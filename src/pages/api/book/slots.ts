import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getLocation } from '~/lib/locations';
import { errorJson, json } from '~/lib/http';
import { listAvailableSlots, slotLabel } from '~/lib/slots-query';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const locationId = Number(url.searchParams.get('locationId'));
  const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'th';
  if (!Number.isFinite(locationId)) {
    return errorJson('INVALID_LOCATION', 'locationId required', 400);
  }
  const location = await getLocation(env.DB, locationId);
  if (!location) return errorJson('NOT_FOUND', 'Location not found', 404);
  if (location.booking_mode === 'external') {
    return json({ ok: true, slots: [], externalOnly: true });
  }
  const slots = await listAvailableSlots(env.DB, locationId);
  return json({
    ok: true,
    slots: slots.map((s) => ({
      id: s.id,
      startsAt: s.starts_at,
      endsAt: s.ends_at,
      label: slotLabel(s, locale),
    })),
  });
};
