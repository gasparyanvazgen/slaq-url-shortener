import type { NextFunction, Request, Response } from 'express';

import type { AppConfig } from '../../config.js';
import { ValidationError } from '../../lib/errors.js';
import { createLinkSchema } from './links.schemas.js';
import type { LinkService } from './links.service.js';
import type { CreateLinkResponse, LinkStatsResponse } from './links.types.js';

export interface LinksController {
  create(req: Request, res: Response, next: NextFunction): void;
  redirect(req: Request, res: Response, next: NextFunction): void;
  stats(req: Request, res: Response, next: NextFunction): void;
}

export interface LinksControllerDependencies {
  readonly service: LinkService;
  readonly config: AppConfig;
}

/** HTTP boundary: validate input, call the service, and shape the response (D1). */
export function createLinksController(deps: LinksControllerDependencies): LinksController {
  return {
    create(req, res, next) {
      try {
        const parsed = createLinkSchema.safeParse(req.body);
        if (!parsed.success) {
          const details = parsed.error.issues.map((issue) => ({
            path: issue.path.join('.') || 'url',
            message: issue.message,
          }));
          throw new ValidationError('Request validation failed', details);
        }

        const link = deps.service.createLink({
          originalUrl: parsed.data.url,
          alias: parsed.data.alias,
          expiresAt: parsed.data.expiresAt,
        });
        const shortUrl = `${deps.config.publicBaseUrl}/${link.code}`;
        const body: CreateLinkResponse = {
          code: link.code,
          shortUrl,
          originalUrl: link.originalUrl,
          createdAt: link.createdAt,
          expiresAt: link.expiresAt,
          isCustom: link.isCustom,
        };

        res.setHeader('Location', shortUrl);
        res.status(201).json(body);
      } catch (error: unknown) {
        next(error);
      }
    },

    redirect(req, res, next) {
      try {
        const rawCode = req.params.code;
        const code = typeof rawCode === 'string' ? rawCode : '';
        const destination = deps.service.redirect(code, req.method === 'GET');
        res.setHeader('Location', destination);
        res.status(302).end();
      } catch (error: unknown) {
        next(error);
      }
    },

    stats(req, res, next) {
      try {
        const rawCode = req.params.code;
        const code = typeof rawCode === 'string' ? rawCode : '';
        const data = deps.service.getStats(code);
        const body: LinkStatsResponse = {
          code: data.code,
          shortUrl: `${deps.config.publicBaseUrl}/${data.code}`,
          originalUrl: data.originalUrl,
          createdAt: data.createdAt,
          expiresAt: data.expiresAt,
          isExpired: data.isExpired,
          isCustom: data.isCustom,
          clickCount: data.clickCount,
          lastClickedAt: data.lastClickedAt,
        };
        // Click counts change between reads, so this response is never cached (D17).
        res.setHeader('Cache-Control', 'no-store');
        res.status(200).json(body);
      } catch (error: unknown) {
        next(error);
      }
    },
  };
}
