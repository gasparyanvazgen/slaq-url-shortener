import { z } from 'zod';

const MAX_URL_LENGTH = 2048;
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);
const URL_MESSAGE = 'url must be a valid http or https URL';

/** D18: validate the submitted URL without normalizing what gets stored. */
function isAllowedDestination(value: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return false;
  }
  if (parsed.username !== '' || parsed.password !== '') {
    return false;
  }
  return true;
}

const destination = z
  .string()
  .transform((value) => value.trim())
  .pipe(
    z
      .string()
      .min(1, URL_MESSAGE)
      .max(MAX_URL_LENGTH, URL_MESSAGE)
      .refine(isAllowedDestination, URL_MESSAGE),
  );

const ALIAS_MESSAGE = 'alias must be 3–32 characters using only letters, digits, hyphen, or underscore';

/** D6: length and charset only; whitespace is not trimmed. Reserved-name and
 * uniqueness checks are business rules that live in the service. */
const alias = z
  .string()
  .min(3, ALIAS_MESSAGE)
  .max(32, ALIAS_MESSAGE)
  .regex(/^[A-Za-z0-9_-]+$/, ALIAS_MESSAGE);

const EXPIRES_MESSAGE = 'expiresAt must be an ISO 8601 instant with an offset';
/** An explicit Z or +/-HH:MM offset is required; any fractional length is fine. */
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

/** D15: validate the instant's shape, then normalize to canonical UTC text. */
const instant = z
  .string()
  .regex(ISO_INSTANT, EXPIRES_MESSAGE)
  .refine((value) => !Number.isNaN(new Date(value).getTime()), EXPIRES_MESSAGE)
  .transform((value) => new Date(value).toISOString());

/**
 * The controller uses this schema at the HTTP boundary. Zod objects strip
 * unknown keys by default, which implements D19. The "strictly in the future"
 * rule needs the injected clock and is applied in the service (D15).
 */
export const createLinkSchema = z.object({
  url: destination,
  alias: alias.optional(),
  expiresAt: instant.nullish(),
});

export type CreateLinkBody = z.infer<typeof createLinkSchema>;
