/** The fixed error-code table from the approved API contract (D3, D17). */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'RESERVED_ALIAS'
  | 'NOT_FOUND'
  | 'ALIAS_TAKEN'
  | 'LINK_EXPIRED'
  | 'INTERNAL_ERROR';

/** A field-level validation problem; only 400 validation errors carry details. */
export interface ErrorDetail {
  readonly path: string;
  readonly message: string;
}

/** Base class for expected failures; the error middleware is the only writer. */
export class AppError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details?: readonly ErrorDetail[];

  constructor(status: number, code: ErrorCode, message: string, details?: readonly ErrorDetail[]) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: readonly ErrorDetail[]) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class ReservedAliasError extends AppError {
  constructor(message = 'Alias is reserved') {
    super(400, 'RESERVED_ALIAS', message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, 'NOT_FOUND', message);
  }
}

export class AliasTakenError extends AppError {
  constructor(message = 'Alias is already taken') {
    super(409, 'ALIAS_TAKEN', message);
  }
}

export class LinkExpiredError extends AppError {
  constructor(message = 'Link has expired') {
    super(410, 'LINK_EXPIRED', message);
  }
}

export class InternalError extends AppError {
  constructor(message = 'Internal server error') {
    super(500, 'INTERNAL_ERROR', message);
  }
}
