import { utcNowIso } from '~/lib/timezone';

const ERASED_NAME = '[erased]';

export interface AppointmentExportRow {
  id: number;
  status: string;
  patient_name: string;
  patient_phone: string;
  patient_email: string | null;
  problem_description: string;
  created_at: string;
  updated_at: string;
  starts_at: string;
  ends_at: string;
  location_name_th: string;
  location_name_en: string;
  consent_version: string | null;
  consented_at: string | null;
}

export interface ContactMessageExportRow {
  id: number;
  sender_name: string;
  sender_email: string;
  sender_phone: string | null;
  message_body: string;
  is_handled: number;
  created_at: string;
  handled_at: string | null;
  consent_version: string | null;
  consented_at: string | null;
}

export interface NewsletterExportRow {
  id: number;
  email: string;
  status: string;
  created_at: string;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
  consent_version: string | null;
  consented_at: string | null;
}

export interface DsrExportBundle {
  appointments: AppointmentExportRow[];
  contactMessages: ContactMessageExportRow[];
  newsletter: NewsletterExportRow | null;
}

export async function hasActivePersonalDataForEmail(db: D1Database, email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const row = await db
    .prepare(
      `SELECT 1 WHERE EXISTS (
         SELECT 1 FROM appointments
         WHERE lower(patient_email) = ? AND patient_name != ?
       ) OR EXISTS (
         SELECT 1 FROM contact_messages
         WHERE lower(sender_email) = ? AND sender_name != ?
       ) OR EXISTS (
         SELECT 1 FROM newsletter_subs
         WHERE lower(email) = ?
       )
       LIMIT 1`,
    )
    .bind(normalized, ERASED_NAME, normalized, ERASED_NAME, normalized)
    .first();
  return Boolean(row);
}

export async function exportPersonalDataForEmail(db: D1Database, email: string): Promise<DsrExportBundle> {
  const appointments = await exportAppointmentsForEmail(db, email);
  const contactMessages = await exportContactMessagesForEmail(db, email);
  const newsletter = await exportNewsletterForEmail(db, email);
  return { appointments, contactMessages, newsletter };
}

export async function exportAppointmentsForEmail(
  db: D1Database,
  email: string,
): Promise<AppointmentExportRow[]> {
  const normalized = email.trim().toLowerCase();
  const { results } = await db
    .prepare(
      `SELECT a.id, a.status, a.patient_name, a.patient_phone, a.patient_email,
              a.problem_description, a.created_at, a.updated_at,
              s.starts_at, s.ends_at,
              l.name_th AS location_name_th, l.name_en AS location_name_en,
              c.consent_version, c.consented_at
       FROM appointments a
       JOIN slots s ON s.id = a.slot_id
       JOIN locations l ON l.id = s.location_id
       LEFT JOIN consent_log c ON c.id = a.consent_log_id
       WHERE lower(a.patient_email) = ?
         AND a.patient_name != ?
       ORDER BY a.created_at ASC`,
    )
    .bind(normalized, ERASED_NAME)
    .all<AppointmentExportRow>();
  return results ?? [];
}

export async function exportContactMessagesForEmail(
  db: D1Database,
  email: string,
): Promise<ContactMessageExportRow[]> {
  const normalized = email.trim().toLowerCase();
  const { results } = await db
    .prepare(
      `SELECT m.id, m.sender_name, m.sender_email, m.sender_phone, m.message_body,
              m.is_handled, m.created_at, m.handled_at,
              c.consent_version, c.consented_at
       FROM contact_messages m
       LEFT JOIN consent_log c ON c.id = m.consent_log_id
       WHERE lower(m.sender_email) = ?
         AND m.sender_name != ?
       ORDER BY m.created_at ASC`,
    )
    .bind(normalized, ERASED_NAME)
    .all<ContactMessageExportRow>();
  return results ?? [];
}

export async function exportNewsletterForEmail(
  db: D1Database,
  email: string,
): Promise<NewsletterExportRow | null> {
  const normalized = email.trim().toLowerCase();
  return db
    .prepare(
      `SELECT n.id, n.email, n.status, n.created_at, n.confirmed_at, n.unsubscribed_at,
              c.consent_version, c.consented_at
       FROM newsletter_subs n
       LEFT JOIN consent_log c ON c.id = n.consent_log_id
       WHERE lower(n.email) = ?`,
    )
    .bind(normalized)
    .first<NewsletterExportRow>();
}

/** Erase guest contact fields for all booking rows tied to a verified email. */
export async function eraseAppointmentsForEmail(db: D1Database, email: string): Promise<number> {
  const normalized = email.trim().toLowerCase();
  const now = utcNowIso();
  const result = await db
    .prepare(
      `UPDATE appointments SET
         patient_name = ?,
         patient_phone = ?,
         patient_email = NULL,
         problem_description = ?,
         magic_link_token = 'erased-' || id,
         admin_notes = NULL,
         updated_at = ?
       WHERE lower(patient_email) = ?
         AND patient_name != ?`,
    )
    .bind(ERASED_NAME, ERASED_NAME, ERASED_NAME, now, normalized, ERASED_NAME)
    .run();
  return result.meta.changes ?? 0;
}

/** Remove contact form rows for the verified email (no slot history to preserve). */
export async function deleteContactMessagesForEmail(db: D1Database, email: string): Promise<number> {
  const normalized = email.trim().toLowerCase();
  const result = await db
    .prepare(`DELETE FROM contact_messages WHERE lower(sender_email) = ? AND sender_name != ?`)
    .bind(normalized, ERASED_NAME)
    .run();
  return result.meta.changes ?? 0;
}

/** Remove newsletter subscription for the verified email. */
export async function deleteNewsletterForEmail(db: D1Database, email: string): Promise<number> {
  const normalized = email.trim().toLowerCase();
  const result = await db
    .prepare(`DELETE FROM newsletter_subs WHERE lower(email) = ?`)
    .bind(normalized)
    .run();
  return result.meta.changes ?? 0;
}

export interface DsrEraseSummary {
  appointments: number;
  contactMessages: number;
  newsletter: number;
}

export async function eraseAllPersonalDataForEmail(db: D1Database, email: string): Promise<DsrEraseSummary> {
  await anonymizeConsentIpsForEmail(db, email);
  const appointments = await eraseAppointmentsForEmail(db, email);
  const contactMessages = await deleteContactMessagesForEmail(db, email);
  const newsletter = await deleteNewsletterForEmail(db, email);
  return { appointments, contactMessages, newsletter };
}

export async function anonymizeConsentIpsForEmail(db: D1Database, email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  await db
    .prepare(
      `UPDATE consent_log SET ip_address = '0.0.0.0'
       WHERE id IN (
         SELECT consent_log_id FROM appointments
         WHERE lower(patient_email) = ?
           AND patient_name != ?
           AND consent_log_id IS NOT NULL
         UNION
         SELECT consent_log_id FROM contact_messages
         WHERE lower(sender_email) = ?
           AND sender_name != ?
         UNION
         SELECT consent_log_id FROM newsletter_subs
         WHERE lower(email) = ?
       )`,
    )
    .bind(normalized, ERASED_NAME, normalized, ERASED_NAME, normalized)
    .run();
}
