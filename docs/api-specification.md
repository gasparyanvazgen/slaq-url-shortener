# API Specification — Draft

This is based on the initial architecture proposal and requires approval.

## Health

`GET /health`

- Success: `200`
- Purpose: process liveness only; do not claim it proves every dependency is healthy unless it checks them.

## Create link

`POST /api/links`

Example body:

```json
{
  "url": "https://example.com/path",
  "alias": "optional-custom-alias",
  "expiresAt": "2026-12-31T00:00:00Z"
}
```

- Success: `201`
- Expected validation: URL must parse and use HTTP or HTTPS; alias and expiry rules are pending approval.
- Response shape must be finalized before implementation.

## Redirect

`GET /:code`

- Success: proposed `302` with `Location` header.
- Unknown code: proposed `404`.
- Expired code: proposed `410`.

## Statistics

`GET /api/links/:code/stats`

- Success: proposed `200`.
- Unknown code: proposed `404`.
- Decide whether expired links remain queryable.

## Error response

Proposed common shape:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

Validation errors may include `details`.

## API decisions still required

- Exact response body for creation and statistics.
- Whether to include short URL in create response and how base URL is configured.
- Whether delete is in scope.
- Whether stats endpoint reveals original URL.
