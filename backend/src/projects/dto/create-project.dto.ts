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
  })
  .strict();

export type CreateProjectDto = z.infer<typeof createProjectSchema>;
