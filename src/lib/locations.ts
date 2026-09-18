export interface LocationRow {
  id: number;
  name_th: string;
  name_en: string;
  address_th: string | null;
  address_en: string | null;
  map_url: string | null;
  phone: string | null;
  booking_mode: 'slots' | 'external';
  external_channel_label: string | null;
  external_phone: string | null;
  external_line_id: string | null;
  external_booking_url: string | null;
  display_order: number;
}

export async function listActiveLocations(db: D1Database): Promise<LocationRow[]> {
  const { results } = await db
    .prepare(
      `SELECT id, name_th, name_en, address_th, address_en, map_url, phone,
              booking_mode, external_channel_label, external_phone,
              external_line_id, external_booking_url, display_order
       FROM locations
       WHERE is_active = 1
       ORDER BY display_order ASC, id ASC`,
    )
    .all<LocationRow>();
  return results ?? [];
}

export async function getLocation(db: D1Database, id: number): Promise<LocationRow | null> {
  return db
    .prepare(
      `SELECT id, name_th, name_en, address_th, address_en, map_url, phone,
              booking_mode, external_channel_label, external_phone,
              external_line_id, external_booking_url, display_order
       FROM locations WHERE id = ? AND is_active = 1`,
    )
    .bind(id)
    .first<LocationRow>();
}
