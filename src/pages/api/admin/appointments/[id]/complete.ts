import type { APIRoute } from 'astro';
import { completeAppointment } from '~/lib/admin/appointments';
import { requireAdminApi } from '~/lib/auth/guard';
import { errorJson, json } from '~/lib/http';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const auth = await requireAdminApi(context, { requireCsrf: true });
  if (auth instanceof Response) return auth;
  const id = Number.parseInt(context.params.id ?? '', 10);
  if (!Number.isFinite(id)) return errorJson('INVALID_ID', '', 400);
  try {
    await completeAppointment(auth, id);
    return json({ ok: true });
  } catch {
    return errorJson('INVALID_STATE', 'ไม่สามารถบันทึกในสถานะนี้', 400);
  }
};
