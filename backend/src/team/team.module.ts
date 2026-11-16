import { Module } from '@nestjs/common';
import { TeamController } from './team.controller';
import { InvitationsController } from './invitations.controller';
import { TeamService } from './team.service';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [ProjectsModule, UsersModule, EmailModule],
  controllers: [TeamController, InvitationsController],
  providers: [TeamService],
  exports: [TeamService],
})
export class TeamModule {}

