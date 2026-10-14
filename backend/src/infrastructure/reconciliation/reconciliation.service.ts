import { Injectable, Logger, Inject } from '@nestjs/common';
import { DatabaseStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  INFRASTRUCTURE_PROVIDER,
  IInfrastructureProvider,
  VmMismatch,
  VmReconciliationResult,
} from '../provider.interface';

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(INFRASTRUCTURE_PROVIDER)
    private readonly provider: IInfrastructureProvider,
  ) {}

  /**
   * Reconciles actual infrastructure VM state against platform database records.
   * Identifies ghost VMs, missing VMs, and status mismatches without destructive automatic actions.
   */
  async reconcile(): Promise<{
    checkedCount: number;
    mismatchCount: number;
    mismatches: VmMismatch[];
  }> {
    this.logger.log(
      `Starting infrastructure reconciliation using provider: ${this.provider.name}`,
    );

    const providerResult: VmReconciliationResult =
      await this.provider.reconcileInfrastructureState();

    const providerVmMap = new Map<string, { vmId: string; databaseId?: string; status: string; internalIp?: string }>();
    for (const pVm of providerResult.discoveredVms) {
      providerVmMap.set(pVm.vmId, pVm);
    }

    // Fetch all active (non-deleted) database instances from platform DB
    const activeDatabases = await this.prisma.databaseInstance.findMany({
      where: {
        status: {
          notIn: [DatabaseStatus.DELETED, DatabaseStatus.REQUESTED],
        },
      },
    });

    const mismatches: VmMismatch[] = [];

    for (const db of activeDatabases) {
      if (!db.vmId) {
        if (db.status === DatabaseStatus.RUNNING) {
          mismatches.push({
            databaseId: db.id,
            platformStatus: db.status,
            description: `Database ${db.id} is marked RUNNING in platform DB but has no vmId assigned`,
            discrepancyType: 'MISSING_VM',
          });
        }
        continue;
      }

      const pVm = providerVmMap.get(db.vmId);
      if (!pVm) {
        mismatches.push({
          databaseId: db.id,
          vmId: db.vmId,
          platformStatus: db.status,
          description: `Database ${db.id} with vmId ${db.vmId} was not found on infrastructure provider`,
          discrepancyType: 'MISSING_VM',
        });
      } else {
        // Check status alignment
        if (db.status === DatabaseStatus.RUNNING && pVm.status !== 'RUNNING') {
          mismatches.push({
            databaseId: db.id,
            vmId: db.vmId,
            platformStatus: db.status,
            providerStatus: pVm.status,
            description: `Database ${db.id} is marked RUNNING in platform, but VM ${db.vmId} is ${pVm.status} in provider`,
            discrepancyType: 'STATUS_MISMATCH',
          });
        } else if (db.status === DatabaseStatus.STOPPED && pVm.status !== 'STOPPED') {
          mismatches.push({
            databaseId: db.id,
            vmId: db.vmId,
            platformStatus: db.status,
            providerStatus: pVm.status,
            description: `Database ${db.id} is marked STOPPED in platform, but VM ${db.vmId} is ${pVm.status} in provider`,
            discrepancyType: 'STATUS_MISMATCH',
          });
        }
      }
    }

    // Check for ghost VMs: VMs in provider that don't map to any active database
    for (const pVm of providerResult.discoveredVms) {
      if (pVm.databaseId) {
        const matchingDb = activeDatabases.find((d) => d.id === pVm.databaseId);
        if (!matchingDb) {
          mismatches.push({
            databaseId: pVm.databaseId,
            vmId: pVm.vmId,
            providerStatus: pVm.status,
            description: `VM ${pVm.vmId} exists on infrastructure provider for non-active/deleted database ${pVm.databaseId}`,
            discrepancyType: 'GHOST_VM',
          });
        }
      }
    }

    if (mismatches.length > 0) {
      this.logger.warn(
        `Reconciliation found ${mismatches.length} mismatches across ${activeDatabases.length} databases`,
      );
    } else {
      this.logger.log(
        `Reconciliation completed successfully with 0 mismatches across ${activeDatabases.length} databases`,
      );
    }

    return {
      checkedCount: activeDatabases.length,
      mismatchCount: mismatches.length,
      mismatches,
    };
  }

  /**
   * Reconciles a single database instance against the infrastructure provider.
   */
  async reconcileInstance(databaseId: string): Promise<VmMismatch | null> {
    const db = await this.prisma.databaseInstance.findUnique({
      where: { id: databaseId },
    });

    if (!db || !db.vmId) {
      return null;
    }

    const vmStatus = await this.provider.getDatabaseVmStatus(db.vmId);

    if (vmStatus.status === 'UNKNOWN') {
      return {
        databaseId: db.id,
        vmId: db.vmId,
        platformStatus: db.status,
        description: `VM ${db.vmId} not found in provider`,
        discrepancyType: 'MISSING_VM',
      };
    }

    if (db.status === DatabaseStatus.RUNNING && vmStatus.status !== 'RUNNING') {
      return {
        databaseId: db.id,
        vmId: db.vmId,
        platformStatus: db.status,
        providerStatus: vmStatus.status,
        description: `Database is RUNNING in platform, but VM is ${vmStatus.status}`,
        discrepancyType: 'STATUS_MISMATCH',
      };
    }

    return null;
  }
}
