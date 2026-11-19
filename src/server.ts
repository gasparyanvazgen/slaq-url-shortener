import { pathToFileURL } from 'node:url';

import { createApp } from './app.js';
import { ConfigError, loadConfig } from './config.js';
import { systemClock } from './lib/clock.js';

/**
 * Resolve configuration, then listen. An invalid value is logged and reported as
 * exit status 1 before any listener exists (D17, D22). The log names the variable
 * and the failed rule; the raw value is never echoed (NFR-07).
 *
 * @returns `0` when the listener was opened, `1` when startup was rejected.
 */
export function startServer(
  env: Readonly<Record<string, string | undefined>> = process.env,
): number {
  try {
    const config = loadConfig(env);
    const app = createApp({ db: null, clock: systemClock, config });

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
