import { env } from 'cloudflare:workers';
import { adminRateLimitIpKey } from '~/lib/auth/kv-keys';

export interface RateLimitResult {
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

/** Login: 15 attempts per hour per IP. */
export async function checkAdminLoginRateLimit(ip: string): Promise<RateLimitResult> {
  return incrementCounter(adminRateLimitIpKey(ip, 'login'), 3600, 15);
}
