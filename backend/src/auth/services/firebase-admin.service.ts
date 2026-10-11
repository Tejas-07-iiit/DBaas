import { Injectable, Logger, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { FirebaseUser } from '../interfaces/firebase-user.interface';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private app?: admin.app.App;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const projectId = this.configService.get<string>('firebase.projectId');
    const clientEmail = this.configService.get<string>('firebase.clientEmail');
    const privateKey = this.configService.get<string>('firebase.privateKey');

    if (!projectId || !clientEmail || !privateKey || privateKey.includes('placeholder')) {
      this.logger.warn(
        'Firebase Admin SDK credentials not fully configured or using placeholders. Protected endpoints will reject requests until valid Firebase credentials are provided.',
      );
      return;
    }

    try {
      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      if ((error as Error).message?.includes('already exists')) {
        this.app = admin.app();
        this.logger.log('Firebase Admin SDK already initialized, reusing existing app');
      } else {
        this.logger.warn(
          `Firebase Admin SDK failed to initialize (${(error as Error).message}). Protected endpoints will reject requests until credentials are resolved.`,
        );
      }
    }
  }

  async verifyIdToken(idToken: string): Promise<FirebaseUser> {
    if (!this.app) {
      throw new UnauthorizedException(
        'Firebase Admin SDK is not initialized with valid credentials',
      );
    }

    try {
      const decodedToken = await admin.auth(this.app).verifyIdToken(idToken);
      return {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        name: decodedToken.name || (decodedToken as any).displayName,
        picture: decodedToken.picture,
      };
    } catch (error) {
      throw new UnauthorizedException(
        `Invalid or expired authentication token: ${(error as Error).message}`,
      );
    }
  }
}
