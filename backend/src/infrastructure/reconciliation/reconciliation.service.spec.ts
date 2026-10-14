import { DatabaseStatus } from '@prisma/client';
import { ReconciliationService } from './reconciliation.service';

describe('ReconciliationService', () => {
  let service: ReconciliationService;
  let mockPrisma: any;
  let mockProvider: any;

  beforeEach(() => {
    mockPrisma = {
      databaseInstance: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    mockProvider = {
      name: 'mock',
      reconcileInfrastructureState: jest.fn(),
      getDatabaseVmStatus: jest.fn(),
    };

    service = new ReconciliationService(mockPrisma as any, mockProvider as any);
  });

  it('should report zero mismatches when provider and database match cleanly', async () => {
    mockPrisma.databaseInstance.findMany.mockResolvedValue([
      {
        id: 'db-1',
        vmId: 'vm-1',
        status: DatabaseStatus.RUNNING,
      },
    ]);

    mockProvider.reconcileInfrastructureState.mockResolvedValue({
      discoveredVms: [
        {
          vmId: 'vm-1',
          databaseId: 'db-1',
          status: 'RUNNING',
          internalIp: '10.50.0.11',
        },
      ],
      timestamp: new Date(),
    });

    const result = await service.reconcile();

    expect(result.checkedCount).toBe(1);
    expect(result.mismatchCount).toBe(0);
    expect(result.mismatches).toHaveLength(0);
  });

  it('should detect MISSING_VM when database is RUNNING but VM does not exist in provider', async () => {
    mockPrisma.databaseInstance.findMany.mockResolvedValue([
      {
        id: 'db-1',
        vmId: 'vm-1',
        status: DatabaseStatus.RUNNING,
      },
    ]);

    mockProvider.reconcileInfrastructureState.mockResolvedValue({
      discoveredVms: [],
      timestamp: new Date(),
    });

    const result = await service.reconcile();

    expect(result.mismatchCount).toBe(1);
    expect(result.mismatches[0].discrepancyType).toBe('MISSING_VM');
  });

  it('should detect STATUS_MISMATCH when database is RUNNING but VM is STOPPED', async () => {
    mockPrisma.databaseInstance.findMany.mockResolvedValue([
      {
        id: 'db-1',
        vmId: 'vm-1',
        status: DatabaseStatus.RUNNING,
      },
    ]);

    mockProvider.reconcileInfrastructureState.mockResolvedValue({
      discoveredVms: [
        {
          vmId: 'vm-1',
          databaseId: 'db-1',
          status: 'STOPPED',
          internalIp: '10.50.0.11',
        },
      ],
      timestamp: new Date(),
    });

    const result = await service.reconcile();

    expect(result.mismatchCount).toBe(1);
    expect(result.mismatches[0].discrepancyType).toBe('STATUS_MISMATCH');
  });

  it('should detect GHOST_VM when provider has a VM for non-existent or deleted database', async () => {
    mockPrisma.databaseInstance.findMany.mockResolvedValue([]);

    mockProvider.reconcileInfrastructureState.mockResolvedValue({
      discoveredVms: [
        {
          vmId: 'vm-ghost',
          databaseId: 'db-deleted-999',
          status: 'RUNNING',
          internalIp: '10.50.0.99',
        },
      ],
      timestamp: new Date(),
    });

    const result = await service.reconcile();

    expect(result.mismatchCount).toBe(1);
    expect(result.mismatches[0].discrepancyType).toBe('GHOST_VM');
  });
});
