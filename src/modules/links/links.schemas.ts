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

/**
 * The controller uses this schema at the HTTP boundary. Zod objects strip
 * unknown keys by default, which implements D19; alias and expiry validation
 * remain in TASKS.md §§5–6.
 */
export const createLinkSchema = z.object({
  url: destination,
});

export type CreateLinkBody = z.infer<typeof createLinkSchema>;
