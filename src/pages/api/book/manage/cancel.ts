import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { cancelByPatient } from '~/lib/appointments';
import { errorJson, json, readJson } from '~/lib/http';
import { resolveManageAccess } from '~/lib/magic-link';

export const prerender = false;

interface Body {
  token: string;
  payload: string;
}

export const POST: APIRoute = async ({ request }) => {
  const body = await readJson<Body>(request);
  const access = await resolveManageAccess(env.DB, body.token, body.payload);
  if (!access) {
    return errorJson('NOT_FOUND', 'ไม่พบคำขอ', 404);
  }
  const ok = await cancelByPatient(env.DB, access.id);
  if (!ok) {
    return errorJson('CANNOT_CANCEL', 'ไม่สามารถยกเลิกในสถานะนี้', 400);
  }
  return json({ ok: true });
};
