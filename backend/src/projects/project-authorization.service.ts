import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectRole, Project, ProjectMember } from '@prisma/client';

export interface AuthorizedContext {
  project: Project;
  membership: ProjectMember;
}

@Injectable()
export class ProjectAuthorizationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Authorizes that a user is a member of the project and holds one of the allowed roles.
   * Enforces tenant isolation: Returns 404 if project does not exist or user is not a member.
   * Returns 403 if user is a member but role is insufficient.
   */
  async authorize(
    projectId: string,
    userId: string,
    allowedRoles?: ProjectRole[],
  ): Promise<AuthorizedContext> {
    const membership = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
      include: {
        project: true,
      },
    });

    // Tenant isolation disclosure policy:
    // If user is not a member, do not reveal if the project UUID exists.
    if (!membership || !membership.project) {
      throw new NotFoundException('Project not found');
    }

    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(membership.role)) {
        throw new ForbiddenException(
          'You do not have the required permissions to perform this action',
        );
      }
    }

    return {
      project: membership.project,
      membership,
    };
  }

  /**
   * Validates if actor has permission to add a member with the requested role.
   */
  validateCanAddMember(actorRole: ProjectRole, targetRole: ProjectRole): void {
    if (actorRole === ProjectRole.MEMBER) {
      throw new ForbiddenException('Members cannot add new team members');
    }

    if (targetRole === ProjectRole.OWNER) {
      throw new ForbiddenException('Cannot assign OWNER role during member addition');
    }

    if (actorRole === ProjectRole.ADMIN && targetRole === ProjectRole.ADMIN) {
      throw new ForbiddenException('Admins cannot invite or assign other Admins');
    }
  }

  /**
   * Validates if actor has permission to change a target member's role.
   */
  validateCanChangeRole(
    actorRole: ProjectRole,
    actorUserId: string,
    targetMember: ProjectMember,
    newRole: ProjectRole,
    project: Project,
  ): void {
    // 1. Prevent self-promotion or self-role change
    if (actorUserId === targetMember.userId) {
      throw new ForbiddenException('You cannot modify your own role');
    }

    // 2. Cannot touch project owner
    if (targetMember.userId === project.ownerId || targetMember.role === ProjectRole.OWNER) {
      throw new BadRequestException('Cannot modify the project owner role');
    }

    // 3. Members cannot change roles
    if (actorRole === ProjectRole.MEMBER) {
      throw new ForbiddenException('Members cannot change team roles');
    }

    // 4. Admins cannot change roles
    if (actorRole === ProjectRole.ADMIN) {
      throw new ForbiddenException('Admins cannot change member roles');
    }

    // 5. Cannot assign OWNER role (ownership transfer is out of scope)
    if (newRole === ProjectRole.OWNER) {
      throw new BadRequestException('Ownership transfer is not supported in this phase');
    }
  }

  /**
   * Validates if actor has permission to remove a target member.
   */
  validateCanRemoveMember(
    actorRole: ProjectRole,
    actorUserId: string,
    targetMember: ProjectMember,
    project: Project,
  ): void {
    // 1. Cannot remove project owner
    if (targetMember.userId === project.ownerId || targetMember.role === ProjectRole.OWNER) {
      throw new BadRequestException('Cannot remove the project owner');
    }

    // 2. Members cannot remove other members
    if (actorRole === ProjectRole.MEMBER && actorUserId !== targetMember.userId) {
      throw new ForbiddenException('Members cannot remove other team members');
    }

    // 3. Admins can only remove ordinary members, not other admins or owner
    if (actorRole === ProjectRole.ADMIN) {
      if (targetMember.role === ProjectRole.ADMIN) {
        throw new ForbiddenException('Admins cannot remove other Admins');
      }
    }
  }
}
