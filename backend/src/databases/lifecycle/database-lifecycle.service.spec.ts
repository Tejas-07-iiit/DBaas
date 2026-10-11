import { BadRequestException } from '@nestjs/common';
import { DatabaseLifecycleService } from './database-lifecycle.service';
import { DatabaseStatus, DatabaseEventType } from '@prisma/client';

describe('DatabaseLifecycleService', () => {
  let service: DatabaseLifecycleService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      databaseInstance: {
        update: jest.fn(),
      },
      databaseEvent: {
        create: jest.fn(),
      },
    };
    service = new DatabaseLifecycleService(prisma);
  });

  describe('validateTransition', () => {
    it('should permit valid lifecycle transitions', () => {
      expect(() =>
        service.validateTransition(
          DatabaseStatus.REQUESTED,
          DatabaseStatus.PROVISIONING,
        ),
      ).not.toThrow();

      expect(() =>
        service.validateTransition(
          DatabaseStatus.PROVISIONING,
          DatabaseStatus.RUNNING,
        ),
      ).not.toThrow();

      expect(() =>
        service.validateTransition(
          DatabaseStatus.RUNNING,
          DatabaseStatus.STOPPING,
        ),
      ).not.toThrow();

      expect(() =>
        service.validateTransition(
          DatabaseStatus.STOPPING,
          DatabaseStatus.STOPPED,
        ),
      ).not.toThrow();

      expect(() =>
        service.validateTransition(
          DatabaseStatus.STOPPED,
          DatabaseStatus.STARTING,
        ),
      ).not.toThrow();

      expect(() =>
        service.validateTransition(
          DatabaseStatus.STARTING,
          DatabaseStatus.RUNNING,
        ),
      ).not.toThrow();

      expect(() =>
        service.validateTransition(
          DatabaseStatus.RUNNING,
          DatabaseStatus.DELETING,
        ),
      ).not.toThrow();

      expect(() =>
        service.validateTransition(
          DatabaseStatus.DELETING,
          DatabaseStatus.DELETED,
        ),
      ).not.toThrow();
    });

    it('should reject direct invalid transition from REQUESTED to RUNNING', () => {
      expect(() =>
        service.validateTransition(
          DatabaseStatus.REQUESTED,
          DatabaseStatus.RUNNING,
        ),
      ).toThrow(BadRequestException);
    });

    it('should reject transitions from terminal DELETED state', () => {
      expect(() =>
        service.validateTransition(
          DatabaseStatus.DELETED,
          DatabaseStatus.RUNNING,
        ),
      ).toThrow(BadRequestException);

      expect(() =>
        service.validateTransition(
          DatabaseStatus.DELETED,
          DatabaseStatus.PROVISIONING,
        ),
      ).toThrow(BadRequestException);
    });

    it('should reject transition to the exact same status', () => {
      expect(() =>
        service.validateTransition(
          DatabaseStatus.RUNNING,
          DatabaseStatus.RUNNING,
        ),
      ).toThrow(BadRequestException);
    });
  });

  describe('transitionStatus', () => {
    it('should update database instance and record an event with previous and new status', async () => {
      const mockTx = {
        databaseInstance: {
          update: jest.fn().mockResolvedValue({
            id: 'db-1',
            status: DatabaseStatus.DELETING,
          }),
        },
        databaseEvent: {
          create: jest.fn().mockResolvedValue({ id: 'evt-1' }),
        },
      };

      await service.transitionStatus(
        mockTx,
        'db-1',
        DatabaseStatus.RUNNING,
        DatabaseStatus.DELETING,
        DatabaseEventType.DELETION_REQUESTED,
        'Manual user deletion',
      );

      expect(mockTx.databaseInstance.update).toHaveBeenCalledWith({
        where: { id: 'db-1' },
        data: {
          status: DatabaseStatus.DELETING,
          deletedAt: expect.any(Date),
        },
      });

      expect(mockTx.databaseEvent.create).toHaveBeenCalledWith({
        data: {
          databaseId: 'db-1',
          type: DatabaseEventType.DELETION_REQUESTED,
          previousStatus: DatabaseStatus.RUNNING,
          newStatus: DatabaseStatus.DELETING,
          message: 'Manual user deletion',
          metadata: undefined,
        },
      });
    });
  });
});
