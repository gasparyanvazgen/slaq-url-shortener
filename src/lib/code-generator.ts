import { randomInt } from 'node:crypto';

/** Generated-code alphabet and length, fixed by D5. */
export const CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
export const CODE_LENGTH = 7;

type RandomInt = (max: number) => number;

/**
 * Build a generator from an explicit random source. Production uses
 * `crypto.randomInt`; tests inject a deterministic source to prove the retry
 * strategy without depending on chance (D5).
 */
export function createCodeGenerator(nextInt: RandomInt = randomInt): () => string {
  return () => {
    let code = '';
    for (let index = 0; index < CODE_LENGTH; index += 1) {
      const character = CODE_ALPHABET[nextInt(CODE_ALPHABET.length)];
      if (character === undefined) {
        throw new RangeError('Random index is outside the code alphabet');
      }
      code += character;
    }
    return code;
  };
}

/** The production generator. No `Math.random` and no database access (D5). */
export const generateCode = createCodeGenerator();
