import { DatabaseStatus, DatabaseType, OperationStatus } from '@prisma/client';
import { DatabaseLifecycleConsumer } from './database-lifecycle.consumer';

describe('DatabaseLifecycleConsumer', () => {
  let consumer: DatabaseLifecycleConsumer;
  let mockPrisma: any;
  let mockLifecycleService: any;
  let mockEncryptionService: any;
  let mockProvider: any;

  const mockDatabase: any = {
    id: 'db-11111111-1111-1111-1111-111111111111',
    projectId: 'proj-2222',
    name: 'test-db',
    type: DatabaseType.POSTGRESQL,
    version: '16',
    status: DatabaseStatus.REQUESTED,
    cpuCores: 1,
    ramMb: 1024,
    storageMb: 5120,
    vmId: null,
    internalIp: null,
    port: null,
  };

  beforeEach(() => {
    mockPrisma = {
      databaseInstance: {
        findUnique: jest.fn().mockResolvedValue({ ...mockDatabase }),
        update: jest.fn().mockResolvedValue({ ...mockDatabase }),
      },
      databaseOperation: {
        update: jest.fn().mockResolvedValue({}),
      },
      databaseCredential: {
        create: jest.fn().mockResolvedValue({}),
      },
      databaseEvent: {
        create: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn().mockImplementation(async (callback) => {
        return callback(mockPrisma);
      }),
    };

    mockLifecycleService = {
      transitionStatus: jest.fn().mockResolvedValue({}),
    };

    mockEncryptionService = {
      encrypt: jest.fn().mockReturnValue('encrypted-mock-password'),
      decrypt: jest.fn().mockReturnValue('decrypted-mock-password'),
    };

    mockProvider = {
      name: 'mock',
      provisionDatabaseVm: jest.fn().mockResolvedValue({
        vmId: 'vm-post-1234',
        status: 'RUNNING',
        internalIp: '10.50.0.11',
        port: 5432,
      }),
      checkDatabaseHealth: jest.fn().mockResolvedValue({
        isHealthy: true,
        databaseResponsive: true,
        latencyMs: 5,
      }),
      startDatabaseVm: jest.fn().mockResolvedValue({ success: true, status: 'RUNNING' }),
      stopDatabaseVm: jest.fn().mockResolvedValue({ success: true, status: 'STOPPED' }),
      restartDatabaseVm: jest.fn().mockResolvedValue({ success: true, status: 'RUNNING' }),
      deleteDatabaseVm: jest.fn().mockResolvedValue({ success: true, status: 'DELETED' }),
    };

    consumer = new DatabaseLifecycleConsumer(
      mockPrisma as any,
      mockLifecycleService as any,
      mockEncryptionService as any,
      mockProvider as any,
    );
  });

  it('should process provision-database job successfully end-to-end', async () => {
    const job: any = {
      id: 'job-1',
      name: 'provision-database',
      attemptsMade: 0,
      opts: { attempts: 3 },
      data: {
        databaseId: mockDatabase.id,
        projectId: mockDatabase.projectId,
        operationId: 'op-1',
      },
    };

    const result = await consumer.process(job);

    expect(result).toBeDefined();
    expect(result.vmId).toBe('vm-post-1234');
    expect(mockProvider.provisionDatabaseVm).toHaveBeenCalledTimes(1);
    expect(mockProvider.checkDatabaseHealth).toHaveBeenCalledWith('vm-post-1234');
    expect(mockEncryptionService.encrypt).toHaveBeenCalledTimes(1);
    expect(mockPrisma.databaseOperation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'op-1' },
        data: expect.objectContaining({ status: OperationStatus.COMPLETED }),
      }),
    );
  });

  it('should handle idempotent duplicate provisioning job when database is already RUNNING', async () => {
    mockPrisma.databaseInstance.findUnique.mockResolvedValue({
      ...mockDatabase,
      status: DatabaseStatus.RUNNING,
      vmId: 'vm-post-already-running',
    });

    const job: any = {
      id: 'job-dup',
      name: 'provision-database',
      attemptsMade: 0,
      opts: { attempts: 3 },
      data: {
        databaseId: mockDatabase.id,
        projectId: mockDatabase.projectId,
        operationId: 'op-1',
      },
    };

    const result = await consumer.process(job);

    expect(result.vmId).toBe('vm-post-already-running');
    expect(mockProvider.provisionDatabaseVm).not.toHaveBeenCalled();
    expect(mockPrisma.databaseOperation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'op-1' },
        data: expect.objectContaining({ status: OperationStatus.COMPLETED }),
      }),
    );
  });

  it('should execute compensation cleanup and mark ERROR on final retry attempt failure', async () => {
    mockProvider.provisionDatabaseVm.mockResolvedValue({
      vmId: 'vm-partial-created',
      status: 'RUNNING',
      internalIp: '10.50.0.11',
      port: 5432,
    });
    mockProvider.checkDatabaseHealth.mockResolvedValue({
      isHealthy: false,
      details: { reason: 'Refused' },
    });

    const job: any = {
      id: 'job-fail',
      name: 'provision-database',
      attemptsMade: 2, // 3rd and final attempt (attemptsMade + 1 >= 3)
      opts: { attempts: 3 },
      data: {
        databaseId: mockDatabase.id,
        projectId: mockDatabase.projectId,
        operationId: 'op-1',
      },
    };

    await expect(consumer.process(job)).rejects.toThrow();

    // Verify compensation cleanup was invoked
    expect(mockProvider.deleteDatabaseVm).toHaveBeenCalledWith('vm-partial-created');

    // Verify instance updated to ERROR and operation updated to FAILED
    expect(mockPrisma.databaseInstance.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockDatabase.id },
        data: expect.objectContaining({ status: DatabaseStatus.ERROR }),
      }),
    );

    expect(mockPrisma.databaseOperation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'op-1' },
        data: expect.objectContaining({ status: OperationStatus.FAILED }),
      }),
    );
  });

  it('should process start-database job successfully', async () => {
    mockPrisma.databaseInstance.findUnique.mockResolvedValue({
      ...mockDatabase,
      status: DatabaseStatus.STOPPED,
      vmId: 'vm-123',
    });

    const job: any = {
      id: 'job-start',
      name: 'start-database',
      attemptsMade: 0,
      data: { databaseId: mockDatabase.id, operationId: 'op-start' },
    };

    const result = await consumer.process(job);

    expect(result.status).toBe('RUNNING');
    expect(mockProvider.startDatabaseVm).toHaveBeenCalledWith('vm-123');
  });

  it('should process stop-database job successfully', async () => {
    mockPrisma.databaseInstance.findUnique.mockResolvedValue({
      ...mockDatabase,
      status: DatabaseStatus.RUNNING,
      vmId: 'vm-123',
    });

    const job: any = {
      id: 'job-stop',
      name: 'stop-database',
      attemptsMade: 0,
      data: { databaseId: mockDatabase.id, operationId: 'op-stop' },
    };

    const result = await consumer.process(job);

    expect(result.status).toBe('STOPPED');
    expect(mockProvider.stopDatabaseVm).toHaveBeenCalledWith('vm-123');
  });

  it('should process restart-database job successfully', async () => {
    mockPrisma.databaseInstance.findUnique.mockResolvedValue({
      ...mockDatabase,
      status: DatabaseStatus.RUNNING,
      vmId: 'vm-123',
    });

    const job: any = {
      id: 'job-restart',
      name: 'restart-database',
      attemptsMade: 0,
      data: { databaseId: mockDatabase.id, operationId: 'op-restart' },
    };

    const result = await consumer.process(job);

    expect(result.status).toBe('RUNNING');
    expect(mockProvider.restartDatabaseVm).toHaveBeenCalledWith('vm-123');
  });

  it('should process delete-database job and destroy VM', async () => {
    mockPrisma.databaseInstance.findUnique.mockResolvedValue({
      ...mockDatabase,
      status: DatabaseStatus.DELETING,
      vmId: 'vm-123',
    });

    const job: any = {
      id: 'job-delete',
      name: 'delete-database',
      attemptsMade: 0,
      data: { databaseId: mockDatabase.id, operationId: 'op-delete' },
    };

    const result = await consumer.process(job);

    expect(result.status).toBe('DELETED');
    expect(mockProvider.deleteDatabaseVm).toHaveBeenCalledWith('vm-123');
  });
});
