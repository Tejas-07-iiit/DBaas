import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTokenGuard } from '../common/guards/api-token.guard';
import { IpAllowlistGuard } from '../common/guards/ip-allowlist.guard';

@Controller('health')
@UseGuards(IpAllowlistGuard, ApiTokenGuard)
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'dbaas-host-api',
      timestamp: new Date().toISOString(),
    };
  }
}
