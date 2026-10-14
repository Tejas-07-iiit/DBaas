import { Module } from '@nestjs/common';
import { BullModule as NestBullModule } from '@nestjs/bullmq';
import { DatabasesController } from './databases.controller';
import { DatabasesService } from './databases.service';
import { DatabaseLifecycleService } from './lifecycle/database-lifecycle.service';
import { DatabaseQuotaService } from './quotas/database-quota.service';
import { DatabaseLifecycleConsumer } from './orchestration/database-lifecycle.consumer';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';
import { DatabaseEnginesModule } from '../database-engines/database-engines.module';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { CommonModule } from '../common/common.module';

const isTestEnvironment = process.env.NODE_ENV === 'test';

@Module({
  imports: [
    ProjectsModule,
    UsersModule,
    DatabaseEnginesModule,
    InfrastructureModule,
    CommonModule,
    NestBullModule.registerQueue({
      name: 'database-lifecycle',
    }),
  ],
  controllers: [DatabasesController],
  providers: [
    DatabasesService,
    DatabaseLifecycleService,
    DatabaseQuotaService,
    ...(isTestEnvironment ? [] : [DatabaseLifecycleConsumer]),
  ],
  exports: [
    DatabasesService,
    DatabaseLifecycleService,
    DatabaseQuotaService,
  ],
})
export class DatabasesModule {}
