import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { VmsService } from './vms.service';
import { CreateVmDto } from './dto/create-vm.dto';
import { ApiTokenGuard } from '../common/guards/api-token.guard';
import { IpAllowlistGuard } from '../common/guards/ip-allowlist.guard';

@Controller('v1/vms')
@UseGuards(IpAllowlistGuard, ApiTokenGuard)
export class VmsController {
  constructor(private readonly vmsService: VmsService) {}

  @Get()
  async listVms() {
    return this.vmsService.listVms();
  }

  @Get(':id')
  async getVm(@Param('id') id: string) {
    return this.vmsService.getVm(id);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async createVm(@Body() dto: CreateVmDto) {
    return this.vmsService.createVm(dto);
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  async startVm(@Param('id') id: string) {
    return this.vmsService.startVm(id);
  }

  @Post(':id/stop')
  @HttpCode(HttpStatus.OK)
  async stopVm(@Param('id') id: string) {
    return this.vmsService.stopVm(id);
  }

  @Post(':id/restart')
  @HttpCode(HttpStatus.OK)
  async restartVm(@Param('id') id: string) {
    return this.vmsService.restartVm(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteVm(@Param('id') id: string) {
    return this.vmsService.deleteVm(id);
  }
}
