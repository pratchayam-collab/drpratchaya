/**
 * Patient-facing acknowledgement copy — must never read as confirmation.
 *
 * Avoids: "นัดหมายสำเร็จ", "ยืนยันนัดแล้ว", "confirmed", "see you then".
 * Uses explicit "คำขอ" (request) and "ยังไม่ใช่การยืนยัน" (not yet confirmed).
 */

export const provisionalAcknowledgement = {
  th: {
    subject: 'เราได้รับคำขอนัดหมายของคุณแล้ว (ยังไม่ยืนยัน)',
    heading: 'ได้รับคำขอนัดหมายแล้ว',
    body:
      'เราได้รับคำขอนัดหมายของคุณแล้ว — ขั้นตอนนี้ยังไม่ใช่การยืนยันนัดหมาย ' +
      'ทีมงานจะตรวจสอบตารางและติดต่อกลับทางอีเมลหรือโทรศัพท์เมื่อมีผลการพิจารณา ' +
      'หากช่วงเวลาที่เลือกไม่ว่าง เราจะแจ้งให้ทราบและเสนอทางเลือกอื่น',
    sms: 'ได้รับคำขอนัดหมายแล้ว (ยังไม่ยืนยัน) — ทีมงานจะติดต่อกลับ',
  },
  en: {
    subject: 'We received your appointment request (not confirmed)',
    heading: 'Request received',
    body:
      'We have received your appointment request. This is not a confirmed appointment. ' +
      'Our team will review the schedule and contact you by email or phone with the outcome. ' +
      'If your chosen time is unavailable, we will let you know and suggest alternatives.',
    sms: 'Appointment request received (not confirmed) — we will contact you.',
  },
} as const;

export const slotTakenMessage = {
  th: 'ช่วงเวลานี้มีผู้ขอนัดไปเมื่อสักครู่แล้ว กรุณาเลือกช่วงเวลาอื่น',
  en: 'Someone just requested this time. Please choose another slot.',
} as const;
