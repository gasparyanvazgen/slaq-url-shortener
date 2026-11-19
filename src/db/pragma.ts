import type { DatabaseHandle } from './connection.js';

/**
 * Values returned by the pragmas the project reads. `db.pragma()` is typed
 * `unknown`, so the single documented cast lives here, keyed by name (D12).
 */
export interface PragmaMap {
  readonly foreign_keys: number;
  readonly busy_timeout: number;
  readonly synchronous: number;
  readonly journal_mode: string;
}

/** Read a pragma as a scalar rather than the driver's array-of-objects form. */
export function pragmaValue<K extends keyof PragmaMap>(
  db: DatabaseHandle,
  name: K,
): PragmaMap[K] {
  const value: unknown = db.pragma(name, { simple: true });
  return value as PragmaMap[K];
}
