import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ProjectAuthorizationService } from '../projects/project-authorization.service';
import { FirebaseUser } from '../auth/interfaces/firebase-user.interface';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { TeamQueryDto } from './dto/team-params.dto';
import { ProjectRole } from '@prisma/client';

@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly authService: ProjectAuthorizationService,
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
}
