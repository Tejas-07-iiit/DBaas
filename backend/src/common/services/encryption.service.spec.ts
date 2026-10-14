import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;
  let mockConfigService: any;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn().mockReturnValue('test-encryption-key-for-unit-test-32b!'),
    };
    service = new EncryptionService(mockConfigService as ConfigService);
  });

  it('should encrypt and decrypt plaintext reliably using AES-256-GCM', () => {
    const secret = 'super-secret-database-password-1234!';
    const encrypted = service.encrypt(secret);

    expect(encrypted).toBeDefined();
    expect(encrypted).not.toEqual(secret);
    expect(encrypted.split(':')).toHaveLength(3); // iv:authTag:ciphertext

    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toEqual(secret);
  });

  it('should produce different ciphertexts for the same plaintext due to random IV', () => {
    const text = 'repeat-password';
    const cipher1 = service.encrypt(text);
    const cipher2 = service.encrypt(text);

    expect(cipher1).not.toEqual(cipher2);
    expect(service.decrypt(cipher1)).toEqual(text);
    expect(service.decrypt(cipher2)).toEqual(text);
  });

  it('should throw an error if decrypting tampered ciphertext', () => {
    const text = 'confidential';
    const encrypted = service.encrypt(text);
    const [iv, authTag, data] = encrypted.split(':');

    // Tamper with encrypted data
    const tamperedData = data.slice(0, -2) + 'aa';
    const tamperedCiphertext = `${iv}:${authTag}:${tamperedData}`;

    expect(() => service.decrypt(tamperedCiphertext)).toThrow();
  });

  it('should throw an error for malformed ciphertext format', () => {
    expect(() => service.decrypt('invalid-format')).toThrow(
      'Invalid ciphertext format',
    );
  });
});
