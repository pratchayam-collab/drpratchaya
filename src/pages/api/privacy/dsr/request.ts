import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { randomToken, sha256Hex } from '~/lib/crypto';
import { clientIp, errorJson, json, readJson } from '~/lib/http';
import { enqueueNotify } from '~/lib/notify-messages';
import { createDsrOtpSession, type DsrAction } from '~/lib/privacy/dsr-otp';
import { hasActivePersonalDataForEmail } from '~/lib/privacy/dsr';
import {
  DSR_REQUEST_MIN_DURATION_MS,
  withMinimumDuration,
} from '~/lib/privacy/dsr-request-timing';
import { checkOtpRateLimits } from '~/lib/rate-limit';
import { verifyTurnstile } from '~/lib/turnstile';

export const prerender = false;

interface Body {
  turnstileToken: string;
  email: string;
  action: DsrAction;
  locale?: 'th' | 'en';
}

const GENERIC_OK = {
  th: 'หากมีข้อมูลที่เกี่ยวข้องกับอีเมลนี้ เราจะส่งรหัสยืนยันไปยังอีเมลดังกล่าว',
  en: 'If we hold data for this email, we will send a verification code to that address',
};

export const POST: APIRoute = async ({ request }) => {
  const ip = clientIp(request);
  const body = await readJson<Body>(request);
  const locale = body.locale === 'en' ? 'en' : 'th';
  const email = body.email?.trim().toLowerCase();
  const action = body.action;

  if (!email || !email.includes('@') || (action !== 'export' && action !== 'delete')) {
    return errorJson('INVALID_INPUT', locale === 'th' ? 'ข้อมูลไม่ถูกต้อง' : 'Invalid input', 400);
  }

  if (!(await verifyTurnstile(body.turnstileToken ?? '', ip))) {
    return errorJson('TURNSTILE_FAILED', locale === 'th' ? 'การตรวจสอบไม่ผ่าน' : 'Verification failed', 403);
  }

  const rl = await checkOtpRateLimits(ip, email);
  if (!rl.allowed) {
    return errorJson('RATE_LIMITED', locale === 'th' ? 'ลองใหม่ภายหลัง' : 'Too many attempts', 429);
  }

  const sessionId = randomToken(16);
  let devCode: string | undefined;

  await withMinimumDuration(DSR_REQUEST_MIN_DURATION_MS, async () => {
    const hasData = await hasActivePersonalDataForEmail(env.DB, email);
    if (hasData) {
      const code = await createDsrOtpSession(sessionId, email, action);
      await enqueueNotify(env.NOTIFY, {
        type: 'dsr_otp_email',
        dedupeId: `dsr:${sessionId}`,
        to: email,
        locale,
        code,
      });
      devCode = import.meta.env.DEV ? code : undefined;
      return;
    }

    const kv = env.SESSIONS;
    if (kv) {
      await kv.put(`book:dsr:noop:${sessionId}`, '1', { expirationTtl: 60 });
    } else {
      await sha256Hex(`${email}:${sessionId}`);
    }
  });

  return json({
    ok: true,
    message: GENERIC_OK[locale],
    sessionId,
    devCode,
  });
};
