import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import supertest from 'supertest';
const request = (supertest as any).default || supertest;

import { DatabasesModule } from '../src/databases/databases.module';
import { ProjectsModule } from '../src/projects/projects.module';
import { DatabaseEnginesModule } from '../src/database-engines/database-engines.module';
import { UsersModule } from '../src/users/users.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../src/auth/auth.module';
import { FirebaseAdminService } from '../src/auth/services/firebase-admin.service';
import { PlatformRole, ProjectRole, DatabaseType, DatabaseStatus, DatabaseEventType } from '@prisma/client';
import { getQueueToken } from '@nestjs/bullmq';

describe('DatabasesController (e2e)', () => {
  let app: INestApplication;
  let firebaseAdminService: any;
  let prismaService: any;
  let mockQueue: any;

  const mockDate = new Date('2026-01-01T00:00:00Z');

  const ownerUser = {
    id: '11111111-1111-1111-1111-111111111111',
    firebaseUid: 'fb-owner-1',
    email: 'project-owner@example.com',
    name: 'Project Owner',
    avatarUrl: null,
    role: PlatformRole.USER,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const memberUser = {
    id: '22222222-2222-2222-2222-222222222222',
    firebaseUid: 'fb-member-1',
    email: 'project-member@example.com',
    name: 'Project Member',
    avatarUrl: null,
    role: PlatformRole.USER,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const mockProject = {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Production Project',
    ownerId: ownerUser.id,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const mockDatabase = {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    projectId: mockProject.id,
    name: 'prod-pg',
    type: DatabaseType.POSTGRESQL,
    version: '16',
    status: DatabaseStatus.REQUESTED,
    cpuCores: 1,
    ramMb: 1024,
    storageMb: 5120,
    internalIp: null,
    internalNetwork: null,
    vmId: null,
    failureReason: null,
    deletedAt: null,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  beforeAll(async () => {
    firebaseAdminService = {
      verifyIdToken: jest.fn().mockImplementation((token: string) => {
        if (token === 'token-owner') {
          return { uid: ownerUser.firebaseUid, email: ownerUser.email, name: ownerUser.name };
        }
        if (token === 'token-member') {
          return { uid: memberUser.firebaseUid, email: memberUser.email, name: memberUser.name };
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
      subscription: {
        findUnique: jest.fn().mockResolvedValue({ tier: 'FREE' }),
      },
      databaseInstance: {
        findFirst: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(1),
        aggregate: jest.fn().mockResolvedValue({
          _sum: { cpuCores: 1, ramMb: 1024, storageMb: 5120 },
        }),
        create: jest.fn().mockResolvedValue(mockDatabase),
        findMany: jest.fn().mockResolvedValue([mockDatabase]),
        findUnique: jest.fn().mockResolvedValue(mockDatabase),
        update: jest.fn().mockResolvedValue({ ...mockDatabase, name: 'renamed-pg' }),
      },
      databaseEvent: {
        create: jest.fn().mockResolvedValue({ id: 'evt-1' }),
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'evt-1',
            databaseId: mockDatabase.id,
            type: DatabaseEventType.CREATED,
            message: 'Database created',
            previousStatus: null,
            newStatus: DatabaseStatus.REQUESTED,
            metadata: null,
            createdAt: mockDate,
          },
        ]),
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
            }),
          ],
        }),
        PrismaModule,
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
    if (app) {
      await app.close();
    }
  });

  it('POST /api/v1/projects/:projectId/databases - 401 Unauthorized when missing token', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/projects/${mockProject.id}/databases`)
      .send({ name: 'my-pg', type: 'POSTGRESQL' })
      .expect(401);
  });

  it('POST /api/v1/projects/:projectId/databases - 201 Created by OWNER in REQUESTED status', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/projects/${mockProject.id}/databases`)
      .set('Authorization', 'Bearer token-owner')
      .send({
        name: 'prod-pg',
        type: 'POSTGRESQL',
        version: '16',
        cpuCores: 1,
        ramMb: 1024,
        storageMb: 5120,
      })
      .expect(201);

    expect(response.body.id).toBe(mockDatabase.id);
    expect(response.body.status).toBe(DatabaseStatus.REQUESTED);
    expect(response.body.isOperational).toBe(false);
  });

  it('POST /api/v1/projects/:projectId/databases - 403 Forbidden when attempted by ordinary MEMBER', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/projects/${mockProject.id}/databases`)
      .set('Authorization', 'Bearer token-member')
      .send({
        name: 'member-pg',
        type: 'POSTGRESQL',
      })
      .expect(403);
  });

  it('GET /api/v1/projects/:projectId/databases - 200 OK lists instances', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/projects/${mockProject.id}/databases`)
      .set('Authorization', 'Bearer token-member')
      .expect(200);

    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].id).toBe(mockDatabase.id);
  });

  it('GET /api/v1/projects/:projectId/databases/:databaseId - 200 OK retrieves details', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/projects/${mockProject.id}/databases/${mockDatabase.id}`)
      .set('Authorization', 'Bearer token-member')
      .expect(200);

    expect(response.body.id).toBe(mockDatabase.id);
    expect(response.body.name).toBe(mockDatabase.name);
  });

  it('PATCH /api/v1/projects/:projectId/databases/:databaseId - 200 OK updates name', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/projects/${mockProject.id}/databases/${mockDatabase.id}`)
      .set('Authorization', 'Bearer token-owner')
      .send({ name: 'renamed-pg' })
      .expect(200);

    expect(response.body.name).toBe('renamed-pg');
  });

  it('DELETE /api/v1/projects/:projectId/databases/:databaseId - 204 No Content safe deletion', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/projects/${mockProject.id}/databases/${mockDatabase.id}`)
      .set('Authorization', 'Bearer token-owner')
      .expect(204);
  });

  it('GET /api/v1/projects/:projectId/databases/:databaseId/events - 200 OK returns events', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/projects/${mockProject.id}/databases/${mockDatabase.id}/events`)
      .set('Authorization', 'Bearer token-member')
      .expect(200);

    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].type).toBe(DatabaseEventType.CREATED);
    expect(response.body.data[0].newStatus).toBe(DatabaseStatus.REQUESTED);
  });
});
