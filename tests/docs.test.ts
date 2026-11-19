import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { CreateLinkResponse } from '../src/modules/links/links.types.js';
import { createTestApp, type TestApp } from './helpers/test-app.js';

const DESTINATION = 'https://example.com/path';
const SPEC_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../docs/openapi.yaml');
const SPEC_CONTENT = readFileSync(SPEC_PATH, 'utf8');

interface ErrorBody {
  readonly error: {
    readonly code: string;
    readonly message: string;
  };
}

describe('served API documentation', () => {
  let context: TestApp;

  beforeEach(() => {
    context = createTestApp();
  });

  afterEach(() => {
    context.close();
  });

  it('GET /api/docs returns 200 HTML that loads Swagger UI and the OpenAPI spec', async () => {
    const response = await request(context.app).get('/api/docs');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.text).toContain('SwaggerUIBundle');
    expect(response.text).toContain("url: '/api/openapi.yaml'");
    expect(response.text).toContain('/api/docs/assets/swagger-ui-bundle.js');
    expect(response.text).toContain('/api/docs/assets/swagger-ui.css');
  });

  it('GET /api/docs/assets/swagger-ui.css serves a real file from swagger-ui-dist', async () => {
    const response = await request(context.app).get('/api/docs/assets/swagger-ui.css');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/css');
    expect(response.text.length).toBeGreaterThan(0);
  });

  it('an unknown /api/docs asset returns the 404 NOT_FOUND envelope', async () => {
    const response = await request(context.app).get('/api/docs/assets/does-not-exist.js');
    const body = response.body as ErrorBody;

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Route not found');
  });

  it('GET /api/openapi.yaml returns 200 with the spec content and a YAML content type', async () => {
    const response = await request(context.app).get('/api/openapi.yaml');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('yaml');
    expect(response.text).toBe(SPEC_CONTENT);
  });

  it('the spec uses a relative server URL and notes browser redirect-following', () => {
    expect(SPEC_CONTENT).toMatch(/servers:\s*\n\s*- url: \/(\s|$)/m);
    expect(SPEC_CONTENT).toContain('browsers follow redirects');
  });

  it('leaves /health, /:code, and the reserved aliases unchanged', async () => {
    const health = await request(context.app).get('/health');
    expect(health.status).toBe(200);
    expect(health.body).toEqual({ status: 'ok' });

    const created = await request(context.app).post('/api/links').send({ url: DESTINATION });
    expect(created.status).toBe(201);
    const code = (created.body as CreateLinkResponse).code;

    const redirected = await request(context.app).get(`/${code}`);
    expect(redirected.status).toBe(302);
    expect(redirected.headers.location).toBe(DESTINATION);

    const reserved = await request(context.app)
      .post('/api/links')
      .send({ url: DESTINATION, alias: 'api' });
    expect(reserved.status).toBe(400);
    expect((reserved.body as ErrorBody).error.code).toBe('RESERVED_ALIAS');
  });
});
