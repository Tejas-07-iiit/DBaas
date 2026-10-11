import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import supertest from 'supertest';
const request = (supertest as any).default || supertest;

import { ProjectsModule } from '../src/projects/projects.module';
import { UsersModule } from '../src/users/users.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../src/auth/auth.module';
import { FirebaseAdminService } from '../src/auth/services/firebase-admin.service';
import { PlatformRole, ProjectRole } from '@prisma/client';

describe('ProjectsController (e2e)', () => {
  let app: INestApplication;
  let firebaseAdminService: any;
  let prismaService: any;

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

  const mockProject = {
    id: '99999999-9999-9999-9999-999999999999',
    name: 'Production Cluster',
    description: 'Main production databases',
    ownerId: ownerUser.id,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  beforeAll(async () => {
    firebaseAdminService = {
      verifyIdToken: jest.fn().mockResolvedValue({
        uid: 'fb-owner-1',
        email: 'project-owner@example.com',
        name: 'Project Owner',
      }),
    };

    prismaService = {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      onModuleInit: jest.fn(),
      onModuleDestroy: jest.fn(),
      user: {
        findUnique: jest.fn().mockResolvedValue(ownerUser),
        create: jest.fn().mockResolvedValue(ownerUser),
      },
      project: {
        create: jest.fn().mockResolvedValue(mockProject),
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([
          {
            ...mockProject,
            members: [{ role: ProjectRole.OWNER }],
          },
        ]),
        findUnique: jest.fn().mockResolvedValue(mockProject),
        update: jest.fn().mockResolvedValue({
          ...mockProject,
          name: 'Renamed Cluster',
        }),
        delete: jest.fn().mockResolvedValue(mockProject),
      },
      projectMember: {
        create: jest.fn().mockResolvedValue({
          id: 'pm-1',
          projectId: mockProject.id,
          userId: ownerUser.id,
          role: ProjectRole.OWNER,
        }),
        count: jest.fn().mockResolvedValue(1),
        findUnique: jest.fn().mockResolvedValue({
          id: 'pm-1',
          projectId: mockProject.id,
          userId: ownerUser.id,
          role: ProjectRole.OWNER,
          project: mockProject,
        }),
      },
      subscription: {
        create: jest.fn().mockResolvedValue({ id: 'sub-1' }),
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

  it('POST /api/v1/projects - should return 401 when unauthorized', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/projects')
      .send({ name: 'Test' })
      .expect(401);
  });

  it('POST /api/v1/projects - should create project and return 201 with role OWNER', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', 'Bearer valid-token')
      .send({ name: 'Production Cluster', description: 'Main production databases' })
      .expect(201);

    expect(response.body).toEqual({
      id: mockProject.id,
      name: mockProject.name,
      description: mockProject.description,
      ownerId: ownerUser.id,
      role: ProjectRole.OWNER,
      createdAt: mockDate.toISOString(),
      updatedAt: mockDate.toISOString(),
    });
  });

  it('GET /api/v1/projects - should list projects for authenticated user', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/projects')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);

    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].id).toBe(mockProject.id);
    expect(response.body.data[0].role).toBe(ProjectRole.OWNER);
    expect(response.body.meta.total).toBe(1);
  });

  it('GET /api/v1/projects/:projectId - should return project details for member', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/projects/${mockProject.id}`)
      .set('Authorization', 'Bearer valid-token')
      .expect(200);

    expect(response.body.id).toBe(mockProject.id);
    expect(response.body.role).toBe(ProjectRole.OWNER);
    expect(response.body.memberCount).toBe(1);
  });

  it('PATCH /api/v1/projects/:projectId - should update project details', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/projects/${mockProject.id}`)
      .set('Authorization', 'Bearer valid-token')
      .send({ name: 'Renamed Cluster' })
      .expect(200);

    expect(response.body.name).toBe('Renamed Cluster');
  });

  it('DELETE /api/v1/projects/:projectId - should delete project for OWNER and return 204', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/projects/${mockProject.id}`)
      .set('Authorization', 'Bearer valid-token')
      .expect(204);
  });
});
