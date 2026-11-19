import Database from 'better-sqlite3';

/** The synchronous SQLite handle shared by the persistence modules (D12). */
export type DatabaseHandle = Database.Database;

/**
 * Open a database and apply the approved pragmas (docs/database-design.md).
 * `journal_mode = WAL` only has an effect for file databases; a `:memory:`
 * database is private to its connection and always reports `memory`.
 */
export function openDatabase(filename: string): DatabaseHandle {
  const db = new Database(filename);

  if (filename !== ':memory:') {
    db.pragma('journal_mode = WAL');
  }
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.pragma('synchronous = NORMAL');

  return db;
}
