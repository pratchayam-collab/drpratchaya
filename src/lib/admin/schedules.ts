import { utcNowIso } from '~/lib/timezone';
import { writeAuditLog } from '~/lib/admin/audit';
import type { AdminAuthContext } from '~/lib/auth/guard';

export interface ScheduleTemplate {
  id: number;
  location_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  valid_from: string;
  valid_until: string | null;
}

export interface ScheduleException {
  id: number;
  location_id: number;
  exception_date: string;
  is_full_day: number;
  closure_start: string | null;
  closure_end: string | null;
  reason: string | null;
}

export async function listTemplates(db: D1Database, locationId: number): Promise<ScheduleTemplate[]> {
  const result = await db
    .prepare(`SELECT * FROM schedule_templates WHERE location_id = ? ORDER BY day_of_week, start_time`)
    .bind(locationId)
    .all<ScheduleTemplate>();
  return result.results ?? [];
}

export async function listExceptions(db: D1Database, locationId: number): Promise<ScheduleException[]> {
  const result = await db
    .prepare(
      `SELECT * FROM schedule_exceptions WHERE location_id = ? ORDER BY exception_date DESC LIMIT 120`,
    )
    .bind(locationId)
    .all<ScheduleException>();
  return result.results ?? [];
}

export async function createTemplate(
  auth: AdminAuthContext,
  db: D1Database,
  data: Omit<ScheduleTemplate, 'id'>,
): Promise<number> {
  const now = utcNowIso();
  const row = await db
    .prepare(
      `INSERT INTO schedule_templates (
         location_id, day_of_week, start_time, end_time, slot_duration_minutes,
         valid_from, valid_until, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id`,
    )
    .bind(
      data.location_id,
      data.day_of_week,
      data.start_time,
      data.end_time,
      data.slot_duration_minutes,
      data.valid_from,
      data.valid_until,
      now,
      now,
    )
    .first<{ id: number }>();
  if (!row) throw new Error('template_insert_failed');
  await writeAuditLog(db, {
    adminUserId: auth.user.id,
    action: 'schedule.template.create',
    entityType: 'schedule_template',
    entityId: row.id,
    after: data,
    ipAddress: auth.ip,
    userAgent: auth.userAgent,
  });
  return row.id;
}

export async function deleteTemplate(auth: AdminAuthContext, db: D1Database, id: number): Promise<void> {
  const before = await db.prepare(`SELECT * FROM schedule_templates WHERE id = ?`).bind(id).first();
  await db.prepare(`DELETE FROM schedule_templates WHERE id = ?`).bind(id).run();
  await writeAuditLog(db, {
    adminUserId: auth.user.id,
    action: 'schedule.template.delete',
    entityType: 'schedule_template',
    entityId: id,
    before,
    ipAddress: auth.ip,
    userAgent: auth.userAgent,
  });
}

export async function createException(
  auth: AdminAuthContext,
  db: D1Database,
  data: Omit<ScheduleException, 'id'>,
): Promise<number> {
  const now = utcNowIso();
  const row = await db
    .prepare(
      `INSERT INTO schedule_exceptions (
         location_id, exception_date, is_full_day, closure_start, closure_end, reason, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?)
       RETURNING id`,
    )
    .bind(
      data.location_id,
      data.exception_date,
      data.is_full_day,
      data.closure_start,
      data.closure_end,
      data.reason,
      now,
    )
    .first<{ id: number }>();
  if (!row) throw new Error('exception_insert_failed');
  await writeAuditLog(db, {
    adminUserId: auth.user.id,
    action: 'schedule.exception.create',
    entityType: 'schedule_exception',
    entityId: row.id,
    after: data,
    ipAddress: auth.ip,
    userAgent: auth.userAgent,
  });
  return row.id;
}

export async function deleteException(auth: AdminAuthContext, db: D1Database, id: number): Promise<void> {
  const before = await db.prepare(`SELECT * FROM schedule_exceptions WHERE id = ?`).bind(id).first();
  await db.prepare(`DELETE FROM schedule_exceptions WHERE id = ?`).bind(id).run();
  await writeAuditLog(db, {
    adminUserId: auth.user.id,
    action: 'schedule.exception.delete',
    entityType: 'schedule_exception',
    entityId: id,
    before,
    ipAddress: auth.ip,
    userAgent: auth.userAgent,
  });
}
