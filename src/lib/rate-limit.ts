import { env } from 'cloudflare:workers';
import { rateLimitIdKey, rateLimitIpKey } from '~/lib/kv-keys';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

async function incrementCounter(key: string, ttlSeconds: number, limit: number): Promise<RateLimitResult> {
  const kv = env.SESSIONS;
  if (!kv) throw new Error('SESSIONS binding missing');
  const existing = await kv.get(key);
  const count = existing ? Number.parseInt(existing, 10) + 1 : 1;
  await kv.put(key, String(count), { expirationTtl: ttlSeconds });
  return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
}

/** OTP request limits: 10/hour per IP, 5/hour per phone/email. */
export async function checkOtpRateLimits(ip: string, identifier: string): Promise<RateLimitResult> {
  const ipResult = await incrementCounter(rateLimitIpKey(ip, 'otp'), 3600, 10);
  if (!ipResult.allowed) return ipResult;
  return incrementCounter(rateLimitIdKey(identifier.toLowerCase(), 'otp'), 3600, 5);
}
