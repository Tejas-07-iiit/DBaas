import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import supertest from 'supertest';
const request = (supertest as any).default || supertest;

import { UsersModule } from '../src/users/users.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../src/auth/auth.module';
import { FirebaseAdminService } from '../src/auth/services/firebase-admin.service';
import { PlatformRole } from '@prisma/client';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let firebaseAdminService: FirebaseAdminService;
  let prismaService: any;

  const mockUser = {
    id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    firebaseUid: 'fb-user-abc-123',
    email: 'cloud-dev@example.com',
    name: 'Cloud Developer',
    avatarUrl: null,
    role: PlatformRole.USER,
    createdAt: new Date('2026-01-01T12:00:00Z'),
    updatedAt: new Date('2026-01-01T12:00:00Z'),
  };

  beforeAll(async () => {
    firebaseAdminService = {
      verifyIdToken: jest.fn(),
    } as unknown as FirebaseAdminService;

    prismaService = {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      onModuleInit: jest.fn(),
      onModuleDestroy: jest.fn(),
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
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

  it('GET /api/v1/users/me - should return 401 when Authorization header is missing', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .expect(401);
  });

  it('GET /api/v1/users/me - should return 401 when Authorization header is malformed', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', 'InvalidFormat')
      .expect(401);
  });

  it('GET /api/v1/users/me - should return 200 with synced user profile when token is valid', async () => {
    (firebaseAdminService.verifyIdToken as jest.Mock).mockResolvedValue({
      uid: 'fb-user-abc-123',
      email: 'cloud-dev@example.com',
      name: 'Cloud Developer',
    });

    prismaService.user.findUnique.mockResolvedValue(mockUser);

    const response = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', 'Bearer valid-firebase-token')
      .expect(200);

    expect(response.body).toEqual({
      id: mockUser.id,
      firebaseUid: mockUser.firebaseUid,
      email: mockUser.email,
      name: mockUser.name,
      avatarUrl: mockUser.avatarUrl,
      role: mockUser.role,
      createdAt: mockUser.createdAt.toISOString(),
      updatedAt: mockUser.updatedAt.toISOString(),
    });
  });

  it('PATCH /api/v1/users/me - should update user name and return updated profile', async () => {
    (firebaseAdminService.verifyIdToken as jest.Mock).mockResolvedValue({
      uid: 'fb-user-abc-123',
      email: 'cloud-dev@example.com',
      name: 'Cloud Developer',
    });

    prismaService.user.findUnique.mockResolvedValue(mockUser);
    prismaService.user.update.mockResolvedValue({
      ...mockUser,
      name: 'Updated Name',
    });

    const response = await request(app.getHttpServer())
      .patch('/api/v1/users/me')
      .set('Authorization', 'Bearer valid-firebase-token')
      .send({ name: 'Updated Name' })
      .expect(200);

    expect(response.body.name).toBe('Updated Name');
  });
});
