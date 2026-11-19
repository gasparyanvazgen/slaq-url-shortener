import type { NextFunction, Request, Response } from 'express';

import { NotFoundError } from '../lib/errors.js';

/** Unmatched routes become the standard 404 envelope (D3). */
export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError('Route not found'));
}
