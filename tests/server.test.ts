import { Server } from 'node:http';

import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { startServer } from '../src/server.js';
import { openDatabase, type DatabaseHandle } from '../src/db/connection.js';

const BASE_URL = 'http://localhost:3000';
const NODE_ENVS = ['development', 'production'] as const;
const REJECTED_PORTS = [
  '0',
  '0000',
  '65536',
  '-1',
  '+3000',
  '3000.5',
  '1e3',
  'abc',
  '3000abc',
] as const;

describe('startup', () => {
  let listen: Mock<typeof Server.prototype.listen>;
  const databases: DatabaseHandle[] = [];

  function startWithMemory(env: Readonly<Record<string, string | undefined>>): number {
    const db = openDatabase(':memory:');
    databases.push(db);
    return startServer(env, db);
  }

  beforeEach(() => {
    listen = vi.spyOn(Server.prototype, 'listen').mockImplementation(function (
      this: Server,
    ) {
      return this;
    });
  });

  afterEach(() => {
    for (const db of databases.splice(0)) {
      db.close();
    }
    listen.mockRestore();
    vi.restoreAllMocks();
  });

  it.each(NODE_ENVS)(
    'listens on 3000 when PORT is unset under NODE_ENV=%s',
    (nodeEnv) => {
      const status = startWithMemory({ NODE_ENV: nodeEnv, PUBLIC_BASE_URL: BASE_URL });

      expect(status).toBe(0);
      expect(listen).toHaveBeenCalledOnce();
      expect(listen.mock.calls[0]?.[0]).toBe(3000);
    },
  );

  it.each([
    ['8080', 8080],
    ['03000', 3000],
    ['00001', 1],
    [' 8080 ', 8080],
  ] as const)('passes the resolved port %s to listen', (rawPort, expected) => {
    const status = startWithMemory({
      NODE_ENV: 'development',
      PORT: rawPort,
      PUBLIC_BASE_URL: BASE_URL,
    });

    expect(status).toBe(0);
    expect(listen.mock.calls[0]?.[0]).toBe(expected);
  });

  it('listens on the development default when PUBLIC_BASE_URL is unset', () => {
    const status = startWithMemory({ NODE_ENV: 'development' });

    expect(status).toBe(0);
    expect(listen.mock.calls[0]?.[0]).toBe(3000);
  });

  it('creates the links table before listening', () => {
    startWithMemory({ NODE_ENV: 'test', PUBLIC_BASE_URL: BASE_URL });
    const db = databases[0];
    expect(db).toBeDefined();

    const table = db
      ?.prepare<[], { name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'links'")
      .get();
    expect(table?.name).toBe('links');
  });

  it('does not listen when production has no PUBLIC_BASE_URL', () => {
    const errors: string[] = [];
    const spy = vi.spyOn(console, 'error').mockImplementation((message?: unknown) => {
      errors.push(String(message));
    });

    const status = startWithMemory({ NODE_ENV: 'production' });

    spy.mockRestore();
    expect(status).toBe(1);
    expect(listen).not.toHaveBeenCalled();
    expect(errors.join('\n')).toMatch(/\[config\] PUBLIC_BASE_URL:/);
  });

  describe.each(NODE_ENVS)('invalid PORT under NODE_ENV=%s', (nodeEnv) => {
    it.each(REJECTED_PORTS)('rejects %s before listen', (rawPort) => {
      const errors: string[] = [];
      const spy = vi.spyOn(console, 'error').mockImplementation((message?: unknown) => {
        errors.push(String(message));
      });

      const status = startWithMemory({
        NODE_ENV: nodeEnv,
        PORT: rawPort,
        PUBLIC_BASE_URL: BASE_URL,
      });

      spy.mockRestore();
      const log = errors.join('\n');

      expect(status).toBe(1);
      expect(listen).not.toHaveBeenCalled();
      expect(log).toMatch(/\[config\] PORT:/);
      expect(log).not.toContain(rawPort);
    });
  });
});
