import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  avatarUrl: z.string().url().max(2048).optional(),
}).strict();

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
