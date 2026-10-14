import { Controller, Get, UseGuards } from '@nestjs/common';
import { LibvirtService } from '../libvirt/libvirt.service';
import { ApiTokenGuard } from '../common/guards/api-token.guard';
import { IpAllowlistGuard } from '../common/guards/ip-allowlist.guard';
import { HOST_LIMITS } from '../config/limits.constants';

@Controller('host')
@UseGuards(IpAllowlistGuard, ApiTokenGuard)
export class HostController {
  constructor(private readonly libvirtService: LibvirtService) {}

  @Get('status')
  async getStatus() {
    const libvirtStatus = await this.libvirtService.getStatus();

    return {
      service: 'dbaas-host-api',
      version: '0.1.0',
      mode: 'dry-run',
      libvirt: libvirtStatus,
      hostLimits: {
        minCpu: HOST_LIMITS.MIN_CPU,
        maxCpu: HOST_LIMITS.MAX_CPU,
        minMemoryMb: HOST_LIMITS.MIN_MEMORY_MB,
        maxMemoryMb: HOST_LIMITS.MAX_MEMORY_MB,
        minDiskGb: HOST_LIMITS.MIN_DISK_GB,
        maxDiskGb: HOST_LIMITS.MAX_DISK_GB,
        network: HOST_LIMITS.DEFAULT_NETWORK,
        bridge: HOST_LIMITS.DEFAULT_BRIDGE,
        diskFormat: HOST_LIMITS.DEFAULT_DISK_FORMAT,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
