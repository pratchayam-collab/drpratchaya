import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { listActiveLocations } from '~/lib/locations';
import { json } from '~/lib/http';

export const prerender = false;

export const GET: APIRoute = async () => {
  const locations = await listActiveLocations(env.DB);
  return json({
    ok: true,
    locations: locations.map((l) => ({
      id: l.id,
      name: { th: l.name_th, en: l.name_en },
      address: { th: l.address_th, en: l.address_en },
      mapUrl: l.map_url,
      phone: l.phone,
      bookingMode: l.booking_mode,
      external:
        l.booking_mode === 'external'
          ? {
              channelLabel: l.external_channel_label,
              phone: l.external_phone,
              lineId: l.external_line_id,
              bookingUrl: l.external_booking_url,
            }
          : null,
    })),
  });
};
