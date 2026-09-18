import type { APIContext } from 'astro';
import { env } from 'cloudflare:workers';
import { clientIp, errorJson } from '~/lib/http';
import {
  loadSession,
  parseSessionCookie,
  touchSession,
  type AdminSessionRecord,
} from '~/lib/auth/session';

export interface AdminAuthContext {
  sessionToken: string;
  session: AdminSessionRecord;
  user: { id: number; email: string };
  ip: string;
  userAgent: string;
}

function csrfFromRequest(request: Request): string | null {
  return request.headers.get('x-admin-csrf') ?? request.headers.get('x-csrf-token');
}

async function loadActiveUser(userId: number): Promise<{ id: number; email: string } | null> {
  const row = await env.DB
    .prepare(`SELECT id, email FROM admin_users WHERE id = ? AND is_active = 1`)
    .bind(userId)
    .first<{ id: number; email: string }>();
  return row ?? null;
}

/** Shared session resolution for middleware and route handlers. */
export async function authenticateAdmin(request: Request): Promise<AdminAuthContext | null> {
  const token = parseSessionCookie(request.headers.get('cookie'));
  const session = await loadSession(token);
  if (!session || !token) return null;
  const user = await loadActiveUser(session.userId);
  if (!user) return null;
  await touchSession(token, session);
  return {
    sessionToken: token,
    session,
    user,
    ip: clientIp(request),
    userAgent: request.headers.get('user-agent') ?? '',
  };
}

/** Returns 401 JSON response or authenticated context for API routes. */
export async function requireAdminApi(
  context: APIContext,
  options?: { requireCsrf?: boolean },
): Promise<AdminAuthContext | Response> {
  const { request } = context;
  const auth = await authenticateAdmin(request);
  if (!auth) {
    return errorJson('UNAUTHORIZED', 'ต้องเข้าสู่ระบบ', 401);
  }
  if (options?.requireCsrf) {
    const header = csrfFromRequest(request);
    if (!header || header !== auth.session.csrfToken) {
      return errorJson('CSRF_INVALID', 'คำขอไม่ถูกต้อง', 403);
    }
  }
  return auth;
}

/** Returns null (unauthenticated) or context for SSR admin pages. */
export async function requireAdminPage(request: Request): Promise<AdminAuthContext | null> {
  return authenticateAdmin(request);
}

export function isAdminProtectedPath(pathname: string): boolean {
  if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) return false;
  if (pathname === '/api/admin/auth/login') return false;
  return pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
}

export function redirectToLogin(): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: '/admin/login' },
  });
}

export function unauthorizedHtml(): Response {
  return new Response('Unauthorized', { status: 401, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
