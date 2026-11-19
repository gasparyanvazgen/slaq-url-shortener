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

  describe('incrementClick (D20)', () => {
    const NOW = '2026-11-19T12:00:00.000Z';
    const LATER = '2026-11-19T12:00:01.000Z';

    function insertActive(code: string, expiresAt: string | null = null) {
      return repo.insert({
        code,
        originalUrl: 'https://example.com',
        isCustom: 0,
        createdAt: CREATED_AT,
        expiresAt,
      });
    }

    it('returns 1 on an active row and records the bound instant', () => {
      insertActive('click01');

      expect(repo.incrementClick('click01', NOW)).toBe(1);

      const link = repo.findByCode('click01');
      expect(link?.clickCount).toBe(1);
      expect(link?.lastClickedAt).toBe(NOW);
    });

    it('returns 0 for an expired row and preserves count and lastClickedAt', () => {
      const link = insertActive('click02', NOW);
      repo.incrementClick('click02', CREATED_AT);
      const before = repo.findByCode('click02');

      expect(repo.incrementClick('click02', NOW)).toBe(0);

      const after = repo.findByCode('click02');
      expect(after?.clickCount).toBe(before?.clickCount);
      expect(after?.lastClickedAt).toBe(before?.lastClickedAt);
      expect(link.expiresAt).toBe(NOW);
    });

    it('returns 0 for an unknown code and writes nothing', () => {
      expect(repo.incrementClick('missing', NOW)).toBe(0);
      expect(rowCount(db)).toBe(0);
    });

    it('counts fifty sequential increments and keeps the last bound instant', () => {
      insertActive('click03');

      for (let index = 0; index < 50; index += 1) {
        expect(repo.incrementClick('click03', NOW)).toBe(1);
      }
      expect(repo.incrementClick('click03', LATER)).toBe(1);

      const link = repo.findByCode('click03');
      expect(link?.clickCount).toBe(51);
      expect(link?.lastClickedAt).toBe(LATER);
    });
  });
});
