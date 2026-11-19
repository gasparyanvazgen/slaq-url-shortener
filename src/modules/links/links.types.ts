/** Values handed to the repository for a new `links` row. */
export interface NewLink {
  readonly code: string;
  readonly originalUrl: string;
  readonly isCustom: 0 | 1;
  readonly createdAt: string;
  readonly expiresAt: string | null;
}

/** The camelCase domain object returned by the repository (D12). */
export interface Link {
  readonly id: number;
  readonly code: string;
  readonly originalUrl: string;
  readonly isCustom: boolean;
  readonly clickCount: number;
  readonly createdAt: string;
  readonly expiresAt: string | null;
  readonly lastClickedAt: string | null;
}

/** Service input; the HTTP layer owns validation and shaping (D1). */
export interface CreateLinkInput {
  readonly originalUrl: string;
}

/** Approved `POST /api/links` response body (D17). */
export interface CreateLinkResponse {
  readonly code: string;
  readonly shortUrl: string;
  readonly originalUrl: string;
  readonly createdAt: string;
  readonly expiresAt: string | null;
  readonly isCustom: boolean;
}
