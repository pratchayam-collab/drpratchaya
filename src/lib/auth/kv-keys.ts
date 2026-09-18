/**
 * KV key prefixes for admin sessions, login rate limits, and pending login state.
 *
 * Shares the SESSIONS namespace with Astro sessions and booking (`book:` family).
 * Never use bare keys — always use a prefix below.
 *
 * | Prefix                    | Purpose                              | TTL        |
 * |---------------------------|--------------------------------------|------------|
 * | admin:session:            | Authenticated admin session payload  | 8 hours    |
 * | admin:rl:ip:              | Login attempts per IP                | 1 hour     |
 * | admin:login-pending:      | Post-password TOTP step (user id)    | 5 minutes  |
 */
export const ADMIN_KV_PREFIX = {
  session: 'admin:session:',
  rateLimitIp: 'admin:rl:ip:',
  loginPending: 'admin:login-pending:',
} as const;

export const adminSessionKey = (token: string): string => `${ADMIN_KV_PREFIX.session}${token}`;
export const adminRateLimitIpKey = (ip: string, action: string): string =>
  `${ADMIN_KV_PREFIX.rateLimitIp}${action}:${ip}`;
export const adminLoginPendingKey = (attemptId: string): string =>
  `${ADMIN_KV_PREFIX.loginPending}${attemptId}`;
