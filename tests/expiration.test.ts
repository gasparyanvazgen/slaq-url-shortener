import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { DatabaseHandle } from '../src/db/connection.js';
import { createLinkRepository } from '../src/modules/links/links.repository.js';
import type { CreateLinkResponse, Link } from '../src/modules/links/links.types.js';
import { createTestApp, type TestApp } from './helpers/test-app.js';

/** The eleven cases in docs/testing-strategy.md, each with a frozen/advanced clock. */
const DESTINATION = 'https://example.com/campaign';
const T0 = new Date('2026-11-19T12:00:00.000Z');

function iso(msFromT0: number): string {
  return new Date(T0.getTime() + msFromT0).toISOString();
}

function mutableClock(start: Date = T0) {
  let current = start;
  return {
    now: () => current,
    set(date: Date) {
      current = date;
    },
    advance(ms: number) {
      current = new Date(current.getTime() + ms);
    },
  };
}

interface ErrorBody {
  readonly error: { readonly code: string };
}

interface StatsBody {
  readonly code: string;
  readonly isExpired: boolean;
  readonly clickCount: number;
}

function created(response: request.Response): CreateLinkResponse {
  return response.body as CreateLinkResponse;
}

function stats(response: request.Response): StatsBody {
  return response.body as StatsBody;
}

function findLink(db: DatabaseHandle, code: string): Link | undefined {
  return createLinkRepository(db).findByCode(code);
}

function rowCount(db: DatabaseHandle): number {
  return db.prepare<[], { count: number }>('SELECT COUNT(*) AS count FROM links').get()?.count ?? 0;
}

describe('eleven expiration-boundary cases (§6)', () => {
  const contexts: TestApp[] = [];

  function appWith(clock: { now: () => Date } = { now: () => T0 }): TestApp {
    const context = createTestApp({ clock });
    contexts.push(context);
    return context;
  }

  afterEach(() => {
    for (const context of contexts.splice(0)) {
      context.close();
    }
  });

  async function create(context: TestApp, expiresAt?: string | null): Promise<string> {
    const response = await request(context.app)
      .post('/api/links')
      .send({ url: DESTINATION, ...(expiresAt === undefined ? {} : { expiresAt }) });
    expect(response.status).toBe(201);
    return created(response).code;
  }

  it('1. expiresAt one millisecond before now -> 410, count unchanged', async () => {
    const clock = mutableClock();
    const context = appWith(clock);
    const code = await create(context, iso(1));

    clock.set(new Date(T0.getTime() + 2));
    const response = await request(context.app).get(`/${code}`);

    expect(response.status).toBe(410);
    expect(findLink(context.db, code)?.clickCount).toBe(0);
    expect(findLink(context.db, code)?.lastClickedAt).toBeNull();
  });

  it('2. expiresAt exactly equal to now -> 410 (inclusive <=)', async () => {
    const clock = mutableClock();
    const context = appWith(clock);
    const code = await create(context, iso(1));

    clock.set(new Date(T0.getTime() + 1));
    const response = await request(context.app).get(`/${code}`);

    expect(response.status).toBe(410);
    expect(findLink(context.db, code)?.clickCount).toBe(0);
  });

  it('3. expiresAt one millisecond after now -> 302, count increments', async () => {
    const clock = mutableClock();
    const context = appWith(clock);
    const code = await create(context, iso(2));

    clock.set(new Date(T0.getTime() + 1));
    const response = await request(context.app).get(`/${code}`);

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(DESTINATION);
    expect(findLink(context.db, code)?.clickCount).toBe(1);
  });

  it('4. expiresAt equal to createdAt -> 400 at creation, never stored', async () => {
    const context = appWith();
    const response = await request(context.app)
      .post('/api/links')
      .send({ url: DESTINATION, expiresAt: T0.toISOString() });

    expect(response.status).toBe(400);
    expect((response.body as ErrorBody).error.code).toBe('VALIDATION_ERROR');
    expect(rowCount(context.db)).toBe(0);
  });

  it('5. expiresAt in the past at creation -> 400', async () => {
    const context = appWith();
    const response = await request(context.app)
      .post('/api/links')
      .send({ url: DESTINATION, expiresAt: iso(-1000) });

    expect(response.status).toBe(400);
    expect((response.body as ErrorBody).error.code).toBe('VALIDATION_ERROR');
    expect(rowCount(context.db)).toBe(0);
  });

  it('6. expiresAt with +02:00 offset -> stored normalized to the same instant in Z', async () => {
    const context = appWith();
    const response = await request(context.app)
      .post('/api/links')
      .send({ url: DESTINATION, expiresAt: '2026-11-20T14:00:00.000+02:00' });

    expect(response.status).toBe(201);
    expect(created(response).expiresAt).toBe('2026-11-20T12:00:00.000Z');
    expect(findLink(context.db, created(response).code)?.expiresAt).toBe(
      '2026-11-20T12:00:00.000Z',
    );
  });

  it('7. fractional seconds other than three digits -> normalized to three on output', async () => {
    const context = appWith();
    const response = await request(context.app)
      .post('/api/links')
      .send({ url: DESTINATION, expiresAt: '2026-11-20T12:00:00.1234Z' });

    expect(response.status).toBe(201);
    expect(created(response).expiresAt).toBe('2026-11-20T12:00:00.123Z');
    expect(findLink(context.db, created(response).code)?.expiresAt).toBe(
      '2026-11-20T12:00:00.123Z',
    );
  });

  it.each(['null', 'omitted'] as const)(
    '8. %s expiresAt -> never expires, even far in the future',
    async (kind) => {
      const clock = mutableClock();
      const context = appWith(clock);
      const code = await create(context, kind === 'null' ? null : undefined);
      expect(createdCodeExpiresAt(context, code)).toBeNull();

      clock.advance(10 * 365 * 24 * 60 * 60 * 1000);
      const response = await request(context.app).get(`/${code}`);

      expect(response.status).toBe(302);
      expect(findLink(context.db, code)?.clickCount).toBe(1);
    },
  );

  function createdCodeExpiresAt(context: TestApp, code: string): string | null {
    return findLink(context.db, code)?.expiresAt ?? null;
  }

  it('9. statistics for an expired link -> 200 with isExpired true and retained count', async () => {
    const clock = mutableClock();
    const context = appWith(clock);
    const code = await create(context, iso(1000));

    await request(context.app).get(`/${code}`);
    await request(context.app).get(`/${code}`);
    clock.set(new Date(T0.getTime() + 2000));
    const response = await request(context.app).get(`/api/links/${code}/stats`);

    expect(response.status).toBe(200);
    expect(stats(response).code).toBe(code);
    expect(stats(response).isExpired).toBe(true);
    expect(stats(response).clickCount).toBe(2);
    expect(rowCount(context.db)).toBe(1);
  });

  it('10. expired redirect -> 410 with no increment, even on repeated requests', async () => {
    const clock = mutableClock();
    const context = appWith(clock);
    const code = await create(context, iso(1));

    clock.set(new Date(T0.getTime() + 2));
    const first = await request(context.app).get(`/${code}`);
    const second = await request(context.app).get(`/${code}`);
    const third = await request(context.app).get(`/${code}`);

    expect([first.status, second.status, third.status]).toEqual([410, 410, 410]);
    expect(findLink(context.db, code)?.clickCount).toBe(0);
    expect(findLink(context.db, code)?.lastClickedAt).toBeNull();
  });

  it('11. an active and an expired link do not affect each other', async () => {
    const clock = mutableClock();
    const context = appWith(clock);
    const active = await create(context, null);
    const expiring = await create(context, iso(1000));

    clock.set(new Date(T0.getTime() + 2000));
    const activeFirst = await request(context.app).get(`/${active}`);
    const expiredFirst = await request(context.app).get(`/${expiring}`);
    const activeSecond = await request(context.app).get(`/${active}`);
    const expiredSecond = await request(context.app).get(`/${expiring}`);

    expect([activeFirst.status, activeSecond.status]).toEqual([302, 302]);
    expect([expiredFirst.status, expiredSecond.status]).toEqual([410, 410]);
    expect(findLink(context.db, active)?.clickCount).toBe(2);
    expect(findLink(context.db, expiring)?.clickCount).toBe(0);

    const activeStats = stats(await request(context.app).get(`/api/links/${active}/stats`));
    const expiredStats = stats(await request(context.app).get(`/api/links/${expiring}/stats`));
    expect(activeStats.isExpired).toBe(false);
    expect(expiredStats.isExpired).toBe(true);
    expect(expiredStats.clickCount).toBe(0);
  });
});

describe('expiration input validation (D15)', () => {
  let context: TestApp;

  beforeEach(() => {
    context = createTestApp();
  });

  afterEach(() => {
    context.close();
  });

  it('rejects a future but impossible calendar date with 400 and inserts nothing', async () => {
    const response = await request(context.app)
      .post('/api/links')
      .send({ url: DESTINATION, expiresAt: '2027-02-30T00:00:00Z' });

    expect(response.status).toBe(400);
    expect((response.body as ErrorBody).error.code).toBe('VALIDATION_ERROR');
    expect(rowCount(context.db)).toBe(0);
  });
});
