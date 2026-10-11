import { BadRequestException } from '@nestjs/common';
import { DatabaseQuotaService } from './database-quota.service';
import { DatabaseType, SubscriptionTier } from '@prisma/client';

describe('DatabaseQuotaService', () => {
  let service: DatabaseQuotaService;

  beforeEach(() => {
    service = new DatabaseQuotaService();
  });

  describe('validateQuotaWithinTransaction', () => {
    it('should permit database creation when within quota limits', async () => {
      const mockTx = {
        subscription: {
          findUnique: jest.fn().mockResolvedValue({ tier: SubscriptionTier.FREE }),
        },
        databaseInstance: {
          count: jest.fn().mockResolvedValue(0),
          aggregate: jest.fn().mockResolvedValue({
            _sum: { cpuCores: 0, ramMb: 0, storageMb: 0 },
          }),
        },
      };

      await expect(
        service.validateQuotaWithinTransaction(mockTx, 'project-1', {
          type: DatabaseType.POSTGRESQL,
          cpuCores: 1,
          ramMb: 1024,
          storageMb: 5120,
        }),
      ).resolves.not.toThrow();
    });

    it('should reject creation when project instance count exceeds tier limit', async () => {
      const mockTx = {
        subscription: {
          findUnique: jest.fn().mockResolvedValue({ tier: SubscriptionTier.FREE }), // Max 2
        },
        databaseInstance: {
          count: jest.fn().mockResolvedValue(2), // Already has 2
          aggregate: jest.fn().mockResolvedValue({
            _sum: { cpuCores: 2, ramMb: 2048, storageMb: 10240 },
          }),
        },
      };

      await expect(
        service.validateQuotaWithinTransaction(mockTx, 'project-1', {
          type: DatabaseType.POSTGRESQL,
          cpuCores: 1,
          ramMb: 1024,
          storageMb: 5120,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject creation when CPU cores exceed tier limit', async () => {
      const mockTx = {
        subscription: {
          findUnique: jest.fn().mockResolvedValue({ tier: SubscriptionTier.FREE }), // Max 4 cores
        },
        databaseInstance: {
          count: jest.fn().mockResolvedValue(1),
          aggregate: jest.fn().mockResolvedValue({
            _sum: { cpuCores: 3, ramMb: 1024, storageMb: 5120 },
          }),
        },
      };

      // Requesting 2 more cores: 3 + 2 = 5 > 4
      await expect(
        service.validateQuotaWithinTransaction(mockTx, 'project-1', {
          type: DatabaseType.POSTGRESQL,
          cpuCores: 2,
          ramMb: 1024,
          storageMb: 5120,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject creation when RAM exceeds tier limit', async () => {
      const mockTx = {
        subscription: {
          findUnique: jest.fn().mockResolvedValue({ tier: SubscriptionTier.FREE }), // Max 4096 MB
        },
        databaseInstance: {
          count: jest.fn().mockResolvedValue(1),
          aggregate: jest.fn().mockResolvedValue({
            _sum: { cpuCores: 1, ramMb: 3500, storageMb: 5120 },
          }),
        },
      };

      // Requesting 1024 MB: 3500 + 1024 = 4524 > 4096
      await expect(
        service.validateQuotaWithinTransaction(mockTx, 'project-1', {
          type: DatabaseType.POSTGRESQL,
          cpuCores: 1,
          ramMb: 1024,
          storageMb: 5120,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject creation when storage exceeds tier limit', async () => {
      const mockTx = {
        subscription: {
          findUnique: jest.fn().mockResolvedValue({ tier: SubscriptionTier.FREE }), // Max 20480 MB
        },
        databaseInstance: {
          count: jest.fn().mockResolvedValue(1),
          aggregate: jest.fn().mockResolvedValue({
            _sum: { cpuCores: 1, ramMb: 1024, storageMb: 18000 },
          }),
        },
      };

      // Requesting 5120 MB: 18000 + 5120 = 23120 > 20480
      await expect(
        service.validateQuotaWithinTransaction(mockTx, 'project-1', {
          type: DatabaseType.POSTGRESQL,
          cpuCores: 1,
          ramMb: 1024,
          storageMb: 5120,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
