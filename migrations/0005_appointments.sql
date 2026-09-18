-- Booking requests (human confirmation required). Magic-link self-service, no patient accounts.

PRAGMA foreign_keys = ON;

CREATE TABLE appointments (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  slot_id              INTEGER NOT NULL REFERENCES slots (id) ON DELETE RESTRICT,
  consent_log_id       INTEGER NOT NULL REFERENCES consent_log (id) ON DELETE RESTRICT,
  patient_name         TEXT    NOT NULL,
  patient_phone        TEXT    NOT NULL,
  patient_email        TEXT,
  problem_description  TEXT    NOT NULL,
  status               TEXT    NOT NULL DEFAULT 'pending'
                       CHECK (status IN (
                         'pending',
                         'confirmed',
                         'rescheduled',
                         'cancelled_by_patient',
                         'declined_by_clinic',
                         'completed',
                         'no_show'
                       )),
  magic_link_token     TEXT    NOT NULL UNIQUE,
  admin_notes          TEXT,
  confirmed_at         TEXT,
  cancelled_at         TEXT,
  completed_at         TEXT,
  created_at           TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at           TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE UNIQUE INDEX uq_slot_active ON appointments (slot_id)
  WHERE status IN ('pending', 'confirmed');

CREATE INDEX idx_appointments_status ON appointments (status, created_at);
CREATE INDEX idx_appointments_created_at ON appointments (created_at);
CREATE INDEX idx_appointments_slot ON appointments (slot_id);

-- Appointments filtered/sorted by appointment day use the slot start instant.
CREATE INDEX idx_appointments_status_slot ON appointments (status, slot_id);
