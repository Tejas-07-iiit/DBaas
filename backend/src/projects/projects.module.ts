import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectAuthorizationService } from './project-authorization.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectAuthorizationService],
  exports: [ProjectsService, ProjectAuthorizationService],
})
export class ProjectsModule {}
