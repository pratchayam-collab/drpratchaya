import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createException, deleteException, listExceptions } from '~/lib/admin/schedules';
import { requireAdminApi } from '~/lib/auth/guard';
import { errorJson, json, readJson } from '~/lib/http';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const auth = await requireAdminApi(context);
  if (auth instanceof Response) return auth;
  const locationId = Number.parseInt(new URL(context.request.url).searchParams.get('locationId') ?? '', 10);
  if (!Number.isFinite(locationId)) return errorJson('INVALID_INPUT', '', 400);
  const exceptions = await listExceptions(env.DB, locationId);
  return json({ ok: true, exceptions });
};

export const POST: APIRoute = async (context) => {
  const auth = await requireAdminApi(context, { requireCsrf: true });
  if (auth instanceof Response) return auth;
  const body = await readJson<Parameters<typeof createException>[2]>(context.request);
  const id = await createException(auth, env.DB, body);
  return json({ ok: true, id });
};

export const DELETE: APIRoute = async (context) => {
  const auth = await requireAdminApi(context, { requireCsrf: true });
  if (auth instanceof Response) return auth;
  const id = Number.parseInt(new URL(context.request.url).searchParams.get('id') ?? '', 10);
  if (!Number.isFinite(id)) return errorJson('INVALID_ID', '', 400);
  await deleteException(auth, env.DB, id);
  return json({ ok: true });
};
