import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp, type AppDependencies, type HealthResponse } from '../src/app.js';
import { loadConfig } from '../src/config.js';

function buildDeps(): AppDependencies {
  return {
    // No connection: /health must answer without one (D19).
    db: null,
    clock: { now: () => new Date('2026-11-19T12:00:00.000Z') },
    config: loadConfig({ NODE_ENV: 'test', PUBLIC_BASE_URL: 'http://localhost:3000' }),
  };
}

describe('GET /health', () => {
  it('returns 200 with the liveness body and a JSON content type', async () => {
    const response = await request(createApp(buildDeps())).get('/health');
    const body = response.body as HealthResponse;

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(body).toEqual({ status: 'ok' });
  });

  it('answers without a database connection', async () => {
    const response = await request(createApp(buildDeps())).get('/health');

    expect(response.status).toBe(200);
  });
});
