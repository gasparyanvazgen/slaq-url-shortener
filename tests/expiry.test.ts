import { describe, expect, it } from 'vitest';

import { isExpired } from '../src/lib/expiry.js';
import { createLinkSchema } from '../src/modules/links/links.schemas.js';

const NOW = new Date('2026-11-19T12:00:00.000Z');
const NOW_ISO = NOW.toISOString();

describe('expiry predicate (D15)', () => {
  it('is false for a null expiry', () => {
    expect(isExpired(null, NOW_ISO)).toBe(false);
  });

  it('is true one millisecond before now', () => {
    expect(isExpired('2026-11-19T11:59:59.999Z', NOW_ISO)).toBe(true);
  });

  it('is true exactly at now (inclusive <=)', () => {
    expect(isExpired(NOW_ISO, NOW_ISO)).toBe(true);
  });

  it('is false one millisecond after now', () => {
    expect(isExpired('2026-11-19T12:00:00.001Z', NOW_ISO)).toBe(false);
  });
});

describe('expiresAt input normalization (D15)', () => {
  it('normalizes a +02:00 offset to the same instant in Z', () => {
    const parsed = createLinkSchema.safeParse({
      url: 'https://example.com',
      expiresAt: '2026-11-20T14:00:00.000+02:00',
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.expiresAt).toBe('2026-11-20T12:00:00.000Z');
    }
  });

  it('normalizes fractional seconds to exactly three digits', () => {
    const parsed = createLinkSchema.safeParse({
      url: 'https://example.com',
      expiresAt: '2026-11-20T12:00:00.1234Z',
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.expiresAt).toBe('2026-11-20T12:00:00.123Z');
    }
  });

  it.each(['tomorrow', '2026-11-20', '2026-11-20T12:00:00'])(
    'rejects %s because it is not an ISO instant with an offset',
    (value) => {
      expect(
        createLinkSchema.safeParse({ url: 'https://example.com', expiresAt: value }).success,
      ).toBe(false);
    },
  );
});
