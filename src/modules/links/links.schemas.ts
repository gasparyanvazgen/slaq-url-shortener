import { z } from 'zod';

const MAX_URL_LENGTH = 2048;
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);
const URL_MESSAGE = 'url must be a valid http or https URL';
/** ASCII control characters are invalid in a stored destination and in a Location header value (D18). */
function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code <= 0x1f || code === 0x7f) {
      return true;
    }
  }
  return false;
}

/** D18: validate the submitted URL without normalizing what gets stored. */
function isAllowedDestination(value: string): boolean {
  if (hasControlCharacter(value)) {
    return false;
  }
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
const ISO_INSTANT =
  /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})T(?<hour>\d{2}):(?<minute>\d{2}):(?<second>\d{2})(?:\.(?<fraction>\d+))?(?:Z|(?<sign>[+-])(?<offsetHour>\d{2}):(?<offsetMinute>\d{2}))$/;

/**
 * `Date` rolls impossible dates such as 2026-02-30 into the next month. Shift the parsed
 * instant back into the submitted offset and require every submitted component to match,
 * while still letting Date normalize fractional digits and produce canonical UTC text (D15).
 */
function isRealInstant(value: string): boolean {
  const match = ISO_INSTANT.exec(value);
  if (match?.groups === undefined) {
    return false;
  }
  const groups = match.groups;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const offsetHour = Number(groups.offsetHour ?? '0');
  const offsetMinute = Number(groups.offsetMinute ?? '0');
  if (offsetHour > 23 || offsetMinute > 59) {
    return false;
  }
  const offsetMs = (groups.sign === '-' ? -1 : 1) * (offsetHour * 60 + offsetMinute) * 60_000;
  const local = new Date(parsed.getTime() + offsetMs);

  return (
    local.getUTCFullYear() === Number(groups.year) &&
    local.getUTCMonth() + 1 === Number(groups.month) &&
    local.getUTCDate() === Number(groups.day) &&
    local.getUTCHours() === Number(groups.hour) &&
    local.getUTCMinutes() === Number(groups.minute) &&
    local.getUTCSeconds() === Number(groups.second) &&
    local.getUTCMilliseconds() === Number(`${groups.fraction ?? ''}000`.slice(0, 3))
  );
}

/** D15: validate the instant's shape and calendar, then normalize to canonical UTC text. */
const instant = z
  .string()
  .regex(ISO_INSTANT, EXPIRES_MESSAGE)
  .refine(isRealInstant, EXPIRES_MESSAGE)
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
