import { Injectable, Logger, Inject } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ProjectStatus, DatabaseType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  INFRASTRUCTURE_PROVIDER,
  IInfrastructureProvider,
  ProvisionVmRequest,
} from '../../infrastructure/provider.interface';

export interface ProjectLifecycleJobData {
  projectId: string;
  projectName?: string;
  cpuCores?: number;
  ramMb?: number;
  storageMb?: number;
}

@Processor('project-lifecycle')
@Injectable()
export class ProjectLifecycleConsumer extends WorkerHost {
  private readonly logger = new Logger(ProjectLifecycleConsumer.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(INFRASTRUCTURE_PROVIDER)
    private readonly provider: IInfrastructureProvider,
  ) {
    super();
  }

  async process(job: Job<ProjectLifecycleJobData>): Promise<any> {
    this.logger.log(
      `Processing project lifecycle job [${job.id}] ${job.name} for project ${job.data?.projectId}`,
    );

    switch (job.name) {
      case 'provision-project-vm':
        return this.handleProvisionProjectVm(job);
      case 'start-project-vm':
        return this.handleStartProjectVm(job);
      case 'stop-project-vm':
        return this.handleStopProjectVm(job);
      case 'restart-project-vm':
        return this.handleRestartProjectVm(job);
      case 'delete-project-vm':
        return this.handleDeleteProjectVm(job);
      default:
        this.logger.warn(`Unknown project lifecycle job: ${job.name}`);
        return null;
    }
  }

  private async handleProvisionProjectVm(job: Job<ProjectLifecycleJobData>): Promise<any> {
    const { projectId } = job.data;
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      this.logger.warn(`Project ${projectId} not found, skipping provisioning`);
      return;
    }

    if (project.status === ProjectStatus.RUNNING && project.vmId) {
      this.logger.log(`Project ${projectId} is already RUNNING with VM ${project.vmId}`);
      return { vmId: project.vmId, status: 'RUNNING' };
    }

    try {
      const provisionRequest: ProvisionVmRequest = {
        databaseId: project.id,
        projectId: project.id,
        engineType: DatabaseType.POSTGRESQL,
        engineVersion: 'default',
        resources: {
          cpuCores: project.cpuCores,
          ramMb: project.ramMb,
          storageMb: project.storageMb,
        },
        credentials: {
          username: 'dbaas_admin',
          password: '5a2191ba39192ca6c408598714ad34ac',
        },
        network: {
          subnet: '192.168.122.0/24',
        },
        tags: {
          projectName: project.name,
          type: 'project-host',
        },
      };

      this.logger.log(
        `Provisioning dedicated host VM for project "${project.name}" (${project.id}) - ${project.cpuCores} vCPUs, ${project.ramMb} MB RAM, ${project.storageMb} MB Disk`,
      );

      const result = await this.provider.provisionDatabaseVm(provisionRequest);

      await this.prisma.project.update({
        where: { id: project.id },
        data: {
          vmId: result.vmId,
          internalIp: result.internalIp,
          status: ProjectStatus.RUNNING,
          failureReason: null,
        },
      });

      this.logger.log(
        `Project VM ${result.vmId} operational at IP ${result.internalIp} for project ${project.id}`,
      );
      return result;
    } catch (err: any) {
      this.logger.error(
        `Failed to provision Project VM for ${project.id}: ${err.message}`,
        err.stack,
      );
      await this.prisma.project.update({
        where: { id: project.id },
        data: {
          status: ProjectStatus.FAILED,
          failureReason: err.message,
        },
      });
      throw err;
    }
  }

  private async handleStartProjectVm(job: Job<ProjectLifecycleJobData>): Promise<any> {
    const { projectId } = job.data;
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || !project.vmId) {
      throw new Error(`Project ${projectId} has no assigned VM to start`);
    }

    await this.provider.startDatabaseVm(project.vmId);

    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.RUNNING, failureReason: null },
    });

    this.logger.log(`Project VM ${project.vmId} started for project ${projectId}`);
    return { status: 'RUNNING' };
  }

  private async handleStopProjectVm(job: Job<ProjectLifecycleJobData>): Promise<any> {
    const { projectId } = job.data;
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || !project.vmId) {
      throw new Error(`Project ${projectId} has no assigned VM to stop`);
    }

    await this.provider.stopDatabaseVm(project.vmId);

    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.STOPPED },
    });

    this.logger.log(`Project VM ${project.vmId} stopped for project ${projectId}`);
    return { status: 'STOPPED' };
  }

  private async handleRestartProjectVm(job: Job<ProjectLifecycleJobData>): Promise<any> {
    const { projectId } = job.data;
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || !project.vmId) {
      throw new Error(`Project ${projectId} has no assigned VM to restart`);
    }

    await this.provider.restartDatabaseVm(project.vmId);

    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.RUNNING, failureReason: null },
    });

    this.logger.log(`Project VM ${project.vmId} restarted for project ${projectId}`);
    return { status: 'RUNNING' };
  }

  private async handleDeleteProjectVm(job: Job<ProjectLifecycleJobData>): Promise<any> {
    const { projectId } = job.data;
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || !project.vmId) {
      return;
    }

    try {
      await this.provider.deleteDatabaseVm(project.vmId);
      this.logger.log(`Project VM ${project.vmId} deleted for project ${projectId}`);
    } catch (err: any) {
      this.logger.warn(`Project VM deletion warning for ${project.vmId}: ${err?.message}`);
    }
  }
}
