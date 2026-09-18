import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { errorJson, json, readJson } from '~/lib/http';
import { verifyDsrOtpSession } from '~/lib/privacy/dsr-otp';
import { eraseAllPersonalDataForEmail, exportPersonalDataForEmail } from '~/lib/privacy/dsr';

export const prerender = false;

interface Body {
  sessionId: string;
  code: string;
  locale?: 'th' | 'en';
}

export const POST: APIRoute = async ({ request }) => {
  const body = await readJson<Body>(request);
  const locale = body.locale === 'en' ? 'en' : 'th';
  const sessionId = body.sessionId?.trim();
  const code = body.code?.trim();

  if (!sessionId || !code || !/^\d{6}$/.test(code)) {
    return errorJson('INVALID_INPUT', locale === 'th' ? 'ข้อมูลไม่ถูกต้อง' : 'Invalid input', 400);
  }

  const verified = await verifyDsrOtpSession(sessionId, code);
  if (!verified.ok) {
    const message =
      verified.reason === 'invalid'
        ? locale === 'th'
          ? 'รหัสไม่ถูกต้อง'
          : 'Invalid code'
        : locale === 'th'
          ? 'รหัสหมดอายุหรือไม่พบคำขอ'
          : 'Code expired or request not found';
    return errorJson('OTP_FAILED', message, 403);
  }

  const { email, action } = verified.payload;

  if (action === 'export') {
    const data = await exportPersonalDataForEmail(env.DB, email);
    return json({ ok: true, action, email, ...data });
  }

  const erased = await eraseAllPersonalDataForEmail(env.DB, email);
  const total = erased.appointments + erased.contactMessages + erased.newsletter;
  return json({
    ok: true,
    action,
    erased,
    erasedCount: total,
    message:
      locale === 'th'
        ? total > 0
          ? 'ลบหรือทำให้ไม่ระบุตัวตนข้อมูลส่วนบุคคลที่เชื่อมกับอีเมลนี้แล้ว'
          : 'ไม่พบข้อมูลที่ลบได้สำหรับอีเมลนี้'
        : total > 0
          ? 'Personal data linked to this email has been erased or removed'
          : 'No erasable personal data found for this email',
  });
};
