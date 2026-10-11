import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    this.logger.log('Connecting to Platform PostgreSQL...');
    await this.$connect();
    this.logger.log('Connected to Platform PostgreSQL');
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from Platform PostgreSQL...');
    await this.$disconnect();
  }
}
