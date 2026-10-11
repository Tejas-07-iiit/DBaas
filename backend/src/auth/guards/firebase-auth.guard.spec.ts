import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { FirebaseAdminService } from '../services/firebase-admin.service';

describe('FirebaseAuthGuard', () => {
  let guard: FirebaseAuthGuard;
  let reflector: Reflector;
  let firebaseAdminService: FirebaseAdminService;

  beforeEach(() => {
    reflector = new Reflector();
    firebaseAdminService = {
      verifyIdToken: jest.fn(),
    } as unknown as FirebaseAdminService;

    guard = new FirebaseAuthGuard(reflector, firebaseAdminService);
  });

  const createMockContext = (headers: Record<string, string> = {}): ExecutionContext => {
    const request = {
      headers,
      user: undefined,
    };
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: jest.fn(),
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow access if route is marked as @Public()', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const context = createMockContext();

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw UnauthorizedException if Authorization header is missing', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const context = createMockContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if Authorization header does not start with Bearer', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const context = createMockContext({ authorization: 'Basic 123456' });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if Bearer token is empty', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const context = createMockContext({ authorization: 'Bearer   ' });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should attach user to request and return true when token is valid', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const mockUser = {
      uid: 'fb-user-123',
      email: 'dev@example.com',
      name: 'Developer',
    };
    (firebaseAdminService.verifyIdToken as jest.Mock).mockResolvedValue(mockUser);

    const context = createMockContext({ authorization: 'Bearer valid-id-token' });
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const request = context.switchToHttp().getRequest();
    expect(request.user).toEqual(mockUser);
  });

  it('should throw UnauthorizedException when token verification fails', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    (firebaseAdminService.verifyIdToken as jest.Mock).mockRejectedValue(
      new Error('Token expired'),
    );

    const context = createMockContext({ authorization: 'Bearer expired-token' });
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });
});
