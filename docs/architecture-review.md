# Architecture Review — Prompt 03

> **Status:** Approved and applied, 2026-11-19. The user approved **D20**, **D21**, and corrections
> **C-1 … C-3**. The decisions are recorded as [`ADR-020`](decisions/ADR-020.md) and
> [`ADR-021`](decisions/ADR-021.md); the corrections are applied across the design documents. D1–D19
> are unchanged, and implementation may begin.
>
> **Scope:** design review only. No code, dependency install, migration, or test was created or run.
> Inputs: `PROJECT.md`, `docs/requirements.md`, `docs/architecture-proposal.md`,
> `docs/api-specification.md`, `docs/database-design.md`, `docs/testing-strategy.md`, and
> `docs/decisions/ADR-001.md` … `ADR-019.md`.

## Verdict

The proposed architecture is **appropriate for the five-hour MVP and should be implemented as
approved**. It is one feature, one table, one process, and one synchronous driver; the four layers
cost roughly six files beyond a flat handler file and buy service-level tests without an HTTP
listener, which is what makes the eleven expiration-boundary cases practical with an injected clock.

Two items needed a decision before scaffolding, and neither was structural: the redirect write path
(**D20**) and the `SQLITE_BUSY` policy (**D21**). Both were approved on 2026-11-19, together with
three corrections that would otherwise have turned into ad-hoc choices during implementation
(**C-1 … C-3**). No change to the requested stack, routes, schema, status codes, or dependency set
(other than completing an already-approved dev list) resulted.

| Proposal element | Verdict | Concrete reason |
|---|---|---|
| Four layers: routes → controllers → services → repository | **Keep** | ~6 files total; the service and generator become testable without a port, which the eleven expiry cases require. |
| Feature module `src/modules/links/` over layer folders | **Keep** | One feature. Layer folders would spread a single change across four directories for no boundary gain. |
| App factory `createApp({ db, clock, config })` | **Keep** | Two call sites (`server.ts`, test helper). The injected clock is the only deterministic way to test `expiresAt <= now`. |
| Repository boundary returning plain typed rows | **Keep**, one rule | Row → DTO mapping (snake_case → camelCase, `isExpired`) belongs in the service; controllers must never see `original_url`. |
| One `links` table, `UNIQUE(code)`, two `CHECK`s | **Keep** | `UNIQUE(code)` is the shared code/alias namespace and the collision signal; fixed-width UTC text makes `expires_at > @now` a valid predicate. |
| API paths (`/api/links`, `/api/links/:code/stats`, `/:code`, `/health`) | **Keep** | The `/api` prefix keeps management routes out of the code namespace; static-before-param registration order is the load-bearing detail. |
| Dependency list | **Keep**, complete it (C-2) | Three runtime packages; the rest are tooling. No runtime addition is justified. |

## 1. Recommended architecture

```text
src/
├── server.ts                     # real db + real clock + validated config → createApp
├── app.ts                        # createApp({ db, clock, config })
├── config.ts                     # PUBLIC_BASE_URL validation, fail-fast in production
├── db/
│   ├── connection.ts             # open db, apply pragmas, typed pragma helper
│   └── schema.ts                 # CREATE TABLE IF NOT EXISTS links
├── modules/links/
│   ├── links.routes.ts           # method + path → controller; no logic
│   ├── links.controller.ts       # parse/validate, call service, shape HTTP
│   ├── links.service.ts          # rules: generation loop, alias conflict, expiry, DTOs
│   ├── links.repository.ts       # SQL only, bound parameters
│   ├── links.schemas.ts          # zod schemas
│   └── links.types.ts            # row, DTO, and outcome types
├── middleware/
│   ├── error-handler.ts          # the only writer of error envelopes
│   └── not-found.ts              # 404 NOT_FOUND
└── lib/
    ├── errors.ts                 # typed application errors (status + code)
    └── code-generator.ts         # 7 Base62 chars via crypto.randomInt
```

**Create path:** route → controller parses with `links.schemas.ts` → service generates or accepts the
code → repository inserts → `UNIQUE` violation becomes `409` (custom alias) or a retry (generated
code, at most five attempts total) → controller returns `201` with `Location`, built from
`PUBLIC_BASE_URL` and never from `Host`.

**Redirect path** (the only path with a write): route → controller passes `req.params.code` → service
loads the row → unknown is `notFound`; `expiresAt !== null && expiresAt <= clock()` is `expired` with
**no write**; otherwise the guarded increment runs, and `changes === 0` is treated as `expired` →
controller answers `302` with the stored destination, then `404`, or `410`.

**Error path:** zod failures, reserved aliases, body-parser failures, `UNIQUE` conflicts, and unknown
codes become typed errors; the error middleware is the single place that writes an error body and the
single place that hides internals from a `500`. Nothing else composes an error response.

**Build order for the timebox:** scaffold + `GET /health` (proves the toolchain and one API test) →
config/db/errors → create → redirect → aliases → expiry → statistics → docs. The health test first is
deliberate: it surfaces Express 5 + supertest + `better-sqlite3` install problems in minutes rather
than at hour four.

## 2. Changes from the proposal and why

| ID | Change | Why (concrete) | Impact | Status |
|---|---|---|---|---|
| **C-1** | **Validation has one owner.** `docs/architecture-proposal.md` §1 said routes "attach validation" *and* that controllers "parse/validate input"; `ADR-001` repeated both. | Two owners guarantee that one of them will be skipped. With zod schemas in `links.schemas.ts`, the controller call is one line and the route stays a pure mapping. | No behavior change. Routes only wire; controllers call `schema.parse` and translate the zod error into `details`. **Applied:** proposal §1, `ADR-001` (dated clarification), `docs/coding-standards.md`. | **Approved 2026-11-19 — applied** |
| **C-2** | **Complete the dev-dependency list** in §6: `eslint`, `@eslint/js`, `typescript-eslint`, `globals` were missing although §7 and D11 approve ESLint 10 with type-aware linting. | `TASKS.md` §1 already lists "ESLint set", so the documents disagreed about what gets installed. Nothing new was proposed — these four are implied by D11. | Documentation only; no new package, no version change. **Applied:** `docs/architecture-proposal.md` §6. | **Approved 2026-11-19 — applied** |
| **C-3** | **Correct the `supertest` description.** `ADR-008` and `docs/testing-strategy.md` said "no port is bound". | `supertest` given an Express app creates an `http.Server` and listens on an **ephemeral loopback port** for the duration of each request, then closes it. The accurate claim is "no fixed port and no manual lifecycle", which is what the tests actually rely on. | D8's substance (use supertest) is unchanged. **Applied:** `ADR-008` (dated correction), `docs/testing-strategy.md`, `docs/architecture-proposal.md` §6. | **Approved 2026-11-19 — applied** |
| **D20** | **Redirect write path:** drop the explicit transaction around lookup + increment; keep the single guarded `UPDATE`; do not increment on `HEAD`. | The guard is already in the statement — `WHERE code = @code AND (expires_at IS NULL OR expires_at > @now)` — so the increment is atomic on its own. With one process and one synchronous connection there is nothing to interleave, and `db.transaction()` only adds a `BEGIN`/`COMMIT` pair per redirect. Separately, Express routes `HEAD` to the `GET` handler, so a monitoring `HEAD /:code` would currently count a click. | `TASKS.md` §4 wording, the query-pattern note in `docs/database-design.md`, and `ADR-007`'s implementation note. No API or schema change. | **Approved 2026-11-19 — [`ADR-020`](decisions/ADR-020.md)** |
| **D21** | **`SQLITE_BUSY` policy:** after `busy_timeout = 5000` the driver's error maps to `500 INTERNAL_ERROR` with a generic message; no retry. | In a single-process, single-connection MVP the only way to hit `SQLITE_BUSY` is an external writer holding the lock. A retry loop adds a second failure path and can hold a request for up to ten seconds to save a case that should not occur; `500` is honest and already in the contract. | Closes the first open question in `docs/database-design.md`. No new error code, no new dependency. | **Approved 2026-11-19 — [`ADR-021`](decisions/ADR-021.md)** |

**Not changed, deliberately:** the four routes, `302`, lazy expiry with retained rows, alias rules,
`UNIQUE(code)` plus the two `CHECK`s, `AUTOINCREMENT`, unindexed `expires_at`, and the runtime
dependency set. Each is already justified in its ADR and none of the reasons has changed.

## 3. Dependency decisions

Versions below are the ranges recorded in `docs/research-findings.md` §2 (verified 2026-11-18) and
approved under D10–D14. They were **not** re-verified in this review, and nothing is installed.

**Runtime — three packages, all load-bearing:**

| Package | Range | Why it is required |
|---|---|---|
| `express` | `^5.3.0` | Request routing and the error middleware. Express 5 forwards rejected promises and thrown errors to the error handler, which is what keeps controllers thin. |
| `better-sqlite3` | `^13.2.0` | Synchronous SQLite driver; synchronous execution is what makes single-statement atomicity sufficient (D20) and keeps transactions simple. |
| `zod` | `^4.6.7` | One schema source for `url`, `alias`, `expiresAt`, and the `details` array. |

**Development:**

| Package | Range | Role |
|---|---|---|
| `typescript` | `^6.0.3` | Strict compile; 6.0.3 because `typescript-eslint` peers `<6.1.0` (D10). |
| `tsx` | `^4.23.15` | `dev`/`start` execution without a build step (D10/D16). |
| `vitest` | `^5.1.1` | Unit, repository, and API tests (D8-related tooling). |
| `eslint`, `@eslint/js`, `typescript-eslint`, `globals` | `^10.15.0`, `^10.0.1`, `^8.73.0`, `^17.14.0` | Type-aware linting (D11) — see C-2. |
| `@types/node`, `@types/express`, `@types/better-sqlite3` | `^24.19.2`, `^5.0.6`, `^9.6.0` | Typings for the runtime, Express 5, and the driver (D12). |
| `supertest`, `@types/supertest` | `^7.3.2`, `^7.2.1` | API integration tests, dev-only (D8). |

### `supertest` versus built-in `fetch`

Both can drive `createApp(deps)`; the difference is lifecycle code and assertion ergonomics.

| Dimension | `supertest` (approved, D8) | Node 24 `fetch` |
|---|---|---|
| How the app is reached | `request(app).get('/health')` — supertest starts an ephemeral listener per request and closes it. | `const server = app.listen(0)` once per suite, read `server.address().port`, `afterAll(() => server.close())`. |
| Per-test code | One chained call: `.expect(200).expect('Content-Type', /json/)`. | `await fetch(url)`, then manual `res.status`, `res.headers.get(...)`, `await res.json()`. |
| Redirect semantics | **Does not follow** `302`; asserts `Location` directly, which is exactly what this API tests. | **Follows** redirects by default; every redirect test must remember `redirect: 'manual'` or it silently fetches the destination. |
| Dependencies | Two dev-only packages | None |
| Failure mode | Library owns teardown. | A missed `close()` or a late listener leaks a handle and hangs the suite or yields `EADDRINUSE`. |
| Typing | `res.body` is `any`, so type-aware lint needs a narrowing helper. | `Response.json()` is `Promise<unknown>`; narrowing is required either way. |

**Recommendation: keep D8 (`supertest`).** With 72 acceptance criteria and eleven expiry cases, the
saved lifecycle and redirect-following code is worth two dev-only packages that never reach
production. The only correction is C-3's wording: supertest binds an ephemeral port and manages it
for you — the suite binds no fixed port and writes no lifecycle code.

The alternative is viable and would cost roughly twenty lines in `tests/helpers/server.ts` plus a
`redirect: 'manual'` discipline that is easy to forget. If you would rather remove the two dev
packages, that is a clean swap and the tests keep the same shape.

## 4. API and database contracts

Authoritative versions: [`api-specification.md`](api-specification.md) and
[`database-design.md`](database-design.md). Summary as reviewed:

**Routes** — static routes registered before the parameter route.

| Method | Path | Success | Notes |
|---|---|---|---|
| `POST` | `/api/links` | `201`, `Location: <shortUrl>` | Body `{ url, alias?, expiresAt? }`; unknown fields ignored (D19). |
| `GET` | `/api/links/:code/stats` | `200`, `Cache-Control: no-store` | Expired link still `200` with `isExpired: true` (D17). |
| `GET` | `/:code` | `302`, `Location: <original_url>` | Case-sensitive lookup. |
| `GET` | `/health` | `200 { "status": "ok" }` | Liveness only, no DB probe (D19). |

**Error envelope** — `{ "error": { "code", "message", "details"? } }`; `details` only on `400`.

| HTTP | `error.code` | Cause |
|---|---|---|
| 400 | `VALIDATION_ERROR` | bad URL, over 2048, bad alias, non-future `expiresAt`, malformed or oversized body |
| 400 | `RESERVED_ALIAS` | alias equals `api` or `health`, compared case-insensitively |
| 404 | `NOT_FOUND` | unknown code or unmatched route |
| 409 | `ALIAS_TAKEN` | custom alias already stored |
| 410 | `LINK_EXPIRED` | `expiresAt <= now` on redirect; no increment |
| 500 | `INTERNAL_ERROR` | unexpected failure, generic message |

**Create response:** `code`, `shortUrl`, `originalUrl`, `createdAt`, `expiresAt`, `isCustom`.
**Statistics response:** the same fields plus `isExpired`, `clickCount`, `lastClickedAt`.

**Schema** — one table, bootstrapped with `CREATE TABLE IF NOT EXISTS`:

```sql
CREATE TABLE IF NOT EXISTS links (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  code            TEXT    NOT NULL UNIQUE,
  original_url    TEXT    NOT NULL,
  is_custom       INTEGER NOT NULL DEFAULT 0 CHECK (is_custom IN (0, 1)),
  click_count     INTEGER NOT NULL DEFAULT 0 CHECK (click_count >= 0),
  created_at      TEXT    NOT NULL,
  expires_at      TEXT,
  last_clicked_at TEXT
);
```

**Invariants and query shapes**

- `UNIQUE(code)` is the shared namespace for generated codes and aliases, and the only uniqueness
  check — never a pre-`SELECT`. The index is case-sensitive (BINARY), matching D6.
- Timestamps are `YYYY-MM-DDTHH:mm:ss.sssZ` only, written by application code through the injected
  clock; fixed width makes text comparison chronological. No `CURRENT_TIMESTAMP` or `datetime('now')`.
- Insert binds `@code, @originalUrl, @isCustom, @createdAt, @expiresAt`.
- Redirect increment: `UPDATE links SET click_count = click_count + 1, last_clicked_at = @now
  WHERE code = @code AND (expires_at IS NULL OR expires_at > @now)`.
- Pragmas on open: `journal_mode = WAL`, `foreign_keys = ON`, `busy_timeout = 5000`,
  `synchronous = NORMAL`. WAL is a no-op for `:memory:`, so tests assert only the other two.

## 5. Risks and testability

| Risk | Impact | Mitigation | How it is checked |
|---|---|---|---|
| `better-sqlite3` prebuild for Node 24 may be unavailable; native build needs a toolchain | Blocks everything at hour 0 | Install first, before other packages; if no prebuild, the timebox is at risk and you should decide before scaffolding | One insert into a fresh database during §1 |
| `supertest` 7 + Express 5 compatibility is unproven (no install yet) | API tests cannot run | Resolve in §1, not later | The `/health` test is the first test written |
| Mapping a `UNIQUE` violation to `409` relies on driver error codes | An alias conflict could surface as `500` | Check the extended `SQLITE_CONSTRAINT_UNIQUE` code rather than matching message text; the service already knows whether the code was generated (retry) or supplied (`409`) | Repository test with a duplicate insert; service test with a stubbed generator returning a conflicting code five times |
| Body-parser failures can escape as Express defaults (`413`, HTML body) | Violates D19's single envelope | Error middleware must check body-parser's error type (`entity.parse.failed`, `entity.too.large`) before the generic branch | Malformed JSON and oversized payload tests |
| Text timestamp comparison breaks if any write path bypasses the clock | Wrong expiry decisions | Repository is the only writer; no SQL time functions | Offset normalization case (`+02:00` → `Z`) and the eleven boundary cases |
| `WAL` is a no-op on `:memory:` | A naive pragma assertion fails | Assert `foreign_keys` and `busy_timeout` only | Pragma test |
| `HEAD /:code` would run the `GET` handler and increment | Probes and prefetches inflate click counts | D20 (approved): no increment for `HEAD` | API test asserting count is unchanged after `HEAD` |
| Click counts include requests the client abandoned before following | Counts are "redirects issued", not "visits" | Accepted as the FR-04 semantic; document it | Repeat-redirect monotonicity test |
| No rate limiting or quota; table grows without deletion | Abuse and unbounded growth | Explicit non-goals (D9, `PROJECT.md`); no retention requirement | Not tested; documented limitation |
| `PUBLIC_BASE_URL` with a trailing slash yields `//code` | Broken `shortUrl` | Normalize to an origin at config validation | Config test with a trailing slash |
| 72 acceptance criteria and 11 boundary cases against five hours | Schedule, not architecture | Build in the §1–§8 order with the health test first; write tests with each capability | `AGENTS.md` §8.2 gate |

**Testability holds up.** `createApp({ db, clock, config })` is importable without binding a fixed
port, `:memory:` gives each test file an isolated database, and the frozen clock removes every
wall-clock dependency. Repository tests can exercise the guard directly. The two untestable-in-unit
areas are honest limitations: `SQLITE_BUSY` needs a second connection or a mock, and the five-attempt
exhaustion path needs a stubbed generator.

## 6. Approval checklist

All items were approved by the user on **2026-11-19**. `[x]` means approved and recorded.

- [x] **C-1** — Validation lives in the controller (zod schema), routes only wire.
- [x] **C-2** — §6's dev-dependency list gains `eslint`, `@eslint/js`, `typescript-eslint`, `globals`.
- [x] **C-3** — `supertest` described as "ephemeral listener, no fixed port, no manual lifecycle".
- [x] **D20** — Redirect: guarded `UPDATE` without an explicit transaction; `HEAD` does not increment
      ([`ADR-020`](decisions/ADR-020.md)).
- [x] **D21** — `SQLITE_BUSY` after `busy_timeout` returns `500 INTERNAL_ERROR`; no retry
      ([`ADR-021`](decisions/ADR-021.md)).
- [x] **D8 stands** — keep `supertest` as the API harness (no change proposed).
- [x] **No stack change** — three runtime dependencies, the approved schema, routes, and status codes.

Applied on 2026-11-19: `ADR-020` and `ADR-021` were written, C-1 … C-3 were applied to the affected
documents, and the register, `TASKS.md`, `ROADMAP.md`, `PROJECT_STATE.md`, `README.md`, and
`CHANGELOG.md` were synchronized. No application code, dependency, install, commit, or push was made.
