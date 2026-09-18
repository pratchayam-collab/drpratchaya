import { env } from 'cloudflare:workers';
import { createCloudflareEmailSender } from '~/lib/email/cloudflare';
import { createResendSender } from '~/lib/email/resend';
import type { EmailSender } from '~/lib/email/types';

const DEFAULT_FROM = 'booking@drpratchaya.com';

/**
 * Email delivery decision (2026-09 Cloudflare docs):
 * - **Email Routing `send_email` with `destination_address`** only delivers to verified inboxes — unsuitable for patients.
 * - **Cloudflare Email Service** (`EMAIL.send()`) sends to arbitrary recipients after domain onboarding — preferred in production.
 * - **Resend** (`RESEND_API_KEY`) is the fallback when the domain is not yet onboarded to Email Service.
 */
export function getEmailSender(): EmailSender | null {
  const from = env.EMAIL_FROM ?? DEFAULT_FROM;
  if (env.EMAIL) {
    return createCloudflareEmailSender(env.EMAIL, from);
  }
  if (env.RESEND_API_KEY) {
    return createResendSender(env.RESEND_API_KEY, from);
  }
  return null;
}

export async function sendOrLog(mail: Parameters<EmailSender['send']>[0]): Promise<void> {
  const sender = getEmailSender();
  if (!sender) {
    console.log('[email:dev-noop]', mail.to, mail.subject);
    return;
  }
  await sender.send(mail);
}
