import Database from 'better-sqlite3';
import express, { type Express } from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { openDatabase } from '../src/db/connection.js';
import { createSchema } from '../src/db/schema.js';
import {
  AliasTakenError,
  LinkExpiredError,
  NotFoundError,
  ReservedAliasError,
  ValidationError,
} from '../src/lib/errors.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { notFoundHandler } from '../src/middleware/not-found.js';

interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: readonly { path: string; message: string }[];
  };
}

/**
 * Build an app with a real handle, then close it. Statement preparation happens
 * in `createApp`; the routes under test execute no SQL.
 */
function createClosedApp(): Express {
  const db = openDatabase(':memory:');
  createSchema(db);
  const app = createApp({
    db,
    clock: { now: () => new Date('2026-11-19T12:00:00.000Z') },
    config: loadConfig({ NODE_ENV: 'test', PUBLIC_BASE_URL: 'http://localhost:3000' }),
  });
  db.close();
  return app;
}

/** A minimal app that routes a request into the real error middleware. */
function appThatThrows(failure: () => unknown): Express {
  const app = express();
  app.use(express.json());
  app.get('/boom', () => {
    failure();
  });
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('error middleware', () => {
  it('maps an AppError to the documented envelope and status', async () => {
    const app = appThatThrows(() => {
      throw new ValidationError('url must be valid', [{ path: 'url', message: 'Invalid URL' }]);
    });

    const response = await request(app).get('/boom');
    const body = response.body as ErrorBody;

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toBe('url must be valid');
    expect(body.error.details).toEqual([{ path: 'url', message: 'Invalid URL' }]);
  });

  it.each([
    { error: new ReservedAliasError(), status: 400, code: 'RESERVED_ALIAS' },
    { error: new NotFoundError(), status: 404, code: 'NOT_FOUND' },
    { error: new AliasTakenError(), status: 409, code: 'ALIAS_TAKEN' },
    { error: new LinkExpiredError(), status: 410, code: 'LINK_EXPIRED' },
  ])('maps $code to HTTP $status', async ({ error, status, code }) => {
    const response = await request(appThatThrows(() => { throw error; })).get('/boom');
    const body = response.body as ErrorBody;

    expect(response.status).toBe(status);
    expect(body.error.code).toBe(code);
    expect(body.error.details).toBeUndefined();
  });

  it('returns the 404 envelope for an unmatched route', async () => {
    const response = await request(createClosedApp()).get('/not-a-route');
    const body = response.body as ErrorBody;

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(typeof body.error.message).toBe('string');
    expect(body.error.details).toBeUndefined();
  });

  it('returns a generic 500 for an unexpected error without leaking internals', async () => {
    const logged: unknown[][] = [];
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      logged.push(args);
    });
    const app = appThatThrows(() => {
      throw new Error('SELECT secret FROM hidden_table at /srv/private/app.ts');
    });

    const response = await request(app).get('/boom');
    const raw = JSON.stringify(response.body as unknown);
    const body = response.body as ErrorBody;

    expect(response.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toBe('Internal server error');
    expect(raw).not.toContain('SELECT');
    expect(raw).not.toContain('secret');
    expect(raw).not.toContain('/srv/private');
    expect(raw).not.toContain('stack');
    expect(logged.length).toBeGreaterThan(0);
  });

  it('maps SQLITE_BUSY to a generic 500 and logs the driver detail server-side', async () => {
    const logged: unknown[][] = [];
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      logged.push(args);
    });
    const busy = new Database.SqliteError('database is locked', 'SQLITE_BUSY');
    const app = appThatThrows(() => {
      throw busy;
    });

    const response = await request(app).get('/boom');
    const raw = JSON.stringify(response.body as unknown);
    const body = response.body as ErrorBody;
    const log = logged.map((args) => args.map(String).join(' ')).join('\n');

    expect(response.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toBe('Internal server error');
    expect(raw).not.toContain('SQLITE_BUSY');
    expect(raw).not.toContain('database is locked');
    expect(log).toContain('SQLITE_BUSY');
    expect(log).toContain('database is locked');
  });

  it('maps malformed JSON to 400 VALIDATION_ERROR', async () => {
    const response = await request(createClosedApp())
      .post('/anything')
      .set('Content-Type', 'application/json')
      .send('{"url":');

    const body = response.body as ErrorBody;
    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toBe('Request body could not be parsed');
    expect(body.error.details).toBeUndefined();
  });

  it('maps an oversized JSON body to 400 VALIDATION_ERROR without a 413', async () => {
    const response = await request(createClosedApp())
      .post('/anything')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ url: 'x'.repeat(101 * 1024) }));

    const body = response.body as ErrorBody;
    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});
