-- Admin-published news and general articles (not clinical condition pages).

PRAGMA foreign_keys = ON;

CREATE TABLE posts (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  translation_key  TEXT    NOT NULL,
  language         TEXT    NOT NULL CHECK (language IN ('th', 'en')),
  slug             TEXT    NOT NULL,
  status           TEXT    NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft', 'scheduled', 'published')),
  published_at     TEXT,
  author_id        INTEGER REFERENCES admin_users (id) ON DELETE SET NULL,
  title            TEXT    NOT NULL,
  excerpt          TEXT,
  body_markdown    TEXT    NOT NULL,
  cover_image_key  TEXT,
  seo_title        TEXT,
  seo_description  TEXT,
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (language, slug)
);

CREATE INDEX idx_posts_status_published ON posts (status, published_at DESC);
CREATE INDEX idx_posts_translation_key ON posts (translation_key, language);
CREATE INDEX idx_posts_author ON posts (author_id);

CREATE TABLE post_media (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id       INTEGER REFERENCES posts (id) ON DELETE SET NULL,
  r2_object_key TEXT    NOT NULL UNIQUE,
  alt_text      TEXT    NOT NULL CHECK (trim(alt_text) != ''),
  width_px      INTEGER CHECK (width_px IS NULL OR width_px > 0),
  height_px     INTEGER CHECK (height_px IS NULL OR height_px > 0),
  content_type  TEXT    NOT NULL,
  byte_size     INTEGER NOT NULL CHECK (byte_size > 0),
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_post_media_post ON post_media (post_id);
