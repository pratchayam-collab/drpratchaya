import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { listAppointments } from '~/lib/admin/appointments';
import { requireAdminApi } from '~/lib/auth/guard';
import { bangkokDateFromUtcInstant, bangkokLocalToUtcInstant, utcNowIso } from '~/lib/timezone';
import { errorJson, json } from '~/lib/http';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const auth = await requireAdminApi(context);
  if (auth instanceof Response) return auth;

  const url = new URL(context.request.url);
  const locationId = url.searchParams.get('locationId');
  const status = url.searchParams.get('status');
  const scope = url.searchParams.get('scope') ?? 'upcoming';

  let fromUtc: string | undefined;
  if (scope === 'today') {
    const today = bangkokDateFromUtcInstant(utcNowIso());
    fromUtc = bangkokLocalToUtcInstant(today, '00:00');
  } else if (scope === 'upcoming') {
    fromUtc = utcNowIso();
  }

  const rows = await listAppointments(env.DB, {
    locationId: locationId ? Number.parseInt(locationId, 10) : undefined,
    status: status ?? undefined,
    fromUtc,
  });

  return json({ ok: true, appointments: rows });
};

export const POST: APIRoute = async () => errorJson('METHOD_NOT_ALLOWED', '', 405);
