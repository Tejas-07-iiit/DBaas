import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Optional,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ProjectAuthorizationService } from '../projects/project-authorization.service';
import { DatabaseEnginesService } from '../database-engines/database-engines.service';
import { DatabaseLifecycleService } from './lifecycle/database-lifecycle.service';
import { DatabaseQuotaService } from './quotas/database-quota.service';
import { FirebaseUser } from '../auth/interfaces/firebase-user.interface';
import { CreateDatabaseDto } from './dto/create-database.dto';
import { UpdateDatabaseDto } from './dto/update-database.dto';
import { DatabaseQueryDto } from './dto/database-query.dto';
import {
  DatabaseStatus,
  DatabaseEventType,
  ProjectRole,
  DatabaseInstance,
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
  ) {}

  /**
   * Creates a database instance metadata record in REQUESTED state.
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

    // Atomically check quotas and persist record
    const instance = await this.prisma.$transaction(async (tx) => {
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

      return newInstance;
    });

    // Enqueue lifecycle job with idempotent job identifier
    if (this.lifecycleQueue) {
      try {
        await this.lifecycleQueue.add(
          'provision-database',
          {
            databaseId: instance.id,
            projectId,
            type: instance.type,
            version: instance.version,
          },
          {
            jobId: `provision-${instance.id}`,
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
      `Database instance "${instance.name}" (${instance.id}) created in project ${projectId} by user ${user.id}`,
    );

    return this.toResponse(instance);
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

    // Safely transition status to DELETING
    await this.prisma.$transaction(async (tx) => {
      await this.lifecycleService.transitionStatus(
        tx,
        databaseId,
        instance.status,
        DatabaseStatus.DELETING,
        DatabaseEventType.DELETION_REQUESTED,
        `Database deletion requested by user ${user.id}`,
        { requestedBy: user.id },
      );
    });

    // Enqueue lifecycle deletion job with idempotent job identifier
    if (this.lifecycleQueue) {
      try {
        await this.lifecycleQueue.add(
          'delete-database',
          { databaseId, projectId },
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
      isOperational: false, // Honest state reflection: Phase 3 manages metadata only
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
