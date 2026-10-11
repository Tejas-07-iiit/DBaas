import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectAuthorizationService } from './project-authorization.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ProjectRole } from '@prisma/client';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let authService: ProjectAuthorizationService;
  let prisma: any;
  let usersService: any;

  const mockDate = new Date('2026-01-01T00:00:00.000Z');

  const mockUser = {
    id: '11111111-1111-1111-1111-111111111111',
    firebaseUid: 'fb-user-1',
    email: 'owner@example.com',
    name: 'Project Owner',
  };

  const mockFirebaseUser = {
    uid: 'fb-user-1',
    email: 'owner@example.com',
  };

  const mockProject = {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Production Cloud',
    description: 'Main production environment',
    ownerId: mockUser.id,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  beforeEach(() => {
    prisma = {
      project: {
        create: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      projectMember: {
        create: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
      },
      subscription: {
        create: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    usersService = {
      findOrCreateFromFirebase: jest.fn().mockResolvedValue(mockUser),
    };

    authService = new ProjectAuthorizationService(prisma);
    service = new ProjectsService(prisma, usersService, authService);
  });

  describe('createProject', () => {
    it('should create project with creator as owner and insert owner membership in transaction', async () => {
      prisma.project.create.mockResolvedValue(mockProject);
      prisma.projectMember.create.mockResolvedValue({
        id: 'pm-1',
        projectId: mockProject.id,
        userId: mockUser.id,
        role: ProjectRole.OWNER,
      });

      const result = await service.createProject(mockFirebaseUser, {
        name: 'Production Cloud',
        description: 'Main production environment',
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.project.create).toHaveBeenCalledWith({
        data: {
          name: 'Production Cloud',
          description: 'Main production environment',
          ownerId: mockUser.id,
        },
      });
      expect(prisma.projectMember.create).toHaveBeenCalledWith({
        data: {
          projectId: mockProject.id,
          userId: mockUser.id,
          role: ProjectRole.OWNER,
        },
      });
      expect(result.ownerId).toBe(mockUser.id);
      expect(result.role).toBe(ProjectRole.OWNER);
    });
  });

  describe('listUserProjects', () => {
    it('should return paginated projects the user belongs to', async () => {
      prisma.project.count.mockResolvedValue(1);
      prisma.project.findMany.mockResolvedValue([
        {
          ...mockProject,
          members: [{ role: ProjectRole.OWNER }],
        },
      ]);

      const result = await service.listUserProjects(mockFirebaseUser, {
        page: 1,
        limit: 10,
      });

      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe(mockProject.id);
      expect(result.data[0].role).toBe(ProjectRole.OWNER);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('getProject', () => {
    it('should return project details if user is a member', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({
        id: 'pm-1',
        projectId: mockProject.id,
        userId: mockUser.id,
        role: ProjectRole.OWNER,
        project: mockProject,
      });
      prisma.projectMember.count.mockResolvedValue(3);

      const result = await service.getProject(mockFirebaseUser, mockProject.id);

      expect(result.id).toBe(mockProject.id);
      expect(result.role).toBe(ProjectRole.OWNER);
      expect(result.memberCount).toBe(3);
    });

    it('should throw NotFoundException if user is not a member (tenant isolation)', async () => {
      prisma.projectMember.findUnique.mockResolvedValue(null);

      await expect(
        service.getProject(mockFirebaseUser, mockProject.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProject', () => {
    it('should allow OWNER to update project', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({
        id: 'pm-1',
        projectId: mockProject.id,
        userId: mockUser.id,
        role: ProjectRole.OWNER,
        project: mockProject,
      });
      prisma.project.update.mockResolvedValue({
        ...mockProject,
        name: 'Updated Name',
      });

      const result = await service.updateProject(
        mockFirebaseUser,
        mockProject.id,
        { name: 'Updated Name' },
      );

      expect(result.name).toBe('Updated Name');
    });

    it('should allow ADMIN to update project', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({
        id: 'pm-2',
        projectId: mockProject.id,
        userId: mockUser.id,
        role: ProjectRole.ADMIN,
        project: mockProject,
      });
      prisma.project.update.mockResolvedValue({
        ...mockProject,
        name: 'Admin Updated',
      });

      const result = await service.updateProject(
        mockFirebaseUser,
        mockProject.id,
        { name: 'Admin Updated' },
      );

      expect(result.name).toBe('Admin Updated');
    });

    it('should forbid MEMBER from updating project', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({
        id: 'pm-3',
        projectId: mockProject.id,
        userId: mockUser.id,
        role: ProjectRole.MEMBER,
        project: mockProject,
      });

      await expect(
        service.updateProject(mockFirebaseUser, mockProject.id, {
          name: 'Member Hack',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteProject', () => {
    it('should allow OWNER to delete project', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({
        id: 'pm-1',
        projectId: mockProject.id,
        userId: mockUser.id,
        role: ProjectRole.OWNER,
        project: mockProject,
      });
      prisma.project.delete.mockResolvedValue(mockProject);

      await service.deleteProject(mockFirebaseUser, mockProject.id);
      expect(prisma.project.delete).toHaveBeenCalledWith({
        where: { id: mockProject.id },
      });
    });

    it('should forbid ADMIN from deleting project', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({
        id: 'pm-2',
        projectId: mockProject.id,
        userId: mockUser.id,
        role: ProjectRole.ADMIN,
        project: mockProject,
      });

      await expect(
        service.deleteProject(mockFirebaseUser, mockProject.id),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should forbid MEMBER from deleting project', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({
        id: 'pm-3',
        projectId: mockProject.id,
        userId: mockUser.id,
        role: ProjectRole.MEMBER,
        project: mockProject,
      });

      await expect(
        service.deleteProject(mockFirebaseUser, mockProject.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
