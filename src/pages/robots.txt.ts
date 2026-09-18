import type { APIRoute } from 'astro';
import { CANONICAL_ORIGIN } from '~/utils/site-url';

export const prerender = true;

const body = `# drpratchaya.com — robots
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

# Answer-engine visibility: allow major AI crawlers to index public Thai clinical articles.
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

Sitemap: ${CANONICAL_ORIGIN}/sitemap.xml
`;

export const GET: APIRoute = () =>
  new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
