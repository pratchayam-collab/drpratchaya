import type { APIRoute } from 'astro';
import { requireAdminApi } from '~/lib/auth/guard';
import { json } from '~/lib/http';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const auth = await requireAdminApi(context);
  if (auth instanceof Response) return auth;
  return json({
    ok: true,
    email: auth.user.email,
    csrfToken: auth.session.csrfToken,
  });
};
