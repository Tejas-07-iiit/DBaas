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

export interface MockVmRecord {
  vmId: string;
  databaseId: string;
  projectId: string;
  engineType: DatabaseType;
  engineVersion: string;
  status: 'RUNNING' | 'STOPPED' | 'STARTING' | 'STOPPING' | 'ERROR';
  internalIp: string;
  port: number;
  cpuCores: number;
  ramMb: number;
  storageMb: number;
  createdAt: Date;
  updatedAt: Date;
}

export type SimulatedFailureMode =
  | 'PROVISION_FAIL'
  | 'START_FAIL'
  | 'STOP_FAIL'
  | 'RESTART_FAIL'
  | 'HEALTH_FAIL'
  | null;

@Injectable()
export class MockInfrastructureProvider implements IInfrastructureProvider {
  public readonly name = 'mock';
  private readonly logger = new Logger(MockInfrastructureProvider.name);

  private readonly vms = new Map<string, MockVmRecord>();
  private nextIpIndex = 11; // 10.50.0.11 upwards
  private failureMode: SimulatedFailureMode = null;

  /**
   * Configures a temporary failure simulation for testing retries and compensation.
   */
  setSimulatedFailure(mode: SimulatedFailureMode) {
    this.failureMode = mode;
  }

  /**
   * Resets all in-memory simulated VMs and configurations.
   */
  reset() {
    this.vms.clear();
    this.nextIpIndex = 11;
    this.failureMode = null;
  }

  async provisionDatabaseVm(
    request: ProvisionVmRequest,
  ): Promise<ProvisionVmResult> {
    this.logger.log(
      `[Mock] Provisioning VM for database ${request.databaseId} (${request.engineType})`,
    );

    if (this.failureMode === 'PROVISION_FAIL') {
      throw new Error(
        'Simulated hypervisor error: Failed to allocate storage volume on host SSD',
      );
    }

    // Idempotency check: return existing VM if already created for this databaseId
    for (const vm of this.vms.values()) {
      if (vm.databaseId === request.databaseId) {
        this.logger.log(`[Mock] Idempotent hit: VM ${vm.vmId} already exists`);
        return {
          vmId: vm.vmId,
          status: vm.status === 'RUNNING' ? 'RUNNING' : 'PROVISIONING',
          internalIp: vm.internalIp,
          port: vm.port,
          metadata: { isMock: true, reused: true },
        };
      }
    }

    const vmId = `vm-${request.engineType.toLowerCase().slice(0, 4)}-${request.databaseId.slice(0, 8)}`;
    const internalIp = request.network.internalIp || `10.50.0.${this.nextIpIndex++}`;
    const port = this.resolveDefaultPort(request.engineType);

    const record: MockVmRecord = {
      vmId,
      databaseId: request.databaseId,
      projectId: request.projectId,
      engineType: request.engineType,
      engineVersion: request.engineVersion,
      status: 'RUNNING',
      internalIp,
      port,
      cpuCores: request.resources.cpuCores,
      ramMb: request.resources.ramMb,
      storageMb: request.resources.storageMb,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.vms.set(vmId, record);

    return {
      vmId,
      status: 'RUNNING',
      internalIp,
      port,
      metadata: {
        isMock: true,
        hypervisor: 'mock-kvm',
        allocatedSsdMb: request.resources.storageMb,
      },
    };
  }

  async getDatabaseVmStatus(vmId: string): Promise<VmStatusResult> {
    const vm = this.vms.get(vmId);
    if (!vm) {
      return { vmId, status: 'UNKNOWN' };
    }

    return {
      vmId,
      status: vm.status,
      cpuUsagePercent: vm.status === 'RUNNING' ? 12.5 : 0,
      ramUsageMb: vm.status === 'RUNNING' ? Math.floor(vm.ramMb * 0.4) : 0,
      uptimeSeconds: vm.status === 'RUNNING' ? 3600 : 0,
    };
  }

  async startDatabaseVm(vmId: string): Promise<VmOperationResult> {
    if (this.failureMode === 'START_FAIL') {
      throw new Error('Simulated start failure: Domain boot timeout');
    }

    const vm = this.vms.get(vmId);
    if (!vm) {
      return { success: false, status: 'NOT_FOUND', error: `VM ${vmId} not found` };
    }

    vm.status = 'RUNNING';
    vm.updatedAt = new Date();

    return { success: true, status: 'RUNNING', operationRef: `start-${vmId}` };
  }

  async stopDatabaseVm(vmId: string): Promise<VmOperationResult> {
    if (this.failureMode === 'STOP_FAIL') {
      throw new Error('Simulated stop failure: ACPI shutdown rejected');
    }

    const vm = this.vms.get(vmId);
    if (!vm) {
      return { success: false, status: 'NOT_FOUND', error: `VM ${vmId} not found` };
    }

    vm.status = 'STOPPED';
    vm.updatedAt = new Date();

    return { success: true, status: 'STOPPED', operationRef: `stop-${vmId}` };
  }

  async restartDatabaseVm(vmId: string): Promise<VmOperationResult> {
    if (this.failureMode === 'RESTART_FAIL') {
      throw new Error('Simulated restart failure: Reboot command failed');
    }

    const vm = this.vms.get(vmId);
    if (!vm) {
      return { success: false, status: 'NOT_FOUND', error: `VM ${vmId} not found` };
    }

    vm.status = 'RUNNING';
    vm.updatedAt = new Date();

    return { success: true, status: 'RUNNING', operationRef: `restart-${vmId}` };
  }

  async deleteDatabaseVm(vmId: string): Promise<VmOperationResult> {
    const exists = this.vms.has(vmId);
    if (exists) {
      this.vms.delete(vmId);
    }

    return {
      success: true,
      status: 'DELETED',
      operationRef: `delete-${vmId}`,
    };
  }

  async checkDatabaseHealth(vmId: string): Promise<VmHealthCheckResult> {
    if (this.failureMode === 'HEALTH_FAIL') {
      return {
        isHealthy: false,
        databaseResponsive: false,
        latencyMs: -1,
        details: { reason: 'Connection refused on port' },
      };
    }

    const vm = this.vms.get(vmId);
    if (!vm || vm.status !== 'RUNNING') {
      return {
        isHealthy: false,
        databaseResponsive: false,
        latencyMs: -1,
        details: { reason: vm ? `VM is ${vm.status}` : 'VM not found' },
      };
    }

    return {
      isHealthy: true,
      databaseResponsive: true,
      latencyMs: 8,
      details: { engineStatus: 'READY', connectionsActive: 1 },
    };
  }

  async getConnectionMetadata(
    vmId: string,
    engineType: DatabaseType,
  ): Promise<VmConnectionMetadata> {
    const vm = this.vms.get(vmId);
    const host = vm ? vm.internalIp : '10.50.0.11';
    const port = vm ? vm.port : this.resolveDefaultPort(engineType);
    const databaseName = 'dbaas_main';

    let connectionStringTemplate = '';
    switch (engineType) {
      case DatabaseType.POSTGRESQL:
        connectionStringTemplate = `postgresql://{username}:{password}@${host}:${port}/${databaseName}`;
        break;
      case DatabaseType.MONGODB:
        connectionStringTemplate = `mongodb://{username}:{password}@${host}:${port}/${databaseName}?authSource=admin`;
        break;
      case DatabaseType.QDRANT:
        connectionStringTemplate = `http://{username}:{password}@${host}:${port}`;
        break;
      case DatabaseType.NEO4J:
        connectionStringTemplate = `neo4j://${host}:${port}`;
        break;
    }

    return {
      host,
      port,
      internalIp: host,
      databaseName,
      connectionStringTemplate,
    };
  }

  async reconcileInfrastructureState(): Promise<VmReconciliationResult> {
    const discoveredVms = Array.from(this.vms.values()).map((vm) => ({
      vmId: vm.vmId,
      databaseId: vm.databaseId,
      status: vm.status,
      internalIp: vm.internalIp,
    }));

    return {
      discoveredVms,
      timestamp: new Date(),
    };
  }

  private resolveDefaultPort(engineType: DatabaseType): number {
    switch (engineType) {
      case DatabaseType.POSTGRESQL:
        return 5432;
      case DatabaseType.MONGODB:
        return 27017;
      case DatabaseType.QDRANT:
        return 6333;
      case DatabaseType.NEO4J:
        return 7687;
      default:
        return 5432;
    }
  }
}
