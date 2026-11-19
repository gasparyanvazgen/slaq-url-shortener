import type { NextFunction, Request, Response } from 'express';

import type { AppConfig } from '../../config.js';
import { ValidationError } from '../../lib/errors.js';
import { createLinkSchema } from './links.schemas.js';
import type { LinkService } from './links.service.js';
import type { CreateLinkResponse } from './links.types.js';

export interface LinksController {
  create(req: Request, res: Response, next: NextFunction): void;
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

        const link = deps.service.createLink({ originalUrl: parsed.data.url });
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
  };
}
