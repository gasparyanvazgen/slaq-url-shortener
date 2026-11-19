import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { DatabaseHandle } from '../src/db/connection.js';
import { createLinkRepository } from '../src/modules/links/links.repository.js';
import type { CreateLinkResponse, Link } from '../src/modules/links/links.types.js';
import { createTestApp, type TestApp } from './helpers/test-app.js';

const DESTINATION = 'https://example.com/very/long';
const PAST = '2026-11-19T11:59:59.999Z';
const NOW = '2026-11-19T12:00:00.000Z';

interface ErrorBody {
  readonly error: {
    readonly code: string;
    readonly message: string;
  };
}

function bodyOf(response: request.Response): CreateLinkResponse {
  return response.body as CreateLinkResponse;
}

function errorOf(response: request.Response): ErrorBody {
  return response.body as ErrorBody;
}

function findLink(db: DatabaseHandle, code: string): Link | undefined {
  return createLinkRepository(db).findByCode(code);
}

describe('redirect and click tracking (§4)', () => {
  let context: TestApp;

  beforeEach(() => {
    context = createTestApp();
  });

  afterEach(() => {
    context.close();
  });

  async function createDestination(): Promise<string> {
    const response = await request(context.app).post('/api/links').send({ url: DESTINATION });
    expect(response.status).toBe(201);
    return bodyOf(response).code;
  }

  it('GET /:code returns 302 with the exact stored Location and increments once', async () => {
    const code = await createDestination();

    const response = await request(context.app).get(`/${code}`);

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(DESTINATION);

    const link = findLink(context.db, code);
    expect(link?.clickCount).toBe(1);
    expect(link?.lastClickedAt).toBe(NOW);
  });

  it('repeated successful GET redirects each increment the count (D4)', async () => {
    const code = await createDestination();

    await request(context.app).get(`/${code}`);
    await request(context.app).get(`/${code}`);
    await request(context.app).get(`/${code}`);

    expect(findLink(context.db, code)?.clickCount).toBe(3);
  });

  it('an unknown code returns 404 NOT_FOUND', async () => {
    const response = await request(context.app).get('/does-not-exist');

    expect(response.status).toBe(404);
    expect(errorOf(response).error.code).toBe('NOT_FOUND');
  });

  it('HEAD /:code mirrors status and Location without incrementing (D20)', async () => {
    const code = await createDestination();

    const head = await request(context.app).head(`/${code}`);

    expect(head.status).toBe(302);
    expect(head.headers.location).toBe(DESTINATION);
    const link = findLink(context.db, code);
    expect(link?.clickCount).toBe(0);
    expect(link?.lastClickedAt).toBeNull();
  });

  it('HEAD of an expired link returns 410 without incrementing', async () => {
    const repo = createLinkRepository(context.db);
    repo.insert({
      code: 'expired1',
      originalUrl: DESTINATION,
      isCustom: 0,
      createdAt: PAST,
      expiresAt: PAST,
    });

    const head = await request(context.app).head('/expired1');

    expect(head.status).toBe(410);
    expect(findLink(context.db, 'expired1')?.clickCount).toBe(0);
  });

  it('GET of an expired link returns 410 LINK_EXPIRED with no increment', async () => {
    const repo = createLinkRepository(context.db);
    repo.insert({
      code: 'expired2',
      originalUrl: DESTINATION,
      isCustom: 0,
      createdAt: PAST,
      expiresAt: PAST,
    });

    const response = await request(context.app).get('/expired2');

    expect(response.status).toBe(410);
    expect(errorOf(response).error.code).toBe('LINK_EXPIRED');
    expect(findLink(context.db, 'expired2')?.clickCount).toBe(0);
    expect(findLink(context.db, 'expired2')?.lastClickedAt).toBeNull();
  });

  it('matches codes case-sensitively', async () => {
    await request(context.app)
      .post('/api/links')
      .send({ url: DESTINATION, alias: 'AbCdEf1' });

    const wrongCase = await request(context.app).get('/abcdef1');
    const exact = await request(context.app).get('/AbCdEf1');

    expect(wrongCase.status).toBe(404);
    expect(exact.status).toBe(302);
  });

  it('does not let /:code shadow the static /health and /api routes (D3)', async () => {
    const health = await request(context.app).get('/health');
    const created = await request(context.app)
      .post('/api/links')
      .send({ url: DESTINATION });

    expect(health.status).toBe(200);
    expect(created.status).toBe(201);
  });
});
