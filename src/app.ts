import express, { type Express } from 'express';

import type { AppConfig } from './config.js';
import type { Clock } from './lib/clock.js';

/**
 * Placeholder for the SQLite connection. §2 replaces it with the typed
 * `better-sqlite3` database; `unknown` keeps the factory honest until then (D12).
 */
export type AppDatabase = unknown;

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

  // §1 exposes health only. The deps object stays in the signature (D1); later
  // sections are what read the database, clock, and config.
  void deps;

  // Liveness only: no database probe, no readiness state, no 503 (D19).
  app.get('/health', (_req, res) => {
    res.status(200).json(HEALTH_BODY);
  });

  return app;
}
