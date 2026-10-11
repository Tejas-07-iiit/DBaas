import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FirebaseUser } from '../interfaces/firebase-user.interface';

export const CurrentUser = createParamDecorator(
  (data: keyof FirebaseUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as FirebaseUser;
    return data ? user?.[data] : user;
  },
);
