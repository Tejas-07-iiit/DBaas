import { z } from 'zod';

export const projectQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  })
  .strict();

export type ProjectQueryDto = z.infer<typeof projectQuerySchema>;

export const projectIdParamSchema = z
  .object({
    projectId: z.string().uuid('Invalid project ID format. Must be a valid UUID'),
  })
  .strict();

export type ProjectIdParamDto = z.infer<typeof projectIdParamSchema>;
