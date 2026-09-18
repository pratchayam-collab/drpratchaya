import type { APIRoute } from 'astro';
import { buildLlmsTxt } from '~/utils/llms';

export const prerender = true;

export const GET: APIRoute = async () => {
  const text = await buildLlmsTxt();
  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
