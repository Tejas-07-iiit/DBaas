import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import supertest from 'supertest';
const request = (supertest as any).default || supertest;

import { ProjectsModule } from '../src/projects/projects.module';
import { TeamModule } from '../src/team/team.module';
import { UsersModule } from '../src/users/users.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../src/auth/auth.module';
import { FirebaseAdminService } from '../src/auth/services/firebase-admin.service';
import { PlatformRole, ProjectRole } from '@prisma/client';

describe('Tenant Isolation & Multi-Tenant Authorization (e2e)', () => {
  let app: INestApplication;
  let firebaseAdminService: any;
  let prismaService: any;

  const mockDate = new Date('2026-01-01T00:00:00Z');

  // Tenant A
  const userA = {
    id: '11111111-1111-1111-1111-111111111111',
    firebaseUid: 'fb-user-a',
    email: 'tenant-a@example.com',
    name: 'Tenant A Owner',
    avatarUrl: null,
    role: PlatformRole.USER,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const projectA = {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Tenant A Isolated Project',
    description: 'Internal confidential data A',
    ownerId: userA.id,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  // Tenant B
  const userB = {
    id: '22222222-2222-2222-2222-222222222222',
    firebaseUid: 'fb-user-b',
    email: 'tenant-b@example.com',
    name: 'Tenant B Owner',
    avatarUrl: null,
    role: PlatformRole.USER,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const projectB = {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    name: 'Tenant B Project',
    description: 'Internal data B',
    ownerId: userB.id,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  // Member C in Project A
  const memberC = {
    id: '33333333-3333-3333-3333-333333333333',
    firebaseUid: 'fb-user-c',
    email: 'member-c@example.com',
    name: 'Ordinary Member C',
    avatarUrl: null,
    role: PlatformRole.USER,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  // Admin D in Project A
  const adminD = {
    id: '44444444-4444-4444-4444-444444444444',
    firebaseUid: 'fb-user-d',
    email: 'admin-d@example.com',
    name: 'Admin D',
    avatarUrl: null,
    role: PlatformRole.USER,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  // In-memory membership table for isolation tests
  const memberships: Array<{
    id: string;
    projectId: string;
    userId: string;
    role: ProjectRole;
    user: any;
    project: any;
    createdAt: Date;
    updatedAt: Date;
  }> = [
    {
      id: 'pm-a-owner',
      projectId: projectA.id,
      userId: userA.id,
      role: ProjectRole.OWNER,
      user: userA,
      project: projectA,
      createdAt: mockDate,
      updatedAt: mockDate,
    },
    {
      id: 'pm-b-owner',
      projectId: projectB.id,
      userId: userB.id,
      role: ProjectRole.OWNER,
      user: userB,
      project: projectB,
      createdAt: mockDate,
      updatedAt: mockDate,
    },
    {
      id: 'pm-a-member',
      projectId: projectA.id,
      userId: memberC.id,
      role: ProjectRole.MEMBER,
      user: memberC,
      project: projectA,
      createdAt: mockDate,
      updatedAt: mockDate,
    },
    {
      id: 'pm-a-admin',
      projectId: projectA.id,
      userId: adminD.id,
      role: ProjectRole.ADMIN,
      user: adminD,
      project: projectA,
      createdAt: mockDate,
      updatedAt: mockDate,
    },
  ];

  let currentAuthUser = userA;

  beforeAll(async () => {
    firebaseAdminService = {
      verifyIdToken: jest.fn().mockImplementation((token: string) => {
        if (token === 'token-user-a') {
          currentAuthUser = userA;
          return { uid: userA.firebaseUid, email: userA.email, name: userA.name };
        }
        if (token === 'token-user-b') {
          currentAuthUser = userB;
          return { uid: userB.firebaseUid, email: userB.email, name: userB.name };
        }
        if (token === 'token-user-c') {
          currentAuthUser = memberC;
          return { uid: memberC.firebaseUid, email: memberC.email, name: memberC.name };
        }
        if (token === 'token-user-d') {
          currentAuthUser = adminD;
          return { uid: adminD.firebaseUid, email: adminD.email, name: adminD.name };
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
          if (where.firebaseUid) {
            return [userA, userB, memberC, adminD].find(
              (u) => u.firebaseUid === where.firebaseUid,
            );
          }
          if (where.email) {
            return [userA, userB, memberC, adminD].find(
              (u) => u.email === where.email,
            );
          }
          if (where.id) {
            return [userA, userB, memberC, adminD].find((u) => u.id === where.id);
          }
          return null;
        }),
      },
      project: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          if (where.id === projectA.id) return projectA;
          if (where.id === projectB.id) return projectB;
          return null;
        }),
        update: jest.fn().mockImplementation(({ where, data }: any) => {
          const p = where.id === projectA.id ? projectA : projectB;
          return { ...p, ...data };
        }),
        delete: jest.fn().mockImplementation(({ where }: any) => {
          return where.id === projectA.id ? projectA : projectB;
        }),
      },
      projectMember: {
        count: jest.fn().mockImplementation(({ where }: any) => {
          return memberships.filter((m) => m.projectId === where.projectId).length;
        }),
        findMany: jest.fn().mockImplementation(({ where }: any) => {
          return memberships.filter((m) => m.projectId === where.projectId);
        }),
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          if (where.userId_projectId) {
            return (
              memberships.find(
                (m) =>
                  m.userId === where.userId_projectId.userId &&
                  m.projectId === where.userId_projectId.projectId,
              ) || null
            );
          }
          return null;
        }),
        create: jest.fn().mockImplementation(({ data }: any) => {
          const user = [userA, userB, memberC, adminD].find((u) => u.id === data.userId);
          const newM = { id: 'pm-new', ...data, user, project: projectA, createdAt: mockDate, updatedAt: mockDate };
          memberships.push(newM);
          return newM;
        }),
        delete: jest.fn().mockResolvedValue({ id: 'pm-deleted' }),
      },
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
        TeamModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaService)
      .overrideProvider(FirebaseAdminService)
      .useValue(firebaseAdminService)
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

  describe('Cross-Tenant IDOR Prevention', () => {
    it('User B cannot view Project A details by guessing UUID -> 404 Not Found', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectA.id}`)
        .set('Authorization', 'Bearer token-user-b')
        .expect(404);
    });

    it('User B cannot update Project A -> 404 Not Found', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectA.id}`)
        .set('Authorization', 'Bearer token-user-b')
        .send({ name: 'Hacked Name' })
        .expect(404);
    });

    it('User B cannot delete Project A -> 404 Not Found', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/projects/${projectA.id}`)
        .set('Authorization', 'Bearer token-user-b')
        .expect(404);
    });

    it('User B cannot list members of Project A -> 404 Not Found', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectA.id}/members`)
        .set('Authorization', 'Bearer token-user-b')
        .expect(404);
    });

    it('User B cannot add a member to Project A -> 404 Not Found', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectA.id}/members`)
        .set('Authorization', 'Bearer token-user-b')
        .send({ email: userB.email, role: 'MEMBER' })
        .expect(404);
    });
  });

  describe('Role-Based Access Control inside Project A', () => {
    it('MEMBER C can view Project A details -> 200 OK', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectA.id}`)
        .set('Authorization', 'Bearer token-user-c')
        .expect(200);

      expect(response.body.id).toBe(projectA.id);
      expect(response.body.role).toBe(ProjectRole.MEMBER);
    });

    it('MEMBER C cannot update Project A settings -> 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectA.id}`)
        .set('Authorization', 'Bearer token-user-c')
        .send({ name: 'Member rename attempt' })
        .expect(403);
    });

    it('MEMBER C cannot delete Project A -> 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/projects/${projectA.id}`)
        .set('Authorization', 'Bearer token-user-c')
        .expect(403);
    });

    it('MEMBER C cannot add members to Project A -> 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectA.id}/members`)
        .set('Authorization', 'Bearer token-user-c')
        .send({ email: 'new@example.com', role: 'MEMBER' })
        .expect(403);
    });

    it('ADMIN D can update Project A settings -> 200 OK', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectA.id}`)
        .set('Authorization', 'Bearer token-user-d')
        .send({ name: 'Admin Updated Cluster' })
        .expect(200);

      expect(response.body.name).toBe('Admin Updated Cluster');
    });

    it('ADMIN D cannot delete Project A -> 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/projects/${projectA.id}`)
        .set('Authorization', 'Bearer token-user-d')
        .expect(403);
    });

    it('ADMIN D cannot add member with ADMIN role (privilege escalation) -> 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectA.id}/members`)
        .set('Authorization', 'Bearer token-user-d')
        .send({ email: memberC.email, role: 'ADMIN' })
        .expect(403);
    });

    it('OWNER A can delete Project A -> 204 No Content', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/projects/${projectA.id}`)
        .set('Authorization', 'Bearer token-user-a')
        .expect(204);
    });
  });
});
