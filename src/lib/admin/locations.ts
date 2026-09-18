import { utcNowIso } from '~/lib/timezone';
import { writeAuditLog } from '~/lib/admin/audit';
import type { AdminAuthContext } from '~/lib/auth/guard';

export interface LocationRow {
  id: number;
  name_th: string;
  name_en: string;
  address_th: string | null;
  address_en: string | null;
  map_url: string | null;
  phone: string | null;
  display_order: number;
  is_active: number;
  booking_mode: 'slots' | 'external';
  external_channel_label: string | null;
  external_phone: string | null;
  external_line_id: string | null;
  external_booking_url: string | null;
}

export async function listLocations(db: D1Database): Promise<LocationRow[]> {
  const result = await db
    .prepare(`SELECT * FROM locations ORDER BY display_order ASC, id ASC`)
    .all<LocationRow>();
  return result.results ?? [];
}

export async function getLocation(db: D1Database, id: number): Promise<LocationRow | null> {
  return db.prepare(`SELECT * FROM locations WHERE id = ?`).bind(id).first<LocationRow>();
}

export async function upsertLocation(
  auth: AdminAuthContext,
  db: D1Database,
  input: Partial<LocationRow> & { name_th: string; name_en: string; booking_mode: 'slots' | 'external' },
  id?: number,
): Promise<number> {
  const now = utcNowIso();
  let locationId = id;
  let before: LocationRow | null = null;
  if (id) {
    before = await getLocation(db, id);
    await db
      .prepare(
        `UPDATE locations SET
           name_th = ?, name_en = ?, address_th = ?, address_en = ?, map_url = ?, phone = ?,
           display_order = ?, is_active = ?, booking_mode = ?,
           external_channel_label = ?, external_phone = ?, external_line_id = ?, external_booking_url = ?,
           updated_at = ?
         WHERE id = ?`,
      )
      .bind(
        input.name_th,
        input.name_en,
        input.address_th ?? null,
        input.address_en ?? null,
        input.map_url ?? null,
        input.phone ?? null,
        input.display_order ?? 0,
        input.is_active ?? 1,
        input.booking_mode,
        input.external_channel_label ?? null,
        input.external_phone ?? null,
        input.external_line_id ?? null,
        input.external_booking_url ?? null,
        now,
        id,
      )
      .run();
  } else {
    const row = await db
      .prepare(
        `INSERT INTO locations (
           name_th, name_en, address_th, address_en, map_url, phone, display_order, is_active,
           booking_mode, external_channel_label, external_phone, external_line_id, external_booking_url,
           created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING id`,
      )
      .bind(
        input.name_th,
        input.name_en,
        input.address_th ?? null,
        input.address_en ?? null,
        input.map_url ?? null,
        input.phone ?? null,
        input.display_order ?? 0,
        input.is_active ?? 1,
        input.booking_mode,
        input.external_channel_label ?? null,
        input.external_phone ?? null,
        input.external_line_id ?? null,
        input.external_booking_url ?? null,
        now,
        now,
      )
      .first<{ id: number }>();
    locationId = row?.id;
  }
  if (!locationId) throw new Error('location_save_failed');
  const after = await getLocation(db, locationId);
  await writeAuditLog(db, {
    adminUserId: auth.user.id,
    action: id ? 'location.update' : 'location.create',
    entityType: 'location',
    entityId: locationId,
    before,
    after,
    ipAddress: auth.ip,
    userAgent: auth.userAgent,
  });
  return locationId;
}
