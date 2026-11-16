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

  let emailService: any;
  let configService: any;

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
      projectInvitation: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn((promises) => Promise.all(promises)),
    };

    usersService = {
      findOrCreateFromFirebase: jest.fn(),
    };

    emailService = {
      sendProjectInvitation: jest.fn().mockResolvedValue({ sent: true }),
    };

    configService = {
      get: jest.fn().mockReturnValue('http://localhost:3000'),
    };

    authService = new ProjectAuthorizationService(prisma);
    service = new TeamService(
      prisma,
      usersService,
      authService,
      emailService,
      configService,
    );
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

    it('should throw BadRequestException if adding oneself', async () => {
      usersService.findOrCreateFromFirebase.mockResolvedValue(ownerUser);
      prisma.projectMember.findUnique.mockResolvedValueOnce({
        id: 'pm-owner',
        userId: ownerUser.id,
        projectId: mockProject.id,
        role: ProjectRole.OWNER,
        project: mockProject,
      });

      await expect(
        service.addMember(
          { uid: 'fb-owner', email: ownerUser.email },
          mockProject.id,
          { email: ownerUser.email, role: ProjectRole.MEMBER },
        ),
      ).rejects.toThrow(BadRequestException);
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

  describe('createInvitation', () => {
    it('should create an invitation and send email for an unregistered user', async () => {
      usersService.findOrCreateFromFirebase.mockResolvedValue(ownerUser);
      prisma.projectMember.findUnique.mockResolvedValueOnce({
        id: 'pm-owner',
        userId: ownerUser.id,
        projectId: mockProject.id,
        role: ProjectRole.OWNER,
        project: mockProject,
      });

      prisma.user.findUnique.mockResolvedValue(null); // unregistered user
      prisma.projectInvitation.findFirst.mockResolvedValue(null); // no existing pending invite
      prisma.projectInvitation.create.mockResolvedValue({
        id: 'inv-1',
        projectId: mockProject.id,
        email: 'unregistered@example.com',
        role: ProjectRole.MEMBER,
        token: 'mock-token-12345678901234567890',
        invitedById: ownerUser.id,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 600000),
        createdAt: mockDate,
        invitedBy: ownerUser,
        project: mockProject,
      });

      const res = await service.createInvitation(
        { uid: 'fb-owner', email: ownerUser.email },
        mockProject.id,
        { email: 'unregistered@example.com', role: ProjectRole.MEMBER },
      );

      expect(res.id).toBe('inv-1');
      expect(res.email).toBe('unregistered@example.com');
      expect(emailService.sendProjectInvitation).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'unregistered@example.com',
          projectName: mockProject.name,
          role: ProjectRole.MEMBER,
        }),
      );
    });

    it('should throw ConflictException if the target user is already a member', async () => {
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

      prisma.user.findUnique.mockResolvedValue(memberUser);

      await expect(
        service.createInvitation(
          { uid: 'fb-owner', email: ownerUser.email },
          mockProject.id,
          { email: memberUser.email, role: ProjectRole.MEMBER },
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if inviting oneself', async () => {
      usersService.findOrCreateFromFirebase.mockResolvedValue(ownerUser);
      prisma.projectMember.findUnique.mockResolvedValueOnce({
        id: 'pm-owner',
        userId: ownerUser.id,
        projectId: mockProject.id,
        role: ProjectRole.OWNER,
        project: mockProject,
      });

      await expect(
        service.createInvitation(
          { uid: 'fb-owner', email: ownerUser.email },
          mockProject.id,
          { email: ownerUser.email, role: ProjectRole.MEMBER },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listInvitations', () => {
    it('should list all pending invitations for authorized admin/owner', async () => {
      usersService.findOrCreateFromFirebase.mockResolvedValue(ownerUser);
      prisma.projectMember.findUnique.mockResolvedValue({
        id: 'pm-owner',
        userId: ownerUser.id,
        projectId: mockProject.id,
        role: ProjectRole.OWNER,
        project: mockProject,
      });

      prisma.projectInvitation.findMany.mockResolvedValue([
        {
          id: 'inv-1',
          projectId: mockProject.id,
          email: 'pending@example.com',
          role: ProjectRole.MEMBER,
          status: 'PENDING',
          expiresAt: mockDate,
          createdAt: mockDate,
          invitedBy: ownerUser,
        },
      ]);

      const res = await service.listInvitations(
        { uid: 'fb-owner', email: ownerUser.email },
        mockProject.id,
      );

      expect(res).toHaveLength(1);
      expect(res[0].email).toBe('pending@example.com');
    });
  });

  describe('getInvitationByToken', () => {
    it('should return invitation details by token', async () => {
      prisma.projectInvitation.findUnique.mockResolvedValue({
        id: 'inv-1',
        projectId: mockProject.id,
        email: 'colleague@example.com',
        role: ProjectRole.ADMIN,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 86400000), // future
        invitedBy: ownerUser,
        project: mockProject,
      });

      const res = await service.getInvitationByToken('valid-token-123456');
      expect(res.isValid).toBe(true);
      expect(res.projectName).toBe(mockProject.name);
      expect(res.role).toBe(ProjectRole.ADMIN);
    });

    it('should throw NotFoundException if token does not exist', async () => {
      prisma.projectInvitation.findUnique.mockResolvedValue(null);

      await expect(
        service.getInvitationByToken('nonexistent-token'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('acceptInvitation', () => {
    it('should successfully accept a pending invitation and add member', async () => {
      usersService.findOrCreateFromFirebase.mockResolvedValue(newUser);
      prisma.projectInvitation.findUnique.mockResolvedValue({
        id: 'inv-1',
        projectId: mockProject.id,
        email: newUser.email,
        role: ProjectRole.MEMBER,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 86400000),
        project: mockProject,
      });

      prisma.projectMember.findUnique.mockResolvedValue(null); // not already member
      prisma.projectMember.create.mockResolvedValue({
        id: 'pm-new',
        projectId: mockProject.id,
        userId: newUser.id,
        role: ProjectRole.MEMBER,
      });
      prisma.projectInvitation.update.mockResolvedValue({
        id: 'inv-1',
        status: 'ACCEPTED',
      });

      const res = await service.acceptInvitation(
        { uid: 'fb-new', email: newUser.email },
        'valid-token',
      );

      expect(res.success).toBe(true);
      expect(res.projectId).toBe(mockProject.id);
      expect(res.role).toBe(ProjectRole.MEMBER);
    });

    it('should throw ForbiddenException if accepting user email does not match invitation email', async () => {
      usersService.findOrCreateFromFirebase.mockResolvedValue(ownerUser);
      prisma.projectInvitation.findUnique.mockResolvedValue({
        id: 'inv-1',
        projectId: mockProject.id,
        email: 'invited-someone-else@example.com',
        role: ProjectRole.MEMBER,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 86400000),
        project: mockProject,
      });

      await expect(
        service.acceptInvitation(
          { uid: 'fb-owner', email: ownerUser.email },
          'valid-token',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getMyPendingInvitations', () => {
    it('should return pending invitations sent to authenticated user email', async () => {
      usersService.findOrCreateFromFirebase.mockResolvedValue(newUser);
      prisma.projectInvitation.findMany.mockResolvedValue([
        {
          id: 'inv-1',
          token: 'token-abc',
          projectId: mockProject.id,
          project: {
            ...mockProject,
            owner: ownerUser,
          },
          role: ProjectRole.MEMBER,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 86400000),
          createdAt: mockDate,
          invitedBy: ownerUser,
        },
      ]);

      const res = await service.getMyPendingInvitations({
        uid: 'fb-new',
        email: newUser.email,
      });

      expect(res).toHaveLength(1);
      expect(res[0].projectName).toBe(mockProject.name);
      expect(res[0].token).toBe('token-abc');
      expect(res[0].role).toBe(ProjectRole.MEMBER);
    });
  });

  describe('declineInvitation', () => {
    it('should decline an invitation and update status to REVOKED', async () => {
      usersService.findOrCreateFromFirebase.mockResolvedValue(newUser);
      prisma.projectInvitation.findUnique.mockResolvedValue({
        id: 'inv-1',
        token: 'token-abc',
        email: newUser.email,
        status: 'PENDING',
        project: mockProject,
      });
      prisma.projectInvitation.update.mockResolvedValue({
        id: 'inv-1',
        status: 'REVOKED',
      });

      const res = await service.declineInvitation(
        { uid: 'fb-new', email: newUser.email },
        'token-abc',
      );

      expect(res.success).toBe(true);
      expect(prisma.projectInvitation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'REVOKED' },
        }),
      );
    });

    it('should throw ForbiddenException if declining user email does not match invitation email', async () => {
      usersService.findOrCreateFromFirebase.mockResolvedValue(ownerUser);
      prisma.projectInvitation.findUnique.mockResolvedValue({
        id: 'inv-1',
        token: 'token-abc',
        email: 'other@example.com',
        status: 'PENDING',
        project: mockProject,
      });

      await expect(
        service.declineInvitation(
          { uid: 'fb-owner', email: ownerUser.email },
          'token-abc',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
