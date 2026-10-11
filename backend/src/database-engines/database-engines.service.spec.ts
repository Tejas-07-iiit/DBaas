import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseEnginesService } from './database-engines.service';
import { DatabaseType } from '@prisma/client';

describe('DatabaseEnginesService', () => {
  let service: DatabaseEnginesService;

  beforeEach(() => {
    service = new DatabaseEnginesService();
  });

  describe('listEngines', () => {
    it('should return all platform-supported database engines', () => {
      const engines = service.listEngines();
      expect(engines.length).toBe(4);
      const ids = engines.map((e) => e.id);
      expect(ids).toContain(DatabaseType.POSTGRESQL);
      expect(ids).toContain(DatabaseType.MONGODB);
      expect(ids).toContain(DatabaseType.QDRANT);
      expect(ids).toContain(DatabaseType.NEO4J);
    });

    it('should accurately advertise isAvailableForProvisioning as false in Phase 3', () => {
      const engines = service.listEngines();
      for (const engine of engines) {
        expect(engine.isAvailableForProvisioning).toBe(false);
        expect(engine.provisioningStatusMessage).toBeDefined();
        expect(engine.availableProfiles.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getEngine', () => {
    it('should return engine metadata for case-insensitive valid engine identifier', () => {
      const postgres = service.getEngine('postgresql');
      expect(postgres.id).toBe(DatabaseType.POSTGRESQL);
      expect(postgres.displayName).toBe('PostgreSQL');
      expect(postgres.defaultPort).toBe(5432);
      expect(postgres.supportedVersions).toContain('16');

      const qdrant = service.getEngine('QDRANT');
      expect(qdrant.id).toBe(DatabaseType.QDRANT);
      expect(qdrant.defaultPort).toBe(6333);
    });

    it('should throw NotFoundException for unsupported engine identifier', () => {
      expect(() => service.getEngine('redis')).toThrow(NotFoundException);
      expect(() => service.getEngine('oracle')).toThrow(NotFoundException);
    });
  });

  describe('validateEngineAndVersion', () => {
    it('should accept valid engine and supported version', () => {
      const meta = service.validateEngineAndVersion(DatabaseType.POSTGRESQL, '16');
      expect(meta.displayName).toBe('PostgreSQL');
    });

    it('should accept valid engine when version is omitted', () => {
      const meta = service.validateEngineAndVersion(DatabaseType.MONGODB);
      expect(meta.displayName).toBe('MongoDB');
    });

    it('should throw BadRequestException for unsupported engine version', () => {
      expect(() =>
        service.validateEngineAndVersion(DatabaseType.POSTGRESQL, '9.6'),
      ).toThrow(BadRequestException);
    });
  });
});
