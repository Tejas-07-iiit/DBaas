import { z } from 'zod';

export const createProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Project name is required')
      .max(100, 'Project name must not exceed 100 characters'),
    description: z
      .string()
      .trim()
      .max(500, 'Description must not exceed 500 characters')
      .optional(),
    cpuCores: z.number().int().min(1).max(32).optional().default(2),
    ramMb: z.number().int().min(1024).max(65536).optional().default(4096),
    storageMb: z.number().int().min(5120).max(1048576).optional().default(20480),
  })
  .strict();

export type CreateProjectDto = z.input<typeof createProjectSchema>;
