import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp, type HealthResponse } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { openDatabase } from '../src/db/connection.js';
import { createSchema } from '../src/db/schema.js';

/**
 * Statement preparation happens when the app is built; closing the handle
 * afterwards proves that serving `/health` executes no SQL (D19).
 */
function buildApp() {
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

describe('GET /health', () => {
  it('returns 200 with the liveness body and a JSON content type', async () => {
    const response = await request(buildApp()).get('/health');
    const body = response.body as HealthResponse;

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(body).toEqual({ status: 'ok' });
  });

  it('answers without a live database connection', async () => {
    const response = await request(buildApp()).get('/health');

    expect(response.status).toBe(200);
  });
});
