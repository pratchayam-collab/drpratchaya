/**
 * Single source of truth for booking consent wording and version id.
 * Bump `BOOKING_CONSENT_VERSION` whenever `bookingConsentText` changes so
 * `consent_log.consent_version` never silently reuses old consent.
 */

export const BOOKING_CONSENT_VERSION = 'booking-pdpa-v1-2026-09-18';

export const bookingConsentText = {
  th:
    'ข้าพเจ้ายินยอมให้เก็บรวบรวมและใช้ข้อมูลส่วนบุคคล (ชื่อ ช่องทางติดต่อ และคำอธิบายอาการโดยสังเขป) เพื่อประมวลผลคำขอนัดหมาย ' +
    'ตามนโยบายความเป็นส่วนตัวของเว็บไซต์ และทราบว่าคำขอนี้ยังไม่ใช่การยืนยันนัดหมายจนกว่าคลินิกจะติดต่อกลับ',
  en:
    'I consent to the collection and use of my personal data (name, contact details, and brief problem description) ' +
    'to process this appointment request per the site privacy policy. I understand this request is not a confirmed appointment until the clinic contacts me.',
} as const;
