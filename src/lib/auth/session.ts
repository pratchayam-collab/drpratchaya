import { env } from 'cloudflare:workers';
import { randomToken } from '~/lib/crypto';
import { adminSessionKey } from '~/lib/auth/kv-keys';

export const ADMIN_SESSION_COOKIE = 'dr_admin_session';
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

export interface AdminSessionRecord {
  userId: number;
  email: string;
  csrfToken: string;
  createdAt: string;
  lastSeenAt: string;
}

export function parseSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === ADMIN_SESSION_COOKIE) {
      const value = rest.join('=');
      return value ? decodeURIComponent(value) : null;
    }
  }
  return null;
}

export async function loadSession(token: string | null): Promise<AdminSessionRecord | null> {
  if (!token) return null;
  const kv = env.SESSIONS;
  if (!kv) return null;
  const raw = await kv.get(adminSessionKey(token));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminSessionRecord;
  } catch {
    return null;
  }
}

export async function createSession(userId: number, email: string): Promise<{ token: string; csrfToken: string }> {
  const kv = env.SESSIONS;
  if (!kv) throw new Error('SESSIONS binding missing');
  const token = randomToken(32);
  const csrfToken = randomToken(16);
  const now = new Date().toISOString();
  const record: AdminSessionRecord = {
    userId,
    email,
    csrfToken,
    createdAt: now,
    lastSeenAt: now,
  };
  await kv.put(adminSessionKey(token), JSON.stringify(record), { expirationTtl: SESSION_TTL_SECONDS });
  return { token, csrfToken };
}

export async function touchSession(token: string, record: AdminSessionRecord): Promise<void> {
  const kv = env.SESSIONS;
  if (!kv) return;
  record.lastSeenAt = new Date().toISOString();
  await kv.put(adminSessionKey(token), JSON.stringify(record), { expirationTtl: SESSION_TTL_SECONDS });
}

export async function destroySession(token: string | null): Promise<void> {
  if (!token) return;
  const kv = env.SESSIONS;
  if (!kv) return;
  await kv.delete(adminSessionKey(token));
}

export function sessionCookieHeader(token: string): string {
  return `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookieHeader(): string {
  return `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
