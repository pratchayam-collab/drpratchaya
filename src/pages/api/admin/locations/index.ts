import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { listLocations, upsertLocation } from '~/lib/admin/locations';
import { requireAdminApi } from '~/lib/auth/guard';
import { errorJson, json, readJson } from '~/lib/http';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const auth = await requireAdminApi(context);
  if (auth instanceof Response) return auth;
  const locations = await listLocations(env.DB);
  return json({ ok: true, locations });
};

export const POST: APIRoute = async (context) => {
  const auth = await requireAdminApi(context, { requireCsrf: true });
  if (auth instanceof Response) return auth;
  const body = await readJson<Record<string, unknown>>(context.request);
  try {
    const id = await upsertLocation(auth, env.DB, body as Parameters<typeof upsertLocation>[2]);
    return json({ ok: true, id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return errorJson('SAVE_FAILED', msg, 400);
  }
};
