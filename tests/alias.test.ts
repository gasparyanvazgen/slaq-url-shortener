import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { DatabaseHandle } from '../src/db/connection.js';
import type { CreateLinkResponse, Link } from '../src/modules/links/links.types.js';
import { createLinkRepository } from '../src/modules/links/links.repository.js';
import { createTestApp, type TestApp } from './helpers/test-app.js';

const URL = 'https://example.com/path';

interface ErrorBody {
  readonly error: {
    readonly code: string;
    readonly message: string;
  };
}

function rowCount(db: DatabaseHandle): number {
  const row = db.prepare<[], { count: number }>('SELECT COUNT(*) AS count FROM links').get();
  return row?.count ?? 0;
}

function bodyOf(response: request.Response): CreateLinkResponse {
  return response.body as CreateLinkResponse;
}

function errorOf(response: request.Response): ErrorBody {
  return response.body as ErrorBody;
}

describe('custom aliases (§5)', () => {
  let context: TestApp;

  beforeEach(() => {
    context = createTestApp();
  });

  afterEach(() => {
    context.close();
  });

  it('AC-02.1 creates a custom alias with the exact code and isCustom=true', async () => {
    const response = await request(context.app)
      .post('/api/links')
      .send({ url: URL, alias: 'my-link' });
    const body = bodyOf(response);

    expect(response.status).toBe(201);
    expect(body.code).toBe('my-link');
    expect(body.isCustom).toBe(true);
    expect(body.shortUrl).toBe(`${context.config.publicBaseUrl}/my-link`);
    expect(response.headers.location).toBe(body.shortUrl);
    expect(rowCount(context.db)).toBe(1);
  });

  it.each([
    ['two characters', 'ab'],
    ['33 characters', 'a'.repeat(33)],
    ['dot', 'my.link'],
    ['space', 'my link'],
    ['empty', ''],
    ['surrounding whitespace', ' MyLink '],
  ])('AC-02.2 rejects %s with VALIDATION_ERROR and inserts nothing', async (_label, alias) => {
    const response = await request(context.app).post('/api/links').send({ url: URL, alias });

    expect(response.status).toBe(400);
    expect(errorOf(response).error.code).toBe('VALIDATION_ERROR');
    expect(rowCount(context.db)).toBe(0);
  });

  it.each(['api', 'health', 'API', 'Api', 'HEALTH'])(
    'AC-02.3 rejects reserved alias %s case-insensitively',
    async (alias) => {
      const response = await request(context.app).post('/api/links').send({ url: URL, alias });

      expect(response.status).toBe(400);
      expect(errorOf(response).error.code).toBe('RESERVED_ALIAS');
      expect(rowCount(context.db)).toBe(0);
    },
  );

  it('AC-02.4 returns 409 ALIAS_TAKEN for a duplicate alias without inserting a row', async () => {
    const first = await request(context.app)
      .post('/api/links')
      .send({ url: URL, alias: 'taken1' });
    expect(first.status).toBe(201);

    const duplicate = await request(context.app)
      .post('/api/links')
      .send({ url: 'https://other.example', alias: 'taken1' });

    expect(duplicate.status).toBe(409);
    expect(errorOf(duplicate).error.code).toBe('ALIAS_TAKEN');
    expect(rowCount(context.db)).toBe(1);
  });

  it('AC-02.5 rejects an alias equal to an existing generated code', async () => {
    const generated = await request(context.app).post('/api/links').send({ url: URL });
    const code = bodyOf(generated).code;
    expect(code).toMatch(/^[A-Za-z0-9]{7}$/);

    const collision = await request(context.app)
      .post('/api/links')
      .send({ url: 'https://other.example', alias: code });

    expect(collision.status).toBe(409);
    expect(errorOf(collision).error.code).toBe('ALIAS_TAKEN');
    expect(rowCount(context.db)).toBe(1);
  });

  it('AC-02.6 stores MyLink and mylink as two independent codes', async () => {
    const upper = await request(context.app)
      .post('/api/links')
      .send({ url: URL, alias: 'MyLink' });
    const lower = await request(context.app)
      .post('/api/links')
      .send({ url: URL, alias: 'mylink' });

    expect(upper.status).toBe(201);
    expect(lower.status).toBe(201);
    expect(bodyOf(upper).code).toBe('MyLink');
    expect(bodyOf(lower).code).toBe('mylink');

    const repo = createLinkRepository(context.db);
    const upperRow: Link | undefined = repo.findByCode('MyLink');
    const lowerRow: Link | undefined = repo.findByCode('mylink');
    expect(upperRow?.code).toBe('MyLink');
    expect(lowerRow?.code).toBe('mylink');
    expect(rowCount(context.db)).toBe(2);
  });

  it('AC-02.7 produces one 201 and one 409 for two simultaneous same-alias creates', async () => {
    const payload = { url: URL, alias: 'race123' };

    const [first, second] = await Promise.all([
      request(context.app).post('/api/links').send(payload),
      request(context.app).post('/api/links').send(payload),
    ]);
    const statuses = [first.status, second.status].sort();

    expect(statuses).toEqual([201, 409]);
    expect(rowCount(context.db)).toBe(1);
    const failures = [first, second].filter((response) => response.status === 409);
    expect(errorOf(failures[0] as request.Response).error.code).toBe('ALIAS_TAKEN');
  });
});
