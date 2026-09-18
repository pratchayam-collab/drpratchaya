import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { buildConditionMarkdownDocument } from '~/utils/markdown-mirror';
import { conditionSlug } from '~/utils/condition-seo';
import { CONDITION_SLUGS } from '~/utils/redirects';

export const prerender = true;

export async function getStaticPaths() {
  return CONDITION_SLUGS.map((slug) => ({ params: { slug } }));
}

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug;
  if (!slug || !CONDITION_SLUGS.includes(slug as (typeof CONDITION_SLUGS)[number])) {
    return new Response('Not found', { status: 404 });
  }

  const entries = await getCollection('conditions');
  const entry = entries.find((item) => conditionSlug(item) === slug);
  if (!entry) {
    return new Response('Not found', { status: 404 });
  }

  const markdown = buildConditionMarkdownDocument(entry);
  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
