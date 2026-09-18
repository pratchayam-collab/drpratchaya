import { env } from 'cloudflare:workers';
import { randomOtp6, sha256Hex } from '~/lib/crypto';

const DSR_OTP_PREFIX = 'book:dsr:otp:';

export const DSR_OTP_TTL_SECONDS = 600;

export type DsrAction = 'export' | 'delete';

export interface DsrOtpPayload {
  codeHash: string;
  email: string;
  action: DsrAction;
  attempts: number;
}

function dsrOtpKey(sessionId: string): string {
  return `${DSR_OTP_PREFIX}${sessionId}`;
}

export async function createDsrOtpSession(
  sessionId: string,
  email: string,
  action: DsrAction,
): Promise<string> {
  const code = randomOtp6();
  const codeHash = await sha256Hex(code);
  const stored: DsrOtpPayload = { codeHash, email, action, attempts: 0 };
  const kv = env.SESSIONS;
  if (!kv) throw new Error('SESSIONS binding missing');
  await kv.put(dsrOtpKey(sessionId), JSON.stringify(stored), {
    expirationTtl: DSR_OTP_TTL_SECONDS,
  });
  return code;
}

export async function verifyDsrOtpSession(
  sessionId: string,
  code: string,
): Promise<
  { ok: true; payload: DsrOtpPayload } | { ok: false; reason: 'missing' | 'expired' | 'invalid' }
> {
  const kv = env.SESSIONS;
  if (!kv) throw new Error('SESSIONS binding missing');
  const raw = await kv.get(dsrOtpKey(sessionId));
  if (!raw) return { ok: false, reason: 'missing' };
  const payload = JSON.parse(raw) as DsrOtpPayload;
  if (payload.attempts >= 5) {
    await kv.delete(dsrOtpKey(sessionId));
    return { ok: false, reason: 'expired' };
  }
  const hash = await sha256Hex(code);
  if (hash !== payload.codeHash) {
    payload.attempts += 1;
    await kv.put(dsrOtpKey(sessionId), JSON.stringify(payload), {
      expirationTtl: DSR_OTP_TTL_SECONDS,
    });
    return { ok: false, reason: 'invalid' };
  }
  await kv.delete(dsrOtpKey(sessionId));
  return { ok: true, payload };
}
