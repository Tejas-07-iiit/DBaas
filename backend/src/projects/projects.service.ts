import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Optional,
  Inject,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ProjectAuthorizationService } from './project-authorization.service';
import { FirebaseUser } from '../auth/interfaces/firebase-user.interface';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { ProjectRole, ProjectStatus } from '@prisma/client';
import {
  INFRASTRUCTURE_PROVIDER,
  IInfrastructureProvider,
} from '../infrastructure/provider.interface';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly authService: ProjectAuthorizationService,
    @Optional()
    @InjectQueue('project-lifecycle')
    private readonly lifecycleQueue?: Queue,
    @Optional()
    @Inject(INFRASTRUCTURE_PROVIDER)
    private readonly infrastructureProvider?: IInfrastructureProvider,
  ) {}

  /**
   * Creates a new project and establishes owner membership within a transaction.
   * Enqueues Project Host VM provisioning.
   */
  async createProject(firebaseUser: FirebaseUser, dto: CreateProjectDto) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    const cpuCores = dto.cpuCores ?? 2;
    const ramMb = dto.ramMb ?? 4096;
    const storageMb = dto.storageMb ?? 20480;

    const project = await this.prisma.$transaction(async (tx) => {
      // 1. Create project with ownerId and VM specs
      const newProject = await tx.project.create({
        data: {
          name: dto.name,
          description: dto.description || null,
          ownerId: user.id,
          status: ProjectStatus.PROVISIONING,
          cpuCores,
          ramMb,
          storageMb,
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

    // 4. Enqueue Project VM provisioning job
    if (this.lifecycleQueue) {
      try {
        await this.lifecycleQueue.add(
          'provision-project-vm',
          {
            projectId: project.id,
            projectName: project.name,
            cpuCores: project.cpuCores,
            ramMb: project.ramMb,
            storageMb: project.storageMb,
          },
          {
            jobId: `provision-project-${project.id}`,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
            removeOnComplete: true,
          },
        );
      } catch (err: any) {
        this.logger.warn(
          `Failed to enqueue project VM provisioning job: ${err?.message}`,
        );
      }
    }

    this.logger.log(
      `Project "${project.name}" (${project.id}) created by user ${user.id} [Specs: ${cpuCores} vCPU, ${ramMb}MB RAM, ${storageMb}MB Disk]`,
    );

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      vmId: project.vmId,
      internalIp: project.internalIp,
      cpuCores: project.cpuCores,
      ramMb: project.ramMb,
      storageMb: project.storageMb,
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
      status: p.status,
      vmId: p.vmId,
      internalIp: p.internalIp,
      cpuCores: p.cpuCores,
      ramMb: p.ramMb,
      storageMb: p.storageMb,
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
      status: project.status,
      vmId: project.vmId,
      internalIp: project.internalIp,
      cpuCores: project.cpuCores,
      ramMb: project.ramMb,
      storageMb: project.storageMb,
      failureReason: project.failureReason,
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
      status: updated.status,
      vmId: updated.vmId,
      internalIp: updated.internalIp,
      cpuCores: updated.cpuCores,
      ramMb: updated.ramMb,
      storageMb: updated.storageMb,
      ownerId: updated.ownerId,
      role: membership.role,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Starts a project VM.
   */
  async startProjectVm(firebaseUser: FirebaseUser, projectId: string) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    const { project } = await this.authService.authorize(projectId, user.id, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
    ]);

    if (!project.vmId) {
      throw new BadRequestException('Project has no provisioned VM yet');
    }

    if (this.infrastructureProvider) {
      await this.infrastructureProvider.startDatabaseVm(project.vmId);
    }

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.RUNNING, failureReason: null },
    });

    this.logger.log(`Project VM ${project.vmId} started by user ${user.id}`);
    return {
      id: updated.id,
      status: updated.status,
      vmId: updated.vmId,
      internalIp: updated.internalIp,
    };
  }

  /**
   * Stops a project VM.
   */
  async stopProjectVm(firebaseUser: FirebaseUser, projectId: string) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    const { project } = await this.authService.authorize(projectId, user.id, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
    ]);

    if (!project.vmId) {
      throw new BadRequestException('Project has no provisioned VM yet');
    }

    if (this.infrastructureProvider) {
      await this.infrastructureProvider.stopDatabaseVm(project.vmId);
    }

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.STOPPED },
    });

    this.logger.log(`Project VM ${project.vmId} stopped by user ${user.id}`);
    return {
      id: updated.id,
      status: updated.status,
      vmId: updated.vmId,
    };
  }

  /**
   * Restarts a project VM.
   */
  async restartProjectVm(firebaseUser: FirebaseUser, projectId: string) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    const { project } = await this.authService.authorize(projectId, user.id, [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
    ]);

    if (!project.vmId) {
      throw new BadRequestException('Project has no provisioned VM yet');
    }

    if (this.infrastructureProvider) {
      await this.infrastructureProvider.restartDatabaseVm(project.vmId);
    }

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.RUNNING, failureReason: null },
    });

    this.logger.log(`Project VM ${project.vmId} restarted by user ${user.id}`);
    return {
      id: updated.id,
      status: updated.status,
      vmId: updated.vmId,
      internalIp: updated.internalIp,
    };
  }

  /**
   * Retrieves real-time status of the project host VM.
   */
  async getProjectVmStatus(firebaseUser: FirebaseUser, projectId: string) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    const { project } = await this.authService.authorize(projectId, user.id);

    let vmMetrics: any = null;
    if (project.vmId && this.infrastructureProvider) {
      try {
        vmMetrics = await this.infrastructureProvider.getDatabaseVmStatus(project.vmId);
      } catch (err: any) {
        this.logger.warn(`Could not get VM metrics for ${project.vmId}: ${err?.message}`);
      }
    }

    return {
      projectId: project.id,
      vmId: project.vmId,
      status: project.status,
      internalIp: project.internalIp,
      cpuCores: project.cpuCores,
      ramMb: project.ramMb,
      storageMb: project.storageMb,
      failureReason: project.failureReason,
      providerStatus: vmMetrics?.status || (project.status === ProjectStatus.RUNNING ? 'RUNNING' : 'UNKNOWN'),
      cpuUsagePercent: vmMetrics?.cpuUsagePercent ?? 0,
      ramUsageMb: vmMetrics?.ramUsageMb ?? 0,
      uptimeSeconds: vmMetrics?.uptimeSeconds ?? 0,
    };
  }

  /**
   * Deletes project and its dedicated host VM. Requires OWNER role.
   */
  async deleteProject(firebaseUser: FirebaseUser, projectId: string) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);
    const { project } = await this.authService.authorize(projectId, user.id, [ProjectRole.OWNER]);

    if (project.vmId && this.infrastructureProvider) {
      try {
        await this.infrastructureProvider.deleteDatabaseVm(project.vmId);
        this.logger.log(`Host VM ${project.vmId} deleted for project ${projectId}`);
      } catch (err: any) {
        this.logger.warn(`Host VM deletion warning: ${err?.message}`);
      }
    }

    await this.prisma.project.delete({
      where: { id: projectId },
    });

    this.logger.log(`Project ${projectId} deleted by owner ${user.id}`);
  }
}
