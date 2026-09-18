/**
 * KV keys for semantic search / ask (SESSIONS namespace).
 * Prefix `search:` — distinct from `book:`, `admin:`, and Astro session keys.
 */
export const SEARCH_KV_PREFIX = 'search:' as const;

export const searchRateLimitIpKey = (ip: string, action: 'search' | 'ask'): string =>
  `${SEARCH_KV_PREFIX}rl:ip:${action}:${ip}`;
