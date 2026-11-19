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
  /** When present, this is a custom alias; otherwise a code is generated (D6). */
  readonly alias?: string;
  /** Canonical UTC text from the schema, or null/undefined for no expiry (D15). */
  readonly expiresAt?: string | null;
}

/** Service-level statistics; the controller adds shortUrl (D1, D17). */
export interface StatsData {
  readonly code: string;
  readonly originalUrl: string;
  readonly createdAt: string;
  readonly expiresAt: string | null;
  readonly isExpired: boolean;
  readonly isCustom: boolean;
  readonly clickCount: number;
  readonly lastClickedAt: string | null;
}

/** Approved GET /api/links/:code/stats response body (D17). */
export interface LinkStatsResponse extends StatsData {
  readonly shortUrl: string;
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
