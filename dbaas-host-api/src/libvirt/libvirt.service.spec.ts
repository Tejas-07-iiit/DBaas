import { Test, TestingModule } from '@nestjs/testing';
import { LibvirtService } from './libvirt.service';
import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';

describe('LibvirtService', () => {
  let service: LibvirtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LibvirtService],
    }).compile();

    service = module.get<LibvirtService>(LibvirtService);
  });

  it('should reject invalid VM identifier before executing virsh', async () => {
    await expect(service.getVm('invalid; rm -rf /')).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.getVm('with spaces')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should parse virsh list --all output correctly', async () => {
    const mockOutput = `
 Id   Name              State
---------------------------------
 1    dbaas-provision   running
 -    customer-pg-1     shut off
`;
    jest.spyOn(service, 'runVirsh').mockResolvedValue({
      stdout: mockOutput,
      stderr: '',
    });

    const vms = await service.listVms();
    expect(vms).toHaveLength(2);
    expect(vms[0]).toEqual({
      id: '1',
      name: 'dbaas-provision',
      state: 'running',
    });
    expect(vms[1]).toEqual({
      id: '-',
      name: 'customer-pg-1',
      state: 'shut off',
    });
  });

  it('should parse virsh dominfo output correctly', async () => {
    const mockDominfo = `
Id:             1
Name:           dbaas-provision
UUID:           550e8400-e29b-41d4-a716-446655440000
OS Type:        hvm
State:          running
CPU(s):         2
Max memory:     4194304 KiB
Used memory:    2097152 KiB
`;
    jest.spyOn(service, 'runVirsh').mockResolvedValue({
      stdout: mockDominfo,
      stderr: '',
    });

    const vm = await service.getVm('dbaas-provision');
    expect(vm).not.toBeNull();
    expect(vm?.name).toBe('dbaas-provision');
    expect(vm?.uuid).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(vm?.state).toBe('running');
    expect(vm?.cpu).toBe(2);
    expect(vm?.maxMemoryKb).toBe(4194304);
  });

  it('should return null when domain does not exist', async () => {
    jest.spyOn(service, 'runVirsh').mockRejectedValue({
      code: 1,
      stderr: 'error: failed to get domain "unknown-vm"',
      message: 'Command failed',
    });

    const vm = await service.getVm('unknown-vm');
    expect(vm).toBeNull();
  });

  it('should return connected false when libvirt hypervisor is unreachable in getStatus()', async () => {
    jest.spyOn(service, 'runVirsh').mockRejectedValue(
      new ServiceUnavailableException('Hypervisor connection error: libvirt service is unavailable on the host.'),
    );

    const status = await service.getStatus();
    expect(status.connected).toBe(false);
    expect(status.error).toBeDefined();
  });

  it('should throw ServiceUnavailableException when listVms fails due to missing socket', async () => {
    jest.spyOn(service, 'runVirsh').mockRejectedValue(
      new ServiceUnavailableException('Hypervisor connection error: libvirt service is unavailable on the host.'),
    );

    await expect(service.listVms()).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
