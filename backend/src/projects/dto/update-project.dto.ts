import { z } from 'zod';

export const updateProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Project name cannot be empty')
      .max(100, 'Project name must not exceed 100 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .max(500, 'Description must not exceed 500 characters')
      .optional(),
  })
  .strict()
  .refine(
    (data) => data.name !== undefined || data.description !== undefined,
    'At least one field (name or description) must be provided for update',
  );

export type UpdateProjectDto = z.infer<typeof updateProjectSchema>;
