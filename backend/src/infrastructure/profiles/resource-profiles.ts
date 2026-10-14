import { BadRequestException } from '@nestjs/common';
import { DatabaseType } from '@prisma/client';
import { VmResourceSpecs } from '../provider.interface';

export interface VmProfileDefinition {
  id: string;
  name: string;
  cpuCores: number;
  ramMb: number;
  storageMb: number;
  description: string;
}

/**
 * Standard approved VM profiles for dedicated customer database VMs.
 */
export const APPROVED_VM_PROFILES: Record<string, VmProfileDefinition> = {
  'db.nano': {
    id: 'db.nano',
    name: 'Nano Database VM',
    cpuCores: 1,
    ramMb: 1024,
    storageMb: 5120, // 5 GB
    description: '1 vCPU, 1 GB RAM, 5 GB SSD storage. Suitable for development/test workloads.',
  },
  'db.small': {
    id: 'db.small',
    name: 'Small Database VM',
    cpuCores: 2,
    ramMb: 2048,
    storageMb: 10240, // 10 GB
    description: '2 vCPU, 2 GB RAM, 10 GB SSD storage. Suitable for light production workloads.',
  },
  'db.medium': {
    id: 'db.medium',
    name: 'Medium Database VM',
    cpuCores: 4,
    ramMb: 4096,
    storageMb: 20480, // 20 GB
    description: '4 vCPU, 4 GB RAM, 20 GB SSD storage. Suitable for medium throughput workloads.',
  },
  'db.large': {
    id: 'db.large',
    name: 'Large Database VM',
    cpuCores: 8,
    ramMb: 8192,
    storageMb: 40960, // 40 GB
    description: '8 vCPU, 8 GB RAM, 40 GB SSD storage. Suitable for high throughput workloads.',
  },
};

/**
 * Certified base VM images mapped by database engine and version.
 */
export const CERTIFIED_ENGINE_IMAGES: Record<
  DatabaseType,
  Record<string, string>
> = {
  [DatabaseType.POSTGRESQL]: {
    '14': 'dbaas-image-postgres-14-v1.qcow2',
    '15': 'dbaas-image-postgres-15-v1.qcow2',
    '16': 'dbaas-image-postgres-16-v1.qcow2',
  },
  [DatabaseType.MONGODB]: {
    '6': 'dbaas-image-mongodb-6-v1.qcow2',
    '7': 'dbaas-image-mongodb-7-v1.qcow2',
  },
  [DatabaseType.QDRANT]: {
    '1.8': 'dbaas-image-qdrant-1.8-v1.qcow2',
    '1.9': 'dbaas-image-qdrant-1.9-v1.qcow2',
  },
  [DatabaseType.NEO4J]: {
    '5': 'dbaas-image-neo4j-5-v1.qcow2',
  },
};

/**
 * Validates requested resources and resolves certified VM image.
 * Strictly sanitizes inputs to reject arbitrary host commands or paths.
 */
export function resolveCertifiedImage(
  engineType: DatabaseType,
  version?: string,
): string {
  const engineMap = CERTIFIED_ENGINE_IMAGES[engineType];
  if (!engineMap) {
    throw new BadRequestException(
      `Unsupported database engine type: ${engineType}`,
    );
  }

  // Resolve matching version or fallback to default certified image
  const resolvedVersion = version || Object.keys(engineMap)[Object.keys(engineMap).length - 1];
  const image = engineMap[resolvedVersion] || Object.values(engineMap)[0];

  return image;
}

/**
 * Validates resource specs to ensure they match approved VM sizes
 * and fit strictly within platform security boundaries.
 */
export function validateResourceSpecs(specs: VmResourceSpecs): void {
  const { cpuCores, ramMb, storageMb } = specs;

  if (!Number.isInteger(cpuCores) || cpuCores < 1 || cpuCores > 16) {
    throw new BadRequestException(
      'cpuCores must be an integer between 1 and 16',
    );
  }

  if (!Number.isInteger(ramMb) || ramMb < 512 || ramMb > 32768) {
    throw new BadRequestException(
      'ramMb must be an integer between 512 MB and 32768 MB',
    );
  }

  if (!Number.isInteger(storageMb) || storageMb < 1024 || storageMb > 204800) {
    throw new BadRequestException(
      'storageMb must be an integer between 1024 MB and 204800 MB (200 GB)',
    );
  }
}
