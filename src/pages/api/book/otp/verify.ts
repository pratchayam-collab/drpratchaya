import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { clientIp, errorJson, json, readJson } from '~/lib/http';
import { createPendingAppointment, SlotUnavailableError } from '~/lib/appointments';
import { verifyOtpSession } from '~/lib/otp';
import { enqueueNotify } from '~/lib/notify-messages';
import { signManageLink } from '~/lib/magic-link';
import { provisionalAcknowledgement } from '~/lib/booking-copy';

export const prerender = false;

interface Body {
  sessionId: string;
  code: string;
}

export const POST: APIRoute = async ({ request }) => {
  const ip = clientIp(request);
  const body = await readJson<Body>(request);
  const verified = await verifyOtpSession(body.sessionId, body.code);
  if (!verified.ok) {
    const messages = {
      missing: { th: 'รหัสหมดอายุ กรุณาขอรหัสใหม่', en: 'Code expired — request a new one' },
      expired: { th: 'รหัสหมดอายุ กรุณาขอรหัสใหม่', en: 'Code expired — request a new one' },
      invalid: { th: 'รหัสไม่ถูกต้อง', en: 'Invalid code' },
    };
    return errorJson('OTP_INVALID', messages[verified.reason].th, 400);
  }

  const payload = verified.payload;
  try {
    const { appointmentId, magicLinkToken } = await createPendingAppointment(env.DB, payload, ip);
    const managePath = await signManageLink(appointmentId, magicLinkToken);
    const dedupeBase = `req:${appointmentId}`;

    await enqueueNotify(env.NOTIFY, {
      type: 'patient_request_received',
      appointmentId,
      dedupeId: `${dedupeBase}:patient`,
      locale: payload.locale,
    });
    await enqueueNotify(env.NOTIFY, {
      type: 'clinic_new_request',
      appointmentId,
      dedupeId: `${dedupeBase}:clinic`,
      locale: payload.locale,
    });

    const copy = provisionalAcknowledgement[payload.locale];
    return json({
      ok: true,
      appointmentId,
      managePath,
      acknowledgement: {
        heading: copy.heading,
        body: copy.body,
      },
    });
  } catch (e) {
    if (e instanceof SlotUnavailableError) {
      return errorJson('SLOT_TAKEN', e.message, 409);
    }
    throw e;
  }
};
