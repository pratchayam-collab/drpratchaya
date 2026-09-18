export type AppointmentNotifyJobType =
  | 'patient_request_received'
  | 'clinic_new_request'
  | 'patient_confirmed'
  | 'patient_declined'
  | 'patient_reminder_24h';

export type NotifyJobType = AppointmentNotifyJobType | 'dsr_otp_email';

export interface AppointmentNotifyJob {
  type: AppointmentNotifyJobType;
  appointmentId: number;
  /** Stable id for idempotency (queue message id or composed key). */
  dedupeId: string;
  locale?: 'th' | 'en';
}

export interface DsrOtpEmailNotifyJob {
  type: 'dsr_otp_email';
  dedupeId: string;
  to: string;
  locale: 'th' | 'en';
  code: string;
}

export type NotifyJob = AppointmentNotifyJob | DsrOtpEmailNotifyJob;

export async function enqueueNotify(queue: Queue<NotifyJob> | undefined, job: NotifyJob): Promise<void> {
  if (!queue) {
    console.log('[notify:dev-noop]', job);
    return;
  }
  await queue.send(job);
}
