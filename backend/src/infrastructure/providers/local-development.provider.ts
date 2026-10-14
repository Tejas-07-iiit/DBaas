import { Injectable, Logger } from '@nestjs/common';
import { DatabaseType } from '@prisma/client';
import {
  IInfrastructureProvider,
  ProvisionVmRequest,
  ProvisionVmResult,
  VmStatusResult,
  VmOperationResult,
  VmHealthCheckResult,
  VmConnectionMetadata,
  VmReconciliationResult,
} from '../provider.interface';
import { MockInfrastructureProvider } from './mock-infrastructure.provider';

@Injectable()
export class LocalDevelopmentProvider implements IInfrastructureProvider {
  public readonly name = 'local-development';
  private readonly logger = new Logger(LocalDevelopmentProvider.name);
  private readonly delegate = new MockInfrastructureProvider();

  async provisionDatabaseVm(
    request: ProvisionVmRequest,
  ): Promise<ProvisionVmResult> {
    this.logger.warn(
      `[LocalDevelopmentProvider] NOTICE: Running simulated provisioning for database ${request.databaseId}. Real KVM virtual machine is not created.`,
    );

    const result = await this.delegate.provisionDatabaseVm(request);
    return {
      ...result,
      metadata: {
        ...result.metadata,
        isSimulated: true,
        environment: 'local-development',
        notice: 'Simulated environment only. Hypervisor execution deferred to Central Management VM.',
      },
    };
  }

  async getDatabaseVmStatus(vmId: string): Promise<VmStatusResult> {
    return this.delegate.getDatabaseVmStatus(vmId);
  }

  async startDatabaseVm(vmId: string): Promise<VmOperationResult> {
    this.logger.log(`[LocalDevelopmentProvider] Simulating start for VM ${vmId}`);
    return this.delegate.startDatabaseVm(vmId);
  }

  async stopDatabaseVm(vmId: string): Promise<VmOperationResult> {
    this.logger.log(`[LocalDevelopmentProvider] Simulating stop for VM ${vmId}`);
    return this.delegate.stopDatabaseVm(vmId);
  }

  async restartDatabaseVm(vmId: string): Promise<VmOperationResult> {
    this.logger.log(`[LocalDevelopmentProvider] Simulating restart for VM ${vmId}`);
    return this.delegate.restartDatabaseVm(vmId);
  }

  async deleteDatabaseVm(vmId: string): Promise<VmOperationResult> {
    this.logger.log(`[LocalDevelopmentProvider] Simulating delete for VM ${vmId}`);
    return this.delegate.deleteDatabaseVm(vmId);
  }

  async checkDatabaseHealth(vmId: string): Promise<VmHealthCheckResult> {
    return this.delegate.checkDatabaseHealth(vmId);
  }

  async getConnectionMetadata(
    vmId: string,
    engineType: DatabaseType,
  ): Promise<VmConnectionMetadata> {
    return this.delegate.getConnectionMetadata(vmId, engineType);
  }

  async reconcileInfrastructureState(): Promise<VmReconciliationResult> {
    return this.delegate.reconcileInfrastructureState();
  }
}
