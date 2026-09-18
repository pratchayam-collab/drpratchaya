-- Hospitals/clinics and recurring availability (wall-clock times in Asia/Bangkok).

PRAGMA foreign_keys = ON;

CREATE TABLE locations (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  name_th               TEXT    NOT NULL,
  name_en               TEXT    NOT NULL,
  address_th            TEXT,
  address_en            TEXT,
  map_url               TEXT,
  phone                 TEXT,
  display_order         INTEGER NOT NULL DEFAULT 0,
  is_active             INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  booking_mode          TEXT    NOT NULL CHECK (booking_mode IN ('slots', 'external')),
  external_channel_label TEXT,
  external_phone        TEXT,
  external_line_id      TEXT,
  external_booking_url  TEXT,
  created_at            TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at            TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (
    booking_mode != 'external'
    OR (
      external_channel_label IS NOT NULL
      AND trim(external_channel_label) != ''
    )
  )
);

CREATE INDEX idx_locations_active_order ON locations (is_active, display_order);

-- day_of_week: ISO 8601 — 1 = Monday … 7 = Sunday (clinic local calendar).
-- start_time / end_time: HH:MM in Asia/Bangkok (no timezone suffix).
CREATE TABLE schedule_templates (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id          INTEGER NOT NULL REFERENCES locations (id) ON DELETE RESTRICT,
  day_of_week          INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time           TEXT    NOT NULL,
  end_time             TEXT    NOT NULL,
  slot_duration_minutes INTEGER NOT NULL CHECK (slot_duration_minutes > 0 AND slot_duration_minutes <= 240),
  valid_from           TEXT    NOT NULL,
  valid_until          TEXT,
  created_at           TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at           TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (start_time GLOB '[0-9][0-9]:[0-9][0-9]'),
  CHECK (end_time GLOB '[0-9][0-9]:[0-9][0-9]'),
  CHECK (valid_from GLOB '????-??-??'),
  CHECK (valid_until IS NULL OR valid_until GLOB '????-??-??')
);

CREATE INDEX idx_schedule_templates_location ON schedule_templates (location_id, day_of_week);
CREATE INDEX idx_schedule_templates_validity ON schedule_templates (location_id, valid_from, valid_until);

-- exception_date: calendar date in Asia/Bangkok (YYYY-MM-DD).
CREATE TABLE schedule_exceptions (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id      INTEGER NOT NULL REFERENCES locations (id) ON DELETE RESTRICT,
  exception_date   TEXT    NOT NULL,
  is_full_day      INTEGER NOT NULL CHECK (is_full_day IN (0, 1)),
  closure_start    TEXT,
  closure_end      TEXT,
  reason           TEXT,
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (exception_date GLOB '????-??-??'),
  CHECK (
    is_full_day = 1
    OR (
      closure_start IS NOT NULL
      AND closure_end IS NOT NULL
      AND closure_start GLOB '[0-9][0-9]:[0-9][0-9]'
      AND closure_end GLOB '[0-9][0-9]:[0-9][0-9]'
    )
  )
);

CREATE INDEX idx_schedule_exceptions_location_date ON schedule_exceptions (location_id, exception_date);
