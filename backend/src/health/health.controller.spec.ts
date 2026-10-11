import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';
import { RedisHealthIndicator } from './indicators/redis.health';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: {
            check: jest.fn().mockImplementation((indicators) => {
              return Promise.all(indicators.map((ind: () => any) => ind())).then(
                (results) => ({
                  status: 'ok',
                  info: Object.assign({}, ...results),
                  error: {},
                  details: Object.assign({}, ...results),
                }),
              );
            }),
          },
        },
        {
          provide: PrismaHealthIndicator,
          useValue: {
            pingCheck: jest.fn().mockResolvedValue({ database: { status: 'up' } }),
          },
        },
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: RedisHealthIndicator,
          useValue: {
            isHealthy: jest.fn().mockResolvedValue({ redis: { status: 'up' } }),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status ok for check()', async () => {
    const result = await controller.check();
    expect(result.status).toBe('ok');
    expect(result.info).toHaveProperty('api');
  });

  it('should return readiness status including database and redis', async () => {
    const result = await controller.readiness();
    expect(result.status).toBe('ok');
    expect(result.info).toHaveProperty('database');
    expect(result.info).toHaveProperty('redis');
  });
});
