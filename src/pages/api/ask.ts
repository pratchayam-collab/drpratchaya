import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { ASK_TOP_K, MAX_QUESTION_LENGTH } from '~/lib/search/constants';
import { composeAskResponse } from '~/lib/search/compose-ask';
import { clientIp, errorJson, json, readJson } from '~/lib/http';
import { checkAskRateLimit } from '~/lib/search/rate-limit';
import { retrieveChunks } from '~/lib/search/retrieve';

export const prerender = false;

interface AskBody {
  question?: string;
}

export const POST: APIRoute = async ({ request }) => {
  const ip = clientIp(request);
  const rate = await checkAskRateLimit(ip);
  if (!rate.allowed) {
    return errorJson('RATE_LIMITED', 'Too many questions — try again later', 429);
  }

  let body: AskBody;
  try {
    body = await readJson<AskBody>(request);
  } catch {
    return errorJson('INVALID_JSON', 'Invalid JSON body', 400);
  }

  const question = body.question?.trim() ?? '';
  if (!question) return errorJson('MISSING_QUESTION', 'question required', 400);
  if (question.length > MAX_QUESTION_LENGTH) {
    return errorJson('QUESTION_TOO_LONG', 'question too long', 400);
  }

  const index = env.VECTORIZE;
  const ai = env.AI;
  if (!index || !ai) {
    return errorJson('UNAVAILABLE', 'Ask is temporarily unavailable', 503);
  }

  const { hits, chunks } = await retrieveChunks(ai, index, question, ASK_TOP_K);
  const response = await composeAskResponse(ai, question, hits, chunks);

  return json({
    ...response,
    rateLimitRemaining: rate.remaining,
  });
};
