import { Module } from '@nestjs/common';
import { BullModule as NestBullModule } from '@nestjs/bullmq';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectAuthorizationService } from './project-authorization.service';
import { ProjectLifecycleConsumer } from './orchestration/project-lifecycle.consumer';
import { UsersModule } from '../users/users.module';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { CommonModule } from '../common/common.module';

const isTestEnvironment = process.env.NODE_ENV === 'test';

@Module({
  imports: [
    UsersModule,
    InfrastructureModule,
    CommonModule,
    NestBullModule.registerQueue({
      name: 'project-lifecycle',
    }),
  ],
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    ProjectAuthorizationService,
    ...(isTestEnvironment ? [] : [ProjectLifecycleConsumer]),
  ],
  exports: [ProjectsService, ProjectAuthorizationService],
})
export class ProjectsModule {}
