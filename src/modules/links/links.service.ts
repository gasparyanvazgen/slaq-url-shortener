import type { AppConfig } from '../../config.js';
import type { Clock } from '../../lib/clock.js';
import { generateCode } from '../../lib/code-generator.js';
import { isExpired } from '../../lib/expiry.js';
import {
  AliasTakenError,
  InternalError,
  LinkExpiredError,
  NotFoundError,
  ReservedAliasError,
  ValidationError,
} from '../../lib/errors.js';
import { UniqueCodeError, type LinkRepository } from './links.repository.js';
import type { CreateLinkInput, Link, StatsData } from './links.types.js';

/** Five generation attempts in total, not five retries after the first (D5). */
const MAX_GENERATION_ATTEMPTS = 5;

/** D6: reserved in the shared redirect namespace, compared case-insensitively. */
const RESERVED_ALIASES = new Set(['api', 'health']);

const FUTURE_MESSAGE = 'expiresAt must be strictly in the future';

export interface LinkServiceDependencies {
  readonly repo: LinkRepository;
  readonly clock: Clock;
  readonly config: AppConfig;
  /** Injectable for deterministic collision tests; production uses `generateCode`. */
  readonly generator?: () => string;
}

export interface LinkService {
  createLink(input: CreateLinkInput): Link;
  /** Resolve a redirect to its destination, counting a click only for GET. */
  redirect(code: string, countClick: boolean): string;
  /** Read-only statistics; expired links are still valid targets (D7, D17). */
  getStats(code: string): StatsData;
}

export function createLinkService(deps: LinkServiceDependencies): LinkService {
  const generate = deps.generator ?? generateCode;

  // The origin is HTTP-shaping data, so the controller uses this config when it
  // builds `shortUrl`; keeping it in the service signature follows D1.
  void deps.config;

  function insertCustom(
    alias: string,
    input: CreateLinkInput,
    createdAt: string,
    expiresAt: string | null,
  ): Link {
    if (RESERVED_ALIASES.has(alias.toLowerCase())) {
      throw new ReservedAliasError();
    }

    try {
      return deps.repo.insert({
        code: alias,
        originalUrl: input.originalUrl,
        isCustom: 1,
        createdAt,
        expiresAt,
      });
    } catch (error: unknown) {
      // The INSERT's UNIQUE(code) is the durable guarantee; a lost race or any
      // existing code (custom or generated) is the same 409 (D2, D6).
      if (error instanceof UniqueCodeError) {
        throw new AliasTakenError();
      }
      throw error;
    }
  }

  return {
    createLink(input) {
      const nowIso = deps.clock.now().toISOString();
      const expiresAt = input.expiresAt ?? null;

      // D15: `expiresAt === now` is rejected, and so is any past instant. Both
      // strings are canonical UTC, so text comparison is a correct time compare.
      if (expiresAt !== null && expiresAt <= nowIso) {
        throw new ValidationError(FUTURE_MESSAGE, [
          { path: 'expiresAt', message: FUTURE_MESSAGE },
        ]);
      }

      if (input.alias !== undefined) {
        return insertCustom(input.alias, input, nowIso, expiresAt);
      }

      for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
        const code = generate();
        try {
          return deps.repo.insert({
            code,
            originalUrl: input.originalUrl,
            isCustom: 0,
            createdAt: nowIso,
            expiresAt,
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

    redirect(code, countClick) {
      const link = deps.repo.findByCode(code);
      if (link === undefined) {
        throw new NotFoundError();
      }

      const nowIso = deps.clock.now().toISOString();
      if (isExpired(link.expiresAt, nowIso)) {
        throw new LinkExpiredError();
      }

      if (countClick) {
        // The guard is inside the UPDATE; changes === 0 means the link expired
        // between the lookup and the write (D20). No count is lost or doubled.
        if (deps.repo.incrementClick(code, nowIso) === 0) {
          throw new LinkExpiredError();
        }
      }

      return link.originalUrl;
    },

    getStats(code) {
      const link = deps.repo.findByCode(code);
      if (link === undefined) {
        throw new NotFoundError();
      }

      const nowIso = deps.clock.now().toISOString();
      return {
        code: link.code,
        originalUrl: link.originalUrl,
        createdAt: link.createdAt,
        expiresAt: link.expiresAt,
        isExpired: isExpired(link.expiresAt, nowIso),
        isCustom: link.isCustom,
        clickCount: link.clickCount,
        lastClickedAt: link.lastClickedAt,
      };
    },
  };
}
