import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ProjectAuthorizationService } from '../projects/project-authorization.service';
import { FirebaseUser } from '../auth/interfaces/firebase-user.interface';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { TeamQueryDto } from './dto/team-params.dto';
import { InviteMemberDto } from './dto/invitation.dto';
import { ProjectRole, InvitationStatus } from '@prisma/client';
import { EmailService } from '../email/email.service';

@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly authService: ProjectAuthorizationService,
    @Optional() private readonly emailService?: EmailService,
    @Optional() private readonly configService?: ConfigService,
  ) {}

  /**
   * Lists project members. Any active member (OWNER, ADMIN, MEMBER) may view the team.
   */
  async listMembers(
    firebaseUser: FirebaseUser,
    projectId: string,
    query: TeamQueryDto,
  ) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    await this.authService.authorize(projectId, user.id);

    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const where = { projectId };

    const [total, members] = await Promise.all([
      this.prisma.projectMember.count({ where }),
      this.prisma.projectMember.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'asc',
        },
        include: {
          user: true,
        },
      }),
    ]);

    const data = members.map((m) => ({
      id: m.id,
      userId: m.user.id,
      email: m.user.email,
      name: m.user.name,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      joinedAt: m.createdAt.toISOString(),
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Adds an existing registered user to the project.
   * OWNER can add ADMIN or MEMBER.
   * ADMIN can only add MEMBER.
   */
  async addMember(
    firebaseUser: FirebaseUser,
    projectId: string,
    dto: AddMemberDto,
  ) {
    const actor = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    const { membership: actorMembership } = await this.authService.authorize(
      projectId,
      actor.id,
      [ProjectRole.OWNER, ProjectRole.ADMIN],
    );

    // Validate role privilege boundaries
    this.authService.validateCanAddMember(actorMembership.role, dto.role);

    if (actor.email && actor.email.toLowerCase() === dto.email.toLowerCase()) {
      throw new BadRequestException('You cannot add yourself to your own project');
    }

    // Verify target user is already registered on the platform
    const targetUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!targetUser) {
      throw new NotFoundException(
        'User with this email is not registered on the platform',
      );
    }

    // Verify user is not already a member
    const existingMembership = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: targetUser.id,
          projectId,
        },
      },
    });

    if (existingMembership) {
      throw new ConflictException('User is already a member of this project');
    }

    const member = await this.prisma.projectMember.create({
      data: {
        projectId,
        userId: targetUser.id,
        role: dto.role,
      },
      include: {
        user: true,
      },
    });

    this.logger.log(
      `User ${targetUser.id} (${targetUser.email}) added to project ${projectId} as ${dto.role} by ${actor.id}`,
    );

    return {
      id: member.id,
      userId: member.user.id,
      email: member.user.email,
      name: member.user.name,
      avatarUrl: member.user.avatarUrl,
      role: member.role,
      joinedAt: member.createdAt.toISOString(),
    };
  }

  /**
   * Updates a member's role.
   * Only OWNER may update roles. Cannot demote project owner.
   */
  async updateMemberRole(
    firebaseUser: FirebaseUser,
    projectId: string,
    targetUserId: string,
    dto: UpdateMemberRoleDto,
  ) {
    const actor = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    const { project, membership: actorMembership } = await this.authService.authorize(
      projectId,
      actor.id,
      [ProjectRole.OWNER],
    );

    const targetMember = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: targetUserId,
          projectId,
        },
      },
      include: {
        user: true,
      },
    });

    if (!targetMember) {
      throw new NotFoundException('Team member not found in this project');
    }

    this.authService.validateCanChangeRole(
      actorMembership.role,
      actor.id,
      targetMember,
      dto.role,
      project,
    );

    const updated = await this.prisma.projectMember.update({
      where: { id: targetMember.id },
      data: { role: dto.role },
      include: { user: true },
    });

    this.logger.log(
      `Member ${targetUserId} role updated to ${dto.role} in project ${projectId} by ${actor.id}`,
    );

    return {
      id: updated.id,
      userId: updated.user.id,
      email: updated.user.email,
      name: updated.user.name,
      avatarUrl: updated.user.avatarUrl,
      role: updated.role,
      joinedAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Removes a member from the project.
   * OWNER can remove any non-owner member.
   * ADMIN can remove ordinary MEMBERs only.
   */
  async removeMember(
    firebaseUser: FirebaseUser,
    projectId: string,
    targetUserId: string,
  ) {
    const actor = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    const { project, membership: actorMembership } = await this.authService.authorize(
      projectId,
      actor.id,
      [ProjectRole.OWNER, ProjectRole.ADMIN],
    );

    const targetMember = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: targetUserId,
          projectId,
        },
      },
    });

    if (!targetMember) {
      throw new NotFoundException('Team member not found in this project');
    }

    this.authService.validateCanRemoveMember(
      actorMembership.role,
      actor.id,
      targetMember,
      project,
    );

    await this.prisma.projectMember.delete({
      where: { id: targetMember.id },
    });

    this.logger.log(
      `Member ${targetUserId} removed from project ${projectId} by ${actor.id}`,
    );
  }

  /**
   * Creates and dispatches an email invitation to collaborate on a project.
   * Target user does NOT need to be registered yet.
   */
  async createInvitation(
    firebaseUser: FirebaseUser,
    projectId: string,
    dto: InviteMemberDto,
  ) {
    const actor = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    const { project, membership: actorMembership } = await this.authService.authorize(
      projectId,
      actor.id,
      [ProjectRole.OWNER, ProjectRole.ADMIN],
    );

    // Validate role privilege boundaries
    this.authService.validateCanAddMember(actorMembership.role, dto.role);

    if (actor.email && actor.email.toLowerCase() === dto.email.toLowerCase()) {
      throw new BadRequestException('You cannot invite yourself to your own project');
    }

    // Verify target user is not already a member
    const targetUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (targetUser) {
      const existingMembership = await this.prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: targetUser.id,
            projectId,
          },
        },
      });

      if (existingMembership) {
        throw new ConflictException('User is already a member of this project');
      }
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // If an existing pending invitation exists for this email and project, refresh it
    const existingPending = await this.prisma.projectInvitation.findFirst({
      where: {
        projectId,
        email: dto.email,
        status: InvitationStatus.PENDING,
      },
    });

    let invitation: any;
    if (existingPending) {
      invitation = await this.prisma.projectInvitation.update({
        where: { id: existingPending.id },
        data: {
          role: dto.role,
          token,
          invitedById: actor.id,
          expiresAt,
        },
        include: {
          invitedBy: true,
          project: true,
        },
      });
    } else {
      invitation = await this.prisma.projectInvitation.create({
        data: {
          projectId,
          email: dto.email,
          role: dto.role,
          token,
          invitedById: actor.id,
          status: InvitationStatus.PENDING,
          expiresAt,
        },
        include: {
          invitedBy: true,
          project: true,
        },
      });
    }

    // Send email via EmailService
    const frontendUrl =
      this.configService?.get<string>('email.frontendUrl') || 'http://localhost:3000';
    const inviteUrl = `${frontendUrl}/invite?token=${token}`;

    if (this.emailService) {
      await this.emailService.sendProjectInvitation({
        to: dto.email,
        inviterName: actor.name,
        inviterEmail: actor.email,
        projectName: project.name,
        role: dto.role,
        inviteUrl,
        expiresAt,
      });
    }

    this.logger.log(
      `Invitation sent to ${dto.email} for project ${projectId} (${project.name}) with role ${dto.role} by ${actor.id}`,
    );

    return {
      id: invitation.id,
      projectId: invitation.projectId,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt.toISOString(),
      createdAt: invitation.createdAt.toISOString(),
      invitedBy: {
        id: actor.id,
        name: actor.name,
        email: actor.email,
      },
    };
  }

  /**
   * Lists all pending invitations for a project.
   */
  async listInvitations(firebaseUser: FirebaseUser, projectId: string) {
    const actor = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    await this.authService.authorize(
      projectId,
      actor.id,
      [ProjectRole.OWNER, ProjectRole.ADMIN],
    );

    const invitations = await this.prisma.projectInvitation.findMany({
      where: {
        projectId,
        status: InvitationStatus.PENDING,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        invitedBy: true,
      },
    });

    return invitations.map((inv) => ({
      id: inv.id,
      projectId: inv.projectId,
      email: inv.email,
      role: inv.role,
      status: inv.status,
      expiresAt: inv.expiresAt.toISOString(),
      createdAt: inv.createdAt.toISOString(),
      invitedBy: {
        id: inv.invitedBy.id,
        name: inv.invitedBy.name,
        email: inv.invitedBy.email,
      },
    }));
  }

  /**
   * Revokes a pending invitation.
   */
  async revokeInvitation(
    firebaseUser: FirebaseUser,
    projectId: string,
    invitationId: string,
  ) {
    const actor = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    await this.authService.authorize(
      projectId,
      actor.id,
      [ProjectRole.OWNER, ProjectRole.ADMIN],
    );

    const invitation = await this.prisma.projectInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.projectId !== projectId) {
      throw new NotFoundException('Invitation not found in this project');
    }

    await this.prisma.projectInvitation.update({
      where: { id: invitationId },
      data: { status: InvitationStatus.REVOKED },
    });

    this.logger.log(`Invitation ${invitationId} revoked by ${actor.id}`);
  }

  /**
   * Resends an invitation with refreshed token and extended expiration.
   */
  async resendInvitation(
    firebaseUser: FirebaseUser,
    projectId: string,
    invitationId: string,
  ) {
    const actor = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    const { project } = await this.authService.authorize(
      projectId,
      actor.id,
      [ProjectRole.OWNER, ProjectRole.ADMIN],
    );

    const invitation = await this.prisma.projectInvitation.findUnique({
      where: { id: invitationId },
      include: { project: true },
    });

    if (!invitation || invitation.projectId !== projectId) {
      throw new NotFoundException('Invitation not found in this project');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Cannot resend a non-pending invitation');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const updated = await this.prisma.projectInvitation.update({
      where: { id: invitationId },
      data: {
        token,
        expiresAt,
      },
    });

    const frontendUrl =
      this.configService?.get<string>('email.frontendUrl') || 'http://localhost:3000';
    const inviteUrl = `${frontendUrl}/invite?token=${token}`;

    if (this.emailService) {
      await this.emailService.sendProjectInvitation({
        to: updated.email,
        inviterName: actor.name,
        inviterEmail: actor.email,
        projectName: project.name,
        role: updated.role,
        inviteUrl,
        expiresAt,
      });
    }

    return {
      id: updated.id,
      status: updated.status,
      expiresAt: updated.expiresAt.toISOString(),
      resent: true,
    };
  }

  /**
   * Retrieves public details of an invitation by token for acceptance view.
   */
  async getInvitationByToken(token: string) {
    const invitation = await this.prisma.projectInvitation.findUnique({
      where: { token },
      include: {
        project: true,
        invitedBy: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation link is invalid or has expired');
    }

    const isExpired = new Date() > invitation.expiresAt;
    const isPending = invitation.status === InvitationStatus.PENDING;

    return {
      id: invitation.id,
      projectId: invitation.projectId,
      projectName: invitation.project.name,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt.toISOString(),
      isExpired,
      isValid: isPending && !isExpired,
      invitedBy: {
        name: invitation.invitedBy.name,
        email: invitation.invitedBy.email,
      },
    };
  }

  /**
   * Accepts an invitation and joins the project.
   */
  async acceptInvitation(firebaseUser: FirebaseUser, token: string) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);

    const invitation = await this.prisma.projectInvitation.findUnique({
      where: { token },
      include: {
        project: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        `This invitation has already been ${invitation.status.toLowerCase()}`,
      );
    }

    if (new Date() > invitation.expiresAt) {
      await this.prisma.projectInvitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });
      throw new BadRequestException('This invitation has expired');
    }

    // Verify accepting user email matches invitation email
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ForbiddenException(
        `This invitation was sent to ${invitation.email}. You are currently signed in as ${user.email}. Please sign in with the invited email address to accept this invitation.`,
      );
    }

    // Check if user is already a member
    const existingMembership = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId: invitation.projectId,
        },
      },
    });

    if (existingMembership) {
      await this.prisma.projectInvitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.ACCEPTED },
      });

      return {
        success: true,
        projectId: invitation.projectId,
        projectName: invitation.project.name,
        role: existingMembership.role,
        message: 'You are already a member of this project',
      };
    }

    const [membership] = await this.prisma.$transaction([
      this.prisma.projectMember.create({
        data: {
          projectId: invitation.projectId,
          userId: user.id,
          role: invitation.role,
        },
      }),
      this.prisma.projectInvitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.ACCEPTED },
      }),
    ]);

    this.logger.log(
      `Invitation ${invitation.id} accepted by user ${user.id} (${user.email}) for project ${invitation.projectId}`,
    );

    return {
      success: true,
      projectId: invitation.projectId,
      projectName: invitation.project.name,
      role: membership.role,
    };
  }

  /**
   * Retrieves all pending invitations addressed to the authenticated user's email.
   */
  async getMyPendingInvitations(firebaseUser: FirebaseUser) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    if (!user.email) return [];

    const invitations = await this.prisma.projectInvitation.findMany({
      where: {
        email: { equals: user.email, mode: 'insensitive' },
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return invitations.map((inv) => ({
      id: inv.id,
      token: inv.token,
      projectId: inv.projectId,
      projectName: inv.project.name,
      projectOwner: inv.project.owner.name || inv.project.owner.email,
      role: inv.role,
      status: inv.status,
      expiresAt: inv.expiresAt.toISOString(),
      createdAt: inv.createdAt.toISOString(),
      invitedBy: {
        id: inv.invitedBy.id,
        name: inv.invitedBy.name,
        email: inv.invitedBy.email,
      },
    }));
  }

  /**
   * Declines a pending invitation sent to the authenticated user's email.
   */
  async declineInvitation(firebaseUser: FirebaseUser, token: string) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);

    const invitation = await this.prisma.projectInvitation.findUnique({
      where: { token },
      include: { project: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ForbiddenException(
        `This invitation was sent to ${invitation.email}. You cannot decline it as ${user.email}.`,
      );
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        `This invitation has already been ${invitation.status.toLowerCase()}`,
      );
    }

    await this.prisma.projectInvitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.REVOKED },
    });

    this.logger.log(
      `Invitation ${invitation.id} declined by user ${user.id} (${user.email})`,
    );

    return {
      success: true,
      message: 'Invitation declined successfully',
    };
  }
}

