import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { clientIp, errorJson, json, readJson } from '~/lib/http';
import { getLocation } from '~/lib/locations';
import { getSlotIfBookable } from '~/lib/slots-query';
import { createOtpSession } from '~/lib/otp';
import { checkOtpRateLimits } from '~/lib/rate-limit';
import { BOOKING_CONSENT_VERSION } from '~/lib/consent';
import { verifyTurnstile } from '~/lib/turnstile';
import { randomToken } from '~/lib/crypto';
import { sendOrLog } from '~/lib/email';

export const prerender = false;

interface Body {
  turnstileToken: string;
  slotId: number;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  problemDescription: string;
  consentAccepted: boolean;
  consentVersion?: string;
  locale?: 'th' | 'en';
}

export const POST: APIRoute = async ({ request }) => {
  const ip = clientIp(request);
  const body = await readJson<Body>(request);
  const locale = body.locale === 'en' ? 'en' : 'th';

  if (!body.consentAccepted || body.consentVersion !== BOOKING_CONSENT_VERSION) {
    return errorJson('CONSENT_REQUIRED', locale === 'th' ? 'ต้องยินยอมก่อนส่งคำขอ' : 'Consent required', 400);
  }
  if (!(await verifyTurnstile(body.turnstileToken ?? '', ip))) {
    return errorJson('TURNSTILE_FAILED', locale === 'th' ? 'การตรวจสอบไม่ผ่าน' : 'Verification failed', 403);
  }

  const slot = await getSlotIfBookable(env.DB, body.slotId);
  if (!slot) {
    return errorJson('SLOT_UNAVAILABLE', locale === 'th' ? 'ช่วงเวลานี้ไม่ว่าง' : 'Slot unavailable', 409);
  }
  const location = await getLocation(env.DB, slot.location_id);
  if (!location || location.booking_mode !== 'slots') {
    return errorJson('EXTERNAL_ONLY', locale === 'th' ? 'สถานที่นี้ไม่รับจองผ่านเว็บ' : 'External booking only', 400);
  }

  const identifier = body.patientEmail?.trim() || body.patientPhone.trim();
  const rl = await checkOtpRateLimits(ip, identifier);
  if (!rl.allowed) {
    return errorJson('RATE_LIMITED', locale === 'th' ? 'ลองใหม่ภายหลัง' : 'Too many attempts', 429);
  }

  const email = body.patientEmail?.trim();
  if (!email) {
    return errorJson('EMAIL_REQUIRED', locale === 'th' ? 'ต้องระบุอีเมลเพื่อรับรหัสยืนยัน' : 'Email required for OTP', 400);
  }

  const sessionId = randomToken(16);
  const code = await createOtpSession(sessionId, {
    slotId: body.slotId,
    patientName: body.patientName,
    patientPhone: body.patientPhone,
    patientEmail: email,
    problemDescription: body.problemDescription,
    locale,
  });

  await sendOrLog({
    to: email,
    subject: locale === 'th' ? 'รหัสยืนยันคำขอนัดหมาย' : 'Appointment request verification code',
    text:
      locale === 'th'
        ? `รหัสยืนยัน: ${code} (หมดอายุใน 10 นาที)\nหากไม่ได้ส่งคำขอ กรุณาเพิกเฉย`
        : `Verification code: ${code} (expires in 10 minutes)`,
  });

  const devCode = import.meta.env.DEV ? code : undefined;
  return json({ ok: true, sessionId, devCode });
};
