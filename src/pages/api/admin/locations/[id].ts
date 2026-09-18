import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getLocation, upsertLocation } from '~/lib/admin/locations';
import { requireAdminApi } from '~/lib/auth/guard';
import { errorJson, json, readJson } from '~/lib/http';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const auth = await requireAdminApi(context);
  if (auth instanceof Response) return auth;
  const id = Number.parseInt(context.params.id ?? '', 10);
  const location = await getLocation(env.DB, id);
  if (!location) return errorJson('NOT_FOUND', '', 404);
  return json({ ok: true, location });
};

export const PATCH: APIRoute = async (context) => {
  const auth = await requireAdminApi(context, { requireCsrf: true });
  if (auth instanceof Response) return auth;
  const id = Number.parseInt(context.params.id ?? '', 10);
  const body = await readJson<Record<string, unknown>>(context.request);
  try {
    await upsertLocation(auth, env.DB, body as Parameters<typeof upsertLocation>[2], id);
    return json({ ok: true, id });
  } catch (e) {
    return errorJson('SAVE_FAILED', e instanceof Error ? e.message : '', 400);
  }
};
