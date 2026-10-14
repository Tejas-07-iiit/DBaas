import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class IpAllowlistGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Determine client IP
    const rawIp =
      request.ip ||
      request.socket.remoteAddress ||
      '';

    // Normalize IPv6-mapped IPv4 addresses (e.g. ::ffff:10.50.0.7 -> 10.50.0.7)
    const normalizedIp = rawIp.replace(/^.*:/, '');

    const allowedIpsStr =
      process.env.ALLOWED_CLIENT_IPS || '10.50.0.7,127.0.0.1,localhost';
    const allowedIps = allowedIpsStr.split(',').map((ip) => ip.trim());

    const isAllowed =
      allowedIps.includes(rawIp) ||
      allowedIps.includes(normalizedIp) ||
      (allowedIps.includes('localhost') &&
        (rawIp === '127.0.0.1' || rawIp === '::1'));

    if (!isAllowed) {
      throw new ForbiddenException(
        `Access denied: client IP '${rawIp}' is not authorized to access this host API.`,
      );
    }

    return true;
  }
}
