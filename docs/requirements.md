# Requirements

> **Status:** Draft. Requirements are confirmed only where they restate `PROJECT.md`.
> Anything derived from an unapproved decision is marked with its D-ID and remains a proposal.
> Decision statuses: [`docs/decisions/DECISION-REGISTER.md`](decisions/DECISION-REGISTER.md).

## Functional requirements

| ID | Requirement | Acceptance criteria | Decision |
|---|---|---|---|
| FR-01 | Create short link | A valid `http`/`https` URL of at most 2048 characters returns `201` with a unique 7-character code and an absolute `shortUrl` built from `PUBLIC_BASE_URL`. | D3, D5, D17, D18 |
| FR-02 | Custom alias | An optional alias of 3–32 `[A-Za-z0-9_-]` characters is reserved when free, stored case-sensitively, and rejected with `409` when already taken. | D6 |
| FR-03 | Redirect | `GET /:code` answers `302` with `Location` set to the exact stored URL. | D4 |
| FR-04 | Click tracking | Each successful redirect increments `click_count` exactly once, in the same transaction as the lookup. | D2, D7 |
| FR-05 | Expiration | A link whose `expiresAt <= now` does not redirect: it returns `410` with `error.code = "LINK_EXPIRED"` and its click count is unchanged. | D7, D15 |
| FR-06 | Statistics | `GET /api/links/:code/stats` returns metadata, `isExpired`, and `clickCount` with `Cache-Control: no-store`. Expired links remain queryable with `200` (proposed). | D3, D7, D17 |
| FR-07 | Validation | Malformed JSON, missing `url`, unparseable URL, non-HTTP(S) scheme, over-long URL, invalid alias, reserved alias, or non-future `expiresAt` returns `400` with the documented error code. | D3, D6, D17, D18 |
| FR-08 | Consistent errors | Every error response uses `{ "error": { "code", "message", "details"? } }`; `500` responses leak no stack traces or paths. | D3, D17 |
| FR-09 | Delete | **Not in the initial scope** unless the user explicitly adds it. The proposal contains no delete endpoint. | D9 (pending) |
| FR-10 | API documentation | Endpoints, payloads, headers, status codes, and error cases are documented in `docs/api-specification.md` before implementation is called complete. | — |

## Non-functional requirements

- Strict TypeScript, type-aware linting, and an ESM codebase that builds with `tsc`.
- Small, understandable codebase; SQL only in repository modules.
- All SQL uses bound parameters; no string interpolation of input.
- `UNIQUE(code)` enforces short-code uniqueness in the database, not only in application code.
- Core service behavior is testable without opening a network port.
- Repository/service tests use an isolated in-memory SQLite database per test.
- Timestamps are canonical UTC `YYYY-MM-DDTHH:mm:ss.sssZ`, produced by an injected clock in
  application code; SQL never calls SQLite date functions.
- `PUBLIC_BASE_URL` is validated at startup and is the only source of the public origin; request
  `Host` / `X-Forwarded-Host` headers are never trusted for URL construction.
- Errors do not expose internal stack traces, filesystem paths, or SQL details.
- No secrets are committed; `.env*` files are never staged.
- Full destination URLs are not logged by default.

These non-functional items restate `PROJECT.md` plus D10–D18 and are subject to the same pending
approval.

## Open questions

All previously open questions now have a **proposal**; none is approved.

| Question | Proposed answer | Status |
|---|---|---|
| Is deletion in the MVP? | No — out of scope, no `DELETE` route, no soft-delete column. | Pending D9 |
| Are statistics available for expired links? | Yes — `200` with `isExpired: true` and the retained click count. | Pending D17 |
| Are custom aliases case-sensitive? | Yes — matches the case-sensitive `UNIQUE` index. | Pending D6 |
| Exact short-code alphabet and length? | Base62, 7 characters, `crypto.randomInt`, 5 collision retries. | Pending D5 |
| Exact maximum destination URL length? | 2048 characters after trimming. | Pending D18 |
| Are URLs with embedded credentials accepted? | No. | Pending D18 |
| Production behaviour when `PUBLIC_BASE_URL` is unset? | Fail fast at startup. | Pending D17 |
| Is `isCustom` exposed in responses? | Proposed yes; low sensitivity. | Pending D17 |
| Node 24 LTS or Node 26 (the sandbox version)? | Node 24 LTS. | Pending D13 |
| `supertest` or built-in `fetch` for API tests? | `supertest` + `@types/supertest`, dev-only. | Pending D8 |
