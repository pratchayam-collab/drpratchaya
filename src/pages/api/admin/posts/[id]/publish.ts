import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { publishPost } from '~/lib/admin/posts';
import { requireAdminApi } from '~/lib/auth/guard';
import { errorJson, json } from '~/lib/http';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const auth = await requireAdminApi(context, { requireCsrf: true });
  if (auth instanceof Response) return auth;
  const id = Number.parseInt(context.params.id ?? '', 10);
  try {
    await publishPost(auth, env.DB, id);
    return json({ ok: true });
  } catch {
    return errorJson('NOT_FOUND', '', 404);
  }
};
