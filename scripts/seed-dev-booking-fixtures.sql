-- Local development only — never run against production D1.
-- Provides one slots-mode and one external-mode location for the booking UI.

PRAGMA foreign_keys = ON;

INSERT INTO locations (
  name_th,
  name_en,
  address_th,
  address_en,
  map_url,
  phone,
  display_order,
  is_active,
  booking_mode,
  external_channel_label,
  external_phone,
  external_line_id,
  external_booking_url
) VALUES (
  'TODO(owner) โรงพยาบาลตัวอย่าง A',
  'TODO(owner) Example Hospital A',
  'TODO(owner) ที่อยู่ตัวอย่าง กรุงเทพฯ',
  'TODO(owner) Example address, Bangkok',
  'https://example.invalid/map/hospital-a',
  '+66000000001',
  10,
  1,
  'slots',
  NULL,
  NULL,
  NULL,
  NULL
);

INSERT INTO locations (
  name_th,
  name_en,
  address_th,
  address_en,
  map_url,
  phone,
  display_order,
  is_active,
  booking_mode,
  external_channel_label,
  external_phone,
  external_line_id,
  external_booking_url
) VALUES (
  'TODO(owner) คลินิกตัวอย่าง B',
  'TODO(owner) Example Clinic B',
  'TODO(owner) ที่อยู่ตัวอย่าง นนทบุรี',
  'TODO(owner) Example address, Nonthaburi',
  'https://example.invalid/map/clinic-b',
  '+66000000002',
  20,
  1,
  'external',
  'โทรศัพท์โรงพยาบาล (ตัวอย่าง)',
  '+66000000099',
  '@example-line-placeholder',
  'https://example.invalid/booking/clinic-b'
);

INSERT INTO schedule_templates (
  location_id,
  day_of_week,
  start_time,
  end_time,
  slot_duration_minutes,
  valid_from,
  valid_until
) VALUES (
  1,
  3,
  '17:00',
  '20:00',
  20,
  '2026-01-01',
  NULL
);

INSERT INTO slots (location_id, starts_at, ends_at, status) VALUES (
  1,
  '2026-09-24T03:00:00.000Z',
  '2026-09-24T03:20:00.000Z',
  'available'
);
