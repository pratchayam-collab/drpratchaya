import type { APIRoute } from 'astro';
import { requireAdminApi } from '~/lib/auth/guard';
import { clearSessionCookieHeader, destroySession, parseSessionCookie } from '~/lib/auth/session';
import { json } from '~/lib/http';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const auth = await requireAdminApi(context, { requireCsrf: true });
  if (auth instanceof Response) return auth;
  const token = parseSessionCookie(context.request.headers.get('cookie'));
  await destroySession(token);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'set-cookie': clearSessionCookieHeader(),
    },
  });
};

export const GET: APIRoute = async () => json({ ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: '' } }, 405);
