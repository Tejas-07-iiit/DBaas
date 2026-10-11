import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseStatus, DatabaseType, SubscriptionTier } from '@prisma/client';

export interface PlanQuota {
  maxDatabases: number;
  maxCpuCores: number;
  maxRamMb: number;
  maxStorageMb: number;
  allowedEngines: DatabaseType[];
}

export const PLAN_QUOTAS: Record<SubscriptionTier, PlanQuota> = {
  [SubscriptionTier.FREE]: {
    maxDatabases: 2,
    maxCpuCores: 4,
    maxRamMb: 4096,
    maxStorageMb: 20480, // 20 GB
    allowedEngines: [
      DatabaseType.POSTGRESQL,
      DatabaseType.MONGODB,
      DatabaseType.QDRANT,
      DatabaseType.NEO4J,
    ],
  },
  [SubscriptionTier.BASIC]: {
    maxDatabases: 5,
    maxCpuCores: 16,
    maxRamMb: 16384,
    maxStorageMb: 102400, // 100 GB
    allowedEngines: [
      DatabaseType.POSTGRESQL,
      DatabaseType.MONGODB,
      DatabaseType.QDRANT,
      DatabaseType.NEO4J,
    ],
  },
  [SubscriptionTier.PRO]: {
    maxDatabases: 20,
    maxCpuCores: 64,
    maxRamMb: 65536,
    maxStorageMb: 512000, // 500 GB
    allowedEngines: [
      DatabaseType.POSTGRESQL,
      DatabaseType.MONGODB,
      DatabaseType.QDRANT,
      DatabaseType.NEO4J,
    ],
  },
};

@Injectable()
export class DatabaseQuotaService {
  /**
   * Retrieves quota limits for a given subscription tier.
   */
  getQuotaForTier(tier: SubscriptionTier): PlanQuota {
    return PLAN_QUOTAS[tier] || PLAN_QUOTAS[SubscriptionTier.FREE];
  }

  /**
   * Validates that requested resources fit within the project quota.
   * Executed within a Prisma transaction to eliminate race conditions.
   */
  async validateQuotaWithinTransaction(
    tx: any,
    projectId: string,
    requested: {
      type: DatabaseType;
      cpuCores: number;
      ramMb: number;
      storageMb: number;
    },
  ): Promise<void> {
    const subscription = await tx.subscription.findUnique({
      where: { projectId },
    });

    const tier = subscription?.tier || SubscriptionTier.FREE;
    const limits = this.getQuotaForTier(tier);

    // Verify engine permission
    if (!limits.allowedEngines.includes(requested.type)) {
      throw new BadRequestException(
        `Engine '${requested.type}' is not allowed on subscription tier ${tier}`,
      );
    }

    const activeFilter = {
      projectId,
      status: {
        notIn: [DatabaseStatus.DELETED],
      },
    };

    const [currentCount, usageSum] = await Promise.all([
      tx.databaseInstance.count({ where: activeFilter }),
      tx.databaseInstance.aggregate({
        where: activeFilter,
        _sum: {
          cpuCores: true,
          ramMb: true,
          storageMb: true,
        },
      }),
    ]);

    // Check count limit
    if (currentCount + 1 > limits.maxDatabases) {
      throw new BadRequestException(
        `Project database limit reached for tier ${tier} (current: ${currentCount}, maximum: ${limits.maxDatabases})`,
      );
    }

    // Check CPU limit
    const currentCpu = usageSum._sum.cpuCores || 0;
    if (currentCpu + requested.cpuCores > limits.maxCpuCores) {
      throw new BadRequestException(
        `CPU quota exceeded for tier ${tier} (current: ${currentCpu} cores, requested: ${requested.cpuCores} cores, maximum: ${limits.maxCpuCores} cores)`,
      );
    }

    // Check RAM limit
    const currentRam = usageSum._sum.ramMb || 0;
    if (currentRam + requested.ramMb > limits.maxRamMb) {
      throw new BadRequestException(
        `Memory quota exceeded for tier ${tier} (current: ${currentRam} MB, requested: ${requested.ramMb} MB, maximum: ${limits.maxRamMb} MB)`,
      );
    }

    // Check Storage limit
    const currentStorage = usageSum._sum.storageMb || 0;
    if (currentStorage + requested.storageMb > limits.maxStorageMb) {
      throw new BadRequestException(
        `Storage quota exceeded for tier ${tier} (current: ${currentStorage} MB, requested: ${requested.storageMb} MB, maximum: ${limits.maxStorageMb} MB)`,
      );
    }
  }
}
