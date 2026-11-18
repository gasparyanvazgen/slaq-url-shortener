# API Specification — Draft

> **Status:** Partially approved. The bodies, headers, error codes, `PUBLIC_BASE_URL` rule, and URL
> limits are **approved** under D17/D18 (2026-11-18 — `ADR-017`, `ADR-018`). The route set and the
> error-envelope shape still come from **D3, which remains Pending User Approval**, as do the
> redirect status (D4), expiry behavior (D7), alias rules (D6), and the schema (D2). Treat those as
> proposals.

Base URL: the validated `PUBLIC_BASE_URL` (for example `https://slaq.example`). Short URLs are
never built from the request `Host` header.

## Health

`GET /health`

- Success: `200` with `{ "status": "ok" }`.
- Purpose: process liveness only. It does not prove the database is reachable unless it checks it.

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
| `alias` | no | 3–32 characters, `[A-Za-z0-9_-]`, case-sensitive, not `api` or `health`, not already used. |
| `expiresAt` | no | ISO 8601 with offset; normalized to UTC `Z`; must be strictly in the future. |

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
| 400 | `VALIDATION_ERROR` | malformed body, bad URL, over-long URL, invalid alias, non-future expiry |
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

Still pending and therefore provisional in this document:

- The route set and the error-envelope shape (D3).
- Alias rules, case sensitivity, and reserved names (D6).
- The `302` redirect status (D4) and lazy expiry with `410` (D7).
- The `links` schema and its `CHECK` constraints (D2).
