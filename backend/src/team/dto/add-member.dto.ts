import { z } from 'zod';
import { ProjectRole } from '@prisma/client';

export const addMemberSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('A valid email address is required'),
    role: z
      .preprocess(
        (val) => (typeof val === 'string' ? val.trim().toUpperCase() : val),
        z.enum([ProjectRole.ADMIN, ProjectRole.MEMBER], {
          errorMap: () => ({ message: 'Role must be either ADMIN or MEMBER' }),
        }),
      )
      .default(ProjectRole.MEMBER),
  })
  .strict();

export type AddMemberDto = z.output<typeof addMemberSchema>;
