import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DatabaseHandle } from '../src/db/connection.js';
import { LinkExpiredError } from '../src/lib/errors.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { notFoundHandler } from '../src/middleware/not-found.js';
import type { Link } from '../src/modules/links/links.types.js';
import { createLinkRepository, type LinkRepository } from '../src/modules/links/links.repository.js';
import { createLinkService } from '../src/modules/links/links.service.js';
import {
  createTestApp,
  TEST_CONFIG,
  TEST_NOW,
  type TestApp,
} from './helpers/test-app.js';

const DESTINATION = 'https://example.com/a/b?x=1&lang=en#section-2';

interface ErrorBody {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
}

function errorOf(response: request.Response): ErrorBody {
  return response.body as ErrorBody;
}

function rowCount(db: DatabaseHandle): number {
  const row = db.prepare<[], { count: number }>('SELECT COUNT(*) AS count FROM links').get();
  return row?.count ?? 0;
}

/**
 * Tests for acceptance criteria in docs/requirements.md that had no executable
 * assertion in the original suites. Production code is unchanged.
 */
describe('requirements acceptance-coverage gaps', () => {
  let context: TestApp;

  beforeEach(() => {
    context = createTestApp();
  });

  afterEach(() => {
    context.close();
    vi.restoreAllMocks();
  });

  async function create(): Promise<{ code: string; createdAt: string; shortUrl: string }> {
    const response = await request(context.app).post('/api/links').send({ url: DESTINATION });
    expect(response.status).toBe(201);
    const body = response.body as {
      code: string;
      createdAt: string;
      shortUrl: string;
    };
    return { code: body.code, createdAt: body.createdAt, shortUrl: body.shortUrl };
  }

  it('AC-01.5 returns the created metadata through the FR-06 statistics route', async () => {
    const created = await create();

    const response = await request(context.app).get(`/api/links/${created.code}/stats`);
    const stats = response.body as {
      code: string;
      shortUrl: string;
      originalUrl: string;
      createdAt: string;
      expiresAt: string | null;
      isCustom: boolean;
      clickCount: number;
      lastClickedAt: string | null;
    };

    expect(response.status).toBe(200);
    expect(stats.code).toBe(created.code);
    expect(stats.shortUrl).toBe(created.shortUrl);
    expect(stats.originalUrl).toBe(DESTINATION);
    expect(stats.createdAt).toBe(created.createdAt);
    expect(stats.expiresAt).toBeNull();
    expect(stats.isCustom).toBe(false);
    expect(stats.clickCount).toBe(0);
    expect(stats.lastClickedAt).toBeNull();
  });

  it('AC-03.2 preserves the query string and fragment byte-for-byte in Location', async () => {
    const created = await create();

    const response = await request(context.app).get(`/${created.code}`);

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(DESTINATION);
    expect(response.headers.location).toBe('https://example.com/a/b?x=1&lang=en#section-2');
  });

  it('AC-03.3 returns a 404 envelope for an unknown code with no stack internals', async () => {
    const response = await request(context.app).get('/unknown-code');
    const raw = JSON.stringify(response.body as unknown);

    expect(response.status).toBe(404);
    expect(errorOf(response).error.code).toBe('NOT_FOUND');
    expect(typeof errorOf(response).error.message).toBe('string');
    expect(raw).not.toContain('stack');
    expect(raw).not.toContain('Error:');
    expect(raw).not.toContain('/src/');
  });

  it('AC-04.2 sets lastClickedAt to the last of three redirect instants', async () => {
    let current = TEST_NOW;
    const local = createTestApp({ clock: { now: () => current } });
    try {
      const createdResponse = await request(local.app)
        .post('/api/links')
        .send({ url: DESTINATION });
      const code = (createdResponse.body as { code: string }).code;

      for (let offset = 1000; offset <= 3000; offset += 1000) {
        current = new Date(TEST_NOW.getTime() + offset);
        const redirect = await request(local.app).get(`/${code}`);
        expect(redirect.status).toBe(302);
      }

      const link = createLinkRepository(local.db).findByCode(code);
      expect(link?.clickCount).toBe(3);
      expect(link?.lastClickedAt).toBe(new Date(TEST_NOW.getTime() + 3000).toISOString());
    } finally {
      local.close();
    }
  });

  it('AC-04.5 counts every one of twenty parallel redirects exactly once', async () => {
    const created = await create();

    const responses = await Promise.all(
      Array.from({ length: 20 }, () => request(context.app).get(`/${created.code}`)),
    );

    expect(responses.every((response) => response.status === 302)).toBe(true);
    expect(createLinkRepository(context.db).findByCode(created.code)?.clickCount).toBe(20);
  });

  it('AC-04.6 never redirects when the guarded increment commits no change', () => {
    const activeLink: Link = {
      id: 1,
      code: 'guard01',
      originalUrl: DESTINATION,
      isCustom: false,
      clickCount: 0,
      createdAt: TEST_NOW.toISOString(),
      expiresAt: null,
      lastClickedAt: null,
    };
    const repo: LinkRepository = {
      insert: () => {
        throw new Error('insert is not used by this test');
      },
      findByCode: () => activeLink,
      incrementClick: () => 0,
    };
    const service = createLinkService({
      repo,
      clock: { now: () => TEST_NOW },
      config: TEST_CONFIG,
    });

    expect(() => service.redirect('guard01', true)).toThrow(LinkExpiredError);
    expect(() => service.redirect('guard01', false)).not.toThrow();
  });

  it.each([
    ['non-string alias', { alias: 42 }],
    ['numeric expiresAt', { expiresAt: 42 }],
    ['boolean expiresAt', { expiresAt: true }],
  ])('AC-07.2 rejects a %s with VALIDATION_ERROR and no row', async (_label, field) => {
    const response = await request(context.app)
      .post('/api/links')
      .send({ url: DESTINATION, ...field });

    expect(response.status).toBe(400);
    expect(errorOf(response).error.code).toBe('VALIDATION_ERROR');
    expect(rowCount(context.db)).toBe(0);
  });

  it('AC-08.2 omits details from a 500 response', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const app = express();
    app.get('/boom', () => {
      throw new Error('internal secret at /srv/app');
    });
    app.use(notFoundHandler);
    app.use(errorHandler);

    const response = await request(app).get('/boom');

    expect(response.status).toBe(500);
    expect(errorOf(response).error.code).toBe('INTERNAL_ERROR');
    expect(errorOf(response).error.details).toBeUndefined();
  });

  it('AC-08.4 and AC-09.1 return 404 in JSON for unmatched routes and DELETE', async () => {
    const created = await create();

    const unmatched = await request(context.app).get('/unknown/route');
    const deletion = await request(context.app).delete(`/api/links/${created.code}`);

    for (const response of [unmatched, deletion]) {
      expect(response.status).toBe(404);
      expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
      expect(errorOf(response).error.code).toBe('NOT_FOUND');
      expect(errorOf(response).error.details).toBeUndefined();
    }
  });

  it('AC-09.2 has no deletion column in the links schema', () => {
    const columns = context.db
      .prepare<[], { name: string }>('PRAGMA table_info(links)')
      .all()
      .map((column) => column.name);

    expect(columns).toEqual([
      'id',
      'code',
      'original_url',
      'is_custom',
      'click_count',
      'created_at',
      'expires_at',
      'last_clicked_at',
    ]);
    expect(columns).not.toContain('deleted_at');
    expect(columns).not.toContain('is_deleted');
  });

  it('AC-09.3 leaves redirect and statistics working after a rejected DELETE', async () => {
    const created = await create();

    const deletion = await request(context.app).delete(`/api/links/${created.code}`);
    expect(deletion.status).toBe(404);

    const redirect = await request(context.app).get(`/${created.code}`);
    expect(redirect.status).toBe(302);
    expect(redirect.headers.location).toBe(DESTINATION);

    const stats = await request(context.app).get(`/api/links/${created.code}/stats`);
    expect(stats.status).toBe(200);
    const body = stats.body as { code: string; clickCount: number };
    expect(body.code).toBe(created.code);
    expect(body.clickCount).toBe(1);
  });
});
