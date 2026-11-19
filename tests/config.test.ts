import { describe, expect, it } from 'vitest';

import { ConfigError, loadConfig } from '../src/config.js';

const BASE_URL = 'http://localhost:3000';
const NODE_ENVS = ['development', 'production'] as const;
const MAX_LENGTH = 2048;

function env(
  overrides: Readonly<Record<string, string | undefined>>,
): Record<string, string | undefined> {
  return { NODE_ENV: 'test', PUBLIC_BASE_URL: BASE_URL, ...overrides };
}

/**
 * Capture a configuration failure as a typed error. Vitest's asymmetric
 * matchers are `any`-typed, so message checks read the error directly (D11).
 */
function configErrorFrom(attempt: () => unknown): ConfigError {
  try {
    attempt();
  } catch (error: unknown) {
    if (error instanceof ConfigError) {
      return error;
    }
    throw error;
  }
  throw new Error('Expected loadConfig to throw ConfigError');
}

describe.each(NODE_ENVS)('PORT resolution under NODE_ENV=%s', (nodeEnv) => {
  it.each([
    ['unset', undefined, 3000],
    ['empty', '', 3000],
    ['whitespace only', '   ', 3000],
    ['03000', '03000', 3000],
    ['00001', '00001', 1],
    ['8080', '8080', 8080],
    ['1', '1', 1],
    ['65535', '65535', 65535],
    ['surrounding whitespace', ' 8080 ', 8080],
  ])('resolves %s to %i', (_label, rawPort, expected) => {
    const config = loadConfig(env({ NODE_ENV: nodeEnv, PORT: rawPort }));

    expect(config.port).toBe(expected);
  });

  it.each([
    ['0', '0'],
    ['0000', '0000'],
    ['65536', '65536'],
    ['-1', '-1'],
    ['+3000', '+3000'],
    ['3000.5', '3000.5'],
    ['1e3', '1e3'],
    ['abc', 'abc'],
    ['3000abc', '3000abc'],
  ])('rejects %s', (_label, rawPort) => {
    const error = configErrorFrom(() => loadConfig(env({ NODE_ENV: nodeEnv, PORT: rawPort })));

    expect(error.message).toContain('PORT');
    expect(error.message).not.toContain(rawPort);
  });

  it('still rejects an invalid PORT when PUBLIC_BASE_URL is valid', () => {
    expect(() =>
      loadConfig(
        env({ NODE_ENV: nodeEnv, PORT: '0000', PUBLIC_BASE_URL: 'https://slaq.example' }),
      ),
    ).toThrow(/PORT/);
  });
});

describe('PORT failures are identical in both environments', () => {
  it.each(['0', '0000', '65536', '-1', '+3000', '3000.5', '1e3', 'abc', '3000abc'])(
    'rejects %s with the same message',
    (rawPort) => {
      const messageFor = (nodeEnv: string): string => {
        try {
          loadConfig(env({ NODE_ENV: nodeEnv, PORT: rawPort }));
        } catch (error) {
          if (error instanceof ConfigError) {
            return error.message;
          }
          throw error;
        }
        throw new Error('expected ConfigError');
      };

      expect(messageFor('development')).toBe(messageFor('production'));
    },
  );
});

describe('PUBLIC_BASE_URL resolution', () => {
  it('falls back to the resolved port in development', () => {
    expect(
      loadConfig({ NODE_ENV: 'development', PUBLIC_BASE_URL: undefined }).publicBaseUrl,
    ).toBe('http://localhost:3000');
    expect(loadConfig({ NODE_ENV: 'development', PORT: '8080' }).publicBaseUrl).toBe(
      'http://localhost:8080',
    );
  });

  it('treats an empty value as unset in development', () => {
    expect(loadConfig({ NODE_ENV: 'development', PUBLIC_BASE_URL: '  ' }).publicBaseUrl).toBe(
      'http://localhost:3000',
    );
  });

  it('fails fast when production has no value', () => {
    expect(() => loadConfig({ NODE_ENV: 'production', PORT: '3000' })).toThrow(/PUBLIC_BASE_URL/);
    expect(() => loadConfig({ NODE_ENV: 'production', PUBLIC_BASE_URL: '' })).toThrow(
      /PUBLIC_BASE_URL/,
    );
  });

  it('normalizes a valid value to its origin', () => {
    expect(
      loadConfig(env({ PUBLIC_BASE_URL: 'https://slaq.example/' })).publicBaseUrl,
    ).toBe('https://slaq.example');
    expect(
      loadConfig(env({ PUBLIC_BASE_URL: '  http://localhost:3000  ' })).publicBaseUrl,
    ).toBe('http://localhost:3000');
    expect(
      loadConfig(env({ PUBLIC_BASE_URL: 'https://slaq.example' })).publicBaseUrl,
    ).toBe('https://slaq.example');
  });

  it.each([
    ['a non-http scheme', 'ftp://slaq.example'],
    ['a javascript URL', 'javascript:alert(1)'],
    ['embedded credentials', 'https://user:secret@slaq.example'],
    ['a path', 'https://slaq.example/path'],
    ['a query string', 'https://slaq.example/?a=1'],
    ['a fragment', 'https://slaq.example/#frag'],
    ['a relative value', 'not-a-url'],
    ['an empty authority', 'https://'],
  ])('rejects %s without echoing the raw value', (_label, value) => {
    const error = configErrorFrom(() => loadConfig(env({ PUBLIC_BASE_URL: value })));

    expect(error.message).toContain('PUBLIC_BASE_URL');
    expect(error.message).not.toContain(value);
  });

  it('rejects an invalid value in development too', () => {
    expect(() =>
      loadConfig({ NODE_ENV: 'development', PUBLIC_BASE_URL: 'https://slaq.example/path' }),
    ).toThrow(ConfigError);
  });

  it('accepts a value of exactly the maximum length and rejects one character more', () => {
    const atMax = `http://${'a'.repeat(MAX_LENGTH - 'http://'.length - '.com'.length)}.com`;
    const overMax = `http://${'a'.repeat(MAX_LENGTH - 'http://'.length - '.com'.length + 1)}.com`;

    expect(atMax).toHaveLength(MAX_LENGTH);
    expect(overMax).toHaveLength(MAX_LENGTH + 1);
    expect(loadConfig(env({ PUBLIC_BASE_URL: atMax })).publicBaseUrl).toBe(atMax);
    expect(() => loadConfig(env({ PUBLIC_BASE_URL: overMax }))).toThrow(/PUBLIC_BASE_URL/);
  });
});

describe('NODE_ENV resolution', () => {
  it('defaults to development when unset or empty', () => {
    expect(loadConfig({ PUBLIC_BASE_URL: BASE_URL }).nodeEnv).toBe('development');
    expect(loadConfig({ NODE_ENV: '  ', PUBLIC_BASE_URL: BASE_URL }).nodeEnv).toBe(
      'development',
    );
  });

  it('keeps an explicit value', () => {
    expect(loadConfig(env({ NODE_ENV: 'production' })).nodeEnv).toBe('production');
  });
});
