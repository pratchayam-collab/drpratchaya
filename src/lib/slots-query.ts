import { formatSlotBangkok, utcNowIso } from '~/lib/timezone';

export interface SlotRow {
  id: number;
  location_id: number;
  starts_at: string;
  ends_at: string;
  status: string;
}

export async function listAvailableSlots(
  db: D1Database,
  locationId: number,
  limit = 40,
): Promise<SlotRow[]> {
  const now = utcNowIso();
  const { results } = await db
    .prepare(
      `SELECT s.id, s.location_id, s.starts_at, s.ends_at, s.status
       FROM slots s
       WHERE s.location_id = ?
         AND s.status = 'available'
         AND s.starts_at > ?
         AND NOT EXISTS (
           SELECT 1 FROM appointments a
           WHERE a.slot_id = s.id AND a.status IN ('pending', 'confirmed')
         )
       ORDER BY s.starts_at ASC
       LIMIT ?`,
    )
    .bind(locationId, now, limit)
    .all<SlotRow>();
  return results ?? [];
}

export function slotLabel(slot: SlotRow, locale: 'th' | 'en'): string {
  return formatSlotBangkok(slot.starts_at, slot.ends_at, locale);
}

export async function getSlotIfBookable(db: D1Database, slotId: number): Promise<SlotRow | null> {
  const now = utcNowIso();
  return db
    .prepare(
      `SELECT s.id, s.location_id, s.starts_at, s.ends_at, s.status
       FROM slots s
       WHERE s.id = ?
         AND s.status = 'available'
         AND s.starts_at > ?
         AND NOT EXISTS (
           SELECT 1 FROM appointments a
           WHERE a.slot_id = s.id AND a.status IN ('pending', 'confirmed')
         )`,
    )
    .bind(slotId, now)
    .first<SlotRow>();
}
