import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TeamService } from './team.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { FirebaseUser } from '../auth/interfaces/firebase-user.interface';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  inviteMemberSchema,
  InviteMemberDto,
  invitationParamsSchema,
  InvitationParamsDto,
  tokenParamSchema,
  TokenParamDto,
} from './dto/invitation.dto';
import { teamParamsSchema, TeamParamsDto } from './dto/team-params.dto';

@Controller()
export class InvitationsController {
  constructor(private readonly teamService: TeamService) {}

  /**
   * Dispatches a new email invitation for a project.
   */
  @Post('projects/:projectId/invitations')
  async createInvitation(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Param(new ZodValidationPipe(teamParamsSchema)) params: TeamParamsDto,
    @Body(new ZodValidationPipe(inviteMemberSchema)) dto: InviteMemberDto,
  ) {
    return this.teamService.createInvitation(firebaseUser, params.projectId, dto);
  }

  /**
   * Lists all pending invitations for a project.
   */
  @Get('projects/:projectId/invitations')
  async listInvitations(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Param(new ZodValidationPipe(teamParamsSchema)) params: TeamParamsDto,
  ) {
    return this.teamService.listInvitations(firebaseUser, params.projectId);
  }

  /**
   * Revokes a pending invitation.
   */
  @Delete('projects/:projectId/invitations/:invitationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeInvitation(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Param(new ZodValidationPipe(invitationParamsSchema)) params: InvitationParamsDto,
  ) {
    await this.teamService.revokeInvitation(
      firebaseUser,
      params.projectId,
      params.invitationId,
    );
  }

  /**
   * Resends an invitation email with a refreshed token and extended expiration.
   */
  @Post('projects/:projectId/invitations/:invitationId/resend')
  async resendInvitation(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Param(new ZodValidationPipe(invitationParamsSchema)) params: InvitationParamsDto,
  ) {
    return this.teamService.resendInvitation(
      firebaseUser,
      params.projectId,
      params.invitationId,
    );
  }

  /**
   * Retrieves all pending invitations addressed to the currently authenticated user's email.
   */
  @Get('invitations/my-pending')
  async getMyPendingInvitations(@CurrentUser() firebaseUser: FirebaseUser) {
    return this.teamService.getMyPendingInvitations(firebaseUser);
  }

  /**
   * Public endpoint to inspect invitation details before accepting.
   */
  @Public()
  @Get('invitations/:token')
  async getInvitation(
    @Param(new ZodValidationPipe(tokenParamSchema)) params: TokenParamDto,
  ) {
    return this.teamService.getInvitationByToken(params.token);
  }

  /**
   * Authenticated endpoint to accept an invitation and join the project.
   */
  @Post('invitations/:token/accept')
  async acceptInvitation(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Param(new ZodValidationPipe(tokenParamSchema)) params: TokenParamDto,
  ) {
    return this.teamService.acceptInvitation(firebaseUser, params.token);
  }

  /**
   * Authenticated endpoint to decline an invitation.
   */
  @Post('invitations/:token/decline')
  async declineInvitation(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Param(new ZodValidationPipe(tokenParamSchema)) params: TokenParamDto,
  ) {
    return this.teamService.declineInvitation(firebaseUser, params.token);
  }
}
