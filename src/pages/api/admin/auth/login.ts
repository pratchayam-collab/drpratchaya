import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { verifyPassword } from '~/lib/auth/password';
import { verifyTotp } from '~/lib/auth/totp';
import { checkAdminLoginRateLimit } from '~/lib/auth/rate-limit';
import { createSession, sessionCookieHeader } from '~/lib/auth/session';
import { clientIp, errorJson, readJson } from '~/lib/http';
import { utcNowIso } from '~/lib/timezone';

export const prerender = false;

interface Body {
  email: string;
  password: string;
  totp: string;
}

export const POST: APIRoute = async ({ request }) => {
  const ip = clientIp(request);
  const rl = await checkAdminLoginRateLimit(ip);
  if (!rl.allowed) {
    return errorJson('RATE_LIMITED', 'ลองใหม่ภายหลัง', 429);
  }

  const body = await readJson<Body>(request);
  const email = body.email?.trim().toLowerCase();
  if (!email || !body.password || !body.totp) {
    return errorJson('INVALID_INPUT', 'กรอกข้อมูลไม่ครบ', 400);
  }

  const user = await env.DB
    .prepare(
      `SELECT id, email, password_hash, pbkdf2_iterations, pbkdf2_salt, totp_secret, is_active
       FROM admin_users WHERE email = ?`,
    )
    .bind(email)
    .first<{
      id: number;
      email: string;
      password_hash: string;
      pbkdf2_iterations: number;
      pbkdf2_salt: string;
      totp_secret: string | null;
      is_active: number;
    }>();

  if (!user || user.is_active !== 1) {
    return errorJson('AUTH_FAILED', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401);
  }

  const passwordOk = await verifyPassword(
    body.password,
    user.password_hash,
    user.pbkdf2_salt,
    user.pbkdf2_iterations,
  );
  if (!passwordOk) {
    return errorJson('AUTH_FAILED', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401);
  }

  if (!user.totp_secret) {
    return errorJson('TOTP_NOT_CONFIGURED', 'บัญชียังไม่ตั้งค่า TOTP', 403);
  }

  const totpOk = await verifyTotp(user.totp_secret, body.totp);
  if (!totpOk) {
    return errorJson('TOTP_INVALID', 'รหัสยืนยันสองชั้นไม่ถูกต้อง', 401);
  }

  const now = utcNowIso();
  await env.DB.prepare(`UPDATE admin_users SET last_login_at = ?, updated_at = ? WHERE id = ?`)
    .bind(now, now, user.id)
    .run();

  const { token, csrfToken } = await createSession(user.id, user.email);
  return new Response(JSON.stringify({ ok: true, csrfToken, email: user.email }), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'set-cookie': sessionCookieHeader(token),
    },
  });
};
