import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseType } from '@prisma/client';
import {
  EngineMetadata,
  SUPPORTED_ENGINES,
} from './database-engines.types';

@Injectable()
export class DatabaseEnginesService {
  /**
   * Returns list of all platform-supported database engine metadata.
   */
  listEngines(): EngineMetadata[] {
    return Object.values(SUPPORTED_ENGINES);
  }

  /**
   * Returns metadata for a specific engine identifier.
   */
  getEngine(engineInput: string): EngineMetadata {
    const normalized = engineInput.toUpperCase() as DatabaseType;
    const metadata = SUPPORTED_ENGINES[normalized];

    if (!metadata) {
      throw new NotFoundException(
        `Database engine '${engineInput}' is not supported. Supported engines are: ${Object.keys(SUPPORTED_ENGINES).join(', ')}`,
      );
    }

    return metadata;
  }

  /**
   * Validates that the requested engine type and optional version are valid.
   */
  validateEngineAndVersion(type: DatabaseType, version?: string): EngineMetadata {
    const engine = SUPPORTED_ENGINES[type];
    if (!engine) {
      throw new BadRequestException(`Invalid database engine type: ${type}`);
    }

    if (version && !engine.supportedVersions.includes(version)) {
      throw new BadRequestException(
        `Engine version '${version}' is not supported for ${engine.displayName}. Supported versions: ${engine.supportedVersions.join(', ')}`,
      );
    }

    return engine;
  }
}
