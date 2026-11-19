# API Specification

> **Status:** Approved. Every statement below is backed by an approved decision: the bodies,
> headers, error codes, `PUBLIC_BASE_URL` rule, and URL limits by D17/D18 (2026-11-18 —
> `ADR-017`, `ADR-018`); unknown body fields, duplicate destinations, `/health` scope, and
> body-parser mapping by D19 (2026-11-19 — `ADR-019`); the routes and error envelope by D3
> (`ADR-003`); the `302` redirect by D4 (`ADR-004`); lazy expiry and `410` by D7 (`ADR-007`); the
> alias rules by D6 (`ADR-006`); the `links` schema by D2 (`ADR-002`); and `HEAD` redirect behavior
> by D20 (`ADR-020`). Nothing here is provisional.

Base URL: the validated `PUBLIC_BASE_URL` (for example `https://slaq.example`). Short URLs are
never built from the request `Host` header.

## Health

`GET /health`

- Success: `200` with `{ "status": "ok" }`.
- Purpose: process liveness only (approved D19). It runs no database query, so `200` does not prove
  the database is reachable; there is no readiness state and no `503`.

## Create link

`POST /api/links`

```json
{
  "url": "https://example.com/path",
  "alias": "optional-custom-alias",
  "expiresAt": "2026-12-31T00:00:00Z"
}
```

| Field | Required | Rules |
|---|---|---|
| `url` | yes | Absolute `http:`/`https:` URL, ≤ 2048 characters after trim, no embedded credentials. |
| `alias` | no | 3–32 characters, `[A-Za-z0-9_-]`, case-sensitive, not `api` or `health` (compared case-insensitively), not already used. |
| `expiresAt` | no | ISO 8601 with offset; normalized to UTC `Z`; must be strictly in the future. |

Field handling (approved D19): unknown body fields are ignored and never stored — only `url`,
`alias`, and `expiresAt` are read. A destination that already exists is **not** deduplicated, so
creating the same `url` twice returns two different codes. A malformed JSON body or a payload above
the body-parser limit returns `400 VALIDATION_ERROR`, never `413`.

Success response — `201 Created`, `Location: <shortUrl>` (approved D17):

```json
{
  "code": "aB3xY9z",
  "shortUrl": "https://slaq.example/aB3xY9z",
  "originalUrl": "https://example.com/very/long",
  "createdAt": "2026-11-18T12:00:00.000Z",
  "expiresAt": null,
  "isCustom": false
}
```

Failures: `400 VALIDATION_ERROR`, `400 RESERVED_ALIAS`, `409 ALIAS_TAKEN`, `500 INTERNAL_ERROR`
(approved D17).

## Redirect

`GET /:code`

- Success: `302 Found` with `Location` set to the exact stored destination. No response body is
  required.
- Unknown code: `404` with `NOT_FOUND`.
- Expired code: `410` with `LINK_EXPIRED`; the click count is **not** incremented.
- Codes are matched case-sensitively.
- `HEAD /:code` returns the same status and `Location` without incrementing the click count
  (approved D20). Only `GET` counts as a click.

```http
HTTP/1.1 302 Found
Location: https://example.com/very/long
```

## Statistics

`GET /api/links/:code/stats`

Success response — `200 OK`, `Cache-Control: no-store` (approved D17):

```json
{
  "code": "aB3xY9z",
  "shortUrl": "https://slaq.example/aB3xY9z",
  "originalUrl": "https://example.com/very/long",
  "createdAt": "2026-11-18T12:00:00.000Z",
  "expiresAt": "2026-12-31T00:00:00.000Z",
  "isExpired": false,
  "isCustom": true,
  "clickCount": 3,
  "lastClickedAt": "2026-11-18T12:04:11.482Z"
}
```

- Unknown code: `404 NOT_FOUND`.
- Expired code: `200` with `isExpired: true` and the retained count (approved D17,
  2026-11-18).
- `lastClickedAt` is `null` until the first successful redirect.

## Error response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "url must be a valid http or https URL",
    "details": [
      { "path": "url", "message": "Invalid URL" }
    ]
  }
}
```

`details` is optional and appears only for `400` validation failures.

| HTTP | `error.code` | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | malformed or oversized body, bad URL, over-long URL, invalid alias, non-future expiry |
| 400 | `RESERVED_ALIAS` | alias equals `api` or `health` |
| 404 | `NOT_FOUND` | unknown code, or any unmatched route |
| 409 | `ALIAS_TAKEN` | alias already exists |
| 410 | `LINK_EXPIRED` | code exists but `expiresAt <= now` |
| 500 | `INTERNAL_ERROR` | unexpected failure; message is generic |

## Headers and caching

- `Content-Type: application/json; charset=utf-8` on JSON responses.
- `Location` on `201` (short URL) and `302` (destination).
- `Cache-Control: no-store` on statistics responses, because click counts change.
- No `Cache-Control` override on the redirect beyond Express defaults.

## Decision status

Approved on 2026-11-18 (`ADR-017`, `ADR-018`, `ADR-009`):

- The create and statistics bodies above, including the echoed `originalUrl`.
- Expired statistics return `200` with `isExpired: true` and the retained count, not `410`.
- `isCustom` is exposed.
- `PUBLIC_BASE_URL` validation and production fail-fast; `shortUrl` never comes from `Host`.
- Deletion stays out of scope, so no delete route exists.
- URL length, scheme allow-list, and embedded-credential rejection.

Approved on 2026-11-19 (`ADR-001` … `ADR-007`):

- The route set and error envelope — `POST /api/links`, `GET /api/links/:code/stats`,
  `GET /:code`, `GET /health`, with static routes registered before `/:code` (D3).
- `302 Found` on redirect, so repeat visits keep being counted (D4).
- Alias rules: 3–32 characters, `[A-Za-z0-9_-]`, case-sensitive, reserved names `api` and `health`
  compared case-insensitively (D6).
- Lazy expiry on redirect and statistics; `410 LINK_EXPIRED` without a click increment; expired rows
  retained and readable through statistics (D7).
- The `links` schema with `UNIQUE(code)` and `CHECK` constraints limited to `click_count >= 0` and
  `is_custom IN (0,1)` (D2). Codes are 7 Base62 characters with five generation attempts in total
  (D5).

Approved on 2026-11-19 (`ADR-020`, `ADR-021`):

- `HEAD /:code` mirrors the `GET` redirect status and `Location` but never increments
  `clickCount` or `lastClickedAt` (D20).
- The redirect increment is one guarded `UPDATE` with no explicit transaction (D20). This is
  internal and does not change any response.
- `SQLITE_BUSY` maps to `500 INTERNAL_ERROR` with a generic message and no retry (D21); no new
  status or error code is introduced.

Resolved on 2026-11-19 (`ADR-019`, D19). No gap remains open:

- Unknown body fields are ignored and never stored (Q-2).
- Duplicate destinations are not deduplicated (Q-3).
- `GET /health` is liveness only, with no database probe and no `503` (Q-4).
- Body-parser failures — malformed JSON and payloads above the default limit — map to
  `400 VALIDATION_ERROR`; no `413` is introduced (Q-5).
