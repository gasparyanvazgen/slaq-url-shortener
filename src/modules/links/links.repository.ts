import type { DatabaseHandle } from '../../db/connection.js';
import { toSafeId } from '../../db/id.js';
import type { Link, NewLink } from './links.types.js';

/** The driver's snake_case row; this interface never escapes this module (D12). */
interface LinkRow {
  readonly id: number | bigint;
  readonly code: string;
  readonly original_url: string;
  readonly is_custom: 0 | 1;
  readonly click_count: number;
  readonly created_at: string;
  readonly expires_at: string | null;
  readonly last_clicked_at: string | null;
}

interface CodeParameter {
  readonly code: string;
}

interface IncrementParameter {
  readonly code: string;
  readonly now: string;
}

const INSERT_SQL = `
INSERT INTO links (code, original_url, is_custom, created_at, expires_at)
VALUES (@code, @originalUrl, @isCustom, @createdAt, @expiresAt)
`;

const SELECT_SQL = `
SELECT id, code, original_url, is_custom, click_count, created_at, expires_at, last_clicked_at
  FROM links
 WHERE code = @code
`;

/** One guarded statement, no transaction; the WHERE clause is the guard (D20). */
const INCREMENT_SQL = `
UPDATE links
   SET click_count = click_count + 1,
       last_clicked_at = @now
 WHERE code = @code
   AND (expires_at IS NULL OR expires_at > @now)
`;

/** A `UNIQUE(code)` conflict: a generator collision or an alias conflict (D2). */
export class UniqueCodeError extends Error {
  constructor() {
    super('Short code already exists');
    this.name = 'UniqueCodeError';
  }
}

function isUniqueConstraint(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    error.code === 'SQLITE_CONSTRAINT_UNIQUE'
  );
}

function toLink(row: LinkRow): Link {
  return {
    id: toSafeId(row.id),
    code: row.code,
    originalUrl: row.original_url,
    isCustom: row.is_custom === 1,
    clickCount: row.click_count,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    lastClickedAt: row.last_clicked_at,
  };
}

export interface LinkRepository {
  insert(input: NewLink): Link;
  findByCode(code: string): Link | undefined;
  incrementClick(code: string, nowIso: string): number;
}

/** SQL boundary: statements are prepared once and every value is bound (D1, D12). */
export function createLinkRepository(db: DatabaseHandle): LinkRepository {
  const insertStatement = db.prepare<[NewLink]>(INSERT_SQL);
  const findStatement = db.prepare<[CodeParameter], LinkRow>(SELECT_SQL);
  const incrementStatement = db.prepare<[IncrementParameter]>(INCREMENT_SQL);

  return {
    insert(input) {
      let result;
      try {
        result = insertStatement.run(input);
      } catch (error: unknown) {
        if (isUniqueConstraint(error)) {
          throw new UniqueCodeError();
        }
        throw error;
      }

      return {
        id: toSafeId(result.lastInsertRowid),
        code: input.code,
        originalUrl: input.originalUrl,
        isCustom: input.isCustom === 1,
        clickCount: 0,
        createdAt: input.createdAt,
        expiresAt: input.expiresAt,
        lastClickedAt: null,
      };
    },

    findByCode(code) {
      const row = findStatement.get({ code });
      return row === undefined ? undefined : toLink(row);
    },

    incrementClick(code, nowIso) {
      return incrementStatement.run({ code, now: nowIso }).changes;
    },
  };
}
