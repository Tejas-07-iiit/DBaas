import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Optional,
  Inject,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ProjectAuthorizationService } from '../projects/project-authorization.service';
import { DatabaseEnginesService } from '../database-engines/database-engines.service';
import { DatabaseLifecycleService } from './lifecycle/database-lifecycle.service';
import { DatabaseQuotaService } from './quotas/database-quota.service';
import { EncryptionService } from '../common/services/encryption.service';
  import { ReconciliationService } from '../infrastructure/reconciliation/reconciliation.service';
import { validateResourceSpecs } from '../infrastructure/profiles/resource-profiles';
import { FirebaseUser } from '../auth/interfaces/firebase-user.interface';
import { CreateDatabaseDto } from './dto/create-database.dto';
import { UpdateDatabaseDto } from './dto/update-database.dto';
import { DatabaseQueryDto } from './dto/database-query.dto';
import {
  DatabaseStatus,
  DatabaseEventType,
  ProjectRole,
  DatabaseInstance,
  DatabaseType,
  OperationType,
  OperationStatus,
} from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class DatabasesService {
  private readonly logger = new Logger(DatabasesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly authService: ProjectAuthorizationService,
    private readonly enginesService: DatabaseEnginesService,
    private readonly lifecycleService: DatabaseLifecycleService,
    private readonly quotaService: DatabaseQuotaService,
    @Optional()
    @InjectQueue('database-lifecycle')
    private readonly lifecycleQueue?: Queue,
    @Optional()
    private readonly encryptionService?: EncryptionService,
    @Optional()
    private readonly reconciliationService?: ReconciliationService,
  ) {}

  /**
   * Creates a database instance metadata record in REQUESTED state and enqueues provisioning.
   */
  async createDatabase(
    firebaseUser: FirebaseUser,
    projectId: string,
    dto: CreateDatabaseDto,
  ) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    await this.authService.authorize(projectId, user.id, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
    ]);

    // Validate resource specs against server-side boundaries
    validateResourceSpecs({
      cpuCores: dto.cpuCores,
      ramMb: dto.ramMb,
      storageMb: dto.storageMb,
    });

    // Validate engine type and version against platform catalog
    const engineMeta = this.enginesService.validateEngineAndVersion(
      dto.type,
      dto.version,
    );
    const resolvedVersion = dto.version || engineMeta.defaultVersion;

    // Check duplicate name within project
    const existing = await this.prisma.databaseInstance.findFirst({
      where: {
        projectId,
        name: dto.name,
        status: {
          not: DatabaseStatus.DELETED,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `A database with name '${dto.name}' already exists in this project`,
      );
    }

    // Atomically check quotas and persist record along with initial PROVISION operation
    const { instance, operation } = await this.prisma.$transaction(async (tx) => {
      await this.quotaService.validateQuotaWithinTransaction(tx, projectId, {
        type: dto.type,
        cpuCores: dto.cpuCores,
        ramMb: dto.ramMb,
        storageMb: dto.storageMb,
      });

      const newInstance = await tx.databaseInstance.create({
        data: {
          projectId,
          name: dto.name,
          type: dto.type,
          version: resolvedVersion,
          status: DatabaseStatus.REQUESTED,
          cpuCores: dto.cpuCores,
          ramMb: dto.ramMb,
          storageMb: dto.storageMb,
        },
      });

      await tx.databaseEvent.create({
        data: {
          databaseId: newInstance.id,
          type: DatabaseEventType.CREATED,
          previousStatus: null,
          newStatus: DatabaseStatus.REQUESTED,
          message: `Database instance creation requested for ${engineMeta.displayName} ${resolvedVersion}`,
          metadata: {
            requestedBy: user.id,
            cpuCores: dto.cpuCores,
            ramMb: dto.ramMb,
            storageMb: dto.storageMb,
          },
        },
      });

      const newOp = await tx.databaseOperation.create({
        data: {
          databaseId: newInstance.id,
          type: OperationType.PROVISION,
          status: OperationStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          metadata: {
            engine: dto.type,
            version: resolvedVersion,
            requestedBy: user.id,
          },
        },
      });

      return { instance: newInstance, operation: newOp };
    });

    // Enqueue lifecycle job with idempotent job identifier
    if (this.lifecycleQueue) {
      try {
        await this.lifecycleQueue.add(
          'provision-database',
          {
            databaseId: instance.id,
            projectId,
            operationId: operation.id,
            type: instance.type,
            version: instance.version,
          },
          {
            jobId: `provision-${instance.id}`,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
            removeOnComplete: true,
          },
        );
      } catch (err: any) {
        this.logger.warn(
          `Failed to enqueue BullMQ provisioning job: ${err?.message}`,
        );
      }
    }

    this.logger.log(
      `Database instance "${instance.name}" (${instance.id}) created in project ${projectId} by user ${user.id} [Operation: ${operation.id}]`,
    );

    return {
      ...this.toResponse(instance),
      operationId: operation.id,
    };
  }

  /**
   * Lists database instances for an authorized project with pagination and filtering.
   */
  async listDatabases(
    firebaseUser: FirebaseUser,
    projectId: string,
    query: DatabaseQueryDto,
  ) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    await this.authService.authorize(projectId, user.id);

    const { page, limit, type, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      projectId,
      ...(type && { type }),
      ...(status
        ? { status }
        : {
            status: {
              not: DatabaseStatus.DELETED,
            },
          }),
    };

    const [total, instances] = await Promise.all([
      this.prisma.databaseInstance.count({ where }),
      this.prisma.databaseInstance.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    return {
      data: instances.map((inst) => this.toResponse(inst)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves single database instance metadata if authorized.
   */
  async getDatabase(
    firebaseUser: FirebaseUser,
    projectId: string,
    databaseId: string,
  ) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    await this.authService.authorize(projectId, user.id);

    const instance = await this.prisma.databaseInstance.findUnique({
      where: { id: databaseId },
    });

    // Tenant isolation: verify database exists and belongs to the route's project
    if (!instance || instance.projectId !== projectId) {
      throw new NotFoundException('Database instance not found');
    }

    return this.toResponse(instance);
  }

  /**
   * Updates mutable database metadata (e.g., name).
   */
  async updateDatabase(
    firebaseUser: FirebaseUser,
    projectId: string,
    databaseId: string,
    dto: UpdateDatabaseDto,
  ) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    await this.authService.authorize(projectId, user.id, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
    ]);

    const instance = await this.prisma.databaseInstance.findUnique({
      where: { id: databaseId },
    });

    if (!instance || instance.projectId !== projectId) {
      throw new NotFoundException('Database instance not found');
    }

    if (instance.status === DatabaseStatus.DELETED) {
      throw new BadRequestException('Cannot modify a deleted database');
    }

    if (dto.name && dto.name !== instance.name) {
      const duplicate = await this.prisma.databaseInstance.findFirst({
        where: {
          projectId,
          name: dto.name,
          id: { not: databaseId },
          status: { not: DatabaseStatus.DELETED },
        },
      });

      if (duplicate) {
        throw new ConflictException(
          `A database with name '${dto.name}' already exists in this project`,
        );
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const db = await tx.databaseInstance.update({
        where: { id: databaseId },
        data: {
          ...(dto.name && { name: dto.name }),
        },
      });

      await tx.databaseEvent.create({
        data: {
          databaseId,
          type: DatabaseEventType.CONFIGURATION_CHANGED,
          previousStatus: instance.status,
          newStatus: instance.status,
          message: `Database metadata updated: name changed from '${instance.name}' to '${dto.name}'`,
          metadata: {
            updatedBy: user.id,
            previousName: instance.name,
            newName: dto.name,
          },
        },
      });

      return db;
    });

    this.logger.log(`Database ${databaseId} updated by user ${user.id}`);

    return this.toResponse(updated);
  }

  /**
   * Starts a stopped database VM asynchronously.
   */
  async startDatabase(
    firebaseUser: FirebaseUser,
    projectId: string,
    databaseId: string,
  ) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    await this.authService.authorize(projectId, user.id, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
    ]);

    const instance = await this.prisma.databaseInstance.findUnique({
      where: { id: databaseId },
    });

    if (!instance || instance.projectId !== projectId) {
      throw new NotFoundException('Database instance not found');
    }

    if (instance.status === DatabaseStatus.RUNNING) {
      throw new BadRequestException('Database is already RUNNING');
    }

    if (instance.status !== DatabaseStatus.STOPPED) {
      throw new BadRequestException(
        `Database can only be started from STOPPED status (current status: ${instance.status})`,
      );
    }

    const { updated, operation } = await this.prisma.$transaction(async (tx) => {
      const up = await this.lifecycleService.transitionStatus(
        tx,
        databaseId,
        instance.status,
        DatabaseStatus.STARTING,
        DatabaseEventType.STATUS_CHANGED,
        `Start requested by user ${user.id}`,
      );

      const op = await tx.databaseOperation.create({
        data: {
          databaseId,
          type: OperationType.START,
          status: OperationStatus.PENDING,
          metadata: { requestedBy: user.id },
        },
      });

      return { updated: up, operation: op };
    });

    if (this.lifecycleQueue) {
      try {
        await this.lifecycleQueue.add(
          'start-database',
          { databaseId, projectId, operationId: operation.id },
          { jobId: `start-${databaseId}-${Date.now()}`, removeOnComplete: true },
        );
      } catch (err: any) {
        this.logger.warn(`Failed to enqueue start job: ${err?.message}`);
      }
    }

    return {
      databaseId,
      operationId: operation.id,
      status: DatabaseStatus.STARTING,
    };
  }

  /**
   * Stops a running database VM asynchronously.
   */
  async stopDatabase(
    firebaseUser: FirebaseUser,
    projectId: string,
    databaseId: string,
  ) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    await this.authService.authorize(projectId, user.id, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
    ]);

    const instance = await this.prisma.databaseInstance.findUnique({
      where: { id: databaseId },
    });

    if (!instance || instance.projectId !== projectId) {
      throw new NotFoundException('Database instance not found');
    }

    if (instance.status === DatabaseStatus.STOPPED) {
      throw new BadRequestException('Database is already STOPPED');
    }

    if (instance.status !== DatabaseStatus.RUNNING) {
      throw new BadRequestException(
        `Database can only be stopped from RUNNING status (current status: ${instance.status})`,
      );
    }

    const { updated, operation } = await this.prisma.$transaction(async (tx) => {
      const up = await this.lifecycleService.transitionStatus(
        tx,
        databaseId,
        instance.status,
        DatabaseStatus.STOPPING,
        DatabaseEventType.STATUS_CHANGED,
        `Stop requested by user ${user.id}`,
      );

      const op = await tx.databaseOperation.create({
        data: {
          databaseId,
          type: OperationType.STOP,
          status: OperationStatus.PENDING,
          metadata: { requestedBy: user.id },
        },
      });

      return { updated: up, operation: op };
    });

    if (this.lifecycleQueue) {
      try {
        await this.lifecycleQueue.add(
          'stop-database',
          { databaseId, projectId, operationId: operation.id },
          { jobId: `stop-${databaseId}-${Date.now()}`, removeOnComplete: true },
        );
      } catch (err: any) {
        this.logger.warn(`Failed to enqueue stop job: ${err?.message}`);
      }
    }

    return {
      databaseId,
      operationId: operation.id,
      status: DatabaseStatus.STOPPING,
    };
  }

  /**
   * Restarts a running database VM asynchronously.
   */
  async restartDatabase(
    firebaseUser: FirebaseUser,
    projectId: string,
    databaseId: string,
  ) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    await this.authService.authorize(projectId, user.id, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
    ]);

    const instance = await this.prisma.databaseInstance.findUnique({
      where: { id: databaseId },
    });

    if (!instance || instance.projectId !== projectId) {
      throw new NotFoundException('Database instance not found');
    }

    if (instance.status !== DatabaseStatus.RUNNING) {
      throw new BadRequestException(
        `Database can only be restarted from RUNNING status (current status: ${instance.status})`,
      );
    }

    const { updated, operation } = await this.prisma.$transaction(async (tx) => {
      const up = await this.lifecycleService.transitionStatus(
        tx,
        databaseId,
        instance.status,
        DatabaseStatus.RESTARTING,
        DatabaseEventType.STATUS_CHANGED,
        `Restart requested by user ${user.id}`,
      );

      const op = await tx.databaseOperation.create({
        data: {
          databaseId,
          type: OperationType.RESTART,
          status: OperationStatus.PENDING,
          metadata: { requestedBy: user.id },
        },
      });

      return { updated: up, operation: op };
    });

    if (this.lifecycleQueue) {
      try {
        await this.lifecycleQueue.add(
          'restart-database',
          { databaseId, projectId, operationId: operation.id },
          { jobId: `restart-${databaseId}-${Date.now()}`, removeOnComplete: true },
        );
      } catch (err: any) {
        this.logger.warn(`Failed to enqueue restart job: ${err?.message}`);
      }
    }

    return {
      databaseId,
      operationId: operation.id,
      status: DatabaseStatus.RESTARTING,
    };
  }

  /**
   * Requests safe database deletion.
   */
  async deleteDatabase(
    firebaseUser: FirebaseUser,
    projectId: string,
    databaseId: string,
  ) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    await this.authService.authorize(projectId, user.id, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
    ]);

    const instance = await this.prisma.databaseInstance.findUnique({
      where: { id: databaseId },
    });

    if (!instance || instance.projectId !== projectId) {
      throw new NotFoundException('Database instance not found');
    }

    if (instance.status === DatabaseStatus.DELETED) {
      throw new BadRequestException('Database is already deleted');
    }

    if (instance.status === DatabaseStatus.DELETING) {
      throw new BadRequestException('Database deletion is already in progress');
    }

    // Safely transition status to DELETING and create DELETE operation
    const operation = await this.prisma.$transaction(async (tx) => {
      await this.lifecycleService.transitionStatus(
        tx,
        databaseId,
        instance.status,
        DatabaseStatus.DELETING,
        DatabaseEventType.DELETION_REQUESTED,
        `Database deletion requested by user ${user.id}`,
        { requestedBy: user.id },
      );

      return tx.databaseOperation.create({
        data: {
          databaseId,
          type: OperationType.DELETE,
          status: OperationStatus.PENDING,
          metadata: { requestedBy: user.id },
        },
      });
    });

    // Enqueue lifecycle deletion job with idempotent job identifier
    if (this.lifecycleQueue) {
      try {
        await this.lifecycleQueue.add(
          'delete-database',
          { databaseId, projectId, operationId: operation.id },
          {
            jobId: `delete-${databaseId}`,
            removeOnComplete: true,
          },
        );
      } catch (err: any) {
        this.logger.warn(`Failed to enqueue BullMQ delete job: ${err?.message}`);
      }
    }

    this.logger.log(`Database ${databaseId} deletion initiated by user ${user.id}`);
  }

  /**
   * Retrieves decrypted connection string and parameters for authorized project members.
   */
  async getConnectionDetails(
    firebaseUser: FirebaseUser,
    projectId: string,
    databaseId: string,
  ) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    await this.authService.authorize(projectId, user.id);

    const instance = await this.prisma.databaseInstance.findUnique({
      where: { id: databaseId },
      include: {
        credentials: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!instance || instance.projectId !== projectId) {
      throw new NotFoundException('Database instance not found');
    }

    if (instance.status !== DatabaseStatus.RUNNING) {
      throw new BadRequestException(
        `Connection parameters are only available when database is in RUNNING status (current status: ${instance.status})`,
      );
    }

    const credential = instance.credentials[0];
    if (!credential) {
      throw new NotFoundException('Active database credentials not found');
    }

    let decryptedPassword = '';
    if (this.encryptionService) {
      try {
        decryptedPassword = this.encryptionService.decrypt(
          credential.encryptedPassword,
        );
      } catch (err: any) {
        this.logger.error(`Failed to decrypt database password: ${err?.message}`);
        decryptedPassword = '[decryption_failed]';
      }
    }

    const host = instance.internalIp || '10.50.0.11';
    const port = instance.port || 5432;
    const dbName = 'dbaas_main';

    let connectionUri = '';
    switch (instance.type) {
      case DatabaseType.POSTGRESQL:
        connectionUri = `postgresql://${credential.username}:${decryptedPassword}@${host}:${port}/${dbName}`;
        break;
      case DatabaseType.MONGODB:
        connectionUri = `mongodb://${credential.username}:${decryptedPassword}@${host}:${port}/${dbName}?authSource=admin`;
        break;
      case DatabaseType.QDRANT:
        connectionUri = `http://${credential.username}:${decryptedPassword}@${host}:${port}`;
        break;
      case DatabaseType.NEO4J:
        connectionUri = `neo4j://${host}:${port}`;
        break;
    }

    return {
      databaseId: instance.id,
      name: instance.name,
      type: instance.type,
      host,
      port,
      internalIp: host,
      databaseName: dbName,
      username: credential.username,
      password: decryptedPassword,
      connectionUri,
      sslMode: 'require',
    };
  }

  /**
   * Connects to a MongoDB database instance.
   */
  private async getMongoClient(
    firebaseUser: FirebaseUser,
    projectId: string,
    databaseId: string,
  ) {
    const conn = await this.getConnectionDetails(firebaseUser, projectId, databaseId);
    if (conn.type !== DatabaseType.MONGODB) {
      throw new BadRequestException('Data Explorer is currently optimized for MongoDB engine instances.');
    }
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(conn.connectionUri, {
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000,
    });
    await client.connect();
    return { client, conn };
  }

  /**
   * Returns databases, collections, and document counts for Atlas-style Data Explorer.
   */
  async getExplorerOverview(
    firebaseUser: FirebaseUser,
    projectId: string,
    databaseId: string,
  ) {
    const { client } = await this.getMongoClient(firebaseUser, projectId, databaseId);
    try {
      const adminDb = client.db().admin();
      const dbsResult = await adminDb.listDatabases();
      const databases = [];

      for (const dbInfo of dbsResult.databases) {
        const db = client.db(dbInfo.name);
        const collectionsInfo = await db.listCollections().toArray();
        const collections = [];

        for (const col of collectionsInfo) {
          let count = 0;
          try {
            count = await db.collection(col.name).countDocuments();
          } catch {
            count = 0;
          }
          collections.push({
            name: col.name,
            type: col.type || 'collection',
            count,
          });
        }

        databases.push({
          name: dbInfo.name,
          sizeOnDisk: dbInfo.sizeOnDisk,
          empty: dbInfo.empty,
          collections,
        });
      }

      return { databases };
    } finally {
      await client.close().catch(() => {});
    }
  }

  /**
   * Returns documents from a collection for Atlas-style Document Viewer.
   */
  async getCollectionDocuments(
    firebaseUser: FirebaseUser,
    projectId: string,
    databaseId: string,
    dbName: string,
    collectionName: string,
    limit = 50,
    skip = 0,
    search?: string,
  ) {
    const { client } = await this.getMongoClient(firebaseUser, projectId, databaseId);
    try {
      const db = client.db(dbName || 'dbaas_main');
      const col = db.collection(collectionName || 'users');

      let query: any = {};
      if (search && search.trim()) {
        const trimmed = search.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          try {
            query = JSON.parse(trimmed);
          } catch {
            query = { $or: [{ name: { $regex: trimmed, $options: 'i' } }, { emailId: { $regex: trimmed, $options: 'i' } }] };
          }
        } else {
          query = {
            $or: [
              { name: { $regex: trimmed, $options: 'i' } },
              { emailId: { $regex: trimmed, $options: 'i' } },
            ],
          };
        }
      }

      const total = await col.countDocuments(query).catch(() => 0);
      const documents = await col
        .find(query)
        .sort({ _id: -1 })
        .skip(Number(skip) || 0)
        .limit(Math.min(Number(limit) || 50, 100))
        .toArray();

      return {
        database: dbName,
        collection: collectionName,
        total,
        skip: Number(skip) || 0,
        limit: Number(limit) || 50,
        documents,
      };
    } finally {
      await client.close().catch(() => {});
    }
  }

  /**
   * Inserts a document into a collection.
   */
  async insertCollectionDocument(
    firebaseUser: FirebaseUser,
    projectId: string,
    databaseId: string,
    dbName: string,
    collectionName: string,
    document: any,
  ) {
    const { client } = await this.getMongoClient(firebaseUser, projectId, databaseId);
    try {
      const db = client.db(dbName || 'dbaas_main');
      const col = db.collection(collectionName || 'users');
      const docToInsert = {
        ...document,
        createdAt: document.createdAt || new Date(),
      };
      const result = await col.insertOne(docToInsert);
      return {
        success: true,
        insertedId: result.insertedId,
      };
    } finally {
      await client.close().catch(() => {});
    }
  }

  /**
   * Retrieves database user accounts and roles for Atlas-style Database Users view.
   */
  async getDatabaseUsers(
    firebaseUser: FirebaseUser,
    projectId: string,
    databaseId: string,
  ) {
    const { client } = await this.getMongoClient(firebaseUser, projectId, databaseId);
    try {
      const adminDb = client.db('admin');
      const usersInfo = await adminDb.command({ usersInfo: 1 });
      const users = (usersInfo?.users || []).map((u: any) => ({
        userId: u.userId,
        username: u.user,
        database: u.db,
        roles: (u.roles || []).map((r: any) => `${r.role}@${r.db}`),
        mechanisms: u.mechanisms || [],
      }));

      return { users };
    } finally {
      await client.close().catch(() => {});
    }
  }

  /**
   * Rotates active database credentials securely.
   */
  async rotateCredentials(
    firebaseUser: FirebaseUser,
    projectId: string,
    databaseId: string,
  ) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    await this.authService.authorize(projectId, user.id, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
    ]);

    const instance = await this.prisma.databaseInstance.findUnique({
      where: { id: databaseId },
    });

    if (!instance || instance.projectId !== projectId) {
      throw new NotFoundException('Database instance not found');
    }

    if (instance.status !== DatabaseStatus.RUNNING) {
      throw new BadRequestException(
        'Credentials can only be rotated when database instance is RUNNING',
      );
    }

    const newPassword = crypto.randomBytes(16).toString('hex');
    const encryptedPassword = this.encryptionService
      ? this.encryptionService.encrypt(newPassword)
      : newPassword;

    await this.prisma.$transaction(async (tx) => {
      await tx.databaseCredential.updateMany({
        where: { databaseId, isActive: true },
        data: { isActive: false },
      });

      await tx.databaseCredential.create({
        data: {
          databaseId,
          username: 'dbaas_admin',
          encryptedPassword,
          isActive: true,
        },
      });

      await tx.databaseEvent.create({
        data: {
          databaseId,
          type: DatabaseEventType.CREDENTIALS_ROTATED,
          previousStatus: instance.status,
          newStatus: instance.status,
          message: `Credentials rotated by user ${user.id}`,
        },
      });
    });

    this.logger.log(`Database ${databaseId} credentials rotated successfully`);

    return {
      message: 'Credentials rotated successfully',
      databaseId,
      username: 'dbaas_admin',
    };
  }

  /**
   * Retrieves single asynchronous operation details.
   */
  async getOperation(
    firebaseUser: FirebaseUser,
    projectId: string,
    databaseId: string,
    operationId: string,
  ) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    await this.authService.authorize(projectId, user.id);

    const instance = await this.prisma.databaseInstance.findUnique({
      where: { id: databaseId },
    });

    if (!instance || instance.projectId !== projectId) {
      throw new NotFoundException('Database instance not found');
    }

    const operation = await this.prisma.databaseOperation.findUnique({
      where: { id: operationId },
    });

    if (!operation || operation.databaseId !== databaseId) {
      throw new NotFoundException('Operation not found');
    }

    return {
      id: operation.id,
      databaseId: operation.databaseId,
      type: operation.type,
      status: operation.status,
      retryCount: operation.retryCount,
      maxRetries: operation.maxRetries,
      errorDetails: operation.errorDetails,
      startedAt: operation.startedAt ? operation.startedAt.toISOString() : null,
      completedAt: operation.completedAt ? operation.completedAt.toISOString() : null,
      createdAt: operation.createdAt.toISOString(),
      updatedAt: operation.updatedAt.toISOString(),
    };
  }

  /**
   * Lists all asynchronous operations for a database instance.
   */
  async listOperations(
    firebaseUser: FirebaseUser,
    projectId: string,
    databaseId: string,
    query: { page: number; limit: number },
  ) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    await this.authService.authorize(projectId, user.id);

    const instance = await this.prisma.databaseInstance.findUnique({
      where: { id: databaseId },
    });

    if (!instance || instance.projectId !== projectId) {
      throw new NotFoundException('Database instance not found');
    }

    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [total, operations] = await Promise.all([
      this.prisma.databaseOperation.count({ where: { databaseId } }),
      this.prisma.databaseOperation.findMany({
        where: { databaseId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: operations.map((op: any) => ({
        id: op.id,
        databaseId: op.databaseId,
        type: op.type,
        status: op.status,
        retryCount: op.retryCount,
        errorDetails: op.errorDetails,
        startedAt: op.startedAt ? op.startedAt.toISOString() : null,
        completedAt: op.completedAt ? op.completedAt.toISOString() : null,
        createdAt: op.createdAt.toISOString(),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Triggers reconciliation between platform state and actual provider state for single database.
   */
  async reconcileDatabase(
    firebaseUser: FirebaseUser,
    projectId: string,
    databaseId: string,
  ) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    await this.authService.authorize(projectId, user.id, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
    ]);

    const instance = await this.prisma.databaseInstance.findUnique({
      where: { id: databaseId },
    });

    if (!instance || instance.projectId !== projectId) {
      throw new NotFoundException('Database instance not found');
    }

    if (!this.reconciliationService) {
      return { databaseId, status: 'Reconciliation service unavailable' };
    }

    const mismatch = await this.reconciliationService.reconcileInstance(databaseId);
    return {
      databaseId,
      hasMismatch: !!mismatch,
      mismatch: mismatch || null,
      message: mismatch
        ? `Discrepancy detected: ${mismatch.description}`
        : 'Database instance state is cleanly synchronized with infrastructure',
    };
  }

  /**
   * Lists lifecycle events for a database instance.
   */
  async listEvents(
    firebaseUser: FirebaseUser,
    projectId: string,
    databaseId: string,
    query: { page: number; limit: number },
  ) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    await this.authService.authorize(projectId, user.id);

    const instance = await this.prisma.databaseInstance.findUnique({
      where: { id: databaseId },
    });

    if (!instance || instance.projectId !== projectId) {
      throw new NotFoundException('Database instance not found');
    }

    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [total, events] = await Promise.all([
      this.prisma.databaseEvent.count({ where: { databaseId } }),
      this.prisma.databaseEvent.findMany({
        where: { databaseId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const data = events.map((e) => ({
      id: e.id,
      databaseId: e.databaseId,
      type: e.type,
      message: e.message,
      previousStatus: e.previousStatus,
      newStatus: e.newStatus,
      metadata: e.metadata,
      createdAt: e.createdAt.toISOString(),
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Maps a database instance record to a sanitized API response.
   */
  private toResponse(instance: DatabaseInstance) {
    return {
      id: instance.id,
      projectId: instance.projectId,
      name: instance.name,
      type: instance.type,
      version: instance.version,
      status: instance.status,
      isOperational: instance.status === DatabaseStatus.RUNNING && !!instance.vmId,
      cpuCores: instance.cpuCores,
      ramMb: instance.ramMb,
      storageMb: instance.storageMb,
      internalIp: instance.internalIp,
      internalNetwork: instance.internalNetwork,
      failureReason: instance.failureReason,
      createdAt: instance.createdAt.toISOString(),
      updatedAt: instance.updatedAt.toISOString(),
      deletedAt: instance.deletedAt ? instance.deletedAt.toISOString() : null,
    };
  }
}
