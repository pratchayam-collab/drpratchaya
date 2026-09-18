import type { EmailSender, OutboundEmail } from '~/lib/email/types';

/**
 * Resend — transactional email to arbitrary recipients (HTTPS API).
 * Used when Cloudflare Email Service binding is not yet onboarded.
 */
export function createResendSender(apiKey: string, from: string): EmailSender {
  return {
    async send(mail: OutboundEmail): Promise<void> {
      const body: Record<string, unknown> = {
        from,
        to: [mail.to],
        subject: mail.subject,
        text: mail.text,
      };
      if (mail.html) body.html = mail.html;
      if (mail.attachments?.length) {
        body.attachments = mail.attachments.map((a) => ({
          filename: a.filename,
          content: btoa(a.content),
          content_type: a.contentType,
        }));
      }
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`resend_failed:${res.status}:${detail.slice(0, 200)}`);
      }
    },
  };
}
