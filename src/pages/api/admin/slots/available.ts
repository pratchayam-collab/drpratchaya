import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { requireAdminApi } from '~/lib/auth/guard';
import { errorJson, json } from '~/lib/http';
import { utcNowIso } from '~/lib/timezone';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const auth = await requireAdminApi(context);
  if (auth instanceof Response) return auth;

  const url = new URL(context.request.url);
  const locationId = Number.parseInt(url.searchParams.get('locationId') ?? '', 10);
  if (!Number.isFinite(locationId)) return errorJson('INVALID_INPUT', '', 400);

  const result = await env.DB
    .prepare(
      `SELECT s.id, s.starts_at, s.ends_at, s.status
       FROM slots s
       WHERE s.location_id = ?
         AND s.status = 'available'
         AND s.starts_at >= ?
       ORDER BY s.starts_at ASC
       LIMIT 80`,
    )
    .bind(locationId, utcNowIso())
    .all<{ id: number; starts_at: string; ends_at: string; status: string }>();

  return json({ ok: true, slots: result.results ?? [] });
};
