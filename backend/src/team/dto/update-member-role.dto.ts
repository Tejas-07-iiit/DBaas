import { z } from 'zod';
import { ProjectRole } from '@prisma/client';

export const updateMemberRoleSchema = z
  .object({
    role: z.enum([ProjectRole.ADMIN, ProjectRole.MEMBER], {
      errorMap: () => ({ message: 'Role must be either ADMIN or MEMBER' }),
    }),
  })
  .strict();

export type UpdateMemberRoleDto = z.infer<typeof updateMemberRoleSchema>;
