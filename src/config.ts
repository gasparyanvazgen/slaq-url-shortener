/**
 * Startup configuration, resolved once before any listener exists (D17, D22).
 *
 * Nothing here reads `process.env` implicitly: the caller passes the environment
 * source, so configuration tests need no process-wide mutation.
 */

const DEFAULT_PORT = 3000;
const MIN_PORT = 1;
const MAX_PORT = 65535;
const MAX_BASE_URL_LENGTH = 2048;
const ASCII_DIGITS = /^[0-9]+$/;
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

export interface AppConfig {
  /** `NODE_ENV` verbatim; defaults to `development` when unset or empty. */
  readonly nodeEnv: string;
  /** Listen port, an integer in 1–65535 (D22). */
  readonly port: number;
  /** Normalized public origin, for example `http://localhost:3000` (D17). */
  readonly publicBaseUrl: string;
}

/** A startup configuration value that violated its rule (D17, D22). */
export class ConfigError extends Error {
  constructor(variable: 'PORT' | 'PUBLIC_BASE_URL', reason: string) {
    super(`${variable}: ${reason}`);
    this.name = 'ConfigError';
  }
}

/**
 * Resolve `PORT` (D22): trim, default an unset or empty value to 3000 in every
 * environment, then require ASCII digits only with a numeric value in 1–65535.
 * Leading zeros are allowed and insignificant; `0` and `0000` are rejected.
 *
 * `Number()` is used on an already validated digits-only string, so it performs
 * no prefix coercion: `3000abc` never reaches this point, and values too large to
 * be a port fail the range check.
 */
function resolvePort(rawValue: string | undefined): number {
  const value = rawValue?.trim() ?? '';

  if (value === '') {
    return DEFAULT_PORT;
  }

  if (!ASCII_DIGITS.test(value)) {
    throw new ConfigError('PORT', 'must contain only ASCII digits (0-9)');
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < MIN_PORT || port > MAX_PORT) {
    throw new ConfigError('PORT', `must be an integer from ${MIN_PORT} to ${MAX_PORT}`);
  }

  return port;
}

/**
 * Resolve and normalize `PUBLIC_BASE_URL` (D17): trim, cap the length, require an
 * absolute http(s) URL without credentials, path, query, or fragment, and reduce
 * it to its origin. Development falls back to `http://localhost:${port}`;
 * production fails fast. An invalid value fails in every environment.
 */
function resolvePublicBaseUrl(
  rawValue: string | undefined,
  nodeEnv: string,
  port: number,
): string {
  const value = rawValue?.trim() ?? '';

  if (value === '') {
    if (nodeEnv === 'production') {
      throw new ConfigError('PUBLIC_BASE_URL', 'is required in production');
    }
    return `http://localhost:${port}`;
  }

  if (value.length > MAX_BASE_URL_LENGTH) {
    throw new ConfigError(
      'PUBLIC_BASE_URL',
      `must be at most ${MAX_BASE_URL_LENGTH} characters`,
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new ConfigError('PUBLIC_BASE_URL', 'must be an absolute http or https URL');
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new ConfigError('PUBLIC_BASE_URL', 'must use the http or https scheme');
  }
  if (parsed.username !== '' || parsed.password !== '') {
    throw new ConfigError('PUBLIC_BASE_URL', 'must not contain credentials');
  }
  if (parsed.pathname !== '/') {
    throw new ConfigError('PUBLIC_BASE_URL', 'must not contain a path');
  }
  if (parsed.search !== '') {
    throw new ConfigError('PUBLIC_BASE_URL', 'must not contain a query string');
  }
  if (parsed.hash !== '') {
    throw new ConfigError('PUBLIC_BASE_URL', 'must not contain a fragment');
  }

  return parsed.origin;
}

/**
 * Build the startup configuration from an environment source.
 *
 * @throws {ConfigError} when `PORT` or `PUBLIC_BASE_URL` violates its rule; the
 * message names the variable and the failed rule and never echoes the raw value.
 */
export function loadConfig(
  env: Readonly<Record<string, string | undefined>> = process.env,
): AppConfig {
  const rawNodeEnv = env.NODE_ENV?.trim() ?? '';
  const nodeEnv = rawNodeEnv === '' ? 'development' : rawNodeEnv;
  const port = resolvePort(env.PORT);
  const publicBaseUrl = resolvePublicBaseUrl(env.PUBLIC_BASE_URL, nodeEnv, port);

  return { nodeEnv, port, publicBaseUrl };
}
