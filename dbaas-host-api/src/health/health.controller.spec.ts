import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should return service health status', () => {
    const res = controller.getHealth();
    expect(res.status).toBe('ok');
    expect(res.service).toBe('dbaas-host-api');
    expect(res.timestamp).toBeDefined();
    expect(() => new Date(res.timestamp)).not.toThrow();
  });
});
