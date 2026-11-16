import { z } from 'zod';
import { ProjectRole } from '@prisma/client';

export const inviteMemberSchema = z
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

export type InviteMemberDto = z.output<typeof inviteMemberSchema>;

export const invitationParamsSchema = z.object({
  projectId: z.string().uuid('Invalid project ID format'),
  invitationId: z.string().uuid('Invalid invitation ID format'),
});

export type InvitationParamsDto = z.infer<typeof invitationParamsSchema>;

export const tokenParamSchema = z.object({
  token: z.string().min(10, 'Invalid invitation token'),
});

export type TokenParamDto = z.infer<typeof tokenParamSchema>;
