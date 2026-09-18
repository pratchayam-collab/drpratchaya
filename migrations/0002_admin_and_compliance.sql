-- Admin accounts, audit trail, and patient consent versioning (PDPA).

PRAGMA foreign_keys = ON;

CREATE TABLE admin_users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  email           TEXT    NOT NULL UNIQUE,
  password_hash   TEXT    NOT NULL,
  pbkdf2_iterations INTEGER NOT NULL CHECK (pbkdf2_iterations >= 100000),
  pbkdf2_salt     TEXT    NOT NULL,
  totp_secret     TEXT,
  is_active       INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  last_login_at   TEXT,
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_admin_users_active ON admin_users (is_active) WHERE is_active = 1;

CREATE TABLE consent_log (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  consent_version  TEXT    NOT NULL,
  consented_at     TEXT    NOT NULL,
  ip_address       TEXT,
  consent_scope    TEXT    NOT NULL,
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_consent_log_version ON consent_log (consent_version);
CREATE INDEX idx_consent_log_consented_at ON consent_log (consented_at);

CREATE TABLE audit_log (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_user_id   INTEGER REFERENCES admin_users (id) ON DELETE SET NULL,
  action          TEXT    NOT NULL,
  entity_type     TEXT    NOT NULL,
  entity_id       TEXT    NOT NULL,
  before_json     TEXT,
  after_json      TEXT,
  ip_address      TEXT,
  user_agent      TEXT,
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_audit_log_admin_user ON audit_log (admin_user_id, created_at);
CREATE INDEX idx_audit_log_entity ON audit_log (entity_type, entity_id, created_at);
CREATE INDEX idx_audit_log_created_at ON audit_log (created_at);
