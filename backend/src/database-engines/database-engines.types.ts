import { DatabaseType } from '@prisma/client';

export interface ResourceProfile {
  name: string;
  cpuCores: number;
  ramMb: number;
  storageMb: number;
}

export interface EngineMetadata {
  id: DatabaseType;
  displayName: string;
  description: string;
  defaultPort: number;
  supportedVersions: string[];
  defaultVersion: string;
  isAvailableForProvisioning: boolean;
  provisioningStatusMessage: string;
  availableProfiles: ResourceProfile[];
}

export const RESOURCE_PROFILES: ResourceProfile[] = [
  {
    name: 'small',
    cpuCores: 1,
    ramMb: 1024,
    storageMb: 5120,
  },
  {
    name: 'medium',
    cpuCores: 2,
    ramMb: 2048,
    storageMb: 10240,
  },
  {
    name: 'large',
    cpuCores: 4,
    ramMb: 4096,
    storageMb: 20480,
  },
];

export const SUPPORTED_ENGINES: Record<DatabaseType, EngineMetadata> = {
  [DatabaseType.POSTGRESQL]: {
    id: DatabaseType.POSTGRESQL,
    displayName: 'PostgreSQL',
    description: 'Advanced, enterprise-grade open-source relational database',
    defaultPort: 5432,
    supportedVersions: ['14', '15', '16'],
    defaultVersion: '16',
    isAvailableForProvisioning: false,
    provisioningStatusMessage:
      'Engine catalog registered. Automated VM/container provisioning will be enabled in Phase 4.',
    availableProfiles: RESOURCE_PROFILES,
  },
  [DatabaseType.MONGODB]: {
    id: DatabaseType.MONGODB,
    displayName: 'MongoDB',
    description: 'Scalable, document-oriented NoSQL database for modern applications',
    defaultPort: 27017,
    supportedVersions: ['6.0', '7.0'],
    defaultVersion: '7.0',
    isAvailableForProvisioning: false,
    provisioningStatusMessage:
      'Engine catalog registered. Automated VM/container provisioning will be enabled in Phase 4.',
    availableProfiles: RESOURCE_PROFILES,
  },
  [DatabaseType.QDRANT]: {
    id: DatabaseType.QDRANT,
    displayName: 'Qdrant',
    description: 'Vector similarity search engine and vector database for AI embeddings',
    defaultPort: 6333,
    supportedVersions: ['1.7', '1.8'],
    defaultVersion: '1.8',
    isAvailableForProvisioning: false,
    provisioningStatusMessage:
      'Engine catalog registered. Automated VM/container provisioning will be enabled in Phase 4.',
    availableProfiles: RESOURCE_PROFILES,
  },
  [DatabaseType.NEO4J]: {
    id: DatabaseType.NEO4J,
    displayName: 'Neo4j',
    description: 'Native graph database optimized for connected data and relationship queries',
    defaultPort: 7474,
    supportedVersions: ['5.15', '5.18'],
    defaultVersion: '5.18',
    isAvailableForProvisioning: false,
    provisioningStatusMessage:
      'Engine catalog registered. Automated VM/container provisioning will be enabled in Phase 4.',
    availableProfiles: RESOURCE_PROFILES,
  },
};
