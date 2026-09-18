-- Contact form, newsletter double opt-in, and future testimonials.

PRAGMA foreign_keys = ON;

CREATE TABLE contact_messages (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  consent_log_id  INTEGER NOT NULL REFERENCES consent_log (id) ON DELETE RESTRICT,
  sender_name     TEXT    NOT NULL,
  sender_email    TEXT    NOT NULL,
  sender_phone    TEXT,
  message_body    TEXT    NOT NULL,
  is_handled      INTEGER NOT NULL DEFAULT 0 CHECK (is_handled IN (0, 1)),
  admin_notes     TEXT,
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  handled_at      TEXT
);

CREATE INDEX idx_contact_messages_handled ON contact_messages (is_handled, created_at);
CREATE INDEX idx_contact_messages_created_at ON contact_messages (created_at);

CREATE TABLE newsletter_subs (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  email              TEXT    NOT NULL UNIQUE,
  status             TEXT    NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'confirmed', 'unsubscribed')),
  confirm_token      TEXT    NOT NULL UNIQUE,
  unsubscribe_token  TEXT    NOT NULL UNIQUE,
  consent_log_id     INTEGER NOT NULL REFERENCES consent_log (id) ON DELETE RESTRICT,
  created_at         TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  confirmed_at       TEXT,
  unsubscribed_at    TEXT
);

CREATE INDEX idx_newsletter_subs_status ON newsletter_subs (status, created_at);

CREATE TABLE testimonials (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  consent_log_id   INTEGER NOT NULL REFERENCES consent_log (id) ON DELETE RESTRICT,
  display_name     TEXT,
  story_body       TEXT    NOT NULL,
  is_published     INTEGER NOT NULL DEFAULT 0 CHECK (is_published IN (0, 1)),
  display_order    INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  published_at     TEXT
);

CREATE INDEX idx_testimonials_published_order ON testimonials (is_published, display_order);
