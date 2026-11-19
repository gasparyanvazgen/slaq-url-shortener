import express, { type Express } from 'express';

import type { AppConfig } from './config.js';
import type { DatabaseHandle } from './db/connection.js';
import type { Clock } from './lib/clock.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import { createLinksController } from './modules/links/links.controller.js';
import { createLinkRepository } from './modules/links/links.repository.js';
import { createLinksRouter, createRedirectRouter } from './modules/links/links.routes.js';
import { createLinkService } from './modules/links/links.service.js';

/** The typed SQLite handle injected into every app instance (D1, D12). */
export type AppDatabase = DatabaseHandle;

/** Everything `createApp` receives; the signature is final (D1). */
export interface AppDependencies {
  readonly db: AppDatabase;
  readonly clock: Clock;
  readonly config: AppConfig;
}

/** Body of `GET /health` (D19: liveness only). */
export interface HealthResponse {
  readonly status: 'ok';
}

const HEALTH_BODY: HealthResponse = { status: 'ok' };

/**
 * Build the Express application from injected dependencies so it can be tested
 * in-process without a fixed port (D1, D8).
 */
export function createApp(deps: AppDependencies): Express {
  const app = express();

  // Body-parser failures must reach the shared 400 envelope, not Express's
  // default HTML error page (D19).
  app.use(express.json());

  const repo = createLinkRepository(deps.db);
  const service = createLinkService({
    repo,
    clock: deps.clock,
    config: deps.config,
  });
  const controller = createLinksController({ service, config: deps.config });

  // Static routes precede the catch-all redirect route and the not-found
  // handler; the single error writer comes last (D3, D20).
  app.get('/health', (_req, res) => {
    res.status(200).json(HEALTH_BODY);
  });
  app.use('/api', createLinksRouter(controller));
  app.use(createRedirectRouter(controller));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
