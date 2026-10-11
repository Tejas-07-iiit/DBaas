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
import { PlatformRole, ProjectRole, DatabaseType, DatabaseStatus } from '@prisma/client';
import { getQueueToken } from '@nestjs/bullmq';

describe('Database Tenant Isolation (e2e)', () => {
  let app: INestApplication;
  let firebaseAdminService: any;
  let prismaService: any;

  const mockDate = new Date('2026-01-01T00:00:00Z');

  // Tenant A
  const userA = {
    id: '11111111-1111-1111-1111-111111111111',
    firebaseUid: 'fb-user-a',
    email: 'user-a@example.com',
    name: 'User A',
    avatarUrl: null,
    role: PlatformRole.USER,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const projectA = {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Project A',
    ownerId: userA.id,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const databaseA = {
    id: '12345678-1234-1234-1234-123456789012',
    projectId: projectA.id,
    name: 'db-a',
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

  // Tenant B
  const userB = {
    id: '22222222-2222-2222-2222-222222222222',
    firebaseUid: 'fb-user-b',
    email: 'user-b@example.com',
    name: 'User B',
    avatarUrl: null,
    role: PlatformRole.USER,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const projectB = {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    name: 'Project B',
    ownerId: userB.id,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  beforeAll(async () => {
    firebaseAdminService = {
      verifyIdToken: jest.fn().mockImplementation((token: string) => {
        if (token === 'token-user-a') {
          return { uid: userA.firebaseUid, email: userA.email, name: userA.name };
        }
        if (token === 'token-user-b') {
          return { uid: userB.firebaseUid, email: userB.email, name: userB.name };
        }
        throw new Error('Invalid token');
      }),
    };

    prismaService = {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      onModuleInit: jest.fn(),
      onModuleDestroy: jest.fn(),
      user: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          if (where.firebaseUid === userA.firebaseUid) return userA;
          if (where.firebaseUid === userB.firebaseUid) return userB;
          return null;
        }),
      },
      project: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          if (where.id === projectA.id) return projectA;
          if (where.id === projectB.id) return projectB;
          return null;
        }),
      },
      projectMember: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          if (where.userId_projectId) {
            const { userId, projectId } = where.userId_projectId;
            if (userId === userA.id && projectId === projectA.id) {
              return { id: 'pm-a', userId: userA.id, projectId: projectA.id, role: ProjectRole.OWNER, project: projectA };
            }
            if (userId === userB.id && projectId === projectB.id) {
              return { id: 'pm-b', userId: userB.id, projectId: projectB.id, role: ProjectRole.OWNER, project: projectB };
            }
          }
          return null;
        }),
      },
      databaseInstance: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          if (where.id === databaseA.id) return databaseA;
          return null;
        }),
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
      .useValue({ add: jest.fn() })
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

  describe('Cross-Tenant Database Access Denial (404 Disclosure Policy)', () => {
    it('User B cannot view Database A using Project A route -> 404 Not Found', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectA.id}/databases/${databaseA.id}`)
        .set('Authorization', 'Bearer token-user-b')
        .expect(404);
    });

    it('User B cannot update Database A using Project A route -> 404 Not Found', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectA.id}/databases/${databaseA.id}`)
        .set('Authorization', 'Bearer token-user-b')
        .send({ name: 'hacked-name' })
        .expect(404);
    });

    it('User B cannot delete Database A using Project A route -> 404 Not Found', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/projects/${projectA.id}/databases/${databaseA.id}`)
        .set('Authorization', 'Bearer token-user-b')
        .expect(404);
    });

    it('User B cannot view Database A events using Project A route -> 404 Not Found', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectA.id}/databases/${databaseA.id}/events`)
        .set('Authorization', 'Bearer token-user-b')
        .expect(404);
    });

    it('User B cannot access Database A using their own Project B route (mismatched project ID) -> 404 Not Found', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectB.id}/databases/${databaseA.id}`)
        .set('Authorization', 'Bearer token-user-b')
        .expect(404);
    });
  });
});
