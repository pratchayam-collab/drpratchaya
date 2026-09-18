import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { sendOrLog } from '~/lib/email';
import { errorJson, json, readJson } from '~/lib/http';
import { resolveManageAccess } from '~/lib/magic-link';

export const prerender = false;

interface Body {
  token: string;
  payload: string;
  message: string;
  locale?: 'th' | 'en';
}

/** Records a human-handled reschedule request (no automatic slot move). */
export const POST: APIRoute = async ({ request }) => {
  const body = await readJson<Body>(request);
  const access = await resolveManageAccess(env.DB, body.token, body.payload);
  if (!access) return errorJson('NOT_FOUND', 'ไม่พบคำขอ', 404);
  if (!['pending', 'confirmed'].includes(access.status)) {
    return errorJson('INVALID_STATE', 'ไม่สามารถขอเลื่อนในสถานะนี้', 400);
  }

  const clinicEmail = env.CLINIC_NOTIFY_EMAIL ?? 'dr.pratchaya@gmail.com';
  await sendOrLog({
    to: clinicEmail,
    subject: `[ขอเลื่อนนัด] appointment #${access.id}`,
    text: `Patient requested reschedule for appointment #${access.id}:\n${body.message}`,
  });

  return json({ ok: true });
};
