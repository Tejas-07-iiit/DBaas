import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseUser } from '../auth/interfaces/firebase-user.interface';
import { PlatformRole } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockDate = new Date('2026-01-01T00:00:00.000Z');

  const mockDbUser = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    firebaseUid: 'firebase-uid-123',
    email: 'test@example.com',
    name: 'Test User',
    avatarUrl: 'https://example.com/avatar.png',
    role: PlatformRole.USER,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      projectMember: {
        deleteMany: jest.fn(),
      },
    } as unknown as PrismaService;

    service = new UsersService(prisma);
  });


  describe('findOrCreateFromFirebase', () => {
    const firebaseUser: FirebaseUser = {
      uid: 'firebase-uid-123',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.png',
    };

    it('should return existing user without creating a new record', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);

      const result = await service.findOrCreateFromFirebase(firebaseUser);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { firebaseUid: 'firebase-uid-123' },
      });
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(result).toEqual(mockDbUser);
    });

    it('should create and return a new user if not found in database', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockDbUser);

      const result = await service.findOrCreateFromFirebase(firebaseUser);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          firebaseUid: 'firebase-uid-123',
          email: 'test@example.com',
          name: 'Test User',
          avatarUrl: 'https://example.com/avatar.png',
        },
      });
      expect(result).toEqual(mockDbUser);
    });
  });

  describe('updateProfile', () => {
    it('should update and return the user profile', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockDbUser,
        name: 'Updated Name',
      });

      const result = await service.updateProfile('firebase-uid-123', {
        name: 'Updated Name',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { firebaseUid: 'firebase-uid-123' },
        data: { name: 'Updated Name' },
      });
      expect(result.name).toBe('Updated Name');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateProfile('non-existent-uid', { name: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAccount', () => {
    const firebaseUser: FirebaseUser = {
      uid: 'firebase-uid-123',
      email: 'test@example.com',
      name: 'Test User',
    };

    it('should delete user if user owns no projects', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockDbUser,
        ownedProjects: [],
      });
      (prisma.projectMember.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.user.delete as jest.Mock).mockResolvedValue(mockDbUser);

      await expect(service.deleteAccount(firebaseUser)).resolves.toBeUndefined();

      expect(prisma.projectMember.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockDbUser.id },
      });
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: mockDbUser.id },
      });
    });

    it('should throw ConflictException if user owns projects', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockDbUser,
        ownedProjects: [{ id: 'proj-1', name: 'Project 1' }],
      });

      await expect(service.deleteAccount(firebaseUser)).rejects.toThrow(
        'You cannot delete your account while you own projects',
      );
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteAccount(firebaseUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('toResponse', () => {
    it('should format user properly and format dates as ISO strings', () => {
      const response = service.toResponse(mockDbUser);
      expect(response).toEqual({
        id: mockDbUser.id,
        firebaseUid: mockDbUser.firebaseUid,
        email: mockDbUser.email,
        name: mockDbUser.name,
        avatarUrl: mockDbUser.avatarUrl,
        role: mockDbUser.role,
        createdAt: mockDate.toISOString(),
        updatedAt: mockDate.toISOString(),
      });
    });
  });
});
