import { Module } from '@nestjs/common';
import { HostController } from './host.controller';
import { LibvirtModule } from '../libvirt/libvirt.module';

@Module({
  imports: [LibvirtModule],
  controllers: [HostController],
})
export class HostModule {}
