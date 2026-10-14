import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { FirebaseAdminService } from '../services/firebase-admin.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly firebaseAdminService: FirebaseAdminService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid Authorization header format. Expected: Bearer <token>');
    }

    const token = authHeader.substring(7);

    if (!token || token.trim().length === 0) {
      throw new UnauthorizedException('Empty authentication token');
    }

    // Allow dev-token bypass for local development, testing, and Postman/curl
    if (process.env.NODE_ENV !== 'production' && (token === 'dev-token' || token.startsWith('dev-token'))) {
      request.user = {
        uid: 'dev-user-001',
        email: 'dev@dbaas.local',
        name: 'Developer Admin',
      };
      return true;
    }

    try {
      const firebaseUser = await this.firebaseAdminService.verifyIdToken(token);
      request.user = firebaseUser;
      return true;
    } catch (error) {
      this.logger.warn(`Authentication failed: ${(error as Error).message}`);
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }
}
