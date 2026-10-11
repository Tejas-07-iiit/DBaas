import { z } from 'zod';

export const teamParamsSchema = z
  .object({
    projectId: z.string().uuid('Invalid project ID format. Must be a valid UUID'),
  })
  .strict();

export type TeamParamsDto = z.infer<typeof teamParamsSchema>;

export const memberParamsSchema = z
  .object({
    projectId: z.string().uuid('Invalid project ID format. Must be a valid UUID'),
    userId: z.string().uuid('Invalid user ID format. Must be a valid UUID'),
  })
  .strict();

export type MemberParamsDto = z.infer<typeof memberParamsSchema>;

export const teamQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  })
  .strict();

export type TeamQueryDto = z.infer<typeof teamQuerySchema>;
