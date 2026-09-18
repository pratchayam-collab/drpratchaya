import type { MiddlewareHandler } from 'astro';
import {
  authenticateAdmin,
  isAdminProtectedPath,
  redirectToLogin,
  unauthorizedHtml,
} from '~/lib/auth/guard';
import { errorJson } from '~/lib/http';
import { resolveSiteRedirect } from '~/utils/redirects';

/**
 * Host and path redirects that must run on the Worker.
 *
 * Path rules are duplicated in `public/_redirects` so they still apply when
 * `run_worker_first` is false and static assets are served without entering
 * user Worker code. Apex→www cannot be expressed in `_redirects` (no Host match),
 * so it lives here only.
 *
 * Admin routes are authenticated here by default so new routes cannot ship
 * without protection. Route handlers still call `requireAdminApi` / `requireAdminPage`
 * for CSRF and defence in depth.
 */
export const onRequest: MiddlewareHandler = async (context, next) => {
  // Skip during static prerender (`locals.runtime` is absent). Live Worker only.
  if (!('runtime' in context.locals) || !context.locals.runtime) {
    return next();
  }

  const requestUrl = new URL(context.request.url);
  const target = resolveSiteRedirect(requestUrl);

  if (target) {
    return Response.redirect(target, 301);
  }

  const pathname = requestUrl.pathname;
  if (isAdminProtectedPath(pathname)) {
    const auth = await authenticateAdmin(context.request);
    if (!auth) {
      if (pathname.startsWith('/api/admin')) {
        return errorJson('UNAUTHORIZED', 'ต้องเข้าสู่ระบบ', 401);
      }
      if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
        return redirectToLogin();
      }
      return unauthorizedHtml();
    }
  }

  return next();
};
