import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import supertest from 'supertest';
const request = (supertest as any).default || supertest;

import { DatabasesModule } from '../src/databases/databases.module';
import { ProjectsModule } from '../src/projects/projects.module';
import { DatabaseEnginesModule } from '../src/database-engines/database-engines.module';
import { InfrastructureModule } from '../src/infrastructure/infrastructure.module';
import { CommonModule } from '../src/common/common.module';
import { EncryptionService } from '../src/common/services/encryption.service';
import { UsersModule } from '../src/users/users.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../src/auth/auth.module';
import { FirebaseAdminService } from '../src/auth/services/firebase-admin.service';
import {
  PlatformRole,
  ProjectRole,
  DatabaseType,
  DatabaseStatus,
  OperationType,
  OperationStatus,
} from '@prisma/client';
import { getQueueToken } from '@nestjs/bullmq';

describe('Database Operations & Lifecycle (e2e)', () => {
  let app: INestApplication;
  let firebaseAdminService: any;
  let prismaService: any;
  let mockQueue: any;
  let encryptionService: EncryptionService;

  const mockDate = new Date('2026-01-01T00:00:00Z');
  const mockOperationId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

  const ownerUser = {
    id: '11111111-1111-1111-1111-111111111111',
    firebaseUid: 'fb-owner-1',
    email: 'project-owner@example.com',
    name: 'Project Owner',
    role: PlatformRole.USER,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const memberUser = {
    id: '22222222-2222-2222-2222-222222222222',
    firebaseUid: 'fb-member-1',
    email: 'project-member@example.com',
    name: 'Project Member',
    role: PlatformRole.USER,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const outsiderUser = {
    id: '33333333-3333-3333-3333-333333333333',
    firebaseUid: 'fb-outsider-1',
    email: 'outsider@example.com',
    name: 'Outsider',
    role: PlatformRole.USER,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const mockProject = {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Test Project',
    ownerId: ownerUser.id,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  let runningDatabase: any;
  let stoppedDatabase: any;

  beforeAll(async () => {
    encryptionService = new EncryptionService({
      get: () => 'dbaas-default-dev-encryption-key-32b!',
    } as any);

    const validEncryptedPassword = encryptionService.encrypt('securePassword123');

    runningDatabase = {
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      projectId: mockProject.id,
      name: 'prod-pg',
      type: DatabaseType.POSTGRESQL,
      version: '16',
      status: DatabaseStatus.RUNNING,
      cpuCores: 2,
      ramMb: 2048,
      storageMb: 10240,
      internalIp: '10.50.0.12',
      port: 5432,
      internalNetwork: '10.50.0.0/24',
      vmId: 'vm-post-dddddddd',
      failureReason: null,
      deletedAt: null,
      createdAt: mockDate,
      updatedAt: mockDate,
      credentials: [
        {
          id: 'c-1',
          username: 'dbaas_admin',
          encryptedPassword: validEncryptedPassword,
          isActive: true,
        },
      ],
    };

    stoppedDatabase = {
      ...runningDatabase,
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      status: DatabaseStatus.STOPPED,
    };

    firebaseAdminService = {
      verifyIdToken: jest.fn().mockImplementation((token: string) => {
        if (token === 'token-owner') {
          return { uid: ownerUser.firebaseUid, email: ownerUser.email, name: ownerUser.name };
        }
        if (token === 'token-member') {
          return { uid: memberUser.firebaseUid, email: memberUser.email, name: memberUser.name };
        }
        if (token === 'token-outsider') {
          return { uid: outsiderUser.firebaseUid, email: outsiderUser.email, name: outsiderUser.name };
        }
        throw new Error('Invalid token');
      }),
    };

    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    };

    prismaService = {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      onModuleInit: jest.fn(),
      onModuleDestroy: jest.fn(),
      user: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          if (where.firebaseUid === ownerUser.firebaseUid) return ownerUser;
          if (where.firebaseUid === memberUser.firebaseUid) return memberUser;
          if (where.firebaseUid === outsiderUser.firebaseUid) return outsiderUser;
          return null;
        }),
      },
      project: {
        findUnique: jest.fn().mockResolvedValue(mockProject),
      },
      projectMember: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          if (where.userId_projectId) {
            if (where.userId_projectId.userId === ownerUser.id) {
              return {
                id: 'pm-1',
                projectId: mockProject.id,
                userId: ownerUser.id,
                role: ProjectRole.OWNER,
                project: mockProject,
              };
            }
            if (where.userId_projectId.userId === memberUser.id) {
              return {
                id: 'pm-2',
                projectId: mockProject.id,
                userId: memberUser.id,
                role: ProjectRole.MEMBER,
                project: mockProject,
              };
            }
          }
          return null;
        }),
      },
      databaseInstance: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          if (where.id === runningDatabase.id) return runningDatabase;
          if (where.id === stoppedDatabase.id) return stoppedDatabase;
          return null;
        }),
        findMany: jest.fn().mockResolvedValue([runningDatabase]),
        update: jest.fn().mockImplementation(({ data }: any) => ({
          ...runningDatabase,
          ...data,
        })),
      },
      databaseOperation: {
        create: jest.fn().mockResolvedValue({
          id: mockOperationId,
          databaseId: runningDatabase.id,
          type: OperationType.START,
          status: OperationStatus.PENDING,
          retryCount: 0,
        }),
        findUnique: jest.fn().mockResolvedValue({
          id: mockOperationId,
          databaseId: runningDatabase.id,
          type: OperationType.PROVISION,
          status: OperationStatus.COMPLETED,
          retryCount: 0,
          maxRetries: 3,
          errorDetails: null,
          startedAt: mockDate,
          completedAt: mockDate,
          createdAt: mockDate,
          updatedAt: mockDate,
        }),
        findMany: jest.fn().mockResolvedValue([
          {
            id: mockOperationId,
            databaseId: runningDatabase.id,
            type: OperationType.PROVISION,
            status: OperationStatus.COMPLETED,
            retryCount: 0,
            startedAt: mockDate,
            completedAt: mockDate,
            createdAt: mockDate,
          },
        ]),
        count: jest.fn().mockResolvedValue(1),
        update: jest.fn().mockResolvedValue({}),
      },
      databaseCredential: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      databaseEvent: {
        create: jest.fn().mockResolvedValue({ id: 'evt-1' }),
      },
      $transaction: jest.fn((cb) => cb(prismaService)),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              nodeEnv: 'test',
              port: 3000,
              database: { url: 'postgresql://localhost:5432/test' },
              redis: { host: 'localhost', port: 6379 },
              firebase: { projectId: 'test', clientEmail: 'test@example.com', privateKey: 'test' },
              infrastructure: { provider: 'mock' },
            }),
          ],
        }),
        PrismaModule,
        CommonModule,
        InfrastructureModule,
        AuthModule,
        UsersModule,
        ProjectsModule,
        DatabaseEnginesModule,
        DatabasesModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaService)
      .overrideProvider(FirebaseAdminService)
      .useValue(firebaseAdminService)
      .overrideProvider(getQueueToken('database-lifecycle'))
      .useValue(mockQueue)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('Lifecycle Actions: Start, Stop, Restart', () => {
    it('POST /start should boot a stopped database', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${mockProject.id}/databases/${stoppedDatabase.id}/start`)
        .set('Authorization', 'Bearer token-owner');

      expect(res.status).toBe(201);
      expect(res.body.status).toBe(DatabaseStatus.STARTING);
      expect(res.body.operationId).toBeDefined();
    });

    it('POST /stop should suspend a running database', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${mockProject.id}/databases/${runningDatabase.id}/stop`)
        .set('Authorization', 'Bearer token-owner');

      expect(res.status).toBe(201);
      expect(res.body.status).toBe(DatabaseStatus.STOPPING);
      expect(res.body.operationId).toBeDefined();
    });

    it('POST /restart should reboot a running database', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${mockProject.id}/databases/${runningDatabase.id}/restart`)
        .set('Authorization', 'Bearer token-owner');

      expect(res.status).toBe(201);
      expect(res.body.status).toBe(DatabaseStatus.RESTARTING);
      expect(res.body.operationId).toBeDefined();
    });

    it('POST /start should return 403 Forbidden for ordinary MEMBER', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${mockProject.id}/databases/${stoppedDatabase.id}/start`)
        .set('Authorization', 'Bearer token-member');

      expect(res.status).toBe(403);
    });
  });

  describe('Connection & Credentials', () => {
    it('GET /connection should return connection parameters to project members', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${mockProject.id}/databases/${runningDatabase.id}/connection`)
        .set('Authorization', 'Bearer token-member');

      expect(res.status).toBe(200);
      expect(res.body.host).toBe('10.50.0.12');
      expect(res.body.port).toBe(5432);
      expect(res.body.username).toBe('dbaas_admin');
      expect(res.body.connectionUri).toContain('postgresql://dbaas_admin:');
    });

    it('POST /credentials/rotate should rotate credentials for OWNER', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${mockProject.id}/databases/${runningDatabase.id}/credentials/rotate`)
        .set('Authorization', 'Bearer token-owner');

      expect(res.status).toBe(201);
      expect(res.body.message).toContain('Credentials rotated');
    });

    it('POST /credentials/rotate should return 403 Forbidden for MEMBER', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${mockProject.id}/databases/${runningDatabase.id}/credentials/rotate`)
        .set('Authorization', 'Bearer token-member');

      expect(res.status).toBe(403);
    });
  });

  describe('Operations Tracking', () => {
    it('GET /operations should list operations', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${mockProject.id}/databases/${runningDatabase.id}/operations`)
        .set('Authorization', 'Bearer token-member');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].type).toBe(OperationType.PROVISION);
    });

    it('GET /operations/:operationId should return single operation details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${mockProject.id}/databases/${runningDatabase.id}/operations/${mockOperationId}`)
        .set('Authorization', 'Bearer token-member');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(mockOperationId);
      expect(res.body.status).toBe(OperationStatus.COMPLETED);
    });
  });

  describe('Tenant Isolation Policy', () => {
    it('should return 404 for outsider trying to access database operations', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${mockProject.id}/databases/${runningDatabase.id}/operations`)
        .set('Authorization', 'Bearer token-outsider');

      expect(res.status).toBe(404);
    });

    it('should return 404 for outsider trying to access database connection', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${mockProject.id}/databases/${runningDatabase.id}/connection`)
        .set('Authorization', 'Bearer token-outsider');

      expect(res.status).toBe(404);
    });
  });
});
