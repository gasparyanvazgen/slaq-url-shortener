import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { LinkStatsResponse } from '../src/modules/links/links.types.js';
import { createTestApp, TEST_NOW, type TestApp } from './helpers/test-app.js';

const DESTINATION = 'https://example.com/path?q=1#frag';
const ORIGIN = 'https://slaq.example';

interface ErrorBody {
  readonly error: { readonly code: string };
}

function bodyOf(response: request.Response): LinkStatsResponse {
  return response.body as LinkStatsResponse;
}

describe('GET /api/links/:code/stats (§7)', () => {
  let context: TestApp;

  beforeEach(() => {
    context = createTestApp();
  });

  afterEach(() => {
    context.close();
  });

  async function create(alias?: string): Promise<string> {
    const response = await request(context.app)
      .post('/api/links')
      .send({ url: DESTINATION, ...(alias === undefined ? {} : { alias }) });
    expect(response.status).toBe(201);
    return (response.body as { code: string }).code;
  }

  it('returns every approved field with exact values', async () => {
    const code = await create('Stats1');

    const response = await request(context.app).get(`/api/links/${code}/stats`);

    expect(response.status).toBe(200);
    expect(bodyOf(response)).toEqual({
      code: 'Stats1',
      shortUrl: `${ORIGIN}/Stats1`,
      originalUrl: DESTINATION,
      createdAt: TEST_NOW.toISOString(),
      expiresAt: null,
      isExpired: false,
      isCustom: true,
      clickCount: 0,
      lastClickedAt: null,
    });
  });

  it('sets Cache-Control: no-store because click counts change', async () => {
    const code = await create();

    const response = await request(context.app).get(`/api/links/${code}/stats`);

    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('returns 404 NOT_FOUND for an unknown code', async () => {
    const response = await request(context.app).get('/api/links/not-there/stats');

    expect(response.status).toBe(404);
    expect((response.body as ErrorBody).error.code).toBe('NOT_FOUND');
  });

  it('reports isCustom=false for a generated code', async () => {
    const code = await create();

    expect(bodyOf(await request(context.app).get(`/api/links/${code}/stats`)).isCustom).toBe(false);
  });

  it('is read-only: repeated stats calls never change the count', async () => {
    const code = await create();

    for (let index = 0; index < 3; index += 1) {
      expect(bodyOf(await request(context.app).get(`/api/links/${code}/stats`)).clickCount).toBe(0);
    }

    await request(context.app).get(`/${code}`);

    for (let index = 0; index < 3; index += 1) {
      const body = bodyOf(await request(context.app).get(`/api/links/${code}/stats`));
      expect(body.clickCount).toBe(1);
      expect(body.lastClickedAt).toBe(TEST_NOW.toISOString());
    }
  });

  it('builds shortUrl only from PUBLIC_BASE_URL, ignoring Host headers (D17)', async () => {
    const code = await create('SafeHost');

    const response = await request(context.app)
      .get(`/api/links/${code}/stats`)
      .set('Host', 'evil.example')
      .set('X-Forwarded-Host', 'evil.example');

    expect(bodyOf(response).shortUrl).toBe(`${ORIGIN}/SafeHost`);
  });

  it('matches the code case-sensitively', async () => {
    await create('CaseAb1');

    expect((await request(context.app).get('/api/links/caseab1/stats')).status).toBe(404);
    expect((await request(context.app).get('/api/links/CaseAb1/stats')).status).toBe(200);
  });

  it('ignores unknown query parameters', async () => {
    const code = await create('Query001');

    const response = await request(context.app).get(`/api/links/${code}/stats?foo=bar&page=2`);

    expect(response.status).toBe(200);
    expect(bodyOf(response).code).toBe('Query001');
  });

  it('returns 200 with isExpired true and the retained count for an expired link', async () => {
    let now = TEST_NOW;
    const local = createTestApp({ clock: { now: () => now } });
    try {
      const expiresAt = new Date(TEST_NOW.getTime() + 1000).toISOString();
      const created = await request(local.app)
        .post('/api/links')
        .send({ url: DESTINATION, expiresAt });
      const code = (created.body as { code: string }).code;
      await request(local.app).get(`/${code}`);
      now = new Date(TEST_NOW.getTime() + 2000);

      const response = await request(local.app).get(`/api/links/${code}/stats`);

      expect(response.status).toBe(200);
      expect(bodyOf(response).isExpired).toBe(true);
      expect(bodyOf(response).clickCount).toBe(1);
      expect(bodyOf(response).expiresAt).toBe(expiresAt);
      expect(response.headers['cache-control']).toBe('no-store');
    } finally {
      local.close();
    }
  });
});
