import type { AppConfig } from '../../config.js';
import type { Clock } from '../../lib/clock.js';
import { InternalError } from '../../lib/errors.js';
import { generateCode } from '../../lib/code-generator.js';
import { UniqueCodeError, type LinkRepository } from './links.repository.js';
import type { CreateLinkInput, Link } from './links.types.js';

/** Five generation attempts in total, not five retries after the first (D5). */
const MAX_GENERATION_ATTEMPTS = 5;

export interface LinkServiceDependencies {
  readonly repo: LinkRepository;
  readonly clock: Clock;
  readonly config: AppConfig;
  /** Injectable for deterministic collision tests; production uses `generateCode`. */
  readonly generator?: () => string;
}

export interface LinkService {
  createLink(input: CreateLinkInput): Link;
}

export function createLinkService(deps: LinkServiceDependencies): LinkService {
  const generate = deps.generator ?? generateCode;

  // The origin is HTTP-shaping data, so the controller uses this config when it
  // builds `shortUrl`; keeping it in the service signature follows D1.
  void deps.config;

  return {
    createLink(input) {
      const createdAt = deps.clock.now().toISOString();

      for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
        const code = generate();
        try {
          return deps.repo.insert({
            code,
            originalUrl: input.originalUrl,
            isCustom: 0,
            createdAt,
            expiresAt: null,
          });
        } catch (error: unknown) {
          if (error instanceof UniqueCodeError) {
            continue;
          }
          throw error;
        }
      }

      throw new InternalError();
    },
  };
}
