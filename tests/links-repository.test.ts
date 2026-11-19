import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { DatabaseHandle } from '../src/db/connection.js';
import { openDatabase } from '../src/db/connection.js';
import { createSchema } from '../src/db/schema.js';
import {
  createLinkRepository,
  UniqueCodeError,
  type LinkRepository,
} from '../src/modules/links/links.repository.js';

const CREATED_AT = '2026-11-19T12:00:00.000Z';

interface CountRow {
  readonly count: number;
}

function rowCount(db: DatabaseHandle): number {
  const row = db.prepare<[], CountRow>('SELECT COUNT(*) AS count FROM links').get();
  return row?.count ?? 0;
}

describe('link repository', () => {
  let db: DatabaseHandle;
  let repo: LinkRepository;

  beforeEach(() => {
    db = openDatabase(':memory:');
    createSchema(db);
    repo = createLinkRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  it('inserts and returns the domain object with canonical values', () => {
    const link = repo.insert({
      code: 'aB3xY9z',
      originalUrl: 'https://example.com/path?q=1#frag',
      isCustom: 0,
      createdAt: CREATED_AT,
      expiresAt: null,
    });

    expect(link).toEqual({
      id: 1,
      code: 'aB3xY9z',
      originalUrl: 'https://example.com/path?q=1#frag',
      isCustom: false,
      clickCount: 0,
      createdAt: CREATED_AT,
      expiresAt: null,
      lastClickedAt: null,
    });
  });

  it('stores the exact supplied string and maps is_custom both ways', () => {
    const originalUrl = 'HTTPS://Example.COM/Path?Q=V#F';
    const generated = repo.insert({
      code: 'gen0001',
      originalUrl,
      isCustom: 0,
      createdAt: CREATED_AT,
      expiresAt: null,
    });
    const custom = repo.insert({
      code: 'cus0001',
      originalUrl,
      isCustom: 1,
      createdAt: CREATED_AT,
      expiresAt: '2026-12-31T00:00:00.000Z',
    });

    expect(generated.isCustom).toBe(false);
    expect(custom.isCustom).toBe(true);
    expect(custom.expiresAt).toBe('2026-12-31T00:00:00.000Z');
    expect(repo.findByCode('gen0001')?.originalUrl).toBe(originalUrl);
    expect(repo.findByCode('cus0001')?.originalUrl).toBe(originalUrl);
  });

  it('translates only a UNIQUE violation into UniqueCodeError and writes nothing', () => {
    const input = {
      code: 'dup0001',
      originalUrl: 'https://example.com',
      isCustom: 0 as const,
      createdAt: CREATED_AT,
      expiresAt: null,
    };
    repo.insert(input);

    expect(() => repo.insert(input)).toThrow(UniqueCodeError);
    expect(rowCount(db)).toBe(1);
  });

  it('finds codes case-sensitively and returns undefined for an unknown code', () => {
    const link = repo.insert({
      code: 'MyLink1',
      originalUrl: 'https://example.com',
      isCustom: 0,
      createdAt: CREATED_AT,
      expiresAt: null,
    });

    expect(repo.findByCode('MyLink1')).toEqual(link);
    expect(repo.findByCode('mylink1')).toBeUndefined();
    expect(repo.findByCode('missing')).toBeUndefined();
  });

  it('binds an injection-shaped code as a value', () => {
    const attack = "x' OR 1=1 --";

    expect(repo.findByCode(attack)).toBeUndefined();
    expect(rowCount(db)).toBe(0);
  });
});
