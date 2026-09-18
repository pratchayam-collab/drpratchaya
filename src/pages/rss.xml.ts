import type { APIRoute } from 'astro';
import { buildRssXml, collectRssItems } from '~/utils/rss';

export const prerender = true;

export const GET: APIRoute = async () => {
  const items = await collectRssItems();
  const xml = buildRssXml(items);
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
