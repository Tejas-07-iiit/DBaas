import { z } from 'zod';

export const updateDatabaseSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Database name cannot be empty')
      .max(63, 'Database name must not exceed 63 characters')
      .regex(
        /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
        'Database name must contain only lowercase alphanumeric characters and hyphens, and cannot start or end with a hyphen',
      ),
  })
  .strict();

export type UpdateDatabaseDto = z.infer<typeof updateDatabaseSchema>;
