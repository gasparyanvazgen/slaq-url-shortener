import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { DatabaseHandle } from '../src/db/connection.js';
import type { CreateLinkResponse } from '../src/modules/links/links.types.js';
import { createLinkRepository } from '../src/modules/links/links.repository.js';
import { createTestApp, type TestApp } from './helpers/test-app.js';

const VALID_URL = 'https://example.com/path?q=1#frag';

interface CountRow {
  readonly count: number;
}

interface ErrorBody {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: readonly { readonly path: string; readonly message: string }[];
  };
}

function bodyOf(response: request.Response): CreateLinkResponse {
  return response.body as CreateLinkResponse;
}

function errorOf(response: request.Response): ErrorBody {
  return response.body as ErrorBody;
}

function rowCount(db: DatabaseHandle): number {
  const row = db.prepare<[], CountRow>('SELECT COUNT(*) AS count FROM links').get();
  return row?.count ?? 0;
}

function urlOfLength(length: number): string {
  const prefix = 'https://example.com/';
  return prefix + 'a'.repeat(length - prefix.length);
}

describe('POST /api/links', () => {
  let context: TestApp;

  beforeEach(() => {
    context = createTestApp();
  });

  afterEach(() => {
    context.close();
  });

  it('creates a link with the approved body, Location, and 201 status', async () => {
    const response = await request(context.app)
      .post('/api/links')
      .send({ url: `  ${VALID_URL}  ` });
    const body = bodyOf(response);

    expect(response.status).toBe(201);
    expect(response.headers.location).toBe(body.shortUrl);
    expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
    expect(Object.keys(body).sort()).toEqual(
      ['code', 'createdAt', 'expiresAt', 'isCustom', 'originalUrl', 'shortUrl'].sort(),
    );
    expect(body.code).toMatch(/^[A-Za-z0-9]{7}$/);
    expect(body.shortUrl).toBe(`${context.config.publicBaseUrl}/${body.code}`);
    expect(body.originalUrl).toBe(VALID_URL);
    expect(body.createdAt).toBe('2026-11-19T12:00:00.000Z');
    expect(body.expiresAt).toBeNull();
    expect(body.isCustom).toBe(false);
    expect(rowCount(context.db)).toBe(1);
  });

  it('stores exactly the metadata returned in the response', async () => {
    const response = await request(context.app).post('/api/links').send({ url: VALID_URL });
    const body = bodyOf(response);
    const stored = createLinkRepository(context.db).findByCode(body.code);

    expect(stored).toEqual({
      id: 1,
      code: body.code,
      originalUrl: body.originalUrl,
      isCustom: false,
      clickCount: 0,
      createdAt: body.createdAt,
      expiresAt: null,
      lastClickedAt: null,
    });
  });

  it('accepts a 2048-character URL after trimming', async () => {
    const url = urlOfLength(2048);

    const response = await request(context.app)
      .post('/api/links')
      .send({ url: ` ${url} ` });

    expect(response.status).toBe(201);
    expect(bodyOf(response).originalUrl).toBe(url);
  });

  it.each([
    ['2049 characters', urlOfLength(2049)],
    ['ftp scheme', 'ftp://example.com/path'],
    ['javascript scheme', 'javascript:alert(1)'],
    ['data scheme', 'data:text/plain,hello'],
    ['file scheme', 'file:///etc/passwd'],
    ['protocol-relative', '//example.com/path'],
    ['unparseable', 'not a url'],
    ['credentials', 'https://user:pass@example.com/path'],
    ['empty', ''],
    ['whitespace only', '   '],
  ])('rejects %s with VALIDATION_ERROR and inserts nothing', async (_label, url) => {
    const response = await request(context.app).post('/api/links').send({ url });

    expect(response.status).toBe(400);
    expect(errorOf(response).error.code).toBe('VALIDATION_ERROR');
    expect(rowCount(context.db)).toBe(0);
  });

  it.each([
    ['CRLF', 'https://example.com/a\r\nX-Injected: 1'],
    ['newline', 'https://example.com/a\nb'],
    ['NUL', 'https://example.com/a\u0000b'],
    ['DEL', 'https://example.com/a\u007fb'],
    ['tab', 'https://example.com/a\tb'],
  ])('rejects a destination containing a %s control character', async (_label, url) => {
    const response = await request(context.app).post('/api/links').send({ url });

    expect(response.status).toBe(400);
    expect(errorOf(response).error.code).toBe('VALIDATION_ERROR');
    expect(errorOf(response).error.details).toContainEqual({
      path: 'url',
      message: 'url must be a valid http or https URL',
    });
    expect(rowCount(context.db)).toBe(0);
  });

  // Alias and expiry validation belong to TASKS.md §§5–6; §3 validates `url`.
  it.each([
    ['missing url', {}],
    ['non-string url', { url: 42 }],
  ])('rejects %s without writing a row', async (_label, payload) => {
    const response = await request(context.app).post('/api/links').send(payload);

    expect(response.status).toBe(400);
    expect(errorOf(response).error.code).toBe('VALIDATION_ERROR');
    expect(rowCount(context.db)).toBe(0);
  });

  it.each([
    ['malformed JSON', 'application/json', '{"url":'],
    ['empty body', 'application/json', ''],
    ['array body', 'application/json', '[]'],
    ['scalar body', 'application/json', '42'],
    ['wrong content type', 'text/plain', JSON.stringify({ url: VALID_URL })],
  ])('rejects %s with the shared envelope', async (_label, contentType, payload) => {
    const response = await request(context.app)
      .post('/api/links')
      .set('Content-Type', contentType)
      .send(payload);

    expect(response.status).toBe(400);
    expect(errorOf(response).error.code).toBe('VALIDATION_ERROR');
    expect(rowCount(context.db)).toBe(0);
  });

  it('ignores unknown body fields instead of rejecting or storing them', async () => {
    const plain = await request(context.app).post('/api/links').send({ url: VALID_URL });
    const withExtra = await request(context.app)
      .post('/api/links')
      .send({ url: VALID_URL, tags: ['a'] });
    const plainBody = bodyOf(plain);
    const extraBody = bodyOf(withExtra);
    const { code: plainCode, shortUrl: plainShortUrl, ...plainRest } = plainBody;
    const { code: extraCode, shortUrl: extraShortUrl, ...extraRest } = extraBody;

    expect(withExtra.status).toBe(201);
    expect(plainCode).not.toBe(extraCode);
    expect(plainShortUrl).not.toBe(extraShortUrl);
    expect(extraRest).toEqual(plainRest);
    expect('tags' in extraBody).toBe(false);
    expect(rowCount(context.db)).toBe(2);
  });

  it('does not deduplicate the same destination', async () => {
    const first = await request(context.app).post('/api/links').send({ url: VALID_URL });
    const second = await request(context.app).post('/api/links').send({ url: VALID_URL });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(bodyOf(first).code).not.toBe(bodyOf(second).code);
    expect(rowCount(context.db)).toBe(2);
  });

  it('builds short URLs from configuration, never from request headers', async () => {
    const response = await request(context.app)
      .post('/api/links')
      .set('Host', 'evil.example')
      .set('X-Forwarded-Host', 'evil.example')
      .send({ url: VALID_URL });

    expect(response.status).toBe(201);
    expect(bodyOf(response).shortUrl).toBe(
      `${context.config.publicBaseUrl}/${bodyOf(response).code}`,
    );
    expect(response.headers.location).toBe(bodyOf(response).shortUrl);
  });
});
