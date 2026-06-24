/**
 * Standard Entrio email template. Table-based, inline-styled HTML so it renders
 * consistently across email clients. Compose new emails from `baseEmail`.
 */

const BRAND = '#4f46e5';
const TEXT = '#0f172a';
const MUTED = '#64748b';
const BORDER = '#e2e8f0';
const BG = '#f1f5f9';

export interface EmailButton {
  label: string;
  url: string;
}

export interface BaseEmailOptions {
  /** Hidden preheader shown in the inbox preview. */
  preview?: string;
  heading: string;
  /** Body paragraphs (plain text; rendered as <p>). */
  bodyLines: string[];
  button?: EmailButton;
  /** Small print under the button. */
  footerNote?: string;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function baseEmail(opts: BaseEmailOptions): string {
  const preview = opts.preview ?? opts.heading;
  const paragraphs = opts.bodyLines
    .map(
      (line) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${TEXT};">${esc(line)}</p>`,
    )
    .join('');

  const button = opts.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
         <tr><td style="border-radius:8px;background:${BRAND};">
           <a href="${opts.button.url}" target="_blank"
              style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
             ${esc(opts.button.label)}
           </a>
         </td></tr>
       </table>
       <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:${MUTED};">
         Or paste this link into your browser:<br/>
         <a href="${opts.button.url}" style="color:${BRAND};word-break:break-all;">${opts.button.url}</a>
       </p>`
    : '';

  const footerNote = opts.footerNote
    ? `<p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:${MUTED};">${esc(opts.footerNote)}</p>`
    : '';

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <span style="display:none;font-size:1px;color:${BG};max-height:0;overflow:hidden;">${esc(preview)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid ${BORDER};border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:20px 32px;border-bottom:1px solid ${BORDER};">
                <span style="font-size:18px;font-weight:700;color:${BRAND};">Entrio</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:${TEXT};">${esc(opts.heading)}</h1>
                ${paragraphs}
                ${button}
                ${footerNote}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid ${BORDER};">
                <p style="margin:0;font-size:12px;color:${MUTED};">
                  Entrio Visitor Management · This is an automated message.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Invite email: prompts a new user to set their password and activate the account. */
export function inviteEmail(opts: { name: string; roleLabel: string; url: string }): {
  subject: string;
  html: string;
} {
  return {
    subject: 'You’ve been invited to Entrio',
    html: baseEmail({
      preview: 'Set your password to activate your Entrio account.',
      heading: 'You’re invited to Entrio',
      bodyLines: [
        `Hi ${opts.name},`,
        `You’ve been added to Entrio as a ${opts.roleLabel}. Set your password to activate your account and sign in.`,
        'For your security, this link expires in 7 days.',
      ],
      button: { label: 'Set your password', url: opts.url },
      footerNote: 'If you weren’t expecting this invitation, you can safely ignore this email.',
    }),
  };
}
