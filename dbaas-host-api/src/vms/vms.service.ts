import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { LibvirtService } from '../libvirt/libvirt.service';
import { CreateVmDto } from './dto/create-vm.dto';
import { HOST_LIMITS } from '../config/limits.constants';

@Injectable()
export class VmsService {
  private readonly logger = new Logger(VmsService.name);

  constructor(private readonly libvirtService: LibvirtService) {}

  async listVms() {
    const vms = await this.libvirtService.listVms();
    return {
      count: vms.length,
      vms,
    };
  }

  async getVm(id: string) {
    const vm = await this.libvirtService.getVm(id);
    if (!vm) {
      throw new NotFoundException(`VM with identifier '${id}' not found`);
    }
    return vm;
  }

  async createVm(dto: CreateVmDto) {
    if (dto.dryRun === true) {
      return this.createDryRun(dto);
    }
    return this.createRealVm(dto);
  }

  async createRealVm(dto: CreateVmDto) {
    const existing = await this.libvirtService.listVms();
    const duplicate = existing.find(
      (v) => v.name.toLowerCase() === dto.name.toLowerCase(),
    );
    if (duplicate) {
      throw new ConflictException(
        `A VM with name '${dto.name}' already exists on this host (current state: ${duplicate.state}).`,
      );
    }

    const volName = `${dto.name}.qcow2`;
    this.logger.log(`Creating real KVM VM '${dto.name}' with volume '${volName}'`);

    // 1. Create copy-on-write volume backed by base-cloud.qcow2
    await this.libvirtService.createCoWVolume(volName, dto.diskGb);

    // 2. Launch domain with virt-install
    try {
      await this.libvirtService.createAndStartDomain(
        dto.name,
        dto.cpu,
        dto.memoryMb,
        volName,
        'Dbaas-Net',
        {
          ipAddress: dto.ipAddress || dto.internalIp,
          gateway: dto.gateway,
          adminPassword: dto.adminPassword,
          dbEngine: dto.dbEngine,
          dbPassword: dto.dbPassword,
        },
      );
    } catch (err: unknown) {
      // Clean up volume if domain launch fails
      this.logger.error(`Domain launch failed for '${dto.name}', cleaning up volume`);
      await this.libvirtService.runVirsh(['vol-delete', volName, '--pool', 'default']).catch(() => {});
      throw err;
    }

    const vm = await this.libvirtService.getVm(dto.name);

    return {
      realVmCreated: true,
      message: `Real KVM virtual machine '${dto.name}' created and booted successfully on host.`,
      vm: {
        id: vm?.id || dto.name,
        name: dto.name,
        state: vm?.state || 'running',
        cpu: dto.cpu,
        memoryMb: dto.memoryMb,
        diskGb: dto.diskGb,
        volume: volName,
      },
      hostLimits: {
        maxCpu: HOST_LIMITS.MAX_CPU,
        maxMemoryMb: HOST_LIMITS.MAX_MEMORY_MB,
        maxDiskGb: HOST_LIMITS.MAX_DISK_GB,
      },
    };
  }

  async createDryRun(dto: CreateVmDto) {
    try {
      const existing = await this.libvirtService.listVms();
      const duplicate = existing.find(
        (v) => v.name.toLowerCase() === dto.name.toLowerCase(),
      );
      if (duplicate) {
        throw new ConflictException(
          `A VM with name '${dto.name}' already exists on this host (current state: ${duplicate.state}).`,
        );
      }
    } catch (err: unknown) {
      if (err instanceof ConflictException) {
        throw err;
      }
    }

    return {
      dryRun: true,
      message:
        'Dry-run provisioning plan generated successfully. No VM or storage volume was created on the host.',
      plan: {
        name: dto.name,
        cpu: dto.cpu,
        memoryMb: dto.memoryMb,
        diskGb: dto.diskGb,
        diskFormat: HOST_LIMITS.DEFAULT_DISK_FORMAT,
        network: HOST_LIMITS.DEFAULT_NETWORK,
        bridge: HOST_LIMITS.DEFAULT_BRIDGE,
        status: 'PLANNED',
        createdAt: new Date().toISOString(),
      },
      hostLimits: {
        maxCpu: HOST_LIMITS.MAX_CPU,
        maxMemoryMb: HOST_LIMITS.MAX_MEMORY_MB,
        maxDiskGb: HOST_LIMITS.MAX_DISK_GB,
      },
    };
  }

  async startVm(id: string) {
    await this.libvirtService.startDomain(id);
    return { success: true, status: 'RUNNING' };
  }

  async stopVm(id: string) {
    await this.libvirtService.stopDomain(id);
    return { success: true, status: 'STOPPED' };
  }

  async restartVm(id: string) {
    await this.libvirtService.restartDomain(id);
    return { success: true, status: 'RUNNING' };
  }

  async deleteVm(id: string) {
    await this.libvirtService.deleteDomain(id);
    return { success: true, status: 'DELETED' };
  }
}
