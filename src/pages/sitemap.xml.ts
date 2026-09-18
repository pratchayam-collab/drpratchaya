import type { APIRoute } from 'astro';
import { buildSitemapXml, collectSitemapUrls } from '~/utils/sitemap';

export const prerender = true;

export const GET: APIRoute = async () => {
  const urls = await collectSitemapUrls();
  const xml = buildSitemapXml(urls);
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
