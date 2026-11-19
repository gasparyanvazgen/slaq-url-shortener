import { Server } from 'node:http';

import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { startServer } from '../src/server.js';

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

  beforeEach(() => {
    listen = vi.spyOn(Server.prototype, 'listen').mockImplementation(function (
      this: Server,
    ) {
      return this;
    });
  });

  afterEach(() => {
    listen.mockRestore();
    vi.restoreAllMocks();
  });

  it.each(NODE_ENVS)(
    'listens on 3000 when PORT is unset under NODE_ENV=%s',
    (nodeEnv) => {
      const status = startServer({ NODE_ENV: nodeEnv, PUBLIC_BASE_URL: BASE_URL });

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
    const status = startServer({
      NODE_ENV: 'development',
      PORT: rawPort,
      PUBLIC_BASE_URL: BASE_URL,
    });

    expect(status).toBe(0);
    expect(listen.mock.calls[0]?.[0]).toBe(expected);
  });

  it('listens on the development default when PUBLIC_BASE_URL is unset', () => {
    const status = startServer({ NODE_ENV: 'development' });

    expect(status).toBe(0);
    expect(listen.mock.calls[0]?.[0]).toBe(3000);
  });

  it('does not listen when production has no PUBLIC_BASE_URL', () => {
    const errors: string[] = [];
    const spy = vi.spyOn(console, 'error').mockImplementation((message?: unknown) => {
      errors.push(String(message));
    });

    const status = startServer({ NODE_ENV: 'production' });

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

      const status = startServer({
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
