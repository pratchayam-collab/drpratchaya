import type { APIRoute } from 'astro';
import { rescheduleAppointment } from '~/lib/admin/appointments';
import { requireAdminApi } from '~/lib/auth/guard';
import { errorJson, json, readJson } from '~/lib/http';

export const prerender = false;

interface Body {
  newSlotId: number;
  confirmNew?: boolean;
}

export const POST: APIRoute = async (context) => {
  const auth = await requireAdminApi(context, { requireCsrf: true });
  if (auth instanceof Response) return auth;
  const id = Number.parseInt(context.params.id ?? '', 10);
  if (!Number.isFinite(id)) return errorJson('INVALID_ID', '', 400);
  const body = await readJson<Body>(context.request);
  if (!body.newSlotId) return errorJson('INVALID_INPUT', 'เลือกช่วงเวลาใหม่', 400);
  try {
    const result = await rescheduleAppointment(auth, id, body.newSlotId, body.confirmNew ?? true);
    return json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg === 'SLOT_UNAVAILABLE') return errorJson('SLOT_UNAVAILABLE', 'ช่วงเวลานี้ไม่ว่าง', 409);
    return errorJson('INVALID_STATE', 'ไม่สามารถเลื่อนในสถานะนี้', 400);
  }
};
