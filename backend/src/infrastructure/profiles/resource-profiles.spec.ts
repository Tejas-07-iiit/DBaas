import { DatabaseType } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import {
  APPROVED_VM_PROFILES,
  CERTIFIED_ENGINE_IMAGES,
  resolveCertifiedImage,
  validateResourceSpecs,
} from './resource-profiles';

describe('ResourceProfiles', () => {
  it('should define standard approved VM profiles', () => {
    expect(APPROVED_VM_PROFILES['db.nano']).toBeDefined();
    expect(APPROVED_VM_PROFILES['db.small']).toBeDefined();
    expect(APPROVED_VM_PROFILES['db.medium']).toBeDefined();
    expect(APPROVED_VM_PROFILES['db.large']).toBeDefined();

    expect(APPROVED_VM_PROFILES['db.nano'].cpuCores).toBe(1);
    expect(APPROVED_VM_PROFILES['db.nano'].ramMb).toBe(1024);
  });

  it('should resolve certified base VM images correctly for each engine', () => {
    expect(resolveCertifiedImage(DatabaseType.POSTGRESQL, '16')).toContain('postgres-16');
    expect(resolveCertifiedImage(DatabaseType.MONGODB, '7')).toContain('mongodb-7');
    expect(resolveCertifiedImage(DatabaseType.QDRANT, '1.9')).toContain('qdrant-1.9');
    expect(resolveCertifiedImage(DatabaseType.NEO4J, '5')).toContain('neo4j-5');
  });

  it('should fallback to default certified image if version is unspecified', () => {
    const defaultImage = resolveCertifiedImage(DatabaseType.POSTGRESQL);
    expect(defaultImage).toContain('postgres-');
  });

  it('should validate acceptable resource specs', () => {
    expect(() =>
      validateResourceSpecs({
        cpuCores: 2,
        ramMb: 4096,
        storageMb: 10240,
      }),
    ).not.toThrow();
  });

  it('should throw BadRequestException for invalid CPU, RAM, or storage values', () => {
    // Non-integer CPU
    expect(() =>
      validateResourceSpecs({ cpuCores: 0.5, ramMb: 1024, storageMb: 5120 }),
    ).toThrow(BadRequestException);

    // Negative or zero CPU
    expect(() =>
      validateResourceSpecs({ cpuCores: 0, ramMb: 1024, storageMb: 5120 }),
    ).toThrow(BadRequestException);

    // RAM too low
    expect(() =>
      validateResourceSpecs({ cpuCores: 1, ramMb: 256, storageMb: 5120 }),
    ).toThrow(BadRequestException);

    // Storage too low
    expect(() =>
      validateResourceSpecs({ cpuCores: 1, ramMb: 1024, storageMb: 500 }),
    ).toThrow(BadRequestException);
  });
});
