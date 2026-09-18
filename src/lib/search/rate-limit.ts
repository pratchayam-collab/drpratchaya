import { env } from 'cloudflare:workers';
import {
  ASK_RATE_LIMIT,
  SEARCH_RATE_LIMIT,
} from '~/lib/search/constants';
import { searchRateLimitIpKey } from '~/lib/search/kv-keys';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

async function incrementCounter(
  key: string,
  ttlSeconds: number,
  limit: number,
): Promise<RateLimitResult> {
  const kv = env.SESSIONS;
  if (!kv) throw new Error('SESSIONS binding missing');
  const existing = await kv.get(key);
  const count = existing ? Number.parseInt(existing, 10) + 1 : 1;
  await kv.put(key, String(count), { expirationTtl: ttlSeconds });
  return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
}

export async function checkSearchRateLimit(ip: string): Promise<RateLimitResult> {
  return incrementCounter(
    searchRateLimitIpKey(ip, 'search'),
    SEARCH_RATE_LIMIT.windowSeconds,
    SEARCH_RATE_LIMIT.limit,
  );
}

export async function checkAskRateLimit(ip: string): Promise<RateLimitResult> {
  return incrementCounter(
    searchRateLimitIpKey(ip, 'ask'),
    ASK_RATE_LIMIT.windowSeconds,
    ASK_RATE_LIMIT.limit,
  );
}
