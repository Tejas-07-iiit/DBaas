import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { FirebaseAdminService } from './services/firebase-admin.service';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';

@Global()
@Module({
  providers: [
    FirebaseAdminService,
    {
      provide: APP_GUARD,
      useClass: FirebaseAuthGuard,
    },
  ],
  exports: [FirebaseAdminService],
})
export class AuthModule {}
