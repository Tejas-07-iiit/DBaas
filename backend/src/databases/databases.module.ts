import { Module } from '@nestjs/common';
import { BullModule as NestBullModule } from '@nestjs/bullmq';
import { DatabasesController } from './databases.controller';
import { DatabasesService } from './databases.service';
import { DatabaseLifecycleService } from './lifecycle/database-lifecycle.service';
import { DatabaseQuotaService } from './quotas/database-quota.service';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';
import { DatabaseEnginesModule } from '../database-engines/database-engines.module';

@Module({
  imports: [
    ProjectsModule,
    UsersModule,
    DatabaseEnginesModule,
    NestBullModule.registerQueue({
      name: 'database-lifecycle',
    }),
  ],
  controllers: [DatabasesController],
  providers: [DatabasesService, DatabaseLifecycleService, DatabaseQuotaService],
  exports: [DatabasesService, DatabaseLifecycleService, DatabaseQuotaService],
})
export class DatabasesModule {}
