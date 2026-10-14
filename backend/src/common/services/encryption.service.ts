import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const rawKey =
      this.configService.get<string>('ENCRYPTION_KEY') ||
      process.env.ENCRYPTION_KEY ||
      'dbaas-default-dev-encryption-key-32b!';

    // Derive a fixed 32-byte key using SHA-256
    this.key = crypto.createHash('sha256').update(rawKey).digest();
  }

  /**
   * Encrypts plaintext using AES-256-GCM.
   * Returns formatted string: iv:authTag:encryptedData (hex encoded).
   */
  encrypt(plaintext: string): string {
    if (!plaintext) {
      throw new Error('Plaintext cannot be empty');
    }

    const iv = crypto.randomBytes(12); // Standard 12-byte IV for AES-GCM
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  /**
   * Decrypts AES-256-GCM encrypted ciphertext.
   * Throws if ciphertext was tampered with or corrupted.
   */
  decrypt(ciphertext: string): string {
    if (!ciphertext) {
      throw new Error('Ciphertext cannot be empty');
    }

    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid ciphertext format. Expected iv:authTag:encryptedData');
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }
}
