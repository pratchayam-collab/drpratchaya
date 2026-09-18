import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { listPosts, savePost } from '~/lib/admin/posts';
import { requireAdminApi } from '~/lib/auth/guard';
import { errorJson, json, readJson } from '~/lib/http';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const auth = await requireAdminApi(context);
  if (auth instanceof Response) return auth;
  const posts = await listPosts(env.DB);
  return json({ ok: true, posts });
};

export const POST: APIRoute = async (context) => {
  const auth = await requireAdminApi(context, { requireCsrf: true });
  if (auth instanceof Response) return auth;
  const body = await readJson<Parameters<typeof savePost>[2]>(context.request);
  try {
    const id = await savePost(auth, env.DB, body);
    return json({ ok: true, id });
  } catch (e) {
    return errorJson('SAVE_FAILED', e instanceof Error ? e.message : '', 400);
  }
};
