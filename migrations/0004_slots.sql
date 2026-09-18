-- Materialised bookable intervals (cron-generated, 8 weeks ahead).

PRAGMA foreign_keys = ON;

-- starts_at / ends_at: UTC instants, TEXT ISO 8601 with Z suffix (e.g. 2026-09-18T10:00:00.000Z).
CREATE TABLE slots (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id INTEGER NOT NULL REFERENCES locations (id) ON DELETE RESTRICT,
  starts_at   TEXT    NOT NULL,
  ends_at     TEXT    NOT NULL,
  status      TEXT    NOT NULL DEFAULT 'available'
              CHECK (status IN ('available', 'unavailable', 'booked')),
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (starts_at GLOB '????-??-??T??:??:??*Z'),
  CHECK (ends_at GLOB '????-??-??T??:??:??*Z'),
  CHECK (ends_at > starts_at)
);

CREATE INDEX idx_slots_location_starts ON slots (location_id, starts_at);
CREATE INDEX idx_slots_location_status_starts ON slots (location_id, status, starts_at);
CREATE INDEX idx_slots_status_starts ON slots (status, starts_at);
