import { z } from 'zod';
import { DatabaseType, DatabaseStatus } from '@prisma/client';

export const databaseQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    type: z.nativeEnum(DatabaseType).optional(),
    status: z.nativeEnum(DatabaseStatus).optional(),
  })
  .strict();

export type DatabaseQueryDto = z.infer<typeof databaseQuerySchema>;

export const databaseParamsSchema = z
  .object({
    projectId: z.string().uuid('Invalid project ID format. Must be a valid UUID'),
  })
  .strict();

export type DatabaseParamsDto = z.infer<typeof databaseParamsSchema>;

export const databaseDetailParamsSchema = z
  .object({
    projectId: z.string().uuid('Invalid project ID format. Must be a valid UUID'),
    databaseId: z
      .string()
      .uuid('Invalid database ID format. Must be a valid UUID'),
  })
  .strict();

export type DatabaseDetailParamsDto = z.infer<
  typeof databaseDetailParamsSchema
>;
