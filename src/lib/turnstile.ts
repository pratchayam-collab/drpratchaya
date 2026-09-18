import { env } from 'cloudflare:workers';

export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = env.TURNSTILE_SECRET_KEY;
  const isProduction = env.PUBLIC_TURNSTILE_SITE_KEY && !import.meta.env.DEV;

  if (!secret) {
    if (isProduction) {
      return false;
    }
    // Local dev without secret: allow after logging (fail closed in production only).
    return token === 'dev-bypass' || token.length > 0;
  }

  const body = new URLSearchParams({
    secret,
    response: token,
    remoteip: ip,
  });

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}
