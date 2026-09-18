import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { loadDashboardFunnel } from '~/lib/admin/analytics';
import { listAppointments } from '~/lib/admin/appointments';
import { requireAdminApi } from '~/lib/auth/guard';
import { bangkokDateFromUtcInstant, bangkokLocalToUtcInstant, utcNowIso } from '~/lib/timezone';
import { json } from '~/lib/http';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const auth = await requireAdminApi(context);
  if (auth instanceof Response) return auth;

  const funnel = await loadDashboardFunnel(env.DB);
  const today = bangkokDateFromUtcInstant(utcNowIso());
  const todayStart = bangkokLocalToUtcInstant(today, '00:00');
  const pending = await listAppointments(env.DB, { status: 'pending' });
  const todaySchedule = await listAppointments(env.DB, { fromUtc: todayStart });

  return json({
    ok: true,
    funnel,
    pendingCount: pending.length,
    pendingPreview: pending.slice(0, 5),
    todaySchedule: todaySchedule.filter((a) => ['pending', 'confirmed'].includes(a.status)),
  });
};
