import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { doctor } from '~/config/site.config';
import { buildOgImageHtml, fetchOgPng, ogR2Key } from '~/utils/og-image';

export const prerender = false;

export const GET: APIRoute = async () => {
  const key = ogR2Key('home');
  const html = buildOgImageHtml({
    eyebrow: doctor.specialty.th,
    title: doctor.name.th,
    subtitle: doctor.subSpecialty.th,
  });

  const png = await fetchOgPng(env, key, html);
  return new Response(Uint8Array.from(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
