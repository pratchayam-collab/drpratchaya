import { env } from 'cloudflare:workers';
import { enqueueNotify } from '~/lib/notify-messages';
import { materializeSlots } from '~/lib/slot-materialize';
import { utcNowIso } from '~/lib/timezone';

const NO_SHOW_GRACE_HOURS = 2;

/** Hourly cron (`0 * * * *`): 24h reminders for confirmed appointments. */
export async function runHourlyJobs(): Promise<void> {
  const now = utcNowIso();
  const in24h = new Date(Date.parse(now) + 24 * 60 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, '.000Z');
  const in25h = new Date(Date.parse(now) + 25 * 60 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, '.000Z');

  const { results } = await env.DB.prepare(
    `SELECT a.id FROM appointments a
     JOIN slots s ON s.id = a.slot_id
     WHERE a.status = 'confirmed'
       AND s.starts_at >= ?
       AND s.starts_at < ?`,
  )
    .bind(in24h, in25h)
    .all<{ id: number }>();

  for (const row of results ?? []) {
    await enqueueNotify(env.NOTIFY, {
      type: 'patient_reminder_24h',
      appointmentId: row.id,
      dedupeId: `reminder24h:${row.id}`,
    });
  }
}

/** Daily Bangkok 01:30 (`30 18 * * *` UTC): slots, no-shows, retention. */
export async function runDailyMaintenanceJobs(): Promise<void> {
  await materializeSlots(env.DB);

  const now = utcNowIso();
  const graceMs = NO_SHOW_GRACE_HOURS * 60 * 60 * 1000;
  const cutoff = new Date(Date.parse(now) - graceMs).toISOString().replace(/\.\d{3}Z$/, '.000Z');

  await env.DB.prepare(
    `UPDATE appointments SET status = 'no_show', updated_at = ?
     WHERE status = 'confirmed'
       AND id IN (
         SELECT a.id FROM appointments a
         JOIN slots s ON s.id = a.slot_id
         WHERE s.ends_at < ?
       )`,
  )
    .bind(now, cutoff)
    .run();

  const retentionCutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .replace(/\.\d{3}Z$/, '.000Z');

  await env.DB.prepare(
    `UPDATE appointments SET
       patient_name = '[erased]',
       patient_phone = '[erased]',
       patient_email = NULL,
       problem_description = '[erased]',
       magic_link_token = 'erased-' || id,
       admin_notes = NULL,
       updated_at = ?
     WHERE status IN ('completed', 'cancelled_by_patient', 'declined_by_clinic', 'no_show')
       AND COALESCE(completed_at, cancelled_at, updated_at) < ?
       AND patient_name != '[erased]'`,
  )
    .bind(now, retentionCutoff)
    .run();
}

export async function handleScheduled(event: ScheduledEvent): Promise<void> {
  const cron = event.cron;
  if (cron === '0 * * * *') {
    await runHourlyJobs();
    return;
  }
  if (cron === '30 18 * * *') {
    await runDailyMaintenanceJobs();
    return;
  }
  await runHourlyJobs();
}
