import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getPost, savePost } from '~/lib/admin/posts';
import { requireAdminApi } from '~/lib/auth/guard';
import { errorJson, json, readJson } from '~/lib/http';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const auth = await requireAdminApi(context);
  if (auth instanceof Response) return auth;
  const id = Number.parseInt(context.params.id ?? '', 10);
  const post = await getPost(env.DB, id);
  if (!post) return errorJson('NOT_FOUND', '', 404);
  return json({ ok: true, post });
};

export const PATCH: APIRoute = async (context) => {
  const auth = await requireAdminApi(context, { requireCsrf: true });
  if (auth instanceof Response) return auth;
  const id = Number.parseInt(context.params.id ?? '', 10);
  const body = await readJson<Parameters<typeof savePost>[2]>(context.request);
  const savedId = await savePost(auth, env.DB, { ...body, id });
  return json({ ok: true, id: savedId });
};
