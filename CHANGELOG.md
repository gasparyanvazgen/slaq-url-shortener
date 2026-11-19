# Changelog

## Unreleased

### 2026-11-19 — §§4–7 redirect, aliases, expiration, and statistics implemented and verified

Each section was implemented with tests first and its own full gate run; §4 was added first because
§6's redirect boundary cases depend on it (confirmed with the user).

- **§4 redirect and click tracking:** `links.repository.ts` gained `incrementClick(code, nowIso)`, a
  single guarded `UPDATE … WHERE code = @code AND (expires_at IS NULL OR expires_at > @now)` with no
  explicit transaction (D20). `src/lib/expiry.ts` holds the shared `expiresAt <= now` predicate
  (D15). `createRedirectRouter` mounts explicit `GET /:code` and `HEAD /:code` handlers after
  `/health` and `/api`; only `GET` increments. §4 gate: 174 tests in 11 files.
- **§5 custom aliases:** `links.schemas.ts` validates 3–32 `[A-Za-z0-9_-]` characters without
  trimming (D6); `links.service.ts` rejects `api`/`health` case-insensitively and maps the existing
  `UNIQUE(code)` violation to `409 ALIAS_TAKEN`, including collisions with generated codes. The
  contrary AC-02.3 line was confirmed stale by the user. §5 gate: 162 tests in 10 files.
- **§6 expiration:** `expiresAt` must be an ISO instant with an explicit offset, is normalized with
  `toISOString()`, and must be strictly later than the injected clock's `now` (D15). Expired
  redirects return `410 LINK_EXPIRED` with no write; rows are never deleted (D7). All eleven
  expiration-boundary cases from `docs/testing-strategy.md` pass with a mutable injected clock, plus
  unit tests for the predicate and timestamp normalization. §6 gate: 195 tests in 13 files.
- **§7 statistics:** `GET /api/links/:code/stats` returns all nine approved fields with
  `Cache-Control: no-store`, uses `PUBLIC_BASE_URL` only for `shortUrl`, reports expired links as
  `200` with `isExpired: true`, and returns `404 NOT_FOUND` for unknown codes (D17). A read-only
  stats route was introduced in §6 for boundary case 9 and completed here. §7 gate: 204 tests in
  14 files.
- Tests added: `tests/redirect.test.ts`, `tests/alias.test.ts`, `tests/expiration.test.ts`,
  `tests/expiry.test.ts`, `tests/stats.test.ts`, plus repository increment tests and a narrowed
  unmatched-route path in `tests/errors.test.ts`.
- Final verification after the §8 review fix: `npm run typecheck && npm run lint && npm test &&
  npm run build` — all four pass; 14 test files, 204 tests, 867 ms. No dependency changed; no
  commit or push was made.

### 2026-11-19 — §3 create short links implemented and verified

- Added `src/lib/code-generator.ts`: a 7-character Base62 generator using `crypto.randomInt` over an
  exported 62-character alphabet (D5). A factory accepts an injected random source for deterministic
  collision tests; `Math.random` is never used.
- Added `src/modules/links/links.types.ts` and `links.repository.ts`. The repository prepares bound
  `INSERT` and `SELECT` statements once, maps the snake_case driver row to the camelCase `Link`
  domain object, normalizes `lastInsertRowid`, and translates only `SQLITE_CONSTRAINT_UNIQUE` into
  `UniqueCodeError` (D2, D12). No existence pre-check and no transaction.
- Added `links.service.ts`: trims nothing itself, uses the injected clock for `createdAt`, inserts
  `expires_at = NULL`, retries at most five generation attempts in total, and maps exhaustion to a
  generic `InternalError`/`500 INTERNAL_ERROR` (D5, D15).
- Added `links.schemas.ts`, `links.controller.ts`, and `links.routes.ts`. The controller validates
  `url` at the HTTP boundary: trimmed, absolute `http:`/`https:` only, 2048-character cap, embedded
  credentials rejected, unknown fields stripped (D18, D19). Alias and expiry validation remain
  assigned to §§5–6.
- `src/app.ts` now builds the repository, service, and controller from the injected deps and serves
  `POST /api/links` with `201`, the approved JSON body, and `Location` built only from the validated
  `PUBLIC_BASE_URL` (D17). Host and forwarded-host headers are ignored.
- The user resolved the open database-filename question to a fixed `slaq.db` in the process working
  directory. `src/server.ts` now opens that file, runs the idempotent schema bootstrap, and then
  calls `listen`; config errors still abort before any database handle exists. `*.db` files are
  ignored by Git.
- Added 37 tests across `tests/code-generator.test.ts`, `tests/links-repository.test.ts`,
  `tests/links-service.test.ts`, and `tests/create-link.test.ts`, covering AC-01.1 … AC-01.10 where
  in scope: exact body/Location, injected clock, 2048/2049 boundary, rejected schemes and
  credentials, repository round-trip, Host-header regression, unknown-field stripping, no
  destination deduplication, collision retry, and five-attempt exhaustion with no extra row.
  AC-01.5 is verified through the repository because the statistics endpoint belongs to §7.
- The tests were written first: the red run failed with four "Cannot find module" errors for the new
  modules. Two tests covering alias/expiry field types were removed before the final run because
  those validations belong to §§5–6.
- Verification: `npm run typecheck && npm run lint && npm test && npm run build` — all four pass;
  9 test files, 146 tests, 776 ms. No dependency changed; no commit or push was made.

### 2026-11-19 — §2 database and shared infrastructure implemented and verified

- Added `src/db/connection.ts` (`openDatabase(filename)`): opens `better-sqlite3`, applies
  `foreign_keys = ON`, `busy_timeout = 5000`, and `synchronous = NORMAL`, plus `journal_mode = WAL`
  only for file databases (`:memory:` ignores WAL). Measured in-memory pragma values are `1`,
  `5000`, and `1` respectively.
- Added `src/db/schema.ts` with the approved D2 `CREATE TABLE IF NOT EXISTS links` verbatim, including
  `UNIQUE(code)` and exactly the two approved `CHECK` constraints (`click_count >= 0`,
  `is_custom IN (0, 1)`). No other table, index, or constraint was added.
- Added the typed driver helpers `src/db/pragma.ts` (`pragmaValue` with a `PragmaMap`-keyed cast) and
  `src/db/id.ts` (`toSafeId` normalizes `number | bigint` and rejects unsafe integers). No `any`,
  `@ts-ignore`, or lint suppression.
- Added `src/lib/errors.ts` with `AppError` and six subclasses carrying the D3/D17 status/code pairs,
  plus `src/middleware/error-handler.ts` (the sole error-body writer) and
  `src/middleware/not-found.ts` (forwards `NotFoundError`).
- D21: a `SQLITE_BUSY` driver error is logged server-side with its detail and returned as a generic
  `500 INTERNAL_ERROR` with no retry and no SQLite text in the body. Unexpected errors follow the
  same generic response; body-parser failures map to `400 VALIDATION_ERROR` (D19).
- `src/app.ts` now registers `express.json()`, the not-found handler, and the error middleware. No
  link routes were added.
- Added 18 tests (`tests/database.test.ts`, `tests/errors.test.ts`) covering pragma values,
  idempotent schema creation, `UNIQUE(code)`, both CHECKs, `toSafeId`, every error-code mapping, the
  404 envelope, generic 500 with no leak, `SQLITE_BUSY` logging, and malformed/oversized JSON bodies.
- Verification: `npm run typecheck && npm run lint && npm test && npm run build` — all four pass;
  5 test files, 109 tests, 688 ms. One initial lint error on the deliberately unused fourth Express
  error-middleware argument was resolved with `void _next;`. No dependency changed; no commit or push
  was made.
- At this point the database filename was still undecided, so `src/server.ts` passed a `db: null`
  placeholder. The user resolved it in §3 to a fixed `slaq.db`, which that section wires into startup.

### 2026-11-19 — §1 scaffold implemented and verified

- Initialized the native-ESM npm project (`slaq@0.1.0`, `"type": "module"`), added `.nvmrc` (`24`)
  and `engines.node: ^24.0.0`, and generated `package-lock.json` v3. `npm ls --depth=0` reports all
  15 packages at exactly the approved versions in `docs/research-findings.md` §2:
  - Runtime: `better-sqlite3` 13.2.0, `express` 5.3.0, `zod` 4.6.7.
  - Toolchain/test: `typescript` 6.0.3, `eslint` 10.15.0, `@eslint/js` 10.0.1,
    `typescript-eslint` 8.73.0, `globals` 17.14.0, `vitest` 5.1.1, `tsx` 4.23.15,
    `supertest` 7.3.2.
  - Types: `@types/better-sqlite3` 9.6.0, `@types/express` 5.0.6, `@types/node` 24.19.2,
    `@types/supertest` 7.2.1.
- Proved the native driver loads on this machine before relying on it: opening `:memory:` and
  running `SELECT sqlite_version()` returned **SQLite 3.54.1** (Node v24.22.1, npm 12.2.1).
- Added `tsconfig.json` / `tsconfig.build.json` (ADR-010), the type-aware ESLint 10 flat config
  (ADR-011), Vitest config, the six scripts (`typecheck`, `lint`, `test`, `build`, `dev`, `start`),
  and `.env.example`.
- Added `src/config.ts` (`PUBLIC_BASE_URL` validation per D17; `PORT` trimming, default `3000` in
  every environment, ASCII-digits-only 1–65535 with insignificant leading zeros and `0000`
  rejected per D22), `src/lib/clock.ts`, `src/app.ts` (`createApp({ db, clock, config })` with a
  `db: unknown` placeholder per D1), and `src/server.ts` (fail-fast before `listen`).
- Added liveness-only `GET /health` returning `200 { "status": "ok" }` with no database probe
  (D19). **No database tables, schema, or link routes were added.**
- Added 91 tests in 3 files covering health over supertest, every D22 `PORT` case under both
  `NODE_ENV` values, `PUBLIC_BASE_URL` validation, and startup/listen behavior. The first gate
  failed lint with 7 `@typescript-eslint/no-unsafe-*` errors from `any`-typed Vitest matchers and an
  untyped spy; the tests were fixed with an explicit `ConfigError` helper and
  `Mock<typeof Server.prototype.listen>` — no suppressions or `any`.
- Verification: `npm run typecheck && npm run lint && npm test && npm run build` — all four pass;
  3 test files, 91 tests, 473 ms. No commit or push was made.

### 2026-11-19 — Prompt 04 persistence design recorded (no code)

- Added a **Repository contract** section to `docs/database-design.md`: the six persistence files,
  the three repository operations (`insert`, `findByCode`, `incrementClick`), typed-row mapping,
  UNIQUE-failure translation, and the explicit absence of a transaction (D1, D12, D20).
- Added the repository-level persistence test cases (exact stored values, `UniqueCodeError` without
  an extra row, case-sensitive lookup, bound-parameter injection regression, `changes === 0` for
  expired and unknown codes, fifty sequential increments) on top of the cases already required by
  `docs/testing-strategy.md`.
- No ORM, migration framework, table, index, column, or dependency was added; the approved schema
  (D2) and pragma set are unchanged.
- No application code was written and no test was run — the repository has no `package.json`, so the
  §1 scaffold must land before these files can be typechecked or tested.
- `PROJECT_STATE.md` updated with the design status, the approval needed to start implementation,
  and the exact file list.

### 2026-11-19 — D22 approved; `PORT` default recorded

- The user approved **D22**: `PORT` is read once at startup, trimmed, and resolved to **`3000` in
  every environment** when unset or empty. A set value must contain only ASCII digits and have a
  numeric value in 1–65535; leading zeros are insignificant (`PORT=03000` → `3000`) and `0000` is
  rejected because its value is `0`. The value is never parsed with a prefix-coercing `parseInt`,
  and an invalid value aborts startup before `listen` in both environments.
- Added `docs/decisions/ADR-022.md`; the register now records **22 of 22 decided, all Approved**,
  with no pending entry.
- `docs/requirements.md`: FR-11 no longer contains a proposal — the `PORT` rule is stated as
  confirmed, AC-11.6 … AC-11.10 were added, and the gaps section records the resolution.
- `docs/security-guidelines.md`, `docs/coding-standards.md`, and `docs/testing-strategy.md` carry the
  parsing rule and its configuration test cases; `docs/architecture-proposal.md` §7 and §9 record
  D22.
- `PROJECT_STATE.md`, `ROADMAP.md`, `TASKS.md`, `README.md`, `docs/decisions/README.md`,
  `prompts/00-start-session.md`, and `prompts/03-architecture.md` synchronized to 22 of 22.
- No application code, dependencies, installs, tests, commits, or pushes were made.

### 2026-11-19 — C-1 … C-3 applied; D20 and D21 approved

- The user approved the Prompt 03 review in full: **D20** (redirect write path — guarded increment
  without an explicit transaction, `HEAD` does not count) and **D21** (`SQLITE_BUSY` →
  `500 INTERNAL_ERROR`, no retry), plus corrections **C-1 … C-3**.
- Added `docs/decisions/ADR-020.md` and `ADR-021.md`; the register now records **21 of 21 decided,
  all Approved**, with no pending entry.
- **C-1** applied: validation has one owner (the controller, via `links.schemas.ts`); routes only
  wire. Updated `docs/architecture-proposal.md`, `ADR-001` (dated clarification), and
  `docs/coding-standards.md`.
- **C-2** applied: `docs/architecture-proposal.md` §6 now lists `eslint`, `@eslint/js`,
  `typescript-eslint`, and `globals` (D11).
- **C-3** applied: `supertest` is described as opening an ephemeral loopback listener per request
  rather than "no port is bound"; updated `ADR-008` (dated correction), `docs/testing-strategy.md`,
  and the proposal.
- **D20** applied to `docs/database-design.md`, `docs/requirements.md` (FR-04, NFR-06),
  `docs/api-specification.md`, `docs/testing-strategy.md`, `docs/research-findings.md`, and `TASKS.md`
  §4. **D21** applied to `docs/database-design.md`, NFR-06, `docs/testing-strategy.md`, and §2.
- `PROJECT_STATE.md`, `ROADMAP.md`, `TASKS.md`, `README.md`, `docs/decisions/README.md`,
  `prompts/03-architecture.md`, and `docs/architecture-review.md` synchronized.
- No application code, dependencies, installs, tests, commits, or pushes were made.

### 2026-11-19 — Prompt 03 architecture review; two proposals pending

- Added `docs/architecture-review.md`: the approved architecture (layers, feature module, app
  factory, repository boundary, schema, routes, dependencies) is **recommended as-is** for the
  five-hour MVP, with concrete trade-offs and a testability review.
- Raised **D20** (redirect write path: guarded increment without an explicit transaction; `HEAD`
  does not count) and **D21** (`SQLITE_BUSY` → `500 INTERNAL_ERROR`, no retry). Both are
  **Pending User Approval** in the register; **no ADR was written and no decision was accepted**.
- Recorded three corrections awaiting confirmation: C-1 validation ownership (routes versus
  controllers), C-2 the incomplete dev-dependency list in `docs/architecture-proposal.md` §6, and
  C-3 the inaccurate "no port is bound" description of `supertest`.
- `docs/decisions/DECISION-REGISTER.md` now lists D1–D21 with D20/D21 pending, and `TASKS.md`,
  `PROJECT_STATE.md`, `ROADMAP.md`, and `prompts/03-architecture.md` reflect the review.
- No application code, dependencies, installs, tests, commits, or pushes were made.

### 2026-11-19 — D1–D7 approved; architecture, requirements, and design finalized

- The user approved **D1–D7** as recommended, with two clarifications: `createApp` takes a deps
  object `{ db, clock, config }` (D1), and collisions are retried for at most **five generation
  attempts in total** (D5). Recorded as `docs/decisions/ADR-001.md` … `ADR-007.md`.
- D2's `CHECK` set is fixed to `click_count >= 0` and `is_custom IN (0,1)`. The length,
  non-empty-URL, and `expires_at > created_at` checks are declined, with the reason recorded in
  `ADR-002`.
- Decision status is now **19 of 19 approved** and no entry is pending. The nine-item checklist in
  `docs/architecture-proposal.md` §9 is fully checked.
- `docs/requirements.md` finalized: every requirement is **Confirmed** or **Out of scope**, and the
  "Partly confirmed"/"Proposal" labels and pending notes are gone.
- `docs/api-specification.md` and `docs/database-design.md` finalized: the drafts are removed and
  the approved routes, envelope, `302`, alias rules, lazy expiry, and schema are stated as settled.
- `TASKS.md`, `ROADMAP.md`, `PROJECT_STATE.md`, `README.md`, `docs/testing-strategy.md`,
  `docs/security-guidelines.md`, `docs/coding-standards.md`, and `docs/research-findings.md`
  synchronized to the approved state.
- No application code, dependencies, installs, commits, or pushes were made.

### 2026-11-19 — Requirement gaps resolved; acceptance criteria no longer provisional

- The user adopted the proposed default for all four requirements gaps, recorded as **D19**
  (`docs/decisions/ADR-019.md`): unknown body fields are ignored, duplicate destinations are not
  deduplicated, `GET /health` is liveness only, and body-parser failures map to
  `400 VALIDATION_ERROR` with no `413`.
- Reconfirmed that link deletion stays out of the MVP; `ADR-009` records the reconfirmation.
- `docs/requirements.md`: FR-01, FR-07, FR-08, and FR-10 now cite D19; added AC-01.9, AC-01.10,
  AC-07.7, and AC-08.6; the gaps table records resolved answers instead of proposals.
- `docs/api-specification.md`: create field handling, `/health` scope, and the `400` error row
  reflect D19; the gap paragraph is replaced by the resolutions.
- `docs/testing-strategy.md`: unknown-field, duplicate-destination, oversized-body, and
  health-without-database cases added.
- Register, ADR index, `TASKS.md`, `ROADMAP.md`, `PROJECT_STATE.md`, and
  `prompts/02-requirements.md` synchronized: 12 of 19 decisions approved at that point, with D1–D7
  still pending until the next entry.
- No application code, dependencies, installs, commits, or pushes were made.

### 2026-11-18 — Requirements and acceptance criteria drafted (Prompt 02)

- Rewrote `docs/requirements.md` as testable requirements: FR-01 … FR-12 and NFR-01 … NFR-09, each
  with inputs, success behavior, validation rules, error cases and status codes, data changes,
  acceptance criteria, and the tests needed.
- Labeled every requirement **Confirmed**, **Partly confirmed**, **Proposal**, or **Out of scope**.
  Only `PROJECT.md` and D8–D18 back confirmed items; anything resting on D1–D7 is a proposal.
- Recorded deletion as out of scope from the user's approved D9 (`ADR-009`) instead of re-deciding
  it; FR-09 has no endpoint and no deletion column.
- Added FR-10 (health) and FR-11 (startup `PUBLIC_BASE_URL` configuration, confirmed by D17).
- Logged four unresolved gaps as proposals: unknown body fields (Q-2), duplicate destinations
  (Q-3), `/health` scope (Q-4), and body-parser error mapping (Q-5).
- Corrected `TASKS.md` (deletion moved out of "if time remains"), `ROADMAP.md`, and the
  unknown-field note in `docs/testing-strategy.md`; linked the gaps from
  `docs/api-specification.md`.
- No application code, dependencies, installs, commits, or pushes were made.

### 2026-11-18 — Decisions D8–D18 approved; documentation synchronized

- The user approved **D8–D18** and their sub-options. Wrote one ADR per approved decision,
  reusing the D-numbers: `docs/decisions/ADR-008.md` … `ADR-018.md`.
- **D1–D7 remain Pending User Approval** and have no ADR; nothing unapproved was marked approved.
- Register: D8–D18 marked Approved with ADR links, an approval-record table added, and the
  sub-options resolved — expired-link statistics return `200` with `isExpired: true`, `isCustom`
  is exposed, production `PUBLIC_BASE_URL` problems fail fast, and URLs with embedded credentials
  are rejected.
- `docs/architecture-proposal.md` is now labeled **Partially Approved**; §9 checks D8–D18 and
  leaves D1–D7 unchecked.
- `docs/requirements.md`: FR-09 confirms deletion is out of scope; the open-questions table marks
  the D8/D9/D13/D17/D18 answers approved and keeps D5/D6 as proposals.
- `docs/api-specification.md`: bodies, headers, error codes, `PUBLIC_BASE_URL`, and URL limits are
  approved (D17/D18); routes/envelope (D3), aliases (D6), redirect status (D4), and expiry (D7)
  are labeled provisional.
- `docs/database-design.md`: D12/D15 recorded as approved; the table, `CHECK` constraints, and
  pragma list stay under the pending D2, including the refined constraint proposal.
- `docs/testing-strategy.md`: `supertest` is the approved API harness; the D17/D18 cases are
  approved; the D2 constraint case is explicitly conditional.
- `docs/security-guidelines.md`: D17/D18 rules marked approved; D2/D6 items remain proposals.
- `PROJECT_STATE.md`, `ROADMAP.md`, `TASKS.md`, `README.md`, `PROJECT.md`, and
  `prompts/01-research.md` synchronized to the same status: 11 of 18 approved, ADRs written,
  D1–D7 pending.
- Corrected stale environment facts: this machine runs **Node 24.22.1** (the Node 26.13.0 figure
  came from a cloud sandbox), 46 tracked files, `origin` configured, and `dev`/`master` in sync
  with `origin/master` at `c804101`.
- No application code, dependencies, installs, commits, or pushes were made.

### 2026-11-18 — Documentation audit and synchronization (no code)

- Completed the Prompt 00 repository review and corrected `PROJECT_STATE.md`: the branch has a
  baseline commit (`b01087c`), a clean tree, 44 tracked files, and no Git remote. Replaced the
  stale "no commits / everything untracked" claim.
- Completed Prompt 01 technical research and re-verified every version against the npm registry
  on 2026-11-18. Recorded it in `docs/research-findings.md` so findings no longer exist only in
  chat history.
- Added `docs/decisions/DECISION-REGISTER.md` with D1–D18 — architecture/behavior (D1–D9) and
  toolchain/contracts (D10–D18) — all **Pending User Approval**, with justification,
  alternatives, verification, affected documents, and dependencies. No ADR is created yet.
- Recorded the verified toolchain positions: TypeScript 6.0.3 rather than 7.0.2 (peer range of
  `typescript-eslint` 8.73.0), ESLint 10 flat config, `better-sqlite3` 13 with separate
  `@types/better-sqlite3` 9 typings, Node 24 LTS policy, caret ranges plus a committed lockfile,
  native ESM, and canonical UTC timestamps.
- Documented `PUBLIC_BASE_URL` validation and the rule that short URLs are never derived from the
  `Host` header.
- Filled in the proposed create/statistics response bodies, error-code table, expired-link
  policy, the 2048-character URL limit, and the `expiresAt <= now` boundary in
  `docs/api-specification.md`, `docs/database-design.md`, `docs/testing-strategy.md`,
  `docs/security-guidelines.md`, and `docs/coding-standards.md`. All remain proposals.
- Expanded `TASKS.md` Gate 0 to the 18 decisions plus separate Gate 1 specification work, and
  updated `ROADMAP.md` phase progress.
- Added `.env.*` to `.gitignore` while keeping `.env.example` trackable.
- No application code, dependencies, installs, commits, or pushes were made.

### Earlier

- Added portable AI execution framework for Slaq.
- Captured initial architecture proposal as unapproved.
- Added project brief, roadmap, task tracker, role cards, prompts, workflows, and templates.
- Synchronized project documentation with the then-current repository state: recorded the empty
  Git history and untracked tree, marked the repository inspection complete, and expanded the
  pending architecture decisions to all nine items from the proposal's approval checklist.
  (The Git-history portion is superseded by the 2026-11-18 entry above.)
