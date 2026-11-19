import type { Express } from 'express';

import { createApp, type AppDependencies } from '../../src/app.js';
import { loadConfig, type AppConfig } from '../../src/config.js';
import { openDatabase, type DatabaseHandle } from '../../src/db/connection.js';
import { createSchema } from '../../src/db/schema.js';

export const TEST_NOW = new Date('2026-11-19T12:00:00.000Z');
export const TEST_CONFIG: AppConfig = loadConfig({
  NODE_ENV: 'test',
  PUBLIC_BASE_URL: 'https://slaq.example',
});

export interface TestApp {
  readonly app: Express;
  readonly db: DatabaseHandle;
  readonly config: AppConfig;
  close(): void;
}

/** An isolated in-memory app with a fixed clock (D1, D8, D15). */
export function createTestApp(
  overrides: Partial<Pick<AppDependencies, 'clock' | 'config'>> = {},
): TestApp {
  const db = openDatabase(':memory:');
  createSchema(db);

  const config = overrides.config ?? TEST_CONFIG;
  const app = createApp({
    db,
    clock: overrides.clock ?? { now: () => TEST_NOW },
    config,
  });

  return {
    app,
    db,
    config,
    close: () => {
      db.close();
    },
  };
}
