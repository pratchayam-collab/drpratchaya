/**
 * KV key prefixes for booking, OTP, and rate limits.
 *
 * Astro's session driver also uses SESSIONS — never use bare keys without a prefix.
 * Framework session keys are managed by Astro; application keys use `book:` below.
 *
 * | Prefix              | Purpose                                      | TTL        |
 * |---------------------|----------------------------------------------|------------|
 * | book:otp:           | Pending OTP payload (hashed code, slot, etc.)| 10 minutes |
 * | book:rl:ip:         | OTP request rate limit per IP                | 1 hour     |
 * | book:rl:id:         | OTP request rate limit per phone/email        | 1 hour     |
 * | book:notify:done:   | Idempotent notify delivery marker            | 14 days    |
 */

export const KV_PREFIX = {
  otp: 'book:otp:',
  rateLimitIp: 'book:rl:ip:',
  rateLimitId: 'book:rl:id:',
  notifyDone: 'book:notify:done:',
} as const;

export const otpKey = (sessionId: string): string => `${KV_PREFIX.otp}${sessionId}`;
export const rateLimitIpKey = (ip: string, action: string): string =>
  `${KV_PREFIX.rateLimitIp}${action}:${ip}`;
export const rateLimitIdKey = (identifier: string, action: string): string =>
  `${KV_PREFIX.rateLimitId}${action}:${identifier}`;
export const notifyDoneKey = (dedupeId: string): string => `${KV_PREFIX.notifyDone}${dedupeId}`;
