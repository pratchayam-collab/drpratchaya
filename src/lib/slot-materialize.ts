import {
  addBangkokDays,
  bangkokDateFromUtcInstant,
  bangkokIsoWeekday,
  bangkokLocalToUtcInstant,
  parseHm,
  utcNowIso,
} from '~/lib/timezone';

interface TemplateRow {
  location_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  valid_from: string;
  valid_until: string | null;
}

interface ExceptionRow {
  location_id: number;
  exception_date: string;
  is_full_day: number;
  closure_start: string | null;
  closure_end: string | null;
}

const WEEKS_AHEAD = 8 * 7;

function overlapsClosure(
  slotStartMin: number,
  slotEndMin: number,
  closureStart: string,
  closureEnd: string,
): boolean {
  const cs = parseHm(closureStart);
  const ce = parseHm(closureEnd);
  return slotStartMin < ce && slotEndMin > cs;
}

export async function materializeSlots(db: D1Database): Promise<{ inserted: number; markedPast: number }> {
  const today = bangkokDateFromUtcInstant(utcNowIso());
  const endDate = addBangkokDays(today, WEEKS_AHEAD);
  const now = utcNowIso();

  const locations = await db
    .prepare(`SELECT id FROM locations WHERE is_active = 1 AND booking_mode = 'slots'`)
    .all<{ id: number }>();
  const templates = await db
    .prepare(`SELECT * FROM schedule_templates`)
    .all<TemplateRow>();
  const exceptions = await db
    .prepare(`SELECT * FROM schedule_exceptions WHERE exception_date >= ? AND exception_date <= ?`)
    .bind(today, endDate)
    .all<ExceptionRow>();

  let inserted = 0;
  for (const loc of locations.results ?? []) {
    for (let d = today; d <= endDate; d = addBangkokDays(d, 1)) {
      const weekday = bangkokIsoWeekday(d);
      const dayTemplates = (templates.results ?? []).filter(
        (t) =>
          t.location_id === loc.id &&
          t.day_of_week === weekday &&
          t.valid_from <= d &&
          (t.valid_until === null || t.valid_until >= d),
      );
      const dayExceptions = (exceptions.results ?? []).filter(
        (e) => e.location_id === loc.id && e.exception_date === d,
      );
      const fullDayClosed = dayExceptions.some((e) => e.is_full_day === 1);

      for (const tmpl of dayTemplates) {
        const startMin = parseHm(tmpl.start_time);
        const endMin = parseHm(tmpl.end_time);
        for (let cursor = startMin; cursor + tmpl.slot_duration_minutes <= endMin; cursor += tmpl.slot_duration_minutes) {
          const slotEnd = cursor + tmpl.slot_duration_minutes;
          const sh = String(Math.floor(cursor / 60)).padStart(2, '0');
          const sm = String(cursor % 60).padStart(2, '0');
          const eh = String(Math.floor(slotEnd / 60)).padStart(2, '0');
          const em = String(slotEnd % 60).padStart(2, '0');
          const startsAt = bangkokLocalToUtcInstant(d, `${sh}:${sm}`);
          const endsAt = bangkokLocalToUtcInstant(d, `${eh}:${em}`);

          let status = 'available';
          if (fullDayClosed) status = 'unavailable';
          else {
            for (const ex of dayExceptions) {
              if (ex.is_full_day === 1) continue;
              if (ex.closure_start && ex.closure_end && overlapsClosure(cursor, slotEnd, ex.closure_start, ex.closure_end)) {
                status = 'unavailable';
                break;
              }
            }
          }

          const existing = await db
            .prepare(`SELECT id FROM slots WHERE location_id = ? AND starts_at = ?`)
            .bind(loc.id, startsAt)
            .first();
          if (!existing) {
            await db
              .prepare(
                `INSERT INTO slots (location_id, starts_at, ends_at, status, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?)`,
              )
              .bind(loc.id, startsAt, endsAt, status, now, now)
              .run();
            inserted += 1;
          }
        }
      }
    }
  }

  const past = await db
    .prepare(
      `UPDATE slots SET status = 'unavailable', updated_at = ?
       WHERE ends_at < ? AND status = 'available'`,
    )
    .bind(now, now)
    .run();

  return { inserted, markedPast: past.meta.changes ?? 0 };
}
