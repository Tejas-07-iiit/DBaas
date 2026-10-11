import { z } from 'zod';
import { DatabaseType } from '@prisma/client';

export const createDatabaseSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Database name is required')
      .max(63, 'Database name must not exceed 63 characters')
      .regex(
        /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
        'Database name must contain only lowercase alphanumeric characters and hyphens, and cannot start or end with a hyphen',
      ),
    type: z.nativeEnum(DatabaseType, {
      errorMap: () => ({
        message:
          'Valid database engine type is required (POSTGRESQL, MONGODB, QDRANT, NEO4J)',
      }),
    }),
    version: z.string().trim().optional(),
    cpuCores: z.coerce
      .number()
      .int('CPU cores must be an integer')
      .min(1, 'CPU cores must be at least 1')
      .max(8, 'CPU cores cannot exceed 8')
      .default(1),
    ramMb: z.coerce
      .number()
      .int('RAM must be an integer')
      .min(512, 'RAM must be at least 512 MB')
      .max(16384, 'RAM cannot exceed 16384 MB')
      .default(1024),
    storageMb: z.coerce
      .number()
      .int('Storage must be an integer')
      .min(1024, 'Storage must be at least 1024 MB')
      .max(102400, 'Storage cannot exceed 102400 MB')
      .default(5120),
  })
  .strict();

export type CreateDatabaseDto = z.infer<typeof createDatabaseSchema>;
