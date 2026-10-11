import {
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { TeamService } from './team.service';
import { ProjectAuthorizationService } from '../projects/project-authorization.service';
import { ProjectRole } from '@prisma/client';

describe('TeamService', () => {
  let service: TeamService;
  let authService: ProjectAuthorizationService;
  let prisma: any;
  let usersService: any;

  const mockDate = new Date('2026-01-01T00:00:00.000Z');

  const ownerUser = {
    id: '11111111-1111-1111-1111-111111111111',
    firebaseUid: 'fb-owner',
    email: 'owner@example.com',
    name: 'Owner User',
  };

  const adminUser = {
    id: '22222222-2222-2222-2222-222222222222',
    firebaseUid: 'fb-admin',
    email: 'admin@example.com',
    name: 'Admin User',
  };

  const memberUser = {
    id: '33333333-3333-3333-3333-333333333333',
    firebaseUid: 'fb-member',
    email: 'member@example.com',
    name: 'Ordinary Member',
  };

  const newUser = {
    id: '44444444-4444-4444-4444-444444444444',
    firebaseUid: 'fb-new',
    email: 'newuser@example.com',
    name: 'New Registered User',
  };

  const mockProject = {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Cloud Team Project',
    ownerId: ownerUser.id,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  beforeEach(() => {
    prisma = {
      projectMember: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    usersService = {
      findOrCreateFromFirebase: jest.fn(),
    };

    authService = new ProjectAuthorizationService(prisma);
    service = new TeamService(prisma, usersService, authService);
  });

  describe('addMember', () => {
    it('should allow OWNER to add a registered user as ADMIN', async () => {
      usersService.findOrCreateFromFirebase.mockResolvedValue(ownerUser);
      prisma.projectMember.findUnique
        .mockResolvedValueOnce({
          id: 'pm-owner',
          userId: ownerUser.id,
          projectId: mockProject.id,
          role: ProjectRole.OWNER,
          project: mockProject,
        })
        .mockResolvedValueOnce(null); // not already a member

      prisma.user.findUnique.mockResolvedValue(newUser);
      prisma.projectMember.create.mockResolvedValue({
        id: 'pm-new',
        userId: newUser.id,
        projectId: mockProject.id,
        role: ProjectRole.ADMIN,
        user: newUser,
        createdAt: mockDate,
      });

      const result = await service.addMember(
        { uid: 'fb-owner', email: ownerUser.email },
        mockProject.id,
        { email: newUser.email, role: ProjectRole.ADMIN },
      );

      expect(result.userId).toBe(newUser.id);
      expect(result.role).toBe(ProjectRole.ADMIN);
    });

    it('should allow ADMIN to add a registered user as MEMBER', async () => {
      usersService.findOrCreateFromFirebase.mockResolvedValue(adminUser);
      prisma.projectMember.findUnique
        .mockResolvedValueOnce({
          id: 'pm-admin',
          userId: adminUser.id,
          projectId: mockProject.id,
          role: ProjectRole.ADMIN,
          project: mockProject,
        })
        .mockResolvedValueOnce(null);

      prisma.user.findUnique.mockResolvedValue(newUser);
      prisma.projectMember.create.mockResolvedValue({
        id: 'pm-new',
        userId: newUser.id,
        projectId: mockProject.id,
        role: ProjectRole.MEMBER,
        user: newUser,
        createdAt: mockDate,
      });

      const result = await service.addMember(
        { uid: 'fb-admin', email: adminUser.email },
        mockProject.id,
        { email: newUser.email, role: ProjectRole.MEMBER },
      );

      expect(result.userId).toBe(newUser.id);
      expect(result.role).toBe(ProjectRole.MEMBER);
    });

    it('should forbid ADMIN from adding a user as ADMIN (privilege escalation)', async () => {
      usersService.findOrCreateFromFirebase.mockResolvedValue(adminUser);
      prisma.projectMember.findUnique.mockResolvedValueOnce({
        id: 'pm-admin',
        userId: adminUser.id,
        projectId: mockProject.id,
        role: ProjectRole.ADMIN,
        project: mockProject,
      });

      await expect(
        service.addMember(
          { uid: 'fb-admin', email: adminUser.email },
          mockProject.id,
          { email: newUser.email, role: ProjectRole.ADMIN },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should forbid MEMBER from adding users', async () => {
      usersService.findOrCreateFromFirebase.mockResolvedValue(memberUser);
      prisma.projectMember.findUnique.mockResolvedValueOnce({
        id: 'pm-member',
        userId: memberUser.id,
        projectId: mockProject.id,
        role: ProjectRole.MEMBER,
        project: mockProject,
      });

      await expect(
        service.addMember(
          { uid: 'fb-member', email: memberUser.email },
          mockProject.id,
          { email: newUser.email, role: ProjectRole.MEMBER },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if user email is not registered on the platform', async () => {
      usersService.findOrCreateFromFirebase.mockResolvedValue(ownerUser);
      prisma.projectMember.findUnique.mockResolvedValueOnce({
        id: 'pm-owner',
        userId: ownerUser.id,
        projectId: mockProject.id,
        role: ProjectRole.OWNER,
        project: mockProject,
      });
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.addMember(
          { uid: 'fb-owner', email: ownerUser.email },
          mockProject.id,
          { email: 'notregistered@example.com', role: ProjectRole.MEMBER },
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if user is already a member', async () => {
      usersService.findOrCreateFromFirebase.mockResolvedValue(ownerUser);
      prisma.projectMember.findUnique
        .mockResolvedValueOnce({
          id: 'pm-owner',
          userId: ownerUser.id,
          projectId: mockProject.id,
          role: ProjectRole.OWNER,
          project: mockProject,
        })
        .mockResolvedValueOnce({
          id: 'pm-already',
          userId: newUser.id,
          projectId: mockProject.id,
          role: ProjectRole.MEMBER,
        });

      prisma.user.findUnique.mockResolvedValue(newUser);

      await expect(
        service.addMember(
          { uid: 'fb-owner', email: ownerUser.email },
          mockProject.id,
          { email: newUser.email, role: ProjectRole.MEMBER },
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateMemberRole', () => {
    it('should allow OWNER to promote MEMBER to ADMIN', async () => {
      usersService.findOrCreateFromFirebase.mockResolvedValue(ownerUser);
      prisma.projectMember.findUnique
        .mockResolvedValueOnce({
          id: 'pm-owner',
          userId: ownerUser.id,
          projectId: mockProject.id,
          role: ProjectRole.OWNER,
          project: mockProject,
        })
        .mockResolvedValueOnce({
          id: 'pm-target',
          userId: memberUser.id,
          projectId: mockProject.id,
          role: ProjectRole.MEMBER,
          user: memberUser,
        });

      prisma.projectMember.update.mockResolvedValue({
        id: 'pm-target',
        userId: memberUser.id,
        projectId: mockProject.id,
        role: ProjectRole.ADMIN,
        user: memberUser,
        createdAt: mockDate,
        updatedAt: mockDate,
      });

      const result = await service.updateMemberRole(
        { uid: 'fb-owner', email: ownerUser.email },
        mockProject.id,
        memberUser.id,
        { role: ProjectRole.ADMIN },
      );

      expect(result.role).toBe(ProjectRole.ADMIN);
    });

    it('should forbid actor from modifying their own role', async () => {
      usersService.findOrCreateFromFirebase.mockResolvedValue(ownerUser);
      prisma.projectMember.findUnique
        .mockResolvedValueOnce({
          id: 'pm-owner',
          userId: ownerUser.id,
          projectId: mockProject.id,
          role: ProjectRole.OWNER,
          project: mockProject,
        })
        .mockResolvedValueOnce({
          id: 'pm-owner',
          userId: ownerUser.id,
          projectId: mockProject.id,
          role: ProjectRole.OWNER,
          user: ownerUser,
        });

      await expect(
        service.updateMemberRole(
          { uid: 'fb-owner', email: ownerUser.email },
          mockProject.id,
          ownerUser.id,
          { role: ProjectRole.ADMIN },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should forbid modifying or demoting the project owner role', async () => {
      usersService.findOrCreateFromFirebase.mockResolvedValue(ownerUser);
      prisma.projectMember.findUnique
        .mockResolvedValueOnce({
          id: 'pm-owner',
          userId: ownerUser.id,
          projectId: mockProject.id,
          role: ProjectRole.OWNER,
          project: mockProject,
        })
        .mockResolvedValueOnce({
          id: 'pm-owner-target',
          userId: mockProject.ownerId,
          projectId: mockProject.id,
          role: ProjectRole.OWNER,
          user: ownerUser,
        });

      await expect(
        service.updateMemberRole(
          { uid: 'fb-owner', email: ownerUser.email },
          mockProject.id,
          'different-id', // simulate someone trying to modify owner
          { role: ProjectRole.ADMIN },
        ),
      ).rejects.toThrow();
    });

    it('should forbid ADMIN from modifying member roles', async () => {
      usersService.findOrCreateFromFirebase.mockResolvedValue(adminUser);
      prisma.projectMember.findUnique.mockResolvedValueOnce({
        id: 'pm-admin',
        userId: adminUser.id,
        projectId: mockProject.id,
        role: ProjectRole.ADMIN,
        project: mockProject,
      });

      await expect(
        service.updateMemberRole(
          { uid: 'fb-admin', email: adminUser.email },
          mockProject.id,
          memberUser.id,
          { role: ProjectRole.ADMIN },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeMember', () => {
    it('should allow OWNER to remove a member', async () => {
      usersService.findOrCreateFromFirebase.mockResolvedValue(ownerUser);
      prisma.projectMember.findUnique
        .mockResolvedValueOnce({
          id: 'pm-owner',
          userId: ownerUser.id,
          projectId: mockProject.id,
          role: ProjectRole.OWNER,
          project: mockProject,
        })
        .mockResolvedValueOnce({
          id: 'pm-member',
          userId: memberUser.id,
          projectId: mockProject.id,
          role: ProjectRole.MEMBER,
        });

      prisma.projectMember.delete.mockResolvedValue({ id: 'pm-member' });

      await service.removeMember(
        { uid: 'fb-owner', email: ownerUser.email },
        mockProject.id,
        memberUser.id,
      );

      expect(prisma.projectMember.delete).toHaveBeenCalledWith({
        where: { id: 'pm-member' },
      });
    });

    it('should forbid removing the project owner', async () => {
      usersService.findOrCreateFromFirebase.mockResolvedValue(ownerUser);
      prisma.projectMember.findUnique
        .mockResolvedValueOnce({
          id: 'pm-owner',
          userId: ownerUser.id,
          projectId: mockProject.id,
          role: ProjectRole.OWNER,
          project: mockProject,
        })
        .mockResolvedValueOnce({
          id: 'pm-owner',
          userId: mockProject.ownerId,
          projectId: mockProject.id,
          role: ProjectRole.OWNER,
        });

      await expect(
        service.removeMember(
          { uid: 'fb-owner', email: ownerUser.email },
          mockProject.id,
          mockProject.ownerId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should forbid ADMIN from removing another ADMIN', async () => {
      usersService.findOrCreateFromFirebase.mockResolvedValue(adminUser);
      prisma.projectMember.findUnique
        .mockResolvedValueOnce({
          id: 'pm-admin',
          userId: adminUser.id,
          projectId: mockProject.id,
          role: ProjectRole.ADMIN,
          project: mockProject,
        })
        .mockResolvedValueOnce({
          id: 'pm-other-admin',
          userId: 'other-admin-id',
          projectId: mockProject.id,
          role: ProjectRole.ADMIN,
        });

      await expect(
        service.removeMember(
          { uid: 'fb-admin', email: adminUser.email },
          mockProject.id,
          'other-admin-id',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should forbid MEMBER from removing other members', async () => {
      usersService.findOrCreateFromFirebase.mockResolvedValue(memberUser);
      prisma.projectMember.findUnique
        .mockResolvedValueOnce({
          id: 'pm-member',
          userId: memberUser.id,
          projectId: mockProject.id,
          role: ProjectRole.MEMBER,
          project: mockProject,
        })
        .mockResolvedValueOnce({
          id: 'pm-other',
          userId: 'other-user-id',
          projectId: mockProject.id,
          role: ProjectRole.MEMBER,
        });

      await expect(
        service.removeMember(
          { uid: 'fb-member', email: memberUser.email },
          mockProject.id,
          'other-user-id',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
