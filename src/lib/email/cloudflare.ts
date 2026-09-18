import type { EmailSender, OutboundEmail } from '~/lib/email/types';

function buildRawMime(from: string, mail: OutboundEmail): string {
  const boundary = `b_${crypto.randomUUID().replace(/-/g, '')}`;
  const lines: string[] = [
    `From: ${from}`,
    `To: ${mail.to}`,
    `Subject: ${mail.subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    mail.text,
  ];
  if (mail.html) {
    lines.push(
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      mail.html,
    );
  }
  for (const att of mail.attachments ?? []) {
    lines.push(
      `--${boundary}`,
      `Content-Type: ${att.contentType}; name="${att.filename}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${att.filename}"`,
      '',
      btoa(att.content),
    );
  }
  lines.push(`--${boundary}--`);
  return lines.join('\r\n');
}

/**
 * Cloudflare Email Service (`send_email` binding) — sends to arbitrary recipients
 * after domain onboarding (unlike legacy Email Routing destination_address bindings).
 */
export function createCloudflareEmailSender(binding: NonNullable<Env['EMAIL']>, from: string): EmailSender {
  return {
    async send(mail: OutboundEmail): Promise<void> {
      const raw = buildRawMime(from, mail);
      await binding.send({
        from,
        to: mail.to,
        raw,
      } as EmailMessage);
    },
  };
}
