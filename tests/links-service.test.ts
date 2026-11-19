import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { loadConfig } from '../src/config.js';
import type { DatabaseHandle } from '../src/db/connection.js';
import { openDatabase } from '../src/db/connection.js';
import { createSchema } from '../src/db/schema.js';
import { InternalError } from '../src/lib/errors.js';
import {
  createLinkService,
  type LinkService,
} from '../src/modules/links/links.service.js';
import { createLinkRepository } from '../src/modules/links/links.repository.js';

const NOW = new Date('2026-11-19T12:00:00.000Z');
const CREATED_AT = NOW.toISOString();
const CONFIG = loadConfig({ NODE_ENV: 'test', PUBLIC_BASE_URL: 'https://slaq.example' });
const ORIGINAL_URL = 'https://example.com/path';

interface CountRow {
  readonly count: number;
}

function rowCount(db: DatabaseHandle): number {
  const row = db.prepare<[], CountRow>('SELECT COUNT(*) AS count FROM links').get();
  return row?.count ?? 0;
}

describe('create-link service', () => {
  let db: DatabaseHandle;

  beforeEach(() => {
    db = openDatabase(':memory:');
    createSchema(db);
  });

  afterEach(() => {
    db.close();
  });

  function occupied(): void {
    const repo = createLinkRepository(db);
    repo.insert({
      code: 'AAAAAAA',
      originalUrl: 'https://occupied.example',
      isCustom: 0,
      createdAt: CREATED_AT,
      expiresAt: null,
    });
  }

  function serviceWith(codes: string[]): { service: LinkService; calls: () => number } {
    const repo = createLinkRepository(db);
    let calls = 0;
    const service = createLinkService({
      repo,
      clock: { now: () => NOW },
      config: CONFIG,
      generator: () => {
        calls += 1;
        return codes[calls - 1] ?? `F${String(calls).padStart(6, '0')}`;
      },
    });
    return { service, calls: () => calls };
  }

  it('uses the injected clock and generates a stored code on the first attempt', () => {
    const { service, calls } = serviceWith(['BBBBBBB']);

    const link = service.createLink({ originalUrl: ORIGINAL_URL });

    expect(link.code).toBe('BBBBBBB');
    expect(link.createdAt).toBe(CREATED_AT);
    expect(link.expiresAt).toBeNull();
    expect(link.isCustom).toBe(false);
    expect(calls()).toBe(1);
    expect(rowCount(db)).toBe(1);
  });

  it('retries after a collision and stores the second generated code', () => {
    occupied();
    const { service, calls } = serviceWith(['AAAAAAA', 'BBBBBBB']);

    const link = service.createLink({ originalUrl: ORIGINAL_URL });

    expect(link.code).toBe('BBBBBBB');
    expect(calls()).toBe(2);
    expect(rowCount(db)).toBe(2);
  });

  it('throws a generic internal error after five total attempts and writes no row', () => {
    occupied();
    const { service, calls } = serviceWith(Array.from({ length: 5 }, () => 'AAAAAAA'));

    let thrown: unknown;
    try {
      service.createLink({ originalUrl: ORIGINAL_URL });
    } catch (error: unknown) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(InternalError);
    expect((thrown as InternalError).code).toBe('INTERNAL_ERROR');
    expect(calls()).toBe(5);
    expect(rowCount(db)).toBe(1);
  });
});
