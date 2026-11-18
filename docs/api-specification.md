# API Specification — Draft

> **Status:** Draft proposal. The routes come from `docs/architecture-proposal.md`; the bodies,
> headers, and error codes are proposed under D3, D17, and D18 and are **not approved**.
> Nothing here may be described as a finalized contract until the register says Approved.

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

Proposed success response — `201 Created`, `Location: <shortUrl>`:

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

Proposed failures: `400 VALIDATION_ERROR`, `400 RESERVED_ALIAS`, `409 ALIAS_TAKEN`,
`500 INTERNAL_ERROR`.

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

Proposed success response — `200 OK`, `Cache-Control: no-store`:

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
- Expired code: proposed `200` with `isExpired: true` and the retained count (pending D17).
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

## API decisions still required

- Approve the create and statistics bodies (D17), including whether `originalUrl` is echoed.
- Approve the expired-statistics policy: `200` + `isExpired` or `410`.
- Approve whether `isCustom` is exposed.
- Approve the `PUBLIC_BASE_URL` validation and production fail-fast rule.
- Confirm deletion stays out of scope (D9).
- Approve the URL length and scheme limits (D18).
