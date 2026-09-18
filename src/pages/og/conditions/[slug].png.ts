import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getCollection } from 'astro:content';
import { doctor } from '~/config/site.config';
import { conditionSlug } from '~/utils/condition-seo';
import { CONDITION_SLUGS } from '~/utils/redirects';
import { buildOgImageHtml, fetchOgPng, ogR2Key } from '~/utils/og-image';

export const prerender = false;

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

  const key = ogR2Key('conditions', slug);
  const html = buildOgImageHtml({
    eyebrow: entry.data.tag,
    title: entry.data.conditionNameTh,
    subtitle: `${doctor.name.th} · ${entry.data.conditionNameEn}`,
  });

  const png = await fetchOgPng(env, key, html);
  return new Response(Uint8Array.from(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
