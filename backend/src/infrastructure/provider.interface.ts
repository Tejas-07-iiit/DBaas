import { DatabaseType } from '@prisma/client';

export interface VmResourceSpecs {
  cpuCores: number;
  ramMb: number;
  storageMb: number;
}

export interface VmNetworkConfig {
  subnet: string;
  internalIp?: string;
}

export interface VmCredentials {
  username: string;
  password?: string;
}

export interface ProvisionVmRequest {
  databaseId: string;
  projectId: string;
  engineType: DatabaseType;
  engineVersion: string;
  resourceProfile?: string;
  resources: VmResourceSpecs;
  credentials: VmCredentials;
  network: VmNetworkConfig;
  tags?: Record<string, string>;
}

export interface ProvisionVmResult {
  vmId: string;
  status: 'PROVISIONING' | 'RUNNING' | 'FAILED';
  internalIp: string;
  port: number;
  metadata?: Record<string, any>;
  error?: string;
}

export interface VmStatusResult {
  vmId: string;
  status: 'RUNNING' | 'STOPPED' | 'STARTING' | 'STOPPING' | 'ERROR' | 'UNKNOWN';
  cpuUsagePercent?: number;
  ramUsageMb?: number;
  uptimeSeconds?: number;
  details?: Record<string, any>;
}

export interface VmOperationResult {
  success: boolean;
  status: string;
  operationRef?: string;
  error?: string;
}

export interface VmHealthCheckResult {
  isHealthy: boolean;
  databaseResponsive: boolean;
  latencyMs: number;
  details?: Record<string, any>;
}

export interface VmConnectionMetadata {
  host: string;
  port: number;
  internalIp: string;
  databaseName: string;
  connectionStringTemplate: string;
}

export interface VmMismatch {
  databaseId?: string;
  vmId?: string;
  platformStatus?: string;
  providerStatus?: string;
  description: string;
  discrepancyType: 'MISSING_VM' | 'GHOST_VM' | 'STATUS_MISMATCH' | 'IP_MISMATCH';
}

export interface VmReconciliationResult {
  discoveredVms: Array<{
    vmId: string;
    databaseId?: string;
    status: string;
    internalIp?: string;
  }>;
  mismatches?: VmMismatch[];
  timestamp: Date;
}

export const INFRASTRUCTURE_PROVIDER = 'INFRASTRUCTURE_PROVIDER';

export interface IInfrastructureProvider {
  readonly name: string;

  provisionDatabaseVm(request: ProvisionVmRequest): Promise<ProvisionVmResult>;

  getDatabaseVmStatus(vmId: string): Promise<VmStatusResult>;

  startDatabaseVm(vmId: string): Promise<VmOperationResult>;

  stopDatabaseVm(vmId: string): Promise<VmOperationResult>;

  restartDatabaseVm(vmId: string): Promise<VmOperationResult>;

  deleteDatabaseVm(vmId: string): Promise<VmOperationResult>;

  checkDatabaseHealth(vmId: string): Promise<VmHealthCheckResult>;

  getConnectionMetadata(
    vmId: string,
    engineType: DatabaseType,
  ): Promise<VmConnectionMetadata>;

  reconcileInfrastructureState(): Promise<VmReconciliationResult>;
}
