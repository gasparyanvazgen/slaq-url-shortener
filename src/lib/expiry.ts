/**
 * D15: a link is expired when `expiresAt <= now`. Both arguments are canonical
 * `toISOString()` values, so fixed-width UTC text compares correctly as text;
 * a null expiry never expires. Shared by redirect and statistics (D7).
 */
export function isExpired(expiresAt: string | null, nowIso: string): boolean {
  return expiresAt !== null && expiresAt <= nowIso;
}
