import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SendProjectInvitationOptions } from './email.interface';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromAddress: string;
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    const smtpHost = this.configService.get<string>('email.smtpHost');
    const smtpPort = this.configService.get<number>('email.smtpPort') || 587;
    const smtpUser = this.configService.get<string>('email.smtpUser');
    const smtpPass = this.configService.get<string>('email.smtpPass');
    this.fromAddress =
      this.configService.get<string>('email.smtpFrom') ||
      'DBaaS Cloud <no-reply@dbaas.local>';

    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      this.isConfigured = true;
      this.logger.log(`Email service configured with SMTP host: ${smtpHost}:${smtpPort}`);
    } else {
      this.isConfigured = false;
      this.logger.log(
        'Email service running in development/console simulation mode. Invitations will be logged to console.',
      );
    }
  }

  /**
   * Dispatches a team invitation email with an acceptance link.
   */
  async sendProjectInvitation(options: SendProjectInvitationOptions): Promise<{ sent: boolean; messageId?: string }> {
    const { to, inviterName, inviterEmail, projectName, role, inviteUrl, expiresAt } = options;
    const inviterDisplay = inviterName ? `${inviterName} (${inviterEmail})` : inviterEmail;
    const expiryFormatted = new Date(expiresAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const subject = `You've been invited to join ${projectName} on DBaaS`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c100e; color: #f2f5f3; margin: 0; padding: 40px 16px;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; background-color: #161c18; border: 1px solid #232d26; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- HEADER -->
          <tr>
            <td style="padding: 28px 36px; border-bottom: 1px solid #232d26; background-color: #19211c;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="width: 10px; height: 10px; background-color: #10b981; border-radius: 50%; margin-right: 8px;"></div>
                  </td>
                  <td style="vertical-align: middle; font-weight: 800; font-size: 18px; letter-spacing: -0.02em; color: #ffffff;">
                    DBaaS Console
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="padding: 36px;">
              <h1 style="font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 16px; letter-spacing: -0.01em;">
                Project Collaboration Invitation
              </h1>
              <p style="font-size: 14px; line-height: 1.6; color: #9da9a0; margin: 0 0 24px 0;">
                <strong style="color: #ffffff;">${inviterDisplay}</strong> has invited you to collaborate on the <strong style="color: #ffffff;">${projectName}</strong> project workspace on DBaaS.
              </p>

              <!-- HIGHLIGHT TABLE WITH FIXED COLUMN SPACING -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #1a221d; border: 1px solid #28362b; border-radius: 12px; margin: 0 0 28px 0; border-collapse: separate;">
                <tr>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #28362b; color: #7e8e83; font-size: 13px; font-weight: 500; width: 40%;">Workspace</td>
                  <td align="right" style="padding: 12px 18px; border-bottom: 1px solid #28362b; color: #ffffff; font-size: 13px; font-weight: 700; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; width: 60%;">${projectName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #28362b; color: #7e8e83; font-size: 13px; font-weight: 500;">Assigned Role</td>
                  <td align="right" style="padding: 12px 18px; border-bottom: 1px solid #28362b;">
                    <span style="display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; background-color: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.35); text-transform: uppercase; letter-spacing: 0.5px;">${role}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #28362b; color: #7e8e83; font-size: 13px; font-weight: 500;">Invited By</td>
                  <td align="right" style="padding: 12px 18px; border-bottom: 1px solid #28362b; color: #ffffff; font-size: 13px; font-weight: 600; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">${inviterEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; color: #7e8e83; font-size: 13px; font-weight: 500;">Expires On</td>
                  <td align="right" style="padding: 12px 18px; color: #ffffff; font-size: 13px; font-weight: 600; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">${expiryFormatted}</td>
                </tr>
              </table>

              <!-- CTA BUTTON -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" target="_blank" style="display: inline-block; background-color: #10b981; color: #ffffff !important; font-size: 14px; font-weight: 600; text-decoration: none; padding: 13px 36px; border-radius: 10px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <!-- FALLBACK LINK -->
              <p style="font-size: 11px; line-height: 1.5; color: #6e7e73; word-break: break-all; margin: 20px 0 0 0; text-align: center;">
                Button not working? Copy and paste this URL into your browser:<br>
                <a href="${inviteUrl}" style="color: #10b981; text-decoration: underline;">${inviteUrl}</a>
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding: 20px 36px; border-top: 1px solid #232d26; background-color: #121714; font-size: 11px; color: #6e7e73; text-align: center;">
              This invitation was sent to <strong style="color: #9da9a0;">${to}</strong>. If you were not expecting this invite, you can safely ignore this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const textContent = `
You've been invited to collaborate on DBaaS!

${inviterDisplay} has invited you to join the project "${projectName}" as a ${role}.

To accept this invitation, open the link below in your browser:
${inviteUrl}

This invitation will expire on ${expiryFormatted}.

If you were not expecting this invitation, you can ignore this email.
    `.trim();

    if (this.isConfigured && this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: this.fromAddress,
          to,
          subject,
          text: textContent,
          html: htmlContent,
        });
        this.logger.log(`Invitation email sent to ${to}: ${info.messageId}`);
        return { sent: true, messageId: info.messageId };
      } catch (err: any) {
        this.logger.error(`Failed to send invitation email to ${to}: ${err.message}`, err.stack);
        // Fall back to console logging so flow doesn't fail
        this.logInvitationFallback(to, projectName, role, inviteUrl);
        return { sent: false };
      }
    } else {
      this.logInvitationFallback(to, projectName, role, inviteUrl);
      return { sent: true };
    }
  }

  private logInvitationFallback(to: string, projectName: string, role: string, inviteUrl: string) {
    this.logger.log(`
================================================================================
📩 [SIMULATED EMAIL DISPATCH]
To: ${to}
Project: ${projectName}
Role: ${role}
Accept URL: ${inviteUrl}
================================================================================
    `);
  }
}
