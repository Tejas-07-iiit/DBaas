import { Test, TestingModule } from '@nestjs/testing';
import { VmsService } from './vms.service';
import { LibvirtService } from '../libvirt/libvirt.service';
import {
  NotFoundException,
  ConflictException,
  NotImplementedException,
} from '@nestjs/common';

describe('VmsService', () => {
  let service: VmsService;
  let mockLibvirt: {
    listVms: jest.Mock;
    getVm: jest.Mock;
  };

  beforeEach(async () => {
    mockLibvirt = {
      listVms: jest.fn().mockResolvedValue([
        { id: '1', name: 'existing-vm', state: 'running' },
      ]),
      getVm: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VmsService,
        {
          provide: LibvirtService,
          useValue: mockLibvirt,
        },
      ],
    }).compile();

    service = module.get<VmsService>(VmsService);
  });

  it('should list VMs from libvirt service', async () => {
    const res = await service.listVms();
    expect(res.count).toBe(1);
    expect(res.vms[0].name).toBe('existing-vm');
  });

  it('should return VM details when found', async () => {
    mockLibvirt.getVm.mockResolvedValue({
      id: '1',
      name: 'existing-vm',
      state: 'running',
    });

    const vm = await service.getVm('existing-vm');
    expect(vm.name).toBe('existing-vm');
  });

  it('should throw NotFoundException when VM is not found', async () => {
    mockLibvirt.getVm.mockResolvedValue(null);

    await expect(service.getVm('unknown-vm')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should generate a dry-run provisioning plan without modifying state', async () => {
    const res = await service.createDryRun({
      name: 'new-db',
      cpu: 2,
      memoryMb: 2048,
      diskGb: 20,
    });

    expect(res.dryRun).toBe(true);
    expect(res.plan.name).toBe('new-db');
    expect(res.plan.cpu).toBe(2);
    expect(res.plan.memoryMb).toBe(2048);
    expect(res.plan.diskGb).toBe(20);
    expect(res.plan.status).toBe('PLANNED');
    expect(res.hostLimits.maxCpu).toBeDefined();
  });

  it('should reject provisioning request with duplicate name', async () => {
    await expect(
      service.createDryRun({
        name: 'existing-vm',
        cpu: 2,
        memoryMb: 1024,
        diskGb: 10,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should throw NotImplementedException for VM deletion in Phase 2', () => {
    expect(() => service.deleteVm('1')).toThrow(NotImplementedException);
  });
});
