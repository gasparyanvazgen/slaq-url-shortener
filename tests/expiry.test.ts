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

  it.each([
    '2026-02-29T00:00:00Z',
    '2026-02-30T00:00:00Z',
    '2026-02-31T00:00:00Z',
    '2026-04-31T00:00:00Z',
    '2026-01-00T00:00:00Z',
    '2026-13-01T00:00:00Z',
    '2026-01-01T25:00:00Z',
    '2026-01-01T00:60:00Z',
    '2026-01-01T00:00:60Z',
    '2026-02-30T00:00:00+02:00',
    '2027-02-30T00:00:00-05:00',
    '1900-02-29T00:00:00Z',
  ])('rejects the impossible calendar date %s', (value) => {
    expect(
      createLinkSchema.safeParse({ url: 'https://example.com', expiresAt: value }).success,
    ).toBe(false);
  });

  it('accepts a real leap day and keeps canonical UTC normalization', () => {
    const parsed = createLinkSchema.safeParse({
      url: 'https://example.com',
      expiresAt: '2024-02-29T00:00:00Z',
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.expiresAt).toBe('2024-02-29T00:00:00.000Z');
    }
  });

  it('accepts a valid negative offset without changing the instant', () => {
    const parsed = createLinkSchema.safeParse({
      url: 'https://example.com',
      expiresAt: '2026-11-20T23:00:00-05:00',
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.expiresAt).toBe('2026-11-21T04:00:00.000Z');
    }
  });
});
