import { env } from 'cloudflare:workers';
import { provisionalAcknowledgement } from '~/lib/booking-copy';
import { sendOrLog } from '~/lib/email';
import { buildIcsEvent } from '~/lib/ics';
import { notifyDoneKey } from '~/lib/kv-keys';
import type { NotifyJob } from '~/lib/notify-messages';
import { formatSlotBangkok } from '~/lib/timezone';
import { signManageLink } from '~/lib/magic-link';

async function alreadySent(dedupeId: string): Promise<boolean> {
  const key = notifyDoneKey(dedupeId);
  const kv = env.SESSIONS;
  if (!kv) return false;
  const v = await kv.get(key);
  return v === '1';
}

async function markSent(dedupeId: string): Promise<void> {
  const kv = env.SESSIONS;
  if (!kv) return;
  await kv.put(notifyDoneKey(dedupeId), '1', { expirationTtl: 14 * 24 * 3600 });
}

interface AppointmentEmailContext {
  id: number;
  patient_name: string;
  patient_email: string | null;
  patient_phone: string;
  problem_description: string;
  status: string;
  magic_link_token: string;
  starts_at: string;
  ends_at: string;
  location_name_th: string;
  location_name_en: string;
  address_th: string | null;
}

async function loadContext(db: D1Database, appointmentId: number): Promise<AppointmentEmailContext | null> {
  return db
    .prepare(
      `SELECT a.id, a.patient_name, a.patient_email, a.patient_phone, a.problem_description,
              a.status, a.magic_link_token, s.starts_at, s.ends_at,
              l.name_th AS location_name_th, l.name_en AS location_name_en, l.address_th
       FROM appointments a
       JOIN slots s ON s.id = a.slot_id
       JOIN locations l ON l.id = s.location_id
       WHERE a.id = ?`,
    )
    .bind(appointmentId)
    .first<AppointmentEmailContext>();
}

export async function processNotifyJob(job: NotifyJob): Promise<void> {
  if (await alreadySent(job.dedupeId)) return;

  if (job.type === 'dsr_otp_email') {
    const locale = job.locale;
    await sendOrLog({
      to: job.to,
      subject:
        locale === 'th'
          ? 'รหัสยืนยันคำขอข้อมูลส่วนบุคคล'
          : 'Personal data request verification code',
      text:
        locale === 'th'
          ? `รหัสยืนยัน: ${job.code} (หมดอายุใน 10 นาที)\nหากไม่ได้ส่งคำขอ กรุณาเพิกเฉย`
          : `Verification code: ${job.code} (expires in 10 minutes)`,
    });
    await markSent(job.dedupeId);
    return;
  }

  const ctx = await loadContext(env.DB, job.appointmentId);
  if (!ctx) {
    await markSent(job.dedupeId);
    return;
  }

  const locale = job.locale ?? 'th';
  const managePath = await signManageLink(ctx.id, ctx.magic_link_token);
  const manageUrl = `https://drpratchaya.com${managePath}`;
  const slotLabel = formatSlotBangkok(ctx.starts_at, ctx.ends_at, locale);
  const clinicEmail = env.CLINIC_NOTIFY_EMAIL ?? 'dr.pratchaya@gmail.com';

  switch (job.type) {
    case 'patient_request_received': {
      if (!ctx.patient_email) break;
      const copy = provisionalAcknowledgement[locale];
      await sendOrLog({
        to: ctx.patient_email,
        subject: copy.subject,
        text: `${copy.body}\n\nช่วงเวลาที่ขอ: ${slotLabel}\nจัดการคำขอ: ${manageUrl}`,
        html: `<p>${copy.body}</p><p><strong>${locale === 'th' ? 'ช่วงเวลาที่ขอ' : 'Requested time'}:</strong> ${slotLabel}</p><p><a href="${manageUrl}">${locale === 'th' ? 'ดูหรือยกเลิกคำขอ' : 'View or cancel request'}</a></p>`,
      });
      break;
    }
    case 'clinic_new_request': {
      await sendOrLog({
        to: clinicEmail,
        subject: `[คำขอนัด — ยังไม่ยืนยัน] ${ctx.patient_name} · ${slotLabel}`,
        text:
          `คำขอนัดหมายใหม่ (สถานะ pending)\n` +
          `ผู้ป่วย: ${ctx.patient_name}\nโทร: ${ctx.patient_phone}\nอีเมล: ${ctx.patient_email ?? '-'}\n` +
          `เวลา: ${slotLabel}\nอาการ: ${ctx.problem_description}\n`,
      });
      break;
    }
    case 'patient_confirmed': {
      if (!ctx.patient_email) break;
      const ics = buildIcsEvent({
        uid: `appointment-${ctx.id}@drpratchaya.com`,
        startsAtUtc: ctx.starts_at,
        endsAtUtc: ctx.ends_at,
        summary: locale === 'th' ? 'นัดหมาย (ยืนยันแล้ว)' : 'Appointment (confirmed)',
        location: ctx.address_th ?? ctx.location_name_th,
        description:
          locale === 'th'
            ? 'นัดหมายได้รับการยืนยันจากคลินิกแล้ว กรุณาติดตามขั้นตอนของโรงพยาบาล'
            : 'Your appointment has been confirmed by the clinic.',
      });
      await sendOrLog({
        to: ctx.patient_email,
        subject: locale === 'th' ? 'ยืนยันนัดหมายแล้ว' : 'Your appointment is confirmed',
        text: `${locale === 'th' ? 'นัดหมายของคุณได้รับการยืนยันแล้ว' : 'Your appointment is confirmed'} — ${slotLabel}`,
        attachments: [{ filename: 'appointment.ics', content: ics, contentType: 'text/calendar' }],
      });
      break;
    }
    case 'patient_declined': {
      if (!ctx.patient_email) break;
      await sendOrLog({
        to: ctx.patient_email,
        subject: locale === 'th' ? 'คำขอนัดหมายไม่สามารถยืนยันได้' : 'Appointment request update',
        text:
          locale === 'th'
            ? `ขออภัย คลินิกไม่สามารถยืนยันนัดหมายในช่วง ${slotLabel} กรุณาติดต่อคลินิกหรือเลือกช่วงเวลาอื่น`
            : `We could not confirm your request for ${slotLabel}. Please contact the clinic or choose another time.`,
      });
      break;
    }
    case 'patient_reminder_24h': {
      if (!ctx.patient_email || ctx.status !== 'confirmed') break;
      await sendOrLog({
        to: ctx.patient_email,
        subject: locale === 'th' ? 'เตือนนัดหมายพรุ่งนี้' : 'Appointment reminder',
        text: `${locale === 'th' ? 'นัดหมายพรุ่งนี้' : 'Reminder'}: ${slotLabel}\n${manageUrl}`,
      });
      break;
    }
  }

  await markSent(job.dedupeId);
}

export async function handleNotifyBatch(batch: MessageBatch<NotifyJob>): Promise<void> {
  for (const msg of batch.messages) {
    try {
      await processNotifyJob(msg.body);
      msg.ack();
    } catch (e) {
      console.error('notify_consumer_error', e);
      msg.retry();
    }
  }
}
