import { z } from 'zod';
import { ProjectRole } from '@prisma/client';

export const updateMemberRoleSchema = z
  .object({
    role: z.preprocess(
      (val) => (typeof val === 'string' ? val.trim().toUpperCase() : val),
      z.enum([ProjectRole.ADMIN, ProjectRole.MEMBER], {
        errorMap: () => ({ message: 'Role must be either ADMIN or MEMBER' }),
      }),
    ),
  })
  .strict();

export type UpdateMemberRoleDto = z.output<typeof updateMemberRoleSchema>;
