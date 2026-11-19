import type { DatabaseHandle } from './connection.js';

/** Approved schema verbatim (D2); `IF NOT EXISTS` makes startup idempotent. */
const CREATE_LINKS_TABLE = `
CREATE TABLE IF NOT EXISTS links (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  code            TEXT    NOT NULL UNIQUE,
  original_url    TEXT    NOT NULL,
  is_custom       INTEGER NOT NULL DEFAULT 0
                          CHECK (is_custom IN (0, 1)),
  click_count     INTEGER NOT NULL DEFAULT 0
                          CHECK (click_count >= 0),
  created_at      TEXT    NOT NULL,
  expires_at      TEXT,
  last_clicked_at TEXT
)
`;

export function createSchema(db: DatabaseHandle): void {
  db.exec(CREATE_LINKS_TABLE);
}
