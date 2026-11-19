import { randomInt } from 'node:crypto';

import { type Mock, afterEach, describe, expect, it, vi } from 'vitest';

import {
  CODE_ALPHABET,
  CODE_LENGTH,
  createCodeGenerator,
  generateCode,
} from '../src/lib/code-generator.js';

vi.mock('node:crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:crypto')>();
  return { ...actual, randomInt: vi.fn(actual.randomInt) };
});

// Node's overloads make `vi.mocked` infer the callback overload's `void`
// return; production uses only `randomInt(max): number`, so narrow it here.
const randomIntMock = vi.mocked(randomInt) as unknown as Mock<(max: number) => number>;

afterEach(() => {
  randomIntMock.mockReset();
});

describe('short-code generator (D5)', () => {
  it('uses the approved 62-character alphabet and length 7', () => {
    expect(CODE_ALPHABET).toBe(
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    );
    expect(CODE_ALPHABET).toHaveLength(62);
    expect(CODE_LENGTH).toBe(7);
  });

  it('calls randomInt(62) seven times and maps results to alphabet characters', () => {
    randomIntMock.mockReturnValue(0);

    const code = generateCode();

    expect(code).toBe('A'.repeat(CODE_LENGTH));
    expect(randomIntMock).toHaveBeenCalledTimes(CODE_LENGTH);
    for (const [max] of randomIntMock.mock.calls) {
      expect(max).toBe(CODE_ALPHABET.length);
    }
  });

  it('uses each returned index in order with an injected random source', () => {
    const indexes = [0, 25, 26, 51, 52, 61, 10];
    let cursor = 0;
    const generator = createCodeGenerator((max: number) => {
      expect(max).toBe(CODE_ALPHABET.length);
      return indexes[cursor++] ?? 0;
    });

    expect(generator()).toBe(
      indexes.map((index) => CODE_ALPHABET[index] ?? '').join(''),
    );
  });

  it('never uses Math.random', () => {
    randomIntMock.mockReturnValue(0);
    const mathRandom = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random must not be used');
    });

    try {
      expect(generateCode()).toBe('A'.repeat(CODE_LENGTH));
    } finally {
      mathRandom.mockRestore();
    }
  });

  it('produces codes containing only alphabet characters', () => {
    const code = generateCode();

    expect(code).toHaveLength(CODE_LENGTH);
    expect([...code].every((character) => CODE_ALPHABET.includes(character))).toBe(true);
  });
});
