import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TeamService } from './team.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FirebaseUser } from '../auth/interfaces/firebase-user.interface';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { addMemberSchema, AddMemberDto } from './dto/add-member.dto';
import {
  updateMemberRoleSchema,
  UpdateMemberRoleDto,
} from './dto/update-member-role.dto';
import {
  teamParamsSchema,
  TeamParamsDto,
  memberParamsSchema,
  MemberParamsDto,
  teamQuerySchema,
  TeamQueryDto,
} from './dto/team-params.dto';

@Controller('projects/:projectId/members')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  async listMembers(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Param(new ZodValidationPipe(teamParamsSchema)) params: TeamParamsDto,
    @Query(new ZodValidationPipe(teamQuerySchema)) query: TeamQueryDto,
  ) {
    return this.teamService.listMembers(firebaseUser, params.projectId, query);
  }

  @Post()
  async addMember(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Param(new ZodValidationPipe(teamParamsSchema)) params: TeamParamsDto,
    @Body(new ZodValidationPipe(addMemberSchema)) dto: AddMemberDto,
  ) {
    return this.teamService.addMember(firebaseUser, params.projectId, dto);
  }

  @Patch(':userId')
  async updateMemberRole(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Param(new ZodValidationPipe(memberParamsSchema)) params: MemberParamsDto,
    @Body(new ZodValidationPipe(updateMemberRoleSchema)) dto: UpdateMemberRoleDto,
  ) {
    return this.teamService.updateMemberRole(
      firebaseUser,
      params.projectId,
      params.userId,
      dto,
    );
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Param(new ZodValidationPipe(memberParamsSchema)) params: MemberParamsDto,
  ) {
    await this.teamService.removeMember(
      firebaseUser,
      params.projectId,
      params.userId,
    );
  }
}
