import type { NextFunction, Request, Response } from 'express';

import {
  AppError,
  type ErrorCode,
  type ErrorDetail,
} from '../lib/errors.js';

const GENERIC_MESSAGE = 'Internal server error';

interface ErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    details?: readonly ErrorDetail[];
  };
}

/** Express's JSON body parser reports these shapes (D19). */
function isBodyParserError(error: Error): boolean {
  if (!('type' in error)) {
    return false;
  }
  return error.type === 'entity.parse.failed' || error.type === 'entity.too.large';
}

/** D21: the driver exposes the SQLite code on the error object. */
function isBusyError(error: Error): boolean {
  return 'code' in error && error.code === 'SQLITE_BUSY';
}

function sendError(
  res: Response,
  status: number,
  code: ErrorCode,
  message: string,
  details?: readonly ErrorDetail[],
): void {
  const body: ErrorBody = {
    error: details === undefined ? { code, message } : { code, message, details },
  };
  res.status(status).json(body);
}

/**
 * The single place that writes an error body. Expected failures use their own
 * status and documented code; everything else becomes a generic 500 with the
 * detail logged only on the server (D3, D21).
 */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Express identifies error middleware by its four-argument arity.
  void _next;

  if (!(error instanceof Error)) {
    console.error('[error] non-error rejection', error);
    sendError(res, 500, 'INTERNAL_ERROR', GENERIC_MESSAGE);
    return;
  }

  if (isBodyParserError(error)) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Request body could not be parsed');
    return;
  }

  if (error instanceof AppError) {
    sendError(res, error.status, error.code, error.message, error.details);
    return;
  }

  if (isBusyError(error)) {
    console.error('[error] SQLITE_BUSY', error);
    sendError(res, 500, 'INTERNAL_ERROR', GENERIC_MESSAGE);
    return;
  }

  console.error('[error] unexpected failure', error);
  sendError(res, 500, 'INTERNAL_ERROR', GENERIC_MESSAGE);
}
