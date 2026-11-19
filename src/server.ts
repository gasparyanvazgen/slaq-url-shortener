import { pathToFileURL } from 'node:url';

import { createApp } from './app.js';
import { ConfigError, loadConfig } from './config.js';
import { openDatabase, type DatabaseHandle } from './db/connection.js';
import { createSchema } from './db/schema.js';
import { systemClock } from './lib/clock.js';

/** Fixed local database filename, approved for this step by the user. */
export const DATABASE_FILENAME = 'slaq.db';

/**
 * Resolve configuration, bootstrap SQLite, then listen. An invalid config value
 * is logged and reported as exit status 1 before any listener or database
 * connection exists (D17, D22). The log names the variable and the failed rule;
 * the raw value is never echoed (NFR-07).
 *
 * @param db Optional injected handle for tests; production opens `slaq.db`.
 * @returns `0` when the listener was opened, `1` when startup was rejected.
 */
export function startServer(
  env: Readonly<Record<string, string | undefined>> = process.env,
  db?: DatabaseHandle,
): number {
  try {
    const config = loadConfig(env);
    const database = db ?? openDatabase(DATABASE_FILENAME);
    createSchema(database);
    const app = createApp({ db: database, clock: systemClock, config });

    app.listen(config.port, () => {
      console.log(`[server] listening on port ${config.port}`);
    });

    return 0;
  } catch (error) {
    if (error instanceof ConfigError) {
      console.error(`[config] ${error.message}`);
      return 1;
    }
    throw error;
  }
}

const entryArgument = process.argv[1];
const invokedDirectly =
  entryArgument !== undefined && import.meta.url === pathToFileURL(entryArgument).href;

if (invokedDirectly) {
  process.exitCode = startServer();
}
