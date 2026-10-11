import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ProjectAuthorizationService } from './project-authorization.service';
import { FirebaseUser } from '../auth/interfaces/firebase-user.interface';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { ProjectRole } from '@prisma/client';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly authService: ProjectAuthorizationService,
  ) {}

  /**
   * Creates a new project and establishes owner membership within a transaction.
   */
  async createProject(firebaseUser: FirebaseUser, dto: CreateProjectDto) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);

    const project = await this.prisma.$transaction(async (tx) => {
      // 1. Create project with ownerId
      const newProject = await tx.project.create({
        data: {
          name: dto.name,
          description: dto.description || null,
          ownerId: user.id,
        },
      });

      // 2. Add creator as OWNER member
      await tx.projectMember.create({
        data: {
          projectId: newProject.id,
          userId: user.id,
          role: ProjectRole.OWNER,
        },
      });

      // 3. Initialize default Free subscription
      await tx.subscription.create({
        data: {
          projectId: newProject.id,
        },
      });

      return newProject;
    });

    this.logger.log(`Project "${project.name}" (${project.id}) created by user ${user.id}`);

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      ownerId: project.ownerId,
      role: ProjectRole.OWNER,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }

  /**
   * Returns paginated list of projects where the user is an active member.
   */
  async listUserProjects(firebaseUser: FirebaseUser, query: ProjectQueryDto) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const where = {
      members: {
        some: {
          userId: user.id,
        },
      },
    };

    const [total, projects] = await Promise.all([
      this.prisma.project.count({ where }),
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          members: {
            where: {
              userId: user.id,
            },
            select: {
              role: true,
            },
          },
        },
      }),
    ]);

    const data = projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      ownerId: p.ownerId,
      role: p.members[0]?.role || ProjectRole.MEMBER,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
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
   * Retrieves single project details if authenticated user has access.
   */
  async getProject(firebaseUser: FirebaseUser, projectId: string) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    const { project, membership } = await this.authService.authorize(projectId, user.id);

    const memberCount = await this.prisma.projectMember.count({
      where: { projectId },
    });

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      ownerId: project.ownerId,
      role: membership.role,
      memberCount,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }

  /**
   * Updates project details. Requires OWNER or ADMIN role.
   */
  async updateProject(
    firebaseUser: FirebaseUser,
    projectId: string,
    dto: UpdateProjectDto,
  ) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    const { membership } = await this.authService.authorize(projectId, user.id, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
    ]);

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });

    this.logger.log(`Project ${projectId} updated by user ${user.id}`);

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      ownerId: updated.ownerId,
      role: membership.role,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Deletes project. Requires OWNER role.
   */
  async deleteProject(firebaseUser: FirebaseUser, projectId: string) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    await this.authService.authorize(projectId, user.id, [ProjectRole.OWNER]);

    await this.prisma.project.delete({
      where: { id: projectId },
    });

    this.logger.log(`Project ${projectId} deleted by owner ${user.id}`);
  }
}
