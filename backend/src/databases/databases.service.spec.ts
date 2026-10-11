import {
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabasesService } from './databases.service';
import { DatabaseEnginesService } from '../database-engines/database-engines.service';
import { DatabaseLifecycleService } from './lifecycle/database-lifecycle.service';
import { DatabaseQuotaService } from './quotas/database-quota.service';
import { ProjectAuthorizationService } from '../projects/project-authorization.service';
import { DatabaseType, DatabaseStatus, ProjectRole, DatabaseEventType } from '@prisma/client';

describe('DatabasesService', () => {
  let service: DatabasesService;
  let prisma: any;
  let usersService: any;
  let authService: ProjectAuthorizationService;
  let enginesService: DatabaseEnginesService;
  let lifecycleService: DatabaseLifecycleService;
  let quotaService: DatabaseQuotaService;
  let mockQueue: any;

  const mockDate = new Date('2026-01-01T00:00:00Z');

  const mockUser = {
    id: '11111111-1111-1111-1111-111111111111',
    firebaseUid: 'fb-user-1',
    email: 'dev@example.com',
    name: 'Developer',
  };

  const mockProject = {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Main Project',
    ownerId: mockUser.id,
  };

  const mockDatabase: any = {
    id: '33333333-3333-3333-3333-333333333333',
    projectId: mockProject.id,
    name: 'primary-db',
    type: DatabaseType.POSTGRESQL,
    version: '16',
    status: DatabaseStatus.REQUESTED,
    cpuCores: 1,
    ramMb: 1024,
    storageMb: 5120,
    internalIp: null,
    internalNetwork: null,
    vmId: null,
    failureReason: null,
    deletedAt: null,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  beforeEach(() => {
    prisma = {
      databaseInstance: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        aggregate: jest.fn().mockResolvedValue({
          _sum: { cpuCores: 0, ramMb: 0, storageMb: 0 },
        }),
      },
      databaseEvent: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      projectMember: {
        findUnique: jest.fn(),
      },
      subscription: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    usersService = {
      findOrCreateFromFirebase: jest.fn().mockResolvedValue(mockUser),
    };

    authService = new ProjectAuthorizationService(prisma);
    enginesService = new DatabaseEnginesService();
    lifecycleService = new DatabaseLifecycleService(prisma);
    quotaService = new DatabaseQuotaService();

    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    };

    service = new DatabasesService(
      prisma,
      usersService,
      authService,
      enginesService,
      lifecycleService,
      quotaService,
      mockQueue,
    );
  });

  describe('createDatabase', () => {
    it('should create database instance in REQUESTED state and enqueue BullMQ job', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({
        id: 'pm-1',
        projectId: mockProject.id,
        userId: mockUser.id,
        role: ProjectRole.OWNER,
        project: mockProject,
      });

      prisma.databaseInstance.findFirst.mockResolvedValue(null);
      prisma.databaseInstance.count.mockResolvedValue(0);
      prisma.databaseInstance.create.mockResolvedValue(mockDatabase);
      prisma.databaseEvent.create.mockResolvedValue({ id: 'evt-1' });

      const result = await service.createDatabase(
        { uid: mockUser.firebaseUid, email: mockUser.email },
        mockProject.id,
        {
          name: 'primary-db',
          type: DatabaseType.POSTGRESQL,
          version: '16',
          cpuCores: 1,
          ramMb: 1024,
          storageMb: 5120,
        },
      );

      expect(result.id).toBe(mockDatabase.id);
      expect(result.status).toBe(DatabaseStatus.REQUESTED);
      expect(result.isOperational).toBe(false);
      expect(mockQueue.add).toHaveBeenCalledWith(
        'provision-database',
        expect.objectContaining({
          databaseId: mockDatabase.id,
          projectId: mockProject.id,
          type: DatabaseType.POSTGRESQL,
        }),
        expect.objectContaining({
          jobId: `provision-${mockDatabase.id}`,
        }),
      );
    });

    it('should forbid ordinary MEMBER from creating database', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({
        id: 'pm-1',
        projectId: mockProject.id,
        userId: mockUser.id,
        role: ProjectRole.MEMBER,
        project: mockProject,
      });

      await expect(
        service.createDatabase(
          { uid: mockUser.firebaseUid, email: mockUser.email },
          mockProject.id,
          {
            name: 'member-db',
            type: DatabaseType.POSTGRESQL,
            cpuCores: 1,
            ramMb: 1024,
            storageMb: 5120,
          },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject creation with duplicate database name in the same project', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({
        id: 'pm-1',
        projectId: mockProject.id,
        userId: mockUser.id,
        role: ProjectRole.OWNER,
        project: mockProject,
      });

      prisma.databaseInstance.findFirst.mockResolvedValue(mockDatabase);

      await expect(
        service.createDatabase(
          { uid: mockUser.firebaseUid, email: mockUser.email },
          mockProject.id,
          {
            name: 'primary-db',
            type: DatabaseType.POSTGRESQL,
            cpuCores: 1,
            ramMb: 1024,
            storageMb: 5120,
          },
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getDatabase', () => {
    it('should return database details when belonging to project', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({
        id: 'pm-1',
        projectId: mockProject.id,
        userId: mockUser.id,
        role: ProjectRole.MEMBER,
        project: mockProject,
      });

      prisma.databaseInstance.findUnique.mockResolvedValue(mockDatabase);

      const result = await service.getDatabase(
        { uid: mockUser.firebaseUid, email: mockUser.email },
        mockProject.id,
        mockDatabase.id,
      );

      expect(result.id).toBe(mockDatabase.id);
      expect(result.name).toBe(mockDatabase.name);
    });

    it('should throw NotFoundException if database belongs to another project (tenant isolation)', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({
        id: 'pm-1',
        projectId: mockProject.id,
        userId: mockUser.id,
        role: ProjectRole.MEMBER,
        project: mockProject,
      });

      prisma.databaseInstance.findUnique.mockResolvedValue({
        ...mockDatabase,
        projectId: 'other-project-id',
      });

      await expect(
        service.getDatabase(
          { uid: mockUser.firebaseUid, email: mockUser.email },
          mockProject.id,
          mockDatabase.id,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateDatabase', () => {
    it('should allow OWNER to update permitted metadata (name)', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({
        id: 'pm-1',
        projectId: mockProject.id,
        userId: mockUser.id,
        role: ProjectRole.OWNER,
        project: mockProject,
      });

      prisma.databaseInstance.findUnique.mockResolvedValue(mockDatabase);
      prisma.databaseInstance.findFirst.mockResolvedValue(null);
      prisma.databaseInstance.update.mockResolvedValue({
        ...mockDatabase,
        name: 'renamed-db',
      });

      const result = await service.updateDatabase(
        { uid: mockUser.firebaseUid, email: mockUser.email },
        mockProject.id,
        mockDatabase.id,
        { name: 'renamed-db' },
      );

      expect(result.name).toBe('renamed-db');
    });
  });

  describe('deleteDatabase', () => {
    it('should transition status to DELETING, record event, and enqueue deletion job', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({
        id: 'pm-1',
        projectId: mockProject.id,
        userId: mockUser.id,
        role: ProjectRole.OWNER,
        project: mockProject,
      });

      prisma.databaseInstance.findUnique.mockResolvedValue({
        ...mockDatabase,
        status: DatabaseStatus.RUNNING,
      });

      prisma.databaseInstance.update.mockResolvedValue({
        ...mockDatabase,
        status: DatabaseStatus.DELETING,
      });

      await service.deleteDatabase(
        { uid: mockUser.firebaseUid, email: mockUser.email },
        mockProject.id,
        mockDatabase.id,
      );

      expect(prisma.databaseInstance.update).toHaveBeenCalledWith({
        where: { id: mockDatabase.id },
        data: expect.objectContaining({
          status: DatabaseStatus.DELETING,
        }),
      });

      expect(mockQueue.add).toHaveBeenCalledWith(
        'delete-database',
        expect.objectContaining({
          databaseId: mockDatabase.id,
          projectId: mockProject.id,
        }),
        expect.objectContaining({
          jobId: `delete-${mockDatabase.id}`,
        }),
      );
    });

    it('should reject deletion if database is already in DELETING status', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({
        id: 'pm-1',
        projectId: mockProject.id,
        userId: mockUser.id,
        role: ProjectRole.OWNER,
        project: mockProject,
      });

      prisma.databaseInstance.findUnique.mockResolvedValue({
        ...mockDatabase,
        status: DatabaseStatus.DELETING,
      });

      await expect(
        service.deleteDatabase(
          { uid: mockUser.firebaseUid, email: mockUser.email },
          mockProject.id,
          mockDatabase.id,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
