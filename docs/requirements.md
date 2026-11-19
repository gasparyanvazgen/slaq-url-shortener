# Requirements

> **Status:** Approved — Prompt 02 output, finalized 2026-11-19. Every requirement is now
> **Confirmed** or **Out of scope**: D1–D7 were approved on 2026-11-19 (`ADR-001` … `ADR-007`), so
> nothing here depends on a pending decision. Each requirement still states the decisions it cites.
>
> **No gap remains open and no decision is pending.** On 2026-11-19 the user approved D1–D7 as
> recommended — with the `createApp({ db, clock, config })` deps object (D1) and five generation
> attempts in total (D5) — after adopting the proposed defaults for **Q-2** … **Q-5** (**D19**,
> [`decisions/ADR-019.md`](decisions/ADR-019.md)) and reconfirming that deletion stays out of the
> MVP (D9).
>
> Sources: `PROJECT.md` (capabilities and non-goals), `docs/decisions/DECISION-REGISTER.md`
> (status), `docs/api-specification.md` (contract), `docs/database-design.md`,
> `docs/testing-strategy.md`, `docs/security-guidelines.md`.

## Status vocabulary

| Label | Meaning in this document |
|---|---|
| **Confirmed** | Backed by `PROJECT.md` or an approved decision. Testable as written. |
| **Out of scope** | Explicitly excluded by an approved decision; recorded for traceability. |

Approved decisions used here — all nineteen: D1 (layers and the deps object), D2 (schema and the
two `CHECK` constraints), D3 (routes and error envelope), D4 (`302`), D5 (7-character Base62 codes,
five generation attempts in total), D6 (aliases), D7 (lazy expiry, `410`, retained rows), D8
(`supertest`), D9 (no deletion; reconfirmed 2026-11-19), D10–D16 (TypeScript, ESLint, driver, Node,
dependencies, timestamps, ESM), D17 (API contracts, `PUBLIC_BASE_URL`, Host-header safety), D18
(destination URL scheme, length, credentials), and D19 (unknown fields ignored, no
duplicate-destination deduplication, `/health` liveness only, body-parser failures mapped to
`400 VALIDATION_ERROR`).

## MVP scope baseline

The ten capabilities in `PROJECT.md` remain the scope. Unchanged non-goals: user accounts or
authentication, a frontend or dashboard, multi-tenancy, per-click analytics history, QR codes,
background jobs, Redis/queues/microservices/cloud infrastructure, production deployment and custom
domains, and rate limiting or abuse detection.

| `PROJECT.md` capability | Requirement |
|---|---|
| 1. Create a short URL with a generated code | FR-01 |
| 2. Optional custom aliases | FR-02 |
| 3. Redirect from `/:code` | FR-03 |
| 4. Track total clicks | FR-04 |
| 5. Optional expiration | FR-05 |
| 6. Basic URL statistics | FR-06 |
| 7. Validate request data | FR-07 |
| 8. Consistent errors | FR-08 |
| 9. Automated tests | NFR-08, plus the "Tests needed" list of each requirement |
| 10. Document the REST API | FR-12 |

FR-09 (deletion) records an approved exclusion; FR-10 (health) and FR-11 (startup configuration)
are supporting behaviors the approved contract already implies (D17, D19).

## Requirement summary

| ID | Requirement | Status | Decisions |
|---|---|---|---|
| FR-01 | Create a short link with a generated code | **Confirmed** | D2, D3, D5, D17, D18, D19 |
| FR-02 | Custom alias creation | **Confirmed** | D2, D5, D6 |
| FR-03 | Redirect from a short code | **Confirmed** | D2, D3, D4, D7 |
| FR-04 | Click tracking on redirect | **Confirmed** | D2, D7 |
| FR-05 | Expiration | **Confirmed** | D7, D15 |
| FR-06 | Statistics | **Confirmed** | D2, D3, D7, D17 |
| FR-07 | Request validation | **Confirmed** | D3, D6, D7, D17, D18, D19 |
| FR-08 | Consistent error contract | **Confirmed** | D3, D17, D19 |
| FR-09 | Delete a link | **Out of scope** | D9 approved |
| FR-10 | Health check | **Confirmed** | D3, D19 |
| FR-11 | Startup configuration and `PUBLIC_BASE_URL` | **Confirmed** | D17 approved |
| FR-12 | REST API documentation | **Confirmed** | `PROJECT.md` #10 |

---

## FR-01 — Create a short link with a generated code

**Status:** Confirmed. The capability is confirmed (`PROJECT.md` #1); the route and error envelope
by D3, persistence by D2, and code generation by D5 (`ADR-003`, `ADR-002`, `ADR-005`), with the
response body and destination rules by D17/D18 and unknown-field and no-duplicate-destination
behavior by D19.

**Inputs**

- `POST /api/links` (route: D3). No authentication.
- `Content-Type: application/json`.
- Body: `url` (string, required), `alias` (string, optional — see FR-02), `expiresAt` (ISO 8601
  string, optional — see FR-05).

**Expected success behavior**

- `201 Created` with `Location: <shortUrl>` and a JSON body containing `code`, `shortUrl`,
  `originalUrl`, `createdAt`, `expiresAt`, `isCustom` (approved contract, D17).
- `code` is a generated 7-character Base62 value that is not already stored (D5).
- `shortUrl` is `${PUBLIC_BASE_URL}/${code}`; the origin comes only from validated configuration,
  never from `Host` / `X-Forwarded-Host` (D17).
- `originalUrl` echoes the destination after trimming, without path/query rewriting (D18).
- `createdAt` is the current instant in canonical UTC `YYYY-MM-DDTHH:mm:ss.sssZ` from the injected
  clock (D15). `expiresAt` is `null` when omitted.
- Unknown body fields are ignored and never stored (D19): only `url`, `alias`, and `expiresAt` are
  read, and extra fields never change the outcome.
- A destination that is already stored is **not** deduplicated (D19): every successful create
  stores a new row with a new code, so the same `url` created twice yields two links.
- Exactly one `links` row is inserted, before the response is sent.

**Validation rules**

| Input | Rule | Source |
|---|---|---|
| body | Must be a JSON object; a missing, non-object, or unparseable body is a validation failure. | D3 |
| `url` | Required string. Trimmed; 1–2048 characters after trimming. | D18 |
| `url` | Absolute, parseable URL with scheme exactly `http:` or `https:`. | D18 |
| `url` | No embedded credentials (`user:pass@`). | D18 |
| `url` | Stored as submitted after trimming — no host lowercasing, default-port removal, or trailing-slash normalization. | D18 |
| `alias` | See FR-02. | D6 |
| `expiresAt` | Valid ISO 8601 instant with an offset; normalized to `Z`; strictly later than now. | D15 |
| unknown fields | Ignored (stripped) rather than rejected; only documented fields are read. | D19 |

**Error cases and status codes**

| Condition | Status | `error.code` | Source |
|---|---|---|---|
| Missing, malformed, or non-object body | 400 | `VALIDATION_ERROR` | D3, D17 |
| `url` missing, not a string, or empty after trimming | 400 | `VALIDATION_ERROR` | D17, D18 |
| Unparseable URL, non-HTTP(S) scheme, protocol-relative value | 400 | `VALIDATION_ERROR` | D18 |
| URL longer than 2048 characters after trimming | 400 | `VALIDATION_ERROR` | D18 |
| URL with embedded credentials | 400 | `VALIDATION_ERROR` | D18 |
| Invalid alias, reserved alias, or alias conflict | 400 / 400 / 409 | `VALIDATION_ERROR` / `RESERVED_ALIAS` / `ALIAS_TAKEN` | FR-02 (D6) |
| `expiresAt` invalid, unparseable, or not strictly future | 400 | `VALIDATION_ERROR` | D15, D17 |
| Five generation attempts in total exhausted by collisions | 500 | `INTERNAL_ERROR` | D5 |
| Unexpected database or runtime failure | 500 | `INTERNAL_ERROR` | D17 |

A generated-code collision is retried internally and is never exposed as `409`.

**Data changes**

One row in `links`: `code`, `original_url` (trimmed), `is_custom = 0` for generated codes,
`click_count = 0`, `created_at = now`, `expires_at` (normalized or `NULL`),
`last_clicked_at = NULL`. No other table is written. A failed insert leaves no row and no
partially written state.

**Acceptance criteria**

1. AC-01.1 — A valid `https://example.com/path` request returns `201`, and the body contains
   `code`, `shortUrl`, `originalUrl`, `createdAt`, `expiresAt: null`, `isCustom: false`.
2. AC-01.2 — `shortUrl` equals `${PUBLIC_BASE_URL}/${code}` and `Location` equals `shortUrl`.
3. AC-01.3 — `createdAt` is the injected clock value formatted as `YYYY-MM-DDTHH:mm:ss.sssZ`.
4. AC-01.4 — A 2048-character URL is accepted; 2049 characters, `ftp:`, `javascript:`, `data:`,
   `file:`, protocol-relative, unparseable, and credentialed URLs are rejected with `400`.
5. AC-01.5 — The created row is immediately retrievable through FR-06 with the same metadata.
6. AC-01.6 — With the generator forced to collide, creation still succeeds and the stored code is
   unique; after five collisions the response is `500 INTERNAL_ERROR` and no row is written.
7. AC-01.7 — A request carrying `Host: evil.example` and `X-Forwarded-Host: evil.example` still
   returns a `shortUrl` on the configured `PUBLIC_BASE_URL` (D17 regression).
8. AC-01.8 — JSON responses carry `Content-Type: application/json; charset=utf-8`.
9. AC-01.9 — A request carrying an extra field such as `tags: ["a"]` returns `201` exactly as the
   same request without it; the extra value is not stored (D19).
10. AC-01.10 — Creating the same `url` twice produces two distinct codes and two rows; neither
    request is answered with `409` or deduplicated (D19).

**Tests needed**

- API integration: happy path body and `Location`; status/content type; 2048/2049 boundary;
  scheme allow-list; credentialed URL; empty and whitespace-only URL; malformed JSON; missing
  `url`; wrong field types; Host-injection regression; an extra body field is ignored; the same
  destination created twice returns two distinct codes.
- Unit: generator alphabet, length, `crypto.randomInt` usage, retry-then-fail behavior.
- Repository: insert stores the exact trimmed URL and canonical timestamps.
- Service: `INTERNAL_ERROR` mapping when the insert fails.

---

## FR-02 — Custom alias creation

**Status:** Confirmed. The capability is confirmed (`PROJECT.md` #2); every alias rule, including
reserved names and case sensitivity, is approved by **D6** (`ADR-006`), and the shared namespace by
**D2** (`ADR-002`).

**Inputs**

- The optional `alias` field on `POST /api/links` (FR-01).

**Expected success behavior**

- `201 Created` with the same body shape as FR-01, `code` equal to the alias exactly, and
  `isCustom: true`.
- The alias is reserved by inserting the row; `UNIQUE(code)` is the durable guarantee, and the row
  participates in the same namespace as generated codes (D2).
- A custom alias becomes immediately redirectable through FR-03.

**Validation rules**

| Rule | Source |
|---|---|
| 3–32 characters inclusive. | D6 |
| Only `[A-Za-z0-9_-]`; surrounding whitespace is not trimmed and therefore fails the charset rule. | D6 |
| Case-sensitive: `MyLink` and `mylink` are different aliases. | D6 |
| Must not equal a reserved name, compared case-insensitively: `api`, `health` (so `API` and `Health` are also rejected). | D6 |
| Must not already exist in the shared `code` namespace, including a generated code. | D5, D2 |

**Error cases and status codes**

| Condition | Status | `error.code` |
|---|---|---|
| Length or character-set violation, including an empty string | 400 | `VALIDATION_ERROR` |
| Alias equal to `api` or `health` | 400 | `RESERVED_ALIAS` |
| Alias already stored (custom or generated) | 409 | `ALIAS_TAKEN` |
| Concurrent insert loses the uniqueness race | 409 | `ALIAS_TAKEN` |
| Unexpected failure | 500 | `INTERNAL_ERROR` |

**Data changes**

One `links` row with `code = alias`, `is_custom = 1`, and the same defaults as FR-01. No extra
row and no separate alias table.

**Acceptance criteria**

1. AC-02.1 — `alias: "my-link"` returns `201` with `code: "my-link"`, `isCustom: true`, and
   `shortUrl` ending in `/my-link`.
2. AC-02.2 — `"ab"`, a 33-character alias, `"my.link"`, `"my link"`, and `""` each return `400
   VALIDATION_ERROR`.
3. AC-02.3 — `"api"` and `"health"` return `400 RESERVED_ALIAS`; `"API"` is accepted.
4. AC-02.4 — A second request with the same alias returns `409 ALIAS_TAKEN` and inserts no row.
5. AC-02.5 — An alias identical to an existing generated code returns `409 ALIAS_TAKEN`.
6. AC-02.6 — `"MyLink"` and `"mylink"` both succeed and redirect independently.
7. AC-02.7 — Two concurrent creates with the same alias produce one `201` and one `409`, never two
   rows.

**Tests needed**

- API integration: success body; each length/charset failure; reserved names and case variant;
  duplicate alias; alias equal to a generated code.
- Repository: `UNIQUE` violation is translated to `ALIAS_TAKEN`, not `500`.
- Concurrency: sequential double insert with service-level handling; uniqueness asserted in SQL.

---

## FR-03 — Redirect from a short code

**Status:** Confirmed. The capability is confirmed (`PROJECT.md` #3); the route (D3), `302` status
(D4), and expired-link `410` (D7) are approved (`ADR-003`, `ADR-004`, `ADR-007`).

**Inputs**

- `GET /:code` — a single path segment; no body and no required headers.
- Codes are matched case-sensitively against the stored value (D2, D6).

**Expected success behavior**

- An existing, unexpired code returns `302 Found` with `Location` set to the exact stored
  `original_url`, including its path, query, and fragment.
- No response body is required; no destination is fetched or validated again at redirect time.
- The response is sent only after the click increment for that redirect has been committed
  (FR-04).
- No caching header is added that would let a client cache the redirect beyond Express defaults.

**Validation rules**

- The code must exist and must not be expired (`expiresAt` absent or `> now`, D15).
- `/api/...` and `/health` are never treated as codes because their routes are registered first;
  reserved aliases are rejected at creation instead (D3, D6).

**Error cases and status codes**

| Condition | Status | `error.code` |
|---|---|---|
| Unknown code | 404 | `NOT_FOUND` |
| Code exists but `expiresAt <= now` | 410 | `LINK_EXPIRED` |
| Multiple path segments or an unmatched route | 404 | `NOT_FOUND` |

**Data changes**

On `302` only: `click_count = click_count + 1` and `last_clicked_at = now` for that row (FR-04).
On `404` and `410`: no write.

**Acceptance criteria**

1. AC-03.1 — A stored code returns `302` and `Location` byte-for-byte equal to the stored URL.
2. AC-03.2 — A destination containing a query string and fragment is preserved exactly.
3. AC-03.3 — An unknown code returns `404` with the error envelope and no stack trace.
4. AC-03.4 — An expired code returns `410 LINK_EXPIRED` on every request.
5. AC-03.5 — `301` and `307` are never returned.
6. AC-03.6 — Lookup is case-sensitive: a differently cased code returns `404`.
7. AC-03.7 — `/health` and `/api/links` still resolve to their own handlers when a link named
   `health` or `api` could have existed (reservation is tested at creation, FR-02).

**Tests needed**

- API integration: `302` and exact `Location`; query/fragment preservation; unknown code; expired
  code; case mismatch; unmatched multi-segment path.
- Service: expired link is not redirected and produces no write.
- Security regression: no `Location` value ever originates from request input.

---

## FR-04 — Click tracking on redirect

**Status:** Confirmed. Cumulative click counting is confirmed (`PROJECT.md` #4); atomicity and the
exact conditional write are approved by **D2** and **D7** (`ADR-002`, `ADR-007`).

**Inputs**

- A successful FR-03 redirect. There is no separate endpoint, query parameter, or body field.

**Expected success behavior**

- Each `302` increments `click_count` by exactly one and sets `last_clicked_at` to the redirect
  instant in canonical UTC (D15).
- The lookup and increment happen in one transaction: the count is written only for a link that
  was both found and unexpired.
- Repeated and concurrent redirects each add one; the count is monotonic and never negative.
- No other operation changes the count: statistics reads, creations, `404`s, and `410`s do not.

**Validation rules**

- Only `302` responses increment; an expired link never increments even when requested repeatedly
  (D7).
- `last_clicked_at` starts as `NULL` and is `NULL` until the first successful redirect.

**Error cases and status codes**

- No dedicated error path. A failed increment must not turn a valid redirect into a `500` after
  the redirect decision; if the transaction fails, the redirect is not sent and the request
  returns `500 INTERNAL_ERROR` with no count change. (The ordering is settled at implementation;
  the requirement is that no redirect is sent without a committed increment.)

**Data changes**

`UPDATE links SET click_count = click_count + 1, last_clicked_at = @now WHERE code = @code AND
(expires_at IS NULL OR expires_at > @now)`, inside the same transaction as the lookup. Zero rows
changed means the link expired between lookup and update, and the response becomes `410`/`404`.

**Acceptance criteria**

1. AC-04.1 — A new link reports `clickCount: 0` and `lastClickedAt: null` (FR-06).
2. AC-04.2 — After three redirects, `clickCount` is `3` and `lastClickedAt` equals the last
   redirect instant.
3. AC-04.3 — Requests to unknown codes and to expired codes leave both `clickCount` and
   `lastClickedAt` unchanged.
4. AC-04.4 — Reading statistics does not change either value.
5. AC-04.5 — Concurrent redirects of the same code produce a count equal to the number of
   requests; none is lost or double counted.
6. AC-04.6 — No redirect succeeds unless its increment committed.

**Tests needed**

- API integration: count after one and several redirects; `410` and `404` do not increment;
  statistics does not increment.
- Repository: atomic conditional update; `changes === 0` for expired rows; monotonic increments.
- Concurrency: repeated sequential and parallel requests against one code.

---

## FR-05 — Expiration

**Status:** Confirmed. Input format and boundary are approved (D15); `410` on redirect, lazy
evaluation, and row retention are approved by **D7** (`ADR-007`).

**Inputs**

- Optional `expiresAt` at creation (FR-01), and the stored value read on redirect and statistics.

**Expected success behavior**

- An omitted or `null` `expiresAt` never expires.
- A link is expired when `expiresAt <= now`; expired links return `410 LINK_EXPIRED` on redirect
  and never increment clicks.
- Expired rows are retained, so FR-06 still reports their metadata and final click count with
  `200` and `isExpired: true` (D17, approved).
- No background job, scheduler, or cleanup process exists; expiry is evaluated per request.

**Validation rules**

| Rule | Source |
|---|---|
| ISO 8601 instant with an offset; normalized to UTC `Z` on storage and output. | D15 |
| Must be strictly later than `now` at creation (`expiresAt === now` is rejected). | D15 |
| Comparison uses `expiresAt <= now` — equality counts as expired. | D15 |
| No retention minimum, no maximum horizon, and no timezone default are introduced. | D15 |

**Error cases and status codes**

| Condition | Status | `error.code` |
|---|---|---|
| `expiresAt` unparseable or lacking a valid instant | 400 | `VALIDATION_ERROR` |
| `expiresAt` in the past or exactly `now` at creation | 400 | `VALIDATION_ERROR` |
| Redirect of an expired code | 410 | `LINK_EXPIRED` |
| Statistics of an expired code | 200 | — (body has `isExpired: true`) |

**Data changes**

Expiry evaluation writes nothing. The row, its `click_count`, and `last_clicked_at` are preserved
after expiry; nothing is deleted, archived, or flagged (D9, D7).

**Acceptance criteria**

1. AC-05.1 — Creation with `expiresAt` one millisecond in the future succeeds; exactly `now` and
   one millisecond in the past both return `400 VALIDATION_ERROR`.
2. AC-05.2 — `expiresAt` with a `+02:00` offset is stored and returned as the same instant in `Z`
   with exactly three fractional digits.
3. AC-05.3 — At `expiresAt === now` the redirect returns `410` and the count is unchanged;
   one millisecond before, it returns `302` and increments.
4. AC-05.4 — `expiresAt: null` never expires.
5. AC-05.5 — Repeating an expired redirect keeps returning `410` with no increments.
6. AC-05.6 — Statistics for the expired link still return `200`, `isExpired: true`, and the final
   count.
7. AC-05.7 — All eleven boundary cases in `docs/testing-strategy.md` pass with a frozen clock.

**Tests needed**

- Unit: expiry predicate at `-1 ms`, `0`, `+1 ms`; timestamp normalization.
- API integration: the eleven documented boundary cases.
- Repository: expired rows remain readable and unchanged after failed redirects.

---

## FR-06 — Statistics

**Status:** Confirmed. The response body, `200` for expired links, and `no-store` are approved
(D17); the route and envelope by **D3**, metadata by **D2**, and expiry reporting by **D7**
(`ADR-003`, `ADR-002`, `ADR-007`).

**Inputs**

- `GET /api/links/:code/stats` (route: D3); code matched case-sensitively.
- No body, no authentication, no pagination.

**Expected success behavior**

- `200 OK` with `Cache-Control: no-store` and a JSON body: `code`, `shortUrl`, `originalUrl`,
  `createdAt`, `expiresAt`, `isExpired`, `isCustom`, `clickCount`, `lastClickedAt` (D17).
- `isExpired` is computed from the injected clock at request time using `expiresAt <= now` (D15).
- `lastClickedAt` is `null` until the first successful redirect.
- The response is read-only: it never increments or updates anything.

**Validation rules**

- The code must exist; expired links are valid statistics targets (D17, approved).
- No query parameters are defined; unknown query parameters are ignored. (No decision covers
  this; it is not part of the contract either way.)

**Error cases and status codes**

| Condition | Status | `error.code` |
|---|---|---|
| Unknown code | 404 | `NOT_FOUND` |
| Expired code | 200 | — (`isExpired: true`) |
| Unexpected failure | 500 | `INTERNAL_ERROR` |

**Data changes**

None. Statistics is a read-only operation.

**Acceptance criteria**

1. AC-06.1 — An active link returns every documented field with correct values.
2. AC-06.2 — `shortUrl` uses `PUBLIC_BASE_URL` and `Location`-style origin rules, unaffected by
   `Host`.
3. AC-06.3 — `isExpired` is `false` before `expiresAt` and `true` at or after it.
4. AC-06.4 — `Cache-Control: no-store` is present on every statistics response.
5. AC-06.5 — An unknown code returns `404` with the error envelope.
6. AC-06.6 — Repeated statistics requests leave `clickCount` and `lastClickedAt` unchanged.
7. AC-06.7 — `isCustom` is `true` for aliases and `false` for generated codes.

**Tests needed**

- API integration: full body for active, alias-created, never-clicked, and expired links;
  `no-store`; unknown code; Host-injection regression.
- Service: `isExpired` at the boundary with a frozen clock.
- Repository: read-only query returns stored metadata without mutation.

---

## FR-07 — Request validation

**Status:** Confirmed. URL rules (D18), error codes (D17), unknown-field and body-parser handling
(D19), route-level behavior (D3), alias rules (D6), and expiry input (D7) are all approved.

**Inputs**

- Every externally supplied value: request body fields, path parameters, and headers that affect
  parsing (`Content-Type`).

**Validation rules**

| Input | Accepted | Rejected with |
|---|---|---|
| `Content-Type` | `application/json` (parameters allowed); a JSON body sent as another type is not parsed and fails validation. | 400 `VALIDATION_ERROR` |
| Body | JSON object; a malformed JSON body or a payload above the default limit becomes a parser failure (D19) | 400 `VALIDATION_ERROR` for malformed JSON, empty body, array, or scalar |
| `url` | String, trimmed 1–2048 characters, absolute `http:`/`https:`, no credentials | 400 `VALIDATION_ERROR` |
| `alias` | String, 3–32 characters, `[A-Za-z0-9_-]`, not reserved, unused | 400 `VALIDATION_ERROR`, `RESERVED_ALIAS`, or `ALIAS_TAKEN` (FR-02) |
| `expiresAt` | ISO 8601 instant, strictly future | 400 `VALIDATION_ERROR` |
| Unknown body fields | Ignored (stripped); only `url`, `alias`, and `expiresAt` are read (D19) | Never rejected |
| Oversized body (above the Express default limit) | Parser failure maps to the shared envelope; the default limit is kept and no `413` is added (D19) | 400 `VALIDATION_ERROR` |
| Path `:code` | Any single segment; lookup is exact and case-sensitive | `404 NOT_FOUND` when absent |

Validation happens once, at the HTTP boundary, before any service call or database access. A
request with several invalid fields returns one `400` response; the order of reported `details` is
not part of the contract. Validation is pure: no row is written for a rejected request.

**Error cases and status codes**

All input failures return `400` with `error.code = "VALIDATION_ERROR"` (or the specific alias code)
and an optional `details` array of `{ path, message }` entries. No validation failure returns
`500`, and no rejected request performs a database write.

**Data changes**

None for any rejected request.

**Acceptance criteria**

1. AC-07.1 — Malformed JSON, an empty body, a JSON array, and a JSON scalar each return `400
   VALIDATION_ERROR` with the envelope.
2. AC-07.2 — A non-string `url`, a non-string `alias`, and a non-string `expiresAt` are each
   rejected with `400`.
3. AC-07.3 — Leading and trailing whitespace around a valid `url` is trimmed and the trimmed value
   is stored.
4. AC-07.4 — A whitespace-only `url` is rejected.
5. AC-07.5 — Unknown fields are ignored on every create request: the response is identical to the
   same request without them, nothing extra is stored, and `docs/api-specification.md` states the
   rule (D19).
6. AC-07.6 — Validation failures insert no rows.
7. AC-07.7 — A payload above the body-parser limit returns `400 VALIDATION_ERROR` in the shared
   envelope, never `413` or `500` (D19).

**Tests needed**

- Unit: schema acceptance/rejection matrix for each field, including boundary lengths 2047/2048/
  2049, alias 2/3/32/33, and timestamp formats.
- API integration: malformed JSON, wrong content type, array/scalar body, mixed valid and invalid
  fields, whitespace trimming, an unknown field being ignored, and an oversized payload mapping to
  `400 VALIDATION_ERROR`.
- Repository: no writes on validation failure (assert row count).

---

## FR-08 — Consistent error contract

**Status:** Confirmed. The envelope, error codes, and no-internals rule are approved (D17); the
route-level `404` and the exact envelope for unmatched routes are approved by **D3** (`ADR-003`).

**Inputs**

- Any request that fails validation, targets a missing resource, or hits an unexpected error.

**Expected success behavior (error behavior)**

- Every error response has `Content-Type: application/json; charset=utf-8` and the body
  `{ "error": { "code": string, "message": string, "details"?: [{ "path", "message" }] } }`.
- `details` appears only for `400` validation failures.
- Codes are exactly `VALIDATION_ERROR`, `RESERVED_ALIAS`, `NOT_FOUND`, `ALIAS_TAKEN`,
  `LINK_EXPIRED`, `INTERNAL_ERROR`.
- `500` responses use a generic message and never include stack traces, filesystem paths, SQL, or
  driver errors; the detail is logged server-side only.
- Unmatched routes (including wrong methods on known paths) return `404 NOT_FOUND` in the same
  envelope, not Express's default HTML page.

**Validation rules**

- Each condition maps to one status and one code, as listed in FR-01 to FR-07.
- Error messages are human-readable and never echo sensitive values (full destination URLs,
  credentials, or environment values).

**Error cases and status codes**

| HTTP | `error.code` | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Malformed or oversized body, invalid URL or expiry, invalid alias syntax |
| 400 | `RESERVED_ALIAS` | Alias names a reserved route |
| 404 | `NOT_FOUND` | Unknown code or unmatched route |
| 409 | `ALIAS_TAKEN` | Alias already stored |
| 410 | `LINK_EXPIRED` | Existing code past its expiry |
| 500 | `INTERNAL_ERROR` | Unexpected failure |

**Data changes**

None; error handling never writes.

**Acceptance criteria**

1. AC-08.1 — Every documented failure returns the envelope with a non-empty `code` and `message`.
2. AC-08.2 — Only `400` responses may include `details`; `404`, `409`, `410`, and `500` never do.
3. AC-08.3 — A forced database failure returns `500 INTERNAL_ERROR` whose body contains no stack,
   path, or SQL text.
4. AC-08.4 — `GET /unknown/route` and `DELETE /api/links/x` return `404 NOT_FOUND` in JSON.
5. AC-08.5 — No response uses an ad-hoc error shape or a bare string.
6. AC-08.6 — A body-parser failure (malformed JSON or a payload above the limit) produces the
   shared envelope with `VALIDATION_ERROR`; no `413`, no `500`, and no default HTML error page
   (D19).

**Tests needed**

- API integration: one case per documented error code; assert exact envelope keys and absence of
  `details` where forbidden; assert JSON content type.
- Regression: an injected `Error` with a stack produces a generic `500`.
- Route: unmatched path and method handling.
- API integration: body-parser failures (malformed JSON, oversized payload) use the shared
  envelope with `VALIDATION_ERROR`.

---

## FR-09 — Delete a link

**Status:** **Out of scope — confirmed.** Deletion was excluded by the user's approval of D9 on
2026-11-18 and the user reconfirmed on 2026-11-19 that it stays out of the MVP
([`decisions/ADR-009.md`](decisions/ADR-009.md)). This document records that approval; it does not
re-decide it. Changing it requires a new decision superseding `ADR-009`.

**Requirement**

- No `DELETE` route exists for links, and no `deleted_at` / `is_deleted` column exists.
- No read path filters deleted rows, because there is no deletion state.
- `TASKS.md` lists deletion as post-MVP work, not as "if time remains" within the MVP.

**Inputs**

- None. Any `DELETE /api/links/:code` request is an unmatched route.

**Expected behavior**

- `DELETE /api/links/:code` returns `404 NOT_FOUND` in the standard envelope (D3).
- Links remain redirectable and their statistics remain readable for the life of the database.

**Data changes**

None. Rows are never removed by the application (expired rows are retained, D7).

**Acceptance criteria**

1. AC-09.1 — No route handler for `DELETE` exists; the request returns `404 NOT_FOUND`.
2. AC-09.2 — The `links` schema has no deletion column.
3. AC-09.3 — Redirect and statistics work identically before and after any request that attempts
   deletion.
4. AC-09.4 — `PROJECT.md`, `docs/api-specification.md`, `TASKS.md`, and this document all describe
   deletion as excluded or post-MVP.

**Tests needed**

- API integration: `DELETE /api/links/:code` returns `404` and the link still redirects.
- Schema: no deletion column is present.

---

## FR-10 — Health check

**Status:** Confirmed. The behavior is approved as liveness only, with no database probe (**D19**),
and the route set that registers `/health` is approved (**D3**, `ADR-003`).

**Inputs**

- `GET /health`. No body, no authentication, no parameters.

**Expected success behavior**

- `200 OK` with `{ "status": "ok" }` and a JSON content type.
- Process liveness only: no database query, so it answers while the database is unavailable
  (D19). A readiness probe is out of scope, and no `503` not-ready state exists.

**Validation rules**

- None beyond the route matching exactly `/health`.

**Error cases and status codes**

| Condition | Status | `error.code` |
|---|---|---|
| Unexpected failure | 500 | `INTERNAL_ERROR` |

**Data changes**

None.

**Acceptance criteria**

1. AC-10.1 — `GET /health` returns `200` with `{ "status": "ok" }`.
2. AC-10.2 — The response is JSON and carries no `Cache-Control: no-store` requirement.
3. AC-10.3 — With the database closed, `GET /health` still answers `200` with `{ "status": "ok" }`
   (D19).

**Tests needed**

- API integration: status, body, content type.
- Configuration: the app factory answers health with the database closed (liveness only, D19).

---

## FR-11 — Startup configuration and `PUBLIC_BASE_URL`

**Status:** **Confirmed** (D17, 2026-11-18 —
[`decisions/ADR-017.md`](decisions/ADR-017.md)).

**Inputs**

- Environment variables read once at startup: `NODE_ENV`, `PORT`, `PUBLIC_BASE_URL`.

**Expected success behavior**

- `PUBLIC_BASE_URL` is trimmed, checked, and normalized with `new URL(value).origin` (no trailing
  slash, no path), then used as the only source of `shortUrl`.
- In development, a missing `PUBLIC_BASE_URL` defaults to `http://localhost:${PORT}`.
- In production, a missing or invalid `PUBLIC_BASE_URL` aborts startup before the listener opens.
- `Host`, `X-Forwarded-Host`, and forwarded-protocol headers are never read for URL construction.
- `PORT` defaults to `3000` (proposal; no decision records a default) and must be an integer in
  1–65535.

**Validation rules**

| Rule | Source |
|---|---|
| Absolute URL with scheme `http:` or `https:`. | D17 |
| No embedded credentials. | D17 |
| No path, query, or fragment; only an origin. | D17 |
| Maximum 2048 characters after trimming. | D17 |
| Failure in production is fatal (non-zero exit), not a warning or fallback. | D17 |

**Error cases and status codes**

- No HTTP response: startup fails before listening, with a clear log line naming the variable and
  the failed rule (never printing a credential-bearing value).

**Data changes**

None.

**Acceptance criteria**

1. AC-11.1 — Missing `PUBLIC_BASE_URL` with `NODE_ENV=production` throws before `listen`.
2. AC-11.2 — `ftp://…`, `https://user:pass@host`, `https://host/path`, `https://host?q=1`,
   `https://host#f`, a relative value, and a 2049-character value are each rejected.
3. AC-11.3 — `https://slaq.example/` normalizes to `https://slaq.example`.
4. AC-11.4 — Development without the variable yields `http://localhost:${PORT}`.
5. AC-11.5 — Forged `Host` headers cannot change any generated `shortUrl`.

**Tests needed**

- Configuration unit tests for every accept/reject case and normalization.
- Startup test: production without the variable rejects before binding a port.
- API regression: Host-injection through create and statistics.

---

## FR-12 — REST API documentation

**Status:** **Confirmed** (`PROJECT.md` #10).

**Inputs**

- The implemented routes, payloads, headers, status codes, and error codes.

**Expected success behavior**

- `docs/api-specification.md` documents every endpoint, request field, response field, header,
  status code, and error code before implementation is called complete.
- `README.md` documents install, configuration, run, test, and known limitations.
- Documentation is updated in the same change as any behavior change; no route or field ships
  documented differently from its implementation.

**Validation rules**

- Every documented example is valid against the implemented schema, and every implemented error
  code appears in the table.

**Error cases and status codes**

- Documentation defects are review findings, not runtime errors.

**Data changes**

None.

**Acceptance criteria**

1. AC-12.1 — Each of FR-01 … FR-11 maps to a documented endpoint or startup behavior.
2. AC-12.2 — The documented error table matches the implemented codes exactly.
3. AC-12.3 — Known limitations (no auth, no rate limiting, public statistics, no deletion) are
   stated in the README.

**Tests needed**

- Review check: endpoint list and error table compared against routes and tests.
- No automated documentation test in the MVP.

---

## Non-functional requirements

### NFR-01 — Toolchain and type safety

**Status:** Confirmed (D10–D16). **Requirement:** TypeScript 6.0.3 with `strict` and
`noUncheckedIndexedAccess`, type-aware ESLint 10 flat config, native ESM with `nodenext` and `.js`
import extensions, Node.js 24 LTS, caret ranges with a committed lockfile.
**Acceptance:** `npm run typecheck && npm run lint && npm test && npm run build` passes from a clean
`npm ci`. **Tests:** the gate itself; no separate test file.

### NFR-02 — Layered, testable architecture

**Status:** Confirmed (D1). **Requirement:** routes → controllers → services → repository inside
one `links` feature module, with deps-object factories (`createApp({ db, clock, config })`,
`createLinkService({ repo, clock, config })`); controllers never run SQL, services never touch
`req`/`res`.
**Acceptance:** redirect and create rules are covered by service tests with no HTTP server, and no
SQL appears outside repository modules. **Tests:** service and repository suites; a review check
for SQL placement.

### NFR-03 — Input, SQL, and redirect safety

**Status:** Confirmed (D2, D6, D17, D18). **Requirement:** all SQL uses
bound parameters; the scheme allow-list is enforced before storage; `Location` is always the exact
stored value; the service never fetches the destination; internal errors are not exposed.
**Acceptance:** no query is assembled from input; a forged `Host` cannot influence output; no
response contains stack, path, or SQL text. **Tests:** validation matrix, Host-injection
regression, forced-failure `500` test.

### NFR-04 — Data integrity

**Status:** Confirmed (D2). **Requirement:** `UNIQUE(code)` enforces the shared code/alias
namespace; `CHECK (click_count >= 0)` and `CHECK (is_custom IN (0, 1))` guard the two invariant
columns; the schema is created idempotently at startup; pragmas `foreign_keys = ON`,
`busy_timeout = 5000`, WAL for file databases.
**Acceptance:** duplicate insert fails at the database level; schema creation twice does not throw;
pragma values are asserted (never WAL on `:memory:`). **Tests:** repository and schema tests.

### NFR-05 — Time handling

**Status:** Confirmed (D15). **Requirement:** all timestamps are canonical UTC
`YYYY-MM-DDTHH:mm:ss.sssZ` from `toISOString()` through an injected clock; SQLite date functions
are never used; expiry uses `expiresAt <= now`.
**Acceptance:** tests can freeze time and get deterministic results; no timestamp is produced by
SQL. **Tests:** boundary cases and normalization tests.

### NFR-06 — Reliability and documented limits

**Status:** Confirmed. **Requirement:** one synchronous process and one SQLite connection;
no rate limiting, queues, cache layer, or background jobs in the MVP; redirects cost one lookup and
one conditional update inside a transaction; `SQLITE_BUSY` waits up to `busy_timeout` and then
surfaces `500 INTERNAL_ERROR` with no retry loop (no decision covers this; it is the default this
requirement records).
**Acceptance:** no unbounded retry; no in-memory state required for correctness; the README states
the operational limits. **Tests:** none beyond the gate; concurrency behavior covered by FR-04.
No throughput or latency target is claimed.

### NFR-07 — Privacy and logging

**Status:** Confirmed (D17 plus `AGENTS.md` §4). **Requirement:** full destination URLs are
not logged by default; logs record code and status instead; environment values and credentials are
never logged; error bodies stay generic.
**Acceptance:** no `console.log` or logger call includes an `originalUrl` value; the `500` test
inspects the response body. **Tests:** review check plus the FR-08 forced-failure test.

### NFR-08 — Deterministic tests

**Status:** Confirmed (D8, D15). **Requirement:** every test uses `supertest` against in-process
`createApp({ db, clock, config })`, an isolated `:memory:` database per test, and a fixed clock; no
test binds a port, reads the wall clock, or depends on another test's rows.
**Acceptance:** `npm test` passes repeatedly in any order; no test opens a listening socket.
**Tests:** repository/service/API suites, run by `npm test`.

### NFR-09 — Dependency discipline

**Status:** Confirmed (D8, D14, `AGENTS.md` §3). **Requirement:** only the approved dependency set
(`express`, `better-sqlite3`, `zod`; dev: TypeScript, ESLint set, `typescript-eslint`, `globals`,
`tsx`, `vitest`, `supertest`, and the `@types` packages) is installed at the approved ranges.
**Acceptance:** `package.json` matches `PROJECT.md`; the lockfile is committed; no `latest`.
**Tests:** review check against `PROJECT.md`.

---

## Contradictions and gaps

### C-1 — Link deletion is resolved, not re-decided here

`PROJECT.md` lists no deletion capability, `docs/api-specification.md` has no delete route, and
`TASKS.md` previously listed deletion under "Deferred unless time remains". The user approved
**D9** on 2026-11-18: deletion is **out of scope**, with no endpoint and no `deleted_at` column
([`ADR-009.md`](decisions/ADR-009.md)). FR-09 therefore records that approval, and `TASKS.md` now
lists deletion as post-MVP rather than optional in-MVP work. Nothing about deletion was decided
silently: opening it now would require a new decision superseding `ADR-009`.

### Gaps resolved on 2026-11-19 (D19)

The user adopted the proposed default for each gap and reconfirmed that deletion stays out of the
MVP. Each answer is now a confirmed requirement, recorded as **D19**
([`decisions/ADR-019.md`](decisions/ADR-019.md)) and cited directly by the requirements above.

| ID | Gap | Adopted answer | Settled in |
|---|---|---|---|
| Q-2 | Unknown body fields | Ignored (stripped); only documented fields are read. | FR-01, FR-07 (AC-01.9, AC-07.5) |
| Q-3 | Duplicate destination URLs | No deduplication: every successful create produces a new link and code. | FR-01 (AC-01.10) |
| Q-4 | `/health` scope | Liveness only: no database probe, no readiness state. | FR-10 (AC-10.3) |
| Q-5 | Body-parser failures (malformed JSON and oversized payloads) | Map every body-parser failure to `400 VALIDATION_ERROR`; keep Express's default body limit; add no `413` and no new code. | FR-07, FR-08 (AC-07.7, AC-08.6) |

No gap remains open and no decision is pending. With D1–D7 approved on 2026-11-19, every
acceptance criterion below is backed by `PROJECT.md` or an approved decision; none is provisional.

## Confirmed scope summary

- **Confirmed:** FR-01 … FR-08, FR-10, FR-11, and FR-12 in full — capabilities from `PROJECT.md`
  #1–#8 and #10, with the layers and deps object (D1), schema (D2), routes and envelope (D3),
  redirect status (D4), code generation (D5), aliases (D6), expiry (D7), and the contract details
  from D15–D19.
- **Out of scope:** FR-09 — deletion, excluded by D9 and reconfirmed 2026-11-19.
- **Not in this document:** implementation. Approving these requirements approved no code; no test
  has been run.

## Evidence

Nothing in this document has been implemented or tested; there is no `package.json`, so the
`AGENTS.md` §8.2 gate cannot run. Once implementation starts, each acceptance criterion is checked
off only with the test named in its "Tests needed" list.
