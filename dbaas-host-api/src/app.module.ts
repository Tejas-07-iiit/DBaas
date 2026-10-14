import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { HostModule } from './host/host.module';
import { VmsModule } from './vms/vms.module';
import { LibvirtModule } from './libvirt/libvirt.module';

@Module({
  imports: [HealthModule, HostModule, VmsModule, LibvirtModule],
})
export class AppModule {}
