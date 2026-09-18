import { env } from 'cloudflare:workers';
import { randomToken } from '~/lib/crypto';
import { enqueueNotify } from '~/lib/notify-messages';
import { utcNowIso } from '~/lib/timezone';
import { writeAuditLog } from '~/lib/admin/audit';
import type { AdminAuthContext } from '~/lib/auth/guard';

export interface AppointmentListRow {
  id: number;
  status: string;
  patient_name: string;
  patient_phone: string;
  patient_email: string | null;
  problem_description: string;
  admin_notes: string | null;
  starts_at: string;
  ends_at: string;
  location_id: number;
  location_name_th: string;
  location_name_en: string;
  slot_id: number;
  rescheduled_to_id: number | null;
  rescheduled_from_id: number | null;
}

const LIST_SQL = `
  SELECT a.id, a.status, a.patient_name, a.patient_phone, a.patient_email,
         a.problem_description, a.admin_notes, a.slot_id,
         s.starts_at, s.ends_at,
         l.id AS location_id, l.name_th AS location_name_th, l.name_en AS location_name_en,
         (SELECT json_extract(al.after_json, '$.newAppointmentId')
          FROM audit_log al
          WHERE al.entity_type = 'appointment' AND al.entity_id = CAST(a.id AS TEXT)
            AND al.action = 'appointment.reschedule'
          ORDER BY al.created_at DESC LIMIT 1) AS rescheduled_to_id,
         (SELECT CAST(al.entity_id AS INTEGER)
          FROM audit_log al
          WHERE al.action = 'appointment.reschedule'
            AND json_extract(al.after_json, '$.newAppointmentId') = a.id
          ORDER BY al.created_at DESC LIMIT 1) AS rescheduled_from_id
  FROM appointments a
  JOIN slots s ON s.id = a.slot_id
  JOIN locations l ON l.id = s.location_id
`;

export async function listAppointments(
  db: D1Database,
  filters: { locationId?: number; status?: string; fromUtc?: string },
): Promise<AppointmentListRow[]> {
  const clauses: string[] = [];
  const binds: unknown[] = [];
  if (filters.fromUtc) {
    clauses.push('s.starts_at >= ?');
    binds.push(filters.fromUtc);
  }
  if (filters.locationId) {
    clauses.push('l.id = ?');
    binds.push(filters.locationId);
  }
  if (filters.status) {
    clauses.push('a.status = ?');
    binds.push(filters.status);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const sql = `${LIST_SQL} ${where} ORDER BY s.starts_at ASC LIMIT 200`;
  const stmt = db.prepare(sql);
  const result = await stmt.bind(...binds).all<AppointmentListRow>();
  return result.results ?? [];
}

async function loadAppointment(db: D1Database, id: number) {
  return db
    .prepare(`SELECT * FROM appointments WHERE id = ?`)
    .bind(id)
    .first<Record<string, unknown>>();
}

const db = () => env.DB;

export async function confirmAppointment(auth: AdminAuthContext, appointmentId: number): Promise<void> {
  const before = await loadAppointment(db(), appointmentId);
  if (!before || before.status !== 'pending') {
    throw new Error('INVALID_STATE');
  }
  const now = utcNowIso();
  await db()
    .prepare(
      `UPDATE appointments SET status = 'confirmed', confirmed_at = ?, updated_at = ? WHERE id = ? AND status = 'pending'`,
    )
    .bind(now, now, appointmentId)
    .run();

  const after = await loadAppointment(db(), appointmentId);
  await writeAuditLog(db(), {
    adminUserId: auth.user.id,
    action: 'appointment.confirm',
    entityType: 'appointment',
    entityId: appointmentId,
    before,
    after,
    ipAddress: auth.ip,
    userAgent: auth.userAgent,
  });

  await enqueueNotify(env.NOTIFY, {
    type: 'patient_confirmed',
    appointmentId,
    dedupeId: `confirm:${appointmentId}`,
    locale: 'th',
  });
}

export async function declineAppointment(auth: AdminAuthContext, appointmentId: number): Promise<void> {
  const before = await loadAppointment(db(), appointmentId);
  if (!before || before.status !== 'pending') {
    throw new Error('INVALID_STATE');
  }
  const now = utcNowIso();
  const slotId = before.slot_id as number;
  await db()
    .prepare(
      `UPDATE appointments SET status = 'declined_by_clinic', cancelled_at = ?, updated_at = ? WHERE id = ?`,
    )
    .bind(now, now, appointmentId)
    .run();
  await db()
    .prepare(`UPDATE slots SET status = 'available', updated_at = ? WHERE id = ?`)
    .bind(now, slotId)
    .run();

  const after = await loadAppointment(db(), appointmentId);
  await writeAuditLog(db(), {
    adminUserId: auth.user.id,
    action: 'appointment.decline',
    entityType: 'appointment',
    entityId: appointmentId,
    before,
    after,
    ipAddress: auth.ip,
    userAgent: auth.userAgent,
  });
  await enqueueNotify(env.NOTIFY, {
    type: 'patient_declined',
    appointmentId,
    dedupeId: `decline:${appointmentId}`,
    locale: 'th',
  });
}

export async function completeAppointment(auth: AdminAuthContext, appointmentId: number): Promise<void> {
  const before = await loadAppointment(db(), appointmentId);
  if (!before || before.status !== 'confirmed') throw new Error('INVALID_STATE');
  const now = utcNowIso();
  await db()
    .prepare(`UPDATE appointments SET status = 'completed', completed_at = ?, updated_at = ? WHERE id = ?`)
    .bind(now, now, appointmentId)
    .run();
  const after = await loadAppointment(db(), appointmentId);
  await writeAuditLog(db(), {
    adminUserId: auth.user.id,
    action: 'appointment.complete',
    entityType: 'appointment',
    entityId: appointmentId,
    before,
    after,
    ipAddress: auth.ip,
    userAgent: auth.userAgent,
  });
}

export async function markNoShow(auth: AdminAuthContext, appointmentId: number): Promise<void> {
  const before = await loadAppointment(db(), appointmentId);
  if (!before || before.status !== 'confirmed') throw new Error('INVALID_STATE');
  const now = utcNowIso();
  const slotId = before.slot_id as number;
  await db()
    .prepare(`UPDATE appointments SET status = 'no_show', updated_at = ? WHERE id = ?`)
    .bind(now, appointmentId)
    .run();
  await db()
    .prepare(`UPDATE slots SET status = 'available', updated_at = ? WHERE id = ?`)
    .bind(now, slotId)
    .run();
  const after = await loadAppointment(db(), appointmentId);
  await writeAuditLog(db(), {
    adminUserId: auth.user.id,
    action: 'appointment.no_show',
    entityType: 'appointment',
    entityId: appointmentId,
    before,
    after,
    ipAddress: auth.ip,
    userAgent: auth.userAgent,
  });
}

export async function rescheduleAppointment(
  auth: AdminAuthContext,
  appointmentId: number,
  newSlotId: number,
  confirmNew: boolean,
): Promise<{ newAppointmentId: number }> {
  const before = await loadAppointment(db(), appointmentId);
  if (!before || !['pending', 'confirmed'].includes(String(before.status))) {
    throw new Error('INVALID_STATE');
  }

  const newSlot = await db()
    .prepare(`SELECT id, status, location_id FROM slots WHERE id = ?`)
    .bind(newSlotId)
    .first<{ id: number; status: string; location_id: number }>();
  if (!newSlot || newSlot.status !== 'available') throw new Error('SLOT_UNAVAILABLE');

  const now = utcNowIso();
  const oldSlotId = before.slot_id as number;
  const consentLogId = before.consent_log_id as number;

  await db()
    .prepare(`UPDATE appointments SET status = 'rescheduled', updated_at = ? WHERE id = ?`)
    .bind(now, appointmentId)
    .run();
  await db()
    .prepare(`UPDATE slots SET status = 'available', updated_at = ? WHERE id = ?`)
    .bind(now, oldSlotId)
    .run();

  const magicLinkToken = randomToken(24);
  const newStatus = confirmNew ? 'confirmed' : 'pending';
  let newRow: { id: number } | null;
  try {
    newRow = await db()
      .prepare(
        `INSERT INTO appointments (
           slot_id, consent_log_id, patient_name, patient_phone, patient_email,
           problem_description, status, magic_link_token, admin_notes,
           confirmed_at, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING id`,
      )
      .bind(
        newSlotId,
        consentLogId,
        before.patient_name,
        before.patient_phone,
        before.patient_email,
        before.problem_description,
        newStatus,
        magicLinkToken,
        `[rescheduled_from:${appointmentId}]`,
        confirmNew ? now : null,
        now,
        now,
      )
      .first<{ id: number }>();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('UNIQUE') || msg.includes('uq_slot_active')) {
      throw new Error('SLOT_UNAVAILABLE');
    }
    throw e;
  }
  if (!newRow) throw new Error('INSERT_FAILED');

  await db()
    .prepare(`UPDATE slots SET status = 'booked', updated_at = ? WHERE id = ?`)
    .bind(now, newSlotId)
    .run();

  const afterOld = await loadAppointment(db(), appointmentId);
  const afterNew = await loadAppointment(db(), newRow.id);

  await writeAuditLog(db(), {
    adminUserId: auth.user.id,
    action: 'appointment.reschedule',
    entityType: 'appointment',
    entityId: appointmentId,
    before,
    after: {
      ...afterOld,
      newAppointmentId: newRow.id,
      newSlotId,
    },
    ipAddress: auth.ip,
    userAgent: auth.userAgent,
  });
  await writeAuditLog(db(), {
    adminUserId: auth.user.id,
    action: 'appointment.reschedule_created',
    entityType: 'appointment',
    entityId: newRow.id,
    before: null,
    after: { ...afterNew, rescheduledFromId: appointmentId },
    ipAddress: auth.ip,
    userAgent: auth.userAgent,
  });

  if (confirmNew) {
    await enqueueNotify(env.NOTIFY, {
      type: 'patient_confirmed',
      appointmentId: newRow.id,
      dedupeId: `confirm:${newRow.id}`,
      locale: 'th',
    });
  }

  return { newAppointmentId: newRow.id };
}

/** Test helper: force invalid status (should fail CHECK). */
export async function tryInvalidStatus(db: D1Database, appointmentId: number): Promise<{ ok: boolean; error?: string }> {
  try {
    await db
      .prepare(`UPDATE appointments SET status = 'not_a_real_status' WHERE id = ?`)
      .bind(appointmentId)
      .run();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
