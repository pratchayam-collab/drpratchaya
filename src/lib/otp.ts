import { env } from 'cloudflare:workers';
import { otpKey } from '~/lib/kv-keys';
import { randomOtp6, sha256Hex } from '~/lib/crypto';

export const OTP_TTL_SECONDS = 600;

export interface OtpSessionPayload {
  codeHash: string;
  slotId: number;
  patientName: string;
  patientPhone: string;
  patientEmail: string | null;
  problemDescription: string;
  locale: 'th' | 'en';
  attempts: number;
}

export async function createOtpSession(
  sessionId: string,
  payload: Omit<OtpSessionPayload, 'codeHash' | 'attempts'>,
): Promise<string> {
  const code = randomOtp6();
  const codeHash = await sha256Hex(code);
  const stored: OtpSessionPayload = { ...payload, codeHash, attempts: 0 };
  const kv = env.SESSIONS;
  if (!kv) throw new Error('SESSIONS binding missing');
  await kv.put(otpKey(sessionId), JSON.stringify(stored), {
    expirationTtl: OTP_TTL_SECONDS,
  });
  return code;
}

export async function verifyOtpSession(
  sessionId: string,
  code: string,
): Promise<{ ok: true; payload: OtpSessionPayload } | { ok: false; reason: 'missing' | 'expired' | 'invalid' }> {
  const kv = env.SESSIONS;
  if (!kv) throw new Error('SESSIONS binding missing');
  const raw = await kv.get(otpKey(sessionId));
  if (!raw) return { ok: false, reason: 'missing' };
  const payload = JSON.parse(raw) as OtpSessionPayload;
  if (payload.attempts >= 5) {
    await kv.delete(otpKey(sessionId));
    return { ok: false, reason: 'expired' };
  }
  const hash = await sha256Hex(code);
  if (hash !== payload.codeHash) {
    payload.attempts += 1;
    await kv.put(otpKey(sessionId), JSON.stringify(payload), {
      expirationTtl: OTP_TTL_SECONDS,
    });
    return { ok: false, reason: 'invalid' };
  }
  await kv.delete(otpKey(sessionId));
  return { ok: true, payload };
}
