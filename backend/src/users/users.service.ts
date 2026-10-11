import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { FirebaseUser } from '../auth/interfaces/firebase-user.interface';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find or create a user from Firebase identity.
   * Called on every authenticated request to /users/me.
   * Creates the Platform PostgreSQL user record if it doesn't exist yet.
   */
  async findOrCreateFromFirebase(firebaseUser: FirebaseUser): Promise<User> {
    const existing = await this.prisma.user.findUnique({
      where: { firebaseUid: firebaseUser.uid },
    });

    if (existing) {
      return existing;
    }

    this.logger.log(`Creating new platform user for Firebase UID: ${firebaseUser.uid}`);

    return this.prisma.user.create({
      data: {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.name || null,
        avatarUrl: firebaseUser.picture || null,
      },
    });
  }

  /**
   * Find user by Firebase UID
   */
  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { firebaseUid },
    });
  }

  /**
   * Update user profile
   */
  async updateProfile(firebaseUid: string, data: UpdateUserDto): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { firebaseUid },
      data,
    });
  }

  /**
   * Format user data for API response (strip any internal fields)
   */
  toResponse(user: User) {
    return {
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
