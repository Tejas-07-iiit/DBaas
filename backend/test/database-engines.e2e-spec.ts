import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import supertest from 'supertest';
const request = (supertest as any).default || supertest;

import { DatabaseEnginesModule } from '../src/database-engines/database-engines.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../src/auth/auth.module';
import { FirebaseAdminService } from '../src/auth/services/firebase-admin.service';

describe('DatabaseEnginesController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
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
        DatabaseEnginesModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
        onModuleInit: jest.fn(),
        onModuleDestroy: jest.fn(),
      })
      .overrideProvider(FirebaseAdminService)
      .useValue({
        verifyIdToken: jest.fn(),
      })
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

  it('GET /api/v1/database-engines - should return supported engine catalog', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/database-engines')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(4);
    const ids = response.body.map((e: any) => e.id);
    expect(ids).toContain('POSTGRESQL');
    expect(ids).toContain('MONGODB');
    expect(ids).toContain('QDRANT');
    expect(ids).toContain('NEO4J');

    // Accurate Phase 3 capability status
    for (const engine of response.body) {
      expect(engine.isAvailableForProvisioning).toBe(false);
    }
  });

  it('GET /api/v1/database-engines/:engine - should return single engine metadata', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/database-engines/postgresql')
      .expect(200);

    expect(response.body.id).toBe('POSTGRESQL');
    expect(response.body.displayName).toBe('PostgreSQL');
    expect(response.body.defaultPort).toBe(5432);
    expect(response.body.supportedVersions).toContain('16');
  });

  it('GET /api/v1/database-engines/:engine - should return 404 for unknown engine', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/database-engines/unknown-engine')
      .expect(404);
  });
});
