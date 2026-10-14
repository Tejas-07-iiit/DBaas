import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class ApiTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    const expectedToken = process.env.HOST_API_TOKEN || process.env.API_TOKEN;

    if (!expectedToken) {
      throw new UnauthorizedException(
        'Host API token not configured on server. Set HOST_API_TOKEN.',
      );
    }

    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException(
        'Invalid Authorization header format. Expected: Bearer <token>',
      );
    }

    const providedToken = parts[1];
    if (!this.safeCompare(expectedToken, providedToken)) {
      throw new UnauthorizedException('Invalid API token');
    }

    return true;
  }

  private safeCompare(expected: string, provided: string): boolean {
    const expectedBuf = Buffer.from(expected, 'utf-8');
    const providedBuf = Buffer.from(provided, 'utf-8');

    if (expectedBuf.length !== providedBuf.length) {
      timingSafeEqual(expectedBuf, expectedBuf);
      return false;
    }

    return timingSafeEqual(expectedBuf, providedBuf);
  }
}
