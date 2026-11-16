export interface SendProjectInvitationOptions {
  to: string;
  inviterName?: string | null;
  inviterEmail: string;
  projectName: string;
  role: string;
  inviteUrl: string;
  expiresAt: Date;
}
