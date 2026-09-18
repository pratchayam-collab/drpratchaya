import { BOOKING_CONSENT_VERSION } from '~/lib/consent';
import { randomToken } from '~/lib/crypto';
import { slotTakenMessage } from '~/lib/booking-copy';
import { utcNowIso } from '~/lib/timezone';
import type { OtpSessionPayload } from '~/lib/otp';

export class SlotUnavailableError extends Error {
  readonly code = 'SLOT_TAKEN';
  constructor(locale: 'th' | 'en') {
    super(slotTakenMessage[locale]);
  }
}

export interface CreateAppointmentResult {
  appointmentId: number;
  magicLinkToken: string;
}

export async function createPendingAppointment(
  db: D1Database,
  payload: OtpSessionPayload,
  ip: string,
): Promise<CreateAppointmentResult> {
  const now = utcNowIso();
  const magicLinkToken = randomToken(24);
  const consent = await db
    .prepare(
      `INSERT INTO consent_log (consent_version, consented_at, ip_address, consent_scope)
       VALUES (?, ?, ?, 'booking')
       RETURNING id`,
    )
    .bind(BOOKING_CONSENT_VERSION, now, ip)
    .first<{ id: number }>();

  if (!consent) throw new Error('consent_insert_failed');

  try {
    const row = await db
      .prepare(
        `INSERT INTO appointments (
           slot_id, consent_log_id, patient_name, patient_phone, patient_email,
           problem_description, status, magic_link_token, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
         RETURNING id`,
      )
      .bind(
        payload.slotId,
        consent.id,
        payload.patientName.trim(),
        payload.patientPhone.trim(),
        payload.patientEmail?.trim() || null,
        payload.problemDescription.trim(),
        magicLinkToken,
        now,
        now,
      )
      .first<{ id: number }>();

    if (!row) throw new Error('appointment_insert_failed');

    await db
      .prepare(`UPDATE slots SET status = 'booked', updated_at = ? WHERE id = ?`)
      .bind(now, payload.slotId)
      .run();

    return { appointmentId: row.id, magicLinkToken };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('UNIQUE constraint failed') || msg.includes('uq_slot_active')) {
      throw new SlotUnavailableError(payload.locale);
    }
    throw e;
  }
}

export async function cancelByPatient(db: D1Database, appointmentId: number): Promise<boolean> {
  const now = utcNowIso();
  const row = await db
    .prepare(`SELECT status, slot_id FROM appointments WHERE id = ?`)
    .bind(appointmentId)
    .first<{ status: string; slot_id: number }>();
  if (!row || !['pending', 'confirmed'].includes(row.status)) return false;

  await db
    .prepare(
      `UPDATE appointments SET status = 'cancelled_by_patient', cancelled_at = ?, updated_at = ? WHERE id = ?`,
    )
    .bind(now, now, appointmentId)
    .run();

  await db
    .prepare(`UPDATE slots SET status = 'available', updated_at = ? WHERE id = ?`)
    .bind(now, row.slot_id)
    .run();

  return true;
}
