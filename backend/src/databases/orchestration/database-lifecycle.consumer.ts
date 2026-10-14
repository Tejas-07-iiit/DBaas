import { Injectable, Logger, Inject } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import * as crypto from 'crypto';
import {
  DatabaseStatus,
  DatabaseEventType,
  OperationStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DatabaseLifecycleService } from '../lifecycle/database-lifecycle.service';
import { EncryptionService } from '../../common/services/encryption.service';
import {
  INFRASTRUCTURE_PROVIDER,
  IInfrastructureProvider,
  ProvisionVmRequest,
} from '../../infrastructure/provider.interface';
import { resolveCertifiedImage } from '../../infrastructure/profiles/resource-profiles';

export interface ProvisionJobData {
  databaseId: string;
  projectId: string;
  operationId?: string;
  type?: any;
  version?: string;
}

export interface LifecycleJobData {
  databaseId: string;
  projectId: string;
  operationId?: string;
}

@Processor('database-lifecycle')
@Injectable()
export class DatabaseLifecycleConsumer extends WorkerHost {
  private readonly logger = new Logger(DatabaseLifecycleConsumer.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly lifecycleService: DatabaseLifecycleService,
    private readonly encryptionService: EncryptionService,
    @Inject(INFRASTRUCTURE_PROVIDER)
    private readonly provider: IInfrastructureProvider,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    this.logger.log(
      `Processing lifecycle job [${job.id}] ${job.name} for database ${job.data?.databaseId} (attempt ${job.attemptsMade + 1})`,
    );

    switch (job.name) {
      case 'provision-database':
        return this.handleProvisionDatabase(job);
      case 'start-database':
        return this.handleStartDatabase(job);
      case 'stop-database':
        return this.handleStopDatabase(job);
      case 'restart-database':
        return this.handleRestartDatabase(job);
      case 'delete-database':
        return this.handleDeleteDatabase(job);
      default:
        this.logger.warn(`Unknown lifecycle job name: ${job.name}`);
        return null;
    }
  }

  private async handleProvisionDatabase(job: Job<ProvisionJobData>): Promise<any> {
    const { databaseId, operationId } = job.data;

    const instance = await this.prisma.databaseInstance.findUnique({
      where: { id: databaseId },
    });

    if (!instance) {
      this.logger.warn(`Database instance ${databaseId} not found, discarding job`);
      return;
    }

    // Idempotency safeguard: if already running with a VM assigned, mark complete
    if (instance.status === DatabaseStatus.RUNNING && instance.vmId) {
      this.logger.log(`Database ${databaseId} is already RUNNING with VM ${instance.vmId}`);
      if (operationId) {
        await this.prisma.databaseOperation.update({
          where: { id: operationId },
          data: {
            status: OperationStatus.COMPLETED,
            completedAt: new Date(),
          },
        });
      }
      return { vmId: instance.vmId, status: 'RUNNING' };
    }

    // Update operation to IN_PROGRESS
    if (operationId) {
      await this.prisma.databaseOperation.update({
        where: { id: operationId },
        data: {
          status: OperationStatus.IN_PROGRESS,
          startedAt: new Date(),
          retryCount: job.attemptsMade,
        },
      });
    }

    // Transition instance to PROVISIONING
    if (instance.status !== DatabaseStatus.PROVISIONING) {
      await this.prisma.$transaction(async (tx) => {
        await this.lifecycleService.transitionStatus(
          tx,
          databaseId,
          instance.status,
          DatabaseStatus.PROVISIONING,
          DatabaseEventType.STATUS_CHANGED,
          'Provisioning worker started VM allocation',
        );
      });
    }

    let provisionedVmId: string | null = null;

    try {
      // Generate secure credentials for this instance
      const generatedPassword = crypto.randomBytes(16).toString('hex');
      const encryptedPassword = this.encryptionService.encrypt(generatedPassword);
      const defaultUsername = 'dbaas_admin';

      const certifiedImage = resolveCertifiedImage(instance.type, instance.version || undefined);

      const provisionRequest: ProvisionVmRequest = {
        databaseId: instance.id,
        projectId: instance.projectId,
        engineType: instance.type,
        engineVersion: instance.version || 'default',
        resources: {
          cpuCores: instance.cpuCores,
          ramMb: instance.ramMb,
          storageMb: instance.storageMb,
        },
        credentials: {
          username: defaultUsername,
          password: generatedPassword,
        },
        network: {
          subnet: '10.50.0.0/24',
        },
        tags: {
          databaseName: instance.name,
          certifiedImage,
        },
      };

      const result = await this.provider.provisionDatabaseVm(provisionRequest);
      provisionedVmId = result.vmId;

      // Verify health check before declaring RUNNING
      const health = await this.provider.checkDatabaseHealth(result.vmId);
      if (!health.isHealthy) {
        throw new Error(`VM health check failed after provisioning: ${JSON.stringify(health.details)}`);
      }

      // Persist credentials and update database instance to RUNNING
      await this.prisma.$transaction(async (tx) => {
        await tx.databaseCredential.create({
          data: {
            databaseId: instance.id,
            username: defaultUsername,
            encryptedPassword,
            isActive: true,
          },
        });

        await tx.databaseInstance.update({
          where: { id: instance.id },
          data: {
            vmId: result.vmId,
            internalIp: result.internalIp,
            port: result.port,
            internalNetwork: '10.50.0.0/24',
            status: DatabaseStatus.RUNNING,
            failureReason: null,
          },
        });

        await tx.databaseEvent.create({
          data: {
            databaseId: instance.id,
            type: DatabaseEventType.STARTED,
            previousStatus: DatabaseStatus.PROVISIONING,
            newStatus: DatabaseStatus.RUNNING,
            message: `Database instance successfully provisioned and operational at ${result.internalIp}:${result.port}`,
            metadata: {
              vmId: result.vmId,
              internalIp: result.internalIp,
              port: result.port,
            },
          },
        });

        if (operationId) {
          await tx.databaseOperation.update({
            where: { id: operationId },
            data: {
              status: OperationStatus.COMPLETED,
              completedAt: new Date(),
              providerOpId: result.vmId,
            },
          });
        }
      });

      this.logger.log(
        `Database ${databaseId} successfully provisioned on VM ${result.vmId} (${result.internalIp}:${result.port})`,
      );

      return result;
    } catch (err: any) {
      this.logger.error(
        `Provisioning failed for database ${databaseId}: ${err?.message}`,
        err?.stack,
      );

      const maxAttempts = job.opts?.attempts || 3;
      const isFinalAttempt = job.attemptsMade + 1 >= maxAttempts;

      if (isFinalAttempt) {
        // Compensation Cleanup: Destroy partial VM if one was allocated
        if (provisionedVmId) {
          try {
            this.logger.warn(
              `Compensation: Cleaning up partial VM ${provisionedVmId} after failed provisioning`,
            );
            await this.provider.deleteDatabaseVm(provisionedVmId);
          } catch (cleanupErr: any) {
            this.logger.error(
              `Compensation cleanup failed for VM ${provisionedVmId}: ${cleanupErr?.message}`,
            );
          }
        }

        // Transition instance to ERROR state
        await this.prisma.$transaction(async (tx) => {
          await tx.databaseInstance.update({
            where: { id: databaseId },
            data: {
              status: DatabaseStatus.ERROR,
              failureReason: err?.message || 'Provisioning failed',
            },
          });

          await tx.databaseEvent.create({
            data: {
              databaseId,
              type: DatabaseEventType.ERROR,
              previousStatus: DatabaseStatus.PROVISIONING,
              newStatus: DatabaseStatus.ERROR,
              message: `Provisioning failed: ${err?.message}`,
              metadata: { error: err?.message, attempts: job.attemptsMade + 1 },
            },
          });

          if (operationId) {
            await tx.databaseOperation.update({
              where: { id: operationId },
              data: {
                status: OperationStatus.FAILED,
                errorDetails: err?.message || 'Provisioning failed',
                completedAt: new Date(),
              },
            });
          }
        });
      }

      throw err; // Allow BullMQ to handle retry backoff
    }
  }

  private async handleStartDatabase(job: Job<LifecycleJobData>): Promise<any> {
    const { databaseId, operationId } = job.data;
    const instance = await this.prisma.databaseInstance.findUnique({
      where: { id: databaseId },
    });

    if (!instance || !instance.vmId) {
      throw new Error(`Database ${databaseId} has no assigned VM to start`);
    }

    if (operationId) {
      await this.prisma.databaseOperation.update({
        where: { id: operationId },
        data: { status: OperationStatus.IN_PROGRESS, startedAt: new Date() },
      });
    }

    await this.provider.startDatabaseVm(instance.vmId);
    const health = await this.provider.checkDatabaseHealth(instance.vmId);
    if (!health.isHealthy) {
      throw new Error(`Health check failed after VM start: ${JSON.stringify(health.details)}`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.databaseInstance.update({
        where: { id: databaseId },
        data: { status: DatabaseStatus.RUNNING, failureReason: null },
      });

      await tx.databaseEvent.create({
        data: {
          databaseId,
          type: DatabaseEventType.STARTED,
          previousStatus: DatabaseStatus.STARTING,
          newStatus: DatabaseStatus.RUNNING,
          message: 'Database instance started successfully',
        },
      });

      if (operationId) {
        await tx.databaseOperation.update({
          where: { id: operationId },
          data: { status: OperationStatus.COMPLETED, completedAt: new Date() },
        });
      }
    });

    return { status: 'RUNNING' };
  }

  private async handleStopDatabase(job: Job<LifecycleJobData>): Promise<any> {
    const { databaseId, operationId } = job.data;
    const instance = await this.prisma.databaseInstance.findUnique({
      where: { id: databaseId },
    });

    if (!instance || !instance.vmId) {
      throw new Error(`Database ${databaseId} has no assigned VM to stop`);
    }

    if (operationId) {
      await this.prisma.databaseOperation.update({
        where: { id: operationId },
        data: { status: OperationStatus.IN_PROGRESS, startedAt: new Date() },
      });
    }

    await this.provider.stopDatabaseVm(instance.vmId);

    await this.prisma.$transaction(async (tx) => {
      await tx.databaseInstance.update({
        where: { id: databaseId },
        data: { status: DatabaseStatus.STOPPED },
      });

      await tx.databaseEvent.create({
        data: {
          databaseId,
          type: DatabaseEventType.STOPPED,
          previousStatus: DatabaseStatus.STOPPING,
          newStatus: DatabaseStatus.STOPPED,
          message: 'Database instance stopped successfully',
        },
      });

      if (operationId) {
        await tx.databaseOperation.update({
          where: { id: operationId },
          data: { status: OperationStatus.COMPLETED, completedAt: new Date() },
        });
      }
    });

    return { status: 'STOPPED' };
  }

  private async handleRestartDatabase(job: Job<LifecycleJobData>): Promise<any> {
    const { databaseId, operationId } = job.data;
    const instance = await this.prisma.databaseInstance.findUnique({
      where: { id: databaseId },
    });

    if (!instance || !instance.vmId) {
      throw new Error(`Database ${databaseId} has no assigned VM to restart`);
    }

    if (operationId) {
      await this.prisma.databaseOperation.update({
        where: { id: operationId },
        data: { status: OperationStatus.IN_PROGRESS, startedAt: new Date() },
      });
    }

    await this.provider.restartDatabaseVm(instance.vmId);
    const health = await this.provider.checkDatabaseHealth(instance.vmId);
    if (!health.isHealthy) {
      throw new Error(`Health check failed after VM restart: ${JSON.stringify(health.details)}`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.databaseInstance.update({
        where: { id: databaseId },
        data: { status: DatabaseStatus.RUNNING, failureReason: null },
      });

      await tx.databaseEvent.create({
        data: {
          databaseId,
          type: DatabaseEventType.RESTARTED,
          previousStatus: DatabaseStatus.RESTARTING,
          newStatus: DatabaseStatus.RUNNING,
          message: 'Database instance restarted successfully',
        },
      });

      if (operationId) {
        await tx.databaseOperation.update({
          where: { id: operationId },
          data: { status: OperationStatus.COMPLETED, completedAt: new Date() },
        });
      }
    });

    return { status: 'RUNNING' };
  }

  private async handleDeleteDatabase(job: Job<LifecycleJobData>): Promise<any> {
    const { databaseId, operationId } = job.data;
    const instance = await this.prisma.databaseInstance.findUnique({
      where: { id: databaseId },
    });

    if (!instance) {
      return;
    }

    if (operationId) {
      await this.prisma.databaseOperation.update({
        where: { id: operationId },
        data: { status: OperationStatus.IN_PROGRESS, startedAt: new Date() },
      });
    }

    if (instance.vmId) {
      try {
        await this.provider.deleteDatabaseVm(instance.vmId);
      } catch (err: any) {
        this.logger.warn(`Provider VM deletion warning for ${instance.vmId}: ${err?.message}`);
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.databaseInstance.update({
        where: { id: databaseId },
        data: {
          status: DatabaseStatus.DELETED,
          deletedAt: new Date(),
        },
      });

      await tx.databaseEvent.create({
        data: {
          databaseId,
          type: DatabaseEventType.DELETED,
          previousStatus: DatabaseStatus.DELETING,
          newStatus: DatabaseStatus.DELETED,
          message: 'Database instance and associated VM successfully destroyed',
        },
      });

      if (operationId) {
        await tx.databaseOperation.update({
          where: { id: operationId },
          data: { status: OperationStatus.COMPLETED, completedAt: new Date() },
        });
      }
    });

    return { status: 'DELETED' };
  }
}
