import { DatabaseType } from '@prisma/client';
import { MockInfrastructureProvider } from './mock-infrastructure.provider';
import { ProvisionVmRequest } from '../provider.interface';

describe('MockInfrastructureProvider', () => {
  let provider: MockInfrastructureProvider;

  const mockRequest: ProvisionVmRequest = {
    databaseId: '11111111-1111-1111-1111-111111111111',
    projectId: '22222222-2222-2222-2222-222222222222',
    engineType: DatabaseType.POSTGRESQL,
    engineVersion: '16',
    resources: {
      cpuCores: 2,
      ramMb: 2048,
      storageMb: 10240,
    },
    credentials: {
      username: 'dbaas_admin',
      password: 'secretpassword',
    },
    network: {
      subnet: '10.50.0.0/24',
    },
  };

  beforeEach(() => {
    provider = new MockInfrastructureProvider();
    provider.reset();
  });

  it('should provision a VM successfully and assign an IP in the 10.50.0.x subnet', async () => {
    const result = await provider.provisionDatabaseVm(mockRequest);

    expect(result).toBeDefined();
    expect(result.status).toBe('RUNNING');
    expect(result.vmId).toContain('vm-post-');
    expect(result.internalIp).toMatch(/^10\.50\.0\.\d+$/);
    expect(result.port).toBe(5432);
    expect(result.metadata?.isMock).toBe(true);
  });

  it('should return existing VM when provision is called idempotently for the same database', async () => {
    const firstResult = await provider.provisionDatabaseVm(mockRequest);
    const secondResult = await provider.provisionDatabaseVm(mockRequest);

    expect(secondResult.vmId).toBe(firstResult.vmId);
    expect(secondResult.internalIp).toBe(firstResult.internalIp);
    expect(secondResult.metadata?.reused).toBe(true);
  });

  it('should support lifecycle actions: stop, start, restart, and delete', async () => {
    const { vmId } = await provider.provisionDatabaseVm(mockRequest);

    // Initial status should be RUNNING
    let statusResult = await provider.getDatabaseVmStatus(vmId);
    expect(statusResult.status).toBe('RUNNING');

    // Stop VM
    const stopResult = await provider.stopDatabaseVm(vmId);
    expect(stopResult.success).toBe(true);
    expect(stopResult.status).toBe('STOPPED');

    statusResult = await provider.getDatabaseVmStatus(vmId);
    expect(statusResult.status).toBe('STOPPED');

    // Start VM
    const startResult = await provider.startDatabaseVm(vmId);
    expect(startResult.success).toBe(true);
    expect(startResult.status).toBe('RUNNING');

    // Restart VM
    const restartResult = await provider.restartDatabaseVm(vmId);
    expect(restartResult.success).toBe(true);
    expect(restartResult.status).toBe('RUNNING');

    // Delete VM
    const deleteResult = await provider.deleteDatabaseVm(vmId);
    expect(deleteResult.success).toBe(true);

    statusResult = await provider.getDatabaseVmStatus(vmId);
    expect(statusResult.status).toBe('UNKNOWN');
  });

  it('should execute health check and report healthy status for running VM', async () => {
    const { vmId } = await provider.provisionDatabaseVm(mockRequest);
    const health = await provider.checkDatabaseHealth(vmId);

    expect(health.isHealthy).toBe(true);
    expect(health.databaseResponsive).toBe(true);
    expect(health.latencyMs).toBeGreaterThan(0);
  });

  it('should format connection metadata for all supported engines', async () => {
    const { vmId } = await provider.provisionDatabaseVm(mockRequest);

    const pgMeta = await provider.getConnectionMetadata(vmId, DatabaseType.POSTGRESQL);
    expect(pgMeta.connectionStringTemplate).toContain('postgresql://');
    expect(pgMeta.port).toBe(5432);

    const mongoMeta = await provider.getConnectionMetadata(vmId, DatabaseType.MONGODB);
    expect(mongoMeta.connectionStringTemplate).toContain('mongodb://');

    const qdrantMeta = await provider.getConnectionMetadata(vmId, DatabaseType.QDRANT);
    expect(qdrantMeta.connectionStringTemplate).toContain('http://');

    const neo4jMeta = await provider.getConnectionMetadata(vmId, DatabaseType.NEO4J);
    expect(neo4jMeta.connectionStringTemplate).toContain('neo4j://');
  });

  it('should simulate failure when failure mode is configured', async () => {
    provider.setSimulatedFailure('PROVISION_FAIL');

    await expect(provider.provisionDatabaseVm(mockRequest)).rejects.toThrow(
      'Simulated hypervisor error',
    );
  });

  it('should simulate health check failure when HEALTH_FAIL is active', async () => {
    const { vmId } = await provider.provisionDatabaseVm(mockRequest);

    provider.setSimulatedFailure('HEALTH_FAIL');
    const health = await provider.checkDatabaseHealth(vmId);

    expect(health.isHealthy).toBe(false);
    expect(health.databaseResponsive).toBe(false);
  });

  it('should return reconciliation list with discovered VMs', async () => {
    await provider.provisionDatabaseVm(mockRequest);
    const result = await provider.reconcileInfrastructureState();

    expect(result.discoveredVms).toHaveLength(1);
    expect(result.discoveredVms[0].databaseId).toBe(mockRequest.databaseId);
  });
});
