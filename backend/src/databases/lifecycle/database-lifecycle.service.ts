import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseStatus, DatabaseEventType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Centrally defined allowed state transitions for database instances.
 */
export const ALLOWED_TRANSITIONS: Record<DatabaseStatus, DatabaseStatus[]> = {
  [DatabaseStatus.REQUESTED]: [
    DatabaseStatus.PROVISIONING,
    DatabaseStatus.DELETING,
    DatabaseStatus.ERROR,
  ],
  [DatabaseStatus.PENDING]: [
    DatabaseStatus.REQUESTED,
    DatabaseStatus.PROVISIONING,
    DatabaseStatus.DELETING,
    DatabaseStatus.ERROR,
  ],
  [DatabaseStatus.PROVISIONING]: [
    DatabaseStatus.RUNNING,
    DatabaseStatus.DELETING,
    DatabaseStatus.ERROR,
  ],
  [DatabaseStatus.RUNNING]: [
    DatabaseStatus.STOPPING,
    DatabaseStatus.RESTARTING,
    DatabaseStatus.DELETING,
    DatabaseStatus.ERROR,
  ],
  [DatabaseStatus.STOPPING]: [
    DatabaseStatus.STOPPED,
    DatabaseStatus.ERROR,
    DatabaseStatus.DELETING,
  ],
  [DatabaseStatus.STOPPED]: [
    DatabaseStatus.STARTING,
    DatabaseStatus.DELETING,
    DatabaseStatus.ERROR,
  ],
  [DatabaseStatus.STARTING]: [
    DatabaseStatus.RUNNING,
    DatabaseStatus.ERROR,
    DatabaseStatus.DELETING,
  ],
  [DatabaseStatus.RESTARTING]: [
    DatabaseStatus.RUNNING,
    DatabaseStatus.ERROR,
    DatabaseStatus.DELETING,
  ],
  [DatabaseStatus.ERROR]: [
    DatabaseStatus.DELETING,
    DatabaseStatus.REQUESTED, // retry
  ],
  [DatabaseStatus.DELETING]: [
    DatabaseStatus.DELETED,
    DatabaseStatus.ERROR,
  ],
  [DatabaseStatus.DELETED]: [], // Terminal state
};

@Injectable()
export class DatabaseLifecycleService {
  private readonly logger = new Logger(DatabaseLifecycleService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Checks whether a status transition is permitted.
   */
  canTransition(fromStatus: DatabaseStatus, toStatus: DatabaseStatus): boolean {
    const allowed = ALLOWED_TRANSITIONS[fromStatus] || [];
    return allowed.includes(toStatus);
  }

  /**
   * Asserts that a status transition is permitted; throws BadRequestException if not.
   */
  validateTransition(fromStatus: DatabaseStatus, toStatus: DatabaseStatus): void {
    if (fromStatus === toStatus) {
      throw new BadRequestException(
        `Database is already in '${fromStatus}' status`,
      );
    }

    if (!this.canTransition(fromStatus, toStatus)) {
      throw new BadRequestException(
        `Invalid lifecycle status transition from '${fromStatus}' to '${toStatus}'.`,
      );
    }
  }

  /**
   * Updates database status and writes an audit DatabaseEvent in a transaction.
   */
  async transitionStatus(
    tx: any,
    databaseId: string,
    fromStatus: DatabaseStatus,
    toStatus: DatabaseStatus,
    eventType: DatabaseEventType = DatabaseEventType.STATUS_CHANGED,
    message?: string,
    metadata?: Record<string, any>,
  ) {
    this.validateTransition(fromStatus, toStatus);

    const updated = await tx.databaseInstance.update({
      where: { id: databaseId },
      data: {
        status: toStatus,
        ...(toStatus === DatabaseStatus.DELETING && { deletedAt: new Date() }),
      },
    });

    await tx.databaseEvent.create({
      data: {
        databaseId,
        type: eventType,
        previousStatus: fromStatus,
        newStatus: toStatus,
        message:
          message ||
          `Database status transitioned from ${fromStatus} to ${toStatus}`,
        metadata: metadata ? (metadata as any) : undefined,
      },
    });

    this.logger.log(
      `Database ${databaseId} status transitioned from ${fromStatus} to ${toStatus}`,
    );

    return updated;
  }
}
