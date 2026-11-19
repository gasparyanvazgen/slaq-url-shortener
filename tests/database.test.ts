import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { openDatabase, type DatabaseHandle } from '../src/db/connection.js';
import { toSafeId } from '../src/db/id.js';
import { pragmaValue } from '../src/db/pragma.js';
import { createSchema } from '../src/db/schema.js';

interface InsertRow {
  code: string;
  originalUrl: string;
  isCustom: number;
  clickCount: number;
  createdAt: string;
}

const INSERT_SQL = `
INSERT INTO links (code, original_url, is_custom, click_count, created_at)
VALUES (@code, @originalUrl, @isCustom, @clickCount, @createdAt)
`;
const CREATED_AT = '2026-11-19T12:00:00.000Z';

/** Insert a row with valid defaults, overriding only what a case needs. */
function addRow(db: DatabaseHandle, overrides: Partial<InsertRow> = {}): void {
  const row: InsertRow = {
    code: 'abc1234',
    originalUrl: 'https://example.com',
    isCustom: 0,
    clickCount: 0,
    createdAt: CREATED_AT,
    ...overrides,
  };
  db.prepare<[InsertRow]>(INSERT_SQL).run(row);
}

/** Read a driver error's SQLite code without using `any`. */
function sqliteCodeOf(attempt: () => unknown): string {
  try {
    attempt();
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && typeof error.code === 'string') {
      return error.code;
    }
    throw error;
  }
  throw new Error('Expected the insert to fail');
}

describe('database setup on an isolated :memory: database', () => {
  let db: DatabaseHandle;

  beforeEach(() => {
    db = openDatabase(':memory:');
    createSchema(db);
  });

  afterEach(() => {
    db.close();
  });

  it('applies the approved pragmas', () => {
    expect(pragmaValue(db, 'foreign_keys')).toBe(1);
    expect(pragmaValue(db, 'busy_timeout')).toBe(5000);
    expect(pragmaValue(db, 'synchronous')).toBe(1);
  });

  it('creates the schema idempotently without losing rows', () => {
    addRow(db, { code: 'keep123' });

    expect(() => createSchema(db)).not.toThrow();

    const count = db.prepare<[], { count: number }>('SELECT COUNT(*) AS count FROM links').get();
    expect(count?.count).toBe(1);
  });

  it('enforces UNIQUE(code)', () => {
    addRow(db, { code: 'dupcode' });

    expect(sqliteCodeOf(() => addRow(db, { code: 'dupcode' }))).toBe(
      'SQLITE_CONSTRAINT_UNIQUE',
    );
  });

  it('rejects a negative click_count with the approved CHECK', () => {
    expect(sqliteCodeOf(() => addRow(db, { code: 'neg1234', clickCount: -1 }))).toBe(
      'SQLITE_CONSTRAINT_CHECK',
    );
  });

  it('rejects an is_custom value outside (0, 1) with the approved CHECK', () => {
    expect(sqliteCodeOf(() => addRow(db, { code: 'bad1234', isCustom: 2 }))).toBe(
      'SQLITE_CONSTRAINT_CHECK',
    );
  });

  it('accepts both approved is_custom values and leaves other fields unconstrained', () => {
    expect(() => addRow(db, { code: 'zero000', isCustom: 0 })).not.toThrow();
    expect(() =>
      addRow(db, { code: 'one0001', isCustom: 1, originalUrl: '' }),
    ).not.toThrow();
  });
});

describe('toSafeId', () => {
  it('normalizes number and bigint ids', () => {
    expect(toSafeId(7)).toBe(7);
    expect(toSafeId(7n)).toBe(7);
    expect(toSafeId(BigInt(Number.MAX_SAFE_INTEGER))).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('rejects unsafe integers', () => {
    expect(() => toSafeId(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
    expect(() => toSafeId(BigInt(Number.MAX_SAFE_INTEGER) + 1n)).toThrow(RangeError);
    expect(() => toSafeId(Number.NaN)).toThrow(RangeError);
  });
});
