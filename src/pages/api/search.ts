import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { SEARCH_TOP_K } from '~/lib/search/constants';
import { errorJson, json, clientIp } from '~/lib/http';
import { checkSearchRateLimit } from '~/lib/search/rate-limit';
import { semanticSearch } from '~/lib/search/retrieve';

export const prerender = false;

const MIN_SEARCH_SCORE = 0.5;

export const GET: APIRoute = async ({ request, url }) => {
  const q = url.searchParams.get('q')?.trim() ?? '';
  if (!q) return errorJson('MISSING_QUERY', 'q required', 400);
  if (q.length > 500) return errorJson('QUERY_TOO_LONG', 'q too long', 400);

  const ip = clientIp(request);
  const rate = await checkSearchRateLimit(ip);
  if (!rate.allowed) {
    return errorJson('RATE_LIMITED', 'Too many search requests', 429);
  }

  const index = env.VECTORIZE;
  const ai = env.AI;
  if (!index || !ai) {
    return errorJson('UNAVAILABLE', 'Search is temporarily unavailable', 503);
  }

  const limit = Math.min(20, Math.max(1, Number(url.searchParams.get('limit') ?? SEARCH_TOP_K)));
  const hits = await semanticSearch(ai, index, q, limit);
  const results = hits.filter((h) => h.score >= MIN_SEARCH_SCORE);

  return json({
    ok: true,
    query: q,
    results,
    rateLimitRemaining: rate.remaining,
  });
};
