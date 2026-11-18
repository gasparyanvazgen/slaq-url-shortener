# Testing Strategy

> **Status:** Draft. The test harness and the toolchain-facing cases follow the decisions approved
> on 2026-11-18 (D8–D18). Cases that depend on D1–D7 are labeled as proposals and may change if the
> user amends them.

## Test layers

1. **Unit tests** — code generator, validation rules, timestamp/expiry helpers, error mapping.
2. **Repository tests** — schema creation, uniqueness, pragma values, atomic click increment.
3. **API integration tests** — request/response behavior, headers, status codes, error shape.
4. **Configuration tests** — `PUBLIC_BASE_URL` validation and production fail-fast.

## Tooling

- Vitest for all layers; `vitest run` in CI and in the `AGENTS.md` §8.2 gate (never watch mode).
- API tests use `supertest` (approved 2026-11-18, D8 —
  [`decisions/ADR-008.md`](decisions/ADR-008.md)) with `createApp(deps)` in-process. No port is
  bound and no server is started by the test suite.
- Tests inject a fixed clock and an isolated `:memory:` database; no test may depend on the real
  current time or on another test's rows.

## Important cases

### Code generation
- Output matches the approved alphabet and length (7 Base62 characters).
- Uses `crypto.randomInt`, not `Math.random`.
- Collision retry succeeds on the second attempt and gives up after five with the documented
  error.
- Generated codes never exceed the alias length bounds.

### Create
- Valid URL returns `201`, a code, and an absolute `shortUrl`.
- Invalid URL, unsupported protocol (`javascript:`, `ftp:`), and protocol-relative URL are `400`.
- Empty, whitespace-only, and 2049-character URLs are `400`; a 2048-character URL is accepted.
- URL with embedded credentials is rejected (approved D18).
- Custom alias success; alias conflict `409`; invalid charset/length `400`; reserved `api`/
  `health` `400 RESERVED_ALIAS`.
- `expiresAt` in the past or exactly `now` is `400`; a future value is accepted and normalized to
  `Z`.
- Unknown body fields are ignored or rejected per the approved schema (must be stated once).

### Redirect
- Existing active code returns `302` with the exact destination in `Location`.
- Unknown code returns `404` with the documented envelope.
- Expired code returns `410 LINK_EXPIRED` and does **not** increment the count.
- A successful redirect increments the count exactly once and sets `lastClickedAt`.
- Repeated redirects increment monotonically.

### Statistics
- Correct metadata and count for an active link.
- Unknown code returns `404`.
- Expired link behavior per the approved contract: `200` with `isExpired: true` (approved D17).
- Response carries `Cache-Control: no-store`.

### Configuration and security regressions
- `PUBLIC_BASE_URL` missing in production throws at startup (fail fast).
- Invalid scheme, embedded credentials, path/query/fragment, or over-long value is rejected.
- A valid value is normalized to its origin (no trailing slash).
- **Host-injection regression:** a request with `Host: evil.example` and
  `X-Forwarded-Host: evil.example` still returns a `shortUrl` built from `PUBLIC_BASE_URL`.
- Error responses contain no stack trace, filesystem path, or SQL text.
- Aliases cannot shadow `/api` or `/health`.

### Database
- Schema creation is idempotent (running it twice does not throw).
- `UNIQUE(code)` rejects a duplicate insert.
- Once D2 is approved, its `CHECK` constraints must reject negative counts and non-boolean
  `is_custom` (D2 is still Pending User Approval).
- Pragma test asserts `foreign_keys = 1` and `busy_timeout = 5000`; it must not assert WAL on
  `:memory:`.
- Typed-pragma helper returns a value without `any` or a lint suppression.
- `lastInsertRowid` is normalized from `number | bigint` before use.

## The eleven expiration-boundary cases

All use an injected clock; `now` is fixed per test.

1. `expiresAt` one millisecond **before** `now` → `410`, count unchanged.
2. `expiresAt` **exactly equal** to `now` → `410` (inclusive `<=` boundary).
3. `expiresAt` one millisecond **after** `now` → `302`, count increments.
4. `expiresAt` equal to `createdAt` → rejected at creation (`400`), never stored.
5. `expiresAt` in the past at creation → `400`.
6. `expiresAt` supplied with a `+02:00` offset → stored normalized to the same instant in `Z`.
7. Fractional seconds other than three digits → normalized to exactly three digits on output.
8. `null` `expiresAt` → never expires, even far in the future.
9. Statistics for an expired link → `200` with `isExpired: true` and the retained count.
10. Redirect for an expired link → `410` and no increment, even on repeated requests.
11. An active and an expired link in the same database do not affect each other's counts or
    responses.

## Test database

Prefer an isolated SQLite `:memory:` database per test or test suite. `:memory:` is per
connection, so create the app and database together in a factory and close them in teardown. If a
shared cache is used, make the sharing explicit and reset rows between tests. Never share a file
database across parallel test files.

## Evidence

Report the exact test command and actual result. A test that was written but not run is not a
passing test. `AGENTS.md` §8.2 requires
`npm run typecheck && npm run lint && npm test && npm run build` before work is called complete;
none of it can run until scaffolding exists.
