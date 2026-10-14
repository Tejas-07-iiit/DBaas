import { Module } from '@nestjs/common';
import { VmsController } from './vms.controller';
import { VmsService } from './vms.service';
import { LibvirtModule } from '../libvirt/libvirt.module';

@Module({
  imports: [LibvirtModule],
  controllers: [VmsController],
  providers: [VmsService],
  exports: [VmsService],
})
export class VmsModule {}
