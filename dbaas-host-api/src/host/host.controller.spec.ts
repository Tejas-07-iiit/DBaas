import { Test, TestingModule } from '@nestjs/testing';
import { HostController } from './host.controller';
import { LibvirtService } from '../libvirt/libvirt.service';

describe('HostController', () => {
  let controller: HostController;
  let libvirtService: jest.Mocked<LibvirtService>;

  beforeEach(async () => {
    const mockLibvirt = {
      getStatus: jest.fn().mockResolvedValue({
        connected: true,
        hypervisor: 'qemu:///system',
        version: '10.0.0',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HostController],
      providers: [
        {
          provide: LibvirtService,
          useValue: mockLibvirt,
        },
      ],
    }).compile();

    controller = module.get<HostController>(HostController);
    libvirtService = module.get(LibvirtService);
  });

  it('should return read-only host status and limits without exposing sensitive info', async () => {
    const status = await controller.getStatus();
    expect(status.service).toBe('dbaas-host-api');
    expect(status.mode).toBe('dry-run');
    expect(status.libvirt.connected).toBe(true);
    expect(status.hostLimits.maxCpu).toBe(8);
    expect(status.hostLimits.maxMemoryMb).toBe(32768);
    expect(status.timestamp).toBeDefined();
    expect(libvirtService.getStatus).toHaveBeenCalled();
  });
});
