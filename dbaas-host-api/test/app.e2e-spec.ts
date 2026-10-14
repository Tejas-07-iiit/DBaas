import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request, { Response } from 'supertest';
import { AppModule } from '../src/app.module';
import { LibvirtService } from '../src/libvirt/libvirt.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

const TEST_SECRET = 'host-api-test-token-32-chars-long';

describe('dbaas-host-api (e2e)', () => {
  let app: INestApplication;
  let mockLibvirt: {
    getStatus: jest.Mock;
    listVms: jest.Mock;
    getVm: jest.Mock;
  };

  beforeAll(async () => {
    process.env.HOST_API_TOKEN = TEST_SECRET;
    // Allow test runner IP
    process.env.ALLOWED_CLIENT_IPS = '127.0.0.1,::1,localhost,10.50.0.7';

    mockLibvirt = {
      getStatus: jest.fn().mockResolvedValue({
        connected: true,
        hypervisor: 'qemu:///system',
        version: '12.0.0',
      }),
      listVms: jest.fn().mockResolvedValue([
        { id: '1', name: 'existing-vm', state: 'running' },
      ]),
      getVm: jest.fn().mockImplementation(async (id: string) => {
        if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/.test(id)) {
          throw new Error('Invalid VM identifier');
        }
        if (id === 'existing-vm' || id === '1') {
          return {
            id: '1',
            name: 'existing-vm',
            state: 'running',
            cpu: 2,
            maxMemoryKb: 2097152,
          };
        }
        return null;
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LibvirtService)
      .useValue(mockLibvirt)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    delete process.env.HOST_API_TOKEN;
  });

  // ─── Authentication Tests ──────────────────────────────────────────

  describe('Authentication & Security', () => {
    it('should reject requests without Authorization header (401)', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(401)
        .expect((res: Response) => {
          expect(res.body.message).toContain('Missing Authorization header');
        });
    });

    it('should reject requests with invalid token (401)', () => {
      return request(app.getHttpServer())
        .get('/health')
        .set('Authorization', 'Bearer wrong-secret')
        .expect(401)
        .expect((res: Response) => {
          expect(res.body.message).toContain('Invalid API token');
        });
    });

    it('should reject requests with malformed header (401)', () => {
      return request(app.getHttpServer())
        .get('/health')
        .set('Authorization', 'Basic dXNlcjpwYXNz')
        .expect(401)
        .expect((res: Response) => {
          expect(res.body.message).toContain('Invalid Authorization header format');
        });
    });
  });

  // ─── Health Endpoint ───────────────────────────────────────────────

  describe('GET /health', () => {
    it('should return 200 with service status when authenticated', () => {
      return request(app.getHttpServer())
        .get('/health')
        .set('Authorization', `Bearer ${TEST_SECRET}`)
        .expect(200)
        .expect((res: Response) => {
          expect(res.body.status).toBe('ok');
          expect(res.body.service).toBe('dbaas-host-api');
          expect(res.body.timestamp).toBeDefined();
        });
    });
  });

  // ─── Host Status ───────────────────────────────────────────────────

  describe('GET /host/status', () => {
    it('should return read-only host status and limits', () => {
      return request(app.getHttpServer())
        .get('/host/status')
        .set('Authorization', `Bearer ${TEST_SECRET}`)
        .expect(200)
        .expect((res: Response) => {
          expect(res.body.service).toBe('dbaas-host-api');
          expect(res.body.mode).toBe('dry-run');
          expect(res.body.libvirt.connected).toBe(true);
          expect(res.body.hostLimits).toBeDefined();
          expect(res.body.hostLimits.maxCpu).toBe(8);
        });
    });
  });

  // ─── List VMs ──────────────────────────────────────────────────────

  describe('GET /v1/vms', () => {
    it('should return VM list from libvirt adapter', () => {
      return request(app.getHttpServer())
        .get('/v1/vms')
        .set('Authorization', `Bearer ${TEST_SECRET}`)
        .expect(200)
        .expect((res: Response) => {
          expect(res.body.count).toBe(1);
          expect(res.body.vms[0].name).toBe('existing-vm');
        });
    });
  });

  // ─── Get Single VM ─────────────────────────────────────────────────

  describe('GET /v1/vms/:id', () => {
    it('should return VM details for existing VM', () => {
      return request(app.getHttpServer())
        .get('/v1/vms/existing-vm')
        .set('Authorization', `Bearer ${TEST_SECRET}`)
        .expect(200)
        .expect((res: Response) => {
          expect(res.body.name).toBe('existing-vm');
          expect(res.body.state).toBe('running');
        });
    });

    it('should return 404 for unknown VM', () => {
      return request(app.getHttpServer())
        .get('/v1/vms/nonexistent-vm')
        .set('Authorization', `Bearer ${TEST_SECRET}`)
        .expect(404)
        .expect((res: Response) => {
          expect(res.body.message).toContain('not found');
        });
    });
  });

  // ─── Provision VM (Dry-Run) ────────────────────────────────────────

  describe('POST /v1/vms (Dry-Run Mode)', () => {
    it('should generate a dry-run provisioning plan for valid request', () => {
      return request(app.getHttpServer())
        .post('/v1/vms')
        .set('Authorization', `Bearer ${TEST_SECRET}`)
        .send({
          name: 'pg-test-db',
          cpu: 2,
          memoryMb: 2048,
          diskGb: 20,
        })
        .expect(200)
        .expect((res: Response) => {
          expect(res.body.dryRun).toBe(true);
          expect(res.body.plan).toBeDefined();
          expect(res.body.plan.name).toBe('pg-test-db');
          expect(res.body.plan.cpu).toBe(2);
          expect(res.body.plan.memoryMb).toBe(2048);
          expect(res.body.plan.diskGb).toBe(20);
          expect(res.body.plan.status).toBe('PLANNED');
        });
    });

    it('should reject duplicate VM name with 409 Conflict', () => {
      return request(app.getHttpServer())
        .post('/v1/vms')
        .set('Authorization', `Bearer ${TEST_SECRET}`)
        .send({
          name: 'existing-vm',
          cpu: 2,
          memoryMb: 1024,
          diskGb: 10,
        })
        .expect(409)
        .expect((res: Response) => {
          expect(res.body.message).toContain('already exists');
        });
    });

    it('should reject request exceeding maximum CPU limit (400)', () => {
      return request(app.getHttpServer())
        .post('/v1/vms')
        .set('Authorization', `Bearer ${TEST_SECRET}`)
        .send({
          name: 'test-db',
          cpu: 16, // Max is 8
          memoryMb: 2048,
          diskGb: 20,
        })
        .expect(400)
        .expect((res: Response) => {
          expect(JSON.stringify(res.body.message)).toContain('cpu must not exceed');
        });
    });

    it('should reject request exceeding maximum Memory limit (400)', () => {
      return request(app.getHttpServer())
        .post('/v1/vms')
        .set('Authorization', `Bearer ${TEST_SECRET}`)
        .send({
          name: 'test-db',
          cpu: 4,
          memoryMb: 65536, // Max is 32768
          diskGb: 20,
        })
        .expect(400);
    });

    it('should reject request exceeding maximum Disk limit (400)', () => {
      return request(app.getHttpServer())
        .post('/v1/vms')
        .set('Authorization', `Bearer ${TEST_SECRET}`)
        .send({
          name: 'test-db',
          cpu: 2,
          memoryMb: 1024,
          diskGb: 600, // Max is 500
        })
        .expect(400);
    });

    it('should reject request below minimum Disk limit (400)', () => {
      return request(app.getHttpServer())
        .post('/v1/vms')
        .set('Authorization', `Bearer ${TEST_SECRET}`)
        .send({
          name: 'test-db',
          cpu: 2,
          memoryMb: 1024,
          diskGb: 2, // Min is 5
        })
        .expect(400);
    });

    it('should reject invalid VM name with uppercase letters (400)', () => {
      return request(app.getHttpServer())
        .post('/v1/vms')
        .set('Authorization', `Bearer ${TEST_SECRET}`)
        .send({
          name: 'TestDB',
          cpu: 2,
          memoryMb: 1024,
          diskGb: 10,
        })
        .expect(400);
    });

    it('should reject invalid VM name ending with hyphen (400)', () => {
      return request(app.getHttpServer())
        .post('/v1/vms')
        .set('Authorization', `Bearer ${TEST_SECRET}`)
        .send({
          name: 'invalid-name-',
          cpu: 2,
          memoryMb: 1024,
          diskGb: 10,
        })
        .expect(400);
    });

    it('should reject non-whitelisted payload properties (400)', () => {
      return request(app.getHttpServer())
        .post('/v1/vms')
        .set('Authorization', `Bearer ${TEST_SECRET}`)
        .send({
          name: 'safe-db',
          cpu: 2,
          memoryMb: 1024,
          diskGb: 10,
          shellCommand: 'rm -rf /',
        })
        .expect(400);
    });
  });

  // ─── Delete VM (Unsupported in Phase 2) ────────────────────────────

  describe('DELETE /v1/vms/:id', () => {
    it('should return 501 Not Implemented', () => {
      return request(app.getHttpServer())
        .delete('/v1/vms/1')
        .set('Authorization', `Bearer ${TEST_SECRET}`)
        .expect(501)
        .expect((res: Response) => {
          expect(res.body.message).toContain('not supported in Phase 2');
        });
    });
  });
});
