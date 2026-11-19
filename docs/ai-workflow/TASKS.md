# Slaq Task Tracker

Use `[ ]` pending, `[x]` completed with evidence, and `[-]` deferred. Keep tasks small and update
this file as work progresses. Decision IDs refer to
[`docs/decisions/DECISION-REGISTER.md`](../decisions/DECISION-REGISTER.md).

## Gate 0 — Research and decision approval

### 0.1 Repository and research (complete)

- [x] Inspect the repository and Git status. — 2026-11-18: baseline commit `b01087c`, clean tree,
      44 tracked files, no remote, documentation-only.
- [x] Complete Prompt 00 session review and record the stale-state corrections. — Evidence:
      `docs/ai-workflow/PROJECT_STATE.md` → Repository and Git status.
- [x] Complete Prompt 01 technical research and re-verify versions against the npm registry. —
      Evidence: `docs/ai-workflow/research-findings.md`.
- [x] Consolidate D1–D18 into a single register with no duplicate records. — Evidence:
      `docs/decisions/DECISION-REGISTER.md`.
- [x] Audit and synchronize project documentation with the findings. — Evidence: `CHANGELOG.md`
      entry of 2026-11-18.

### 0.2 Decisions (D1–D22 all approved)

- [x] Review `docs/architecture-proposal.md` and the register. — Reviewed before the D1–D7
      walkthrough on 2026-11-19.
- [x] **D1 approved 2026-11-19** — layered architecture and feature-module layout, with
      `createApp({ db, clock, config })`. Evidence: `docs/decisions/ADR-001.md`.
- [x] **D2 approved 2026-11-19** — `links` schema and idempotent bootstrap; `CHECK` set limited to
      `click_count >= 0` and `is_custom IN (0,1)`. Evidence: `ADR-002.md`.
- [x] **D3 approved 2026-11-19** — API routes and error envelope. Evidence: `ADR-003.md`.
- [x] **D4 approved 2026-11-19** — `302` redirect. Evidence: `ADR-004.md`.
- [x] **D5 approved 2026-11-19** — 7-character Base62 codes, five generation attempts in total.
      Evidence: `ADR-005.md`.
- [x] **D6 approved 2026-11-19** — alias rules, case-sensitive matching, case-insensitive reserved
      names. Evidence: `ADR-006.md`.
- [x] **D7 approved 2026-11-19** — lazy expiration, `410`, rows retained. Evidence: `ADR-007.md`.
- [x] **D8 approved 2026-11-18** — `supertest` + `@types/supertest`, dev-only. Evidence:
      `docs/decisions/ADR-008.md`.
- [x] **D9 approved 2026-11-18** — deletion stays out of scope. Evidence: `ADR-009.md`.
- [x] **D10 approved 2026-11-18** — TypeScript 6.0.3 and the tsconfig split. Evidence:
      `ADR-010.md`.
- [x] **D11 approved 2026-11-18** — ESLint 10 flat config, type-aware. Evidence: `ADR-011.md`.
- [x] **D12 approved 2026-11-18** — `better-sqlite3` 13 + `@types/better-sqlite3` 9. Evidence:
      `ADR-012.md`.
- [x] **D13 approved 2026-11-18** — Node.js 24 LTS policy. Evidence: `ADR-013.md`.
- [x] **D14 approved 2026-11-18** — caret ranges + committed lockfile. Evidence: `ADR-014.md`.
- [x] **D15 approved 2026-11-18** — canonical UTC timestamps and the `expiresAt <= now`
      boundary. Evidence: `ADR-015.md`.
- [x] **D16 approved 2026-11-18** — native ESM. Evidence: `ADR-016.md`.
- [x] **D17 approved 2026-11-18** — API contracts, `PUBLIC_BASE_URL`, Host-header safety;
      sub-options resolved to `200` + `isExpired`, `isCustom` exposed, fail-fast. Evidence:
      `ADR-017.md`.
- [x] **D18 approved 2026-11-18** — scheme allow-list, 2048-character cap, credentials rejected.
      Evidence: `ADR-018.md`.
- [x] **D19 approved 2026-11-19** — adopted the defaults for Q-2 … Q-5 (unknown fields ignored,
      no duplicate-destination deduplication, `/health` liveness only, body-parser failures →
      `400 VALIDATION_ERROR`) and reconfirmed D9. Evidence: `docs/decisions/ADR-019.md`.
- [x] **D20 approved 2026-11-19** — redirect write path: guarded increment without an explicit
      transaction; `HEAD` returns the redirect without counting a click. Evidence: `ADR-020.md`.
- [x] **D21 approved 2026-11-19** — `SQLITE_BUSY` after `busy_timeout` maps to `500 INTERNAL_ERROR`
      with no retry. Evidence: `ADR-021.md`.
- [x] **D22 approved 2026-11-19** — `PORT` resolves to `3000` in every environment when unset or
      empty; a set value is ASCII digits only with a numeric value in 1–65535, leading zeros
      insignificant (`03000` → `3000`, `0000` rejected), and never parsed with a coercing
      `parseInt`. Evidence: `ADR-022.md`; closes the last proposal in FR-11.
- [x] Record the approved decisions as ADRs — `docs/decisions/ADR-008.md` … `ADR-019.md`.
- [x] Record the D1–D7 approval as `ADR-001` … `ADR-007`. — Evidence:
      `docs/decisions/ADR-001.md` … `ADR-007.md`, 2026-11-19.
- [x] Confirm the `.gitignore` change: `.env.*` is ignored, with `.env.example`
      exempted, so a future example file stays trackable. — Verified 2026-11-19:
      `git check-ignore -v` reports `.gitignore:9:.env.*` for `.env.local`, `.env.production`, and
      `.env.test`, and `.gitignore:10:!.env.example` for `.env.example`; a throwaway `.env.example`
      appeared as `??` (trackable) while a throwaway `.env.local` stayed ignored. Both probe files
      were removed afterwards; the working tree is clean.
- [x] Draft requirements and acceptance criteria (Prompt 02). — Evidence:
      `docs/requirements.md`, 2026-11-18, finalized 2026-11-19; every requirement is now
      **Confirmed** or **Out of scope**, and no requirement is provisional.
- [x] Resolve the four requirements gaps Q-2 … Q-5 — D19 approved 2026-11-19, folded into
      `docs/requirements.md` FR-01, FR-07, FR-08, and FR-10 and their new acceptance criteria.
- [x] Confirm the drafted acceptance criteria. — Every criterion is confirmed: D19 closed the
      gaps and D1–D7 were approved on 2026-11-19; no requirement is provisional.

## Gate 1 — Requirements and specifications

- [x] Turn approved decisions into confirmed functional and non-functional requirements. —
      Evidence: `docs/requirements.md` FR-01 … FR-12 and NFR-01 … NFR-09, every one **Confirmed**
      or **Out of scope** after the D1–D7 approval.
- [x] Confirm acceptance criteria for every MVP capability — AC-01.1 … AC-12.3, all confirmed
      after D19 and the D1–D7 approval. Evidence: `docs/requirements.md`, 2026-11-19.
- [x] Finalize the API specification (bodies, status codes, error codes). — Evidence:
      `docs/api-specification.md`, status Approved; routes D3, `302` D4, aliases D6, expiry D7.
- [x] Finalize the database design and pragma rationale. — Evidence: `docs/database-design.md`,
      status Approved; D2 schema with the two approved `CHECK` constraints.
- [x] Finalize the testing strategy, including the eleven expiration-boundary cases and the
      Host-injection regression test. — Evidence: `docs/testing-strategy.md`, status Approved. No
      test has been executed; there is no npm project yet.
- [x] Review the approved architecture for MVP fit (Prompt 03). — Evidence:
      `docs/ai-workflow/architecture-review.md`, 2026-11-19. The layers, module, factory, schema, routes, and
      dependencies were recommended unchanged; the user approved **D20**/**`D21`** (`ADR-020`,
      `ADR-021`) and corrections **C-1 … C-3**, which are applied across the design documents.

## MVP implementation

### 1. Scaffold (complete — committed as `acb51ec`)
- [x] Initialize the npm project with `"type": "module"`. — `package.json`, `slaq@0.1.0`,
      2026-11-19.
- [x] Add `.nvmrc` (`24`) and `"engines": { "node": "^24.0.0" }`. — Verified under Node v24.22.1 /
      npm 12.2.1.
- [x] Add runtime deps (`express` 5.3.0, `better-sqlite3` 13.2.0, `zod` 4.6.7) at approved versions.
      — `npm ls --depth=0`; `better-sqlite3` loaded `SELECT sqlite_version()` → **3.54.1**.
- [x] Add dev deps (TypeScript 6.0.3, ESLint 10.15.0 / `@eslint/js` 10.0.1 /
      `typescript-eslint` 8.73.0 / `globals` 17.14.0, `@types/*`, `tsx` 4.23.15, `vitest` 5.1.1,
      `supertest` 7.3.2 — approved D8). — All 15 installed versions match
      `docs/ai-workflow/research-findings.md` §2 exactly.
- [x] Configure `tsconfig.json` (no emit) and `tsconfig.build.json` (emit to `dist/`). — ADR-010
      options; `tsc -p` passes for both configs.
- [x] Configure ESLint flat config with type-aware rules. — `eslint.config.js` per ADR-011;
      `eslint .` passes after typing the Vitest matcher/spy assertions (no suppressions).
- [x] Configure Vitest. — `vitest.config.ts`, node environment, `tests/**/*.test.ts`.
- [x] Add scripts `typecheck`, `lint`, `test`, `build`, `dev`, `start`. — All present in
      `package.json`.
- [x] Commit the lockfile. — `package-lock.json` (lockfileVersion 3) with the approved versions was
      committed with §1 as `acb51ec`.
- [x] Create the Express app factory and server entry point. — `src/app.ts` exports
      `createApp({ db, clock, config })` with `db: unknown` placeholder (D1); `src/server.ts`
      resolves config, logs and exits 1 before `listen` on failure.
- [x] Add startup configuration with `PUBLIC_BASE_URL` validation and `PORT` resolution —
      default `3000` in every environment, digits-only 1–65535, leading zeros insignificant,
      `0000` rejected (D22). — `src/config.ts`; 91 tests pass, including every D22 PORT case and
      PUBLIC_BASE_URL validation under both `NODE_ENV` values.
- [x] Add `GET /health`. — Liveness only, `{ "status": "ok" }`, no database probe (D19); verified
      by `tests/health.test.ts` via supertest.
- [x] Verify typecheck, lint, and the health test. — `npm run typecheck && npm run lint &&
      npm test && npm run build` all pass: 3 test files, 91 tests, 473 ms.

### 2. Database and shared infrastructure (complete — committed as `93dd0f8`)
- [x] Create the SQLite connection. — `src/db/connection.ts` `openDatabase(filename)`; WAL is
      requested only for file databases.
- [x] Apply approved pragmas and document the rationale. — `foreign_keys = ON`,
      `busy_timeout = 5000`, `synchronous = NORMAL`, plus file-only WAL; rationale retained in
      `docs/database-design.md`.
- [x] Create the `links` table with `UNIQUE(code)` and approved `CHECK` constraints. —
      `src/db/schema.ts` runs the approved D2 `CREATE TABLE IF NOT EXISTS` verbatim; idempotency and
      both CHECKs are tested.
- [x] Add a typed `pragma()` / `lastInsertRowid` wrapper instead of `any`. — `src/db/pragma.ts`
      (`PragmaMap` keyed cast) and `src/db/id.ts` (`toSafeId` rejects unsafe integers); no `any` or
      suppression.
- [x] Add typed application errors. — `src/lib/errors.ts` defines `AppError` and six code-specific
      subclasses matching the D3/D17 table.
- [x] Add centralized error middleware and a 404 handler, including the `SQLITE_BUSY` →
      `500 INTERNAL_ERROR` mapping with server-side logging (D21). — `src/middleware/error-handler.ts`
      is the sole error-body writer; `src/middleware/not-found.ts` forwards `NotFoundError`;
      `express.json()` failures map to `400 VALIDATION_ERROR` (D19).
- [x] Test database initialization and the error response shape. — 18 new tests in
      `tests/database.test.ts` and `tests/errors.test.ts`; full gate passes with 109 tests total.

### 3. Create short links (complete)
- [x] Add URL and optional-field validation (scheme allow-list, 2048 cap). —
      `src/modules/links/links.schemas.ts` trims then validates `url` with Zod plus explicit
      `http:`/`https:`, credential, and 2048-character checks (D18); unknown body fields are stripped
      (D19). Alias validation remains in §5 and expiry validation in §6.
- [x] Implement the short-code generator. — `src/lib/code-generator.ts` uses `crypto.randomInt` over
      the 62-character alphabet for 7 characters (D5); tests inject a deterministic random source and
      prove `Math.random` is unused.
- [x] Implement repository insert and lookup. — `src/modules/links/links.repository.ts` prepares both
      statements once, binds all values, maps `LinkRow` to `Link`, and translates only
      `SQLITE_CONSTRAINT_UNIQUE` to `UniqueCodeError` (D2, D12).
- [x] Implement the create-link service with collision retries. — `src/modules/links/links.service.ts`
      makes at most five generation attempts in total and throws a generic `InternalError` on
      exhaustion (D5); injected-generator tests cover retry and exhaustion with no extra row.
- [x] Implement `POST /api/links` returning the approved body and `Location`. — routes/controller/
      service layers under `src/modules/links/`; `shortUrl` uses only `PUBLIC_BASE_URL` (D17). The
      user approved a fixed `slaq.db` in the process working directory, so `src/server.ts` now opens
      and bootstraps it before `listen`.
- [x] Test valid creation, invalid URL, over-long URL, unsupported scheme, and collisions. — 37 new
      tests across generator, repository, service, and API suites; full gate passes with 146 tests in
      9 files. AC-01.5 is verified through the repository because the statistics endpoint is §7.

### 4. Redirect and click tracking (complete)
- [x] Implement lookup and the guarded click increment as two statements with no explicit
      transaction (D20). — `links.repository.ts` prepares `findByCode` and a single guarded
      `UPDATE … WHERE code = @code AND (expires_at IS NULL OR expires_at > @now)`; no
      `db.transaction()` anywhere.
- [x] Implement `GET /:code` and the non-counting `HEAD /:code` response (D20). — an explicit
      `createRedirectRouter` is mounted after `/health` and `/api`; `controller.redirect` counts only
      when `req.method === 'GET'`.
- [x] Test the `302` status and exact `Location` header. — `tests/redirect.test.ts` asserts the exact
      stored destination and repeat-visit increments.
- [x] Test unknown code. — `404 NOT_FOUND` in `tests/redirect.test.ts`.
- [x] Test that only successful `GET` redirects increment the count, and that `HEAD` does not (D20). —
      API tests plus repository tests for `changes` 1/0 and fifty sequential increments. §4 gate:
      full gate passed with 174 tests in 11 files.

### 5. Custom aliases (complete)
- [x] Validate alias length and character set. — `links.schemas.ts` enforces 3–32 `[A-Za-z0-9_-]`
      without trimming (D6).
- [x] Reject reserved route names. — `links.service.ts` rejects `api`/`health` case-insensitively with
      `RESERVED_ALIAS` (D6). The contrary AC-02.3 line was confirmed stale by the user.
- [x] Enforce uniqueness in the database. — the existing `UNIQUE(code)` constraint is the only
      guarantee; no pre-check.
- [x] Return the approved conflict error. — `UniqueCodeError` maps to `409 ALIAS_TAKEN`, including a
      collision with an existing generated code.
- [x] Test alias success, invalid alias, reserved alias, and collision. — 16 tests in
      `tests/alias.test.ts`, including case-sensitive `MyLink`/`mylink` and one-winner concurrent
      same-alias creates. §5 gate: full gate passed with 162 tests in 10 files.

### 6. Expiration (complete)
- [x] Validate expiration input and reject past or equal-to-now dates at creation. — `links.schemas.ts`
      requires an ISO instant with an explicit offset and normalizes via `toISOString()`; the service
      rejects `expiresAt <= nowIso` with `400 VALIDATION_ERROR` (D15).
- [x] Inject the clock into service logic. — the same `nowIso` drives `createdAt`, the creation
      future-check, redirect expiry, increment guard, and statistics `isExpired`.
- [x] Return `410` for expired links on redirect. — `isExpired` in `src/lib/expiry.ts` yields
      `LINK_EXPIRED` without any write; the guarded `UPDATE` is the race backstop (D7, D20).
- [x] Keep expired records available for statistics. — no deletion, flag, or cleanup job exists.
- [x] Test all eleven boundary cases in `docs/testing-strategy.md`. — `tests/expiration.test.ts`
      implements all 11 verbatim with a mutable injected clock, plus `tests/expiry.test.ts` unit
      coverage of the predicate and timestamp normalization. §6 gate: full gate passed with 195 tests
      in 13 files. Minimal read-only stats were added in §6 for case 9; §7 completed the contract.

### 7. Statistics (complete)
- [x] Implement `GET /api/links/:code/stats`. — registered in `createLinksRouter`; `getStats` reads the
      row without writing.
- [x] Return the approved metadata and click count with `Cache-Control: no-store`. — all nine approved
      fields; `shortUrl` built only from `PUBLIC_BASE_URL` (D17).
- [x] Test the approved expired-link behavior. — `200` with `isExpired: true` and the retained count,
      in both §6 case 9 and `tests/stats.test.ts`.
- [x] Test unknown code. — `404 NOT_FOUND`. §7 gate: full gate passed with 204 tests in 14 files.
      `tests/stats.test.ts` also covers exact fields, read-only behavior, Host-header safety, and
      case-sensitive codes.

### 8. Final quality and docs (complete)
- [x] Run `npm run typecheck && npm run lint && npm test && npm run build`. — passed after each of
      §§4, 5, 6, 7 and after the final review; a clean `rm -rf node_modules && npm ci` run passed all
      four checks with 15 test files, 217 tests, 1.32 s.
- [x] Review security and error handling. — parameterized SQL, no transactions, no SQL time
      functions, no stack/SQL leakage, no `any`, no debug artifacts; the redirect router cannot
      shadow `/health` or `/api`.
- [x] Write setup and usage README. — `README.md` now covers requirements, install, `.env`/env-var
      rules, run, curl examples, verification, a D1–D22 summary, known limitations, and future work;
      the stale framework-only status lines are gone.
- [x] Write API documentation / OpenAPI description. — every request/response example in
      `docs/api-specification.md` was exercised against a real server started from `dist/` on a
      temporary database; two mismatches were fixed (the `expiresAt` normalization text and the
      validation error envelope). Added the hand-written `docs/openapi.yaml` (OpenAPI 3.1), which
      parses cleanly and needs no new dependency.
- [x] Review the Git diff and repository status. — `git diff --check` clean; no `.db` or secret file
      staged or created.
- [x] Record known limitations and future work. — README "Known limitations" and "Future work";
      the three documented gaps were approved and fixed in §9, so they are no longer listed as
      limitations. No production code was changed in §8.

### 9. Approved review fixes (complete)
- [x] Reject destinations containing ASCII control characters. — `links.schemas.ts` rejects them at
      the HTTP boundary; five API tests in `tests/create-link.test.ts` confirm `400 VALIDATION_ERROR`
      with a `url` detail and no inserted row. Stays within D18; no new decision.
- [x] Validate `expiresAt` calendar dates strictly. — `links.schemas.ts` shifts the parsed instant
      back into the submitted offset and requires every submitted component to match, so impossible
      dates are rejected while canonical UTC normalization, offsets, and fractional digits remain.
      Twelve schema cases in `tests/expiry.test.ts` plus an API test in `tests/expiration.test.ts`
      pass; real leap days and negative offsets remain accepted (D15).
- [x] Send `Cache-Control: no-store` on every statistics response. — the header is set before the
      service call in `links.controller.ts`, so `404` responses carry it too; new assertion in
      `tests/stats.test.ts` (D17).
- Tests were written first: the five control-character cases returned `201`, five impossible-date
      cases were accepted by the schema, the impossible-future API case returned `201`, and the 404
      statistics header was `undefined`. Each failed before the fix and passes after it. Full gate
      evidence is in `docs/ai-workflow/PROJECT_STATE.md`.

### 10. Repository tidy-up (complete)
- [x] Move the workflow sources into `docs/ai-workflow/` with `git mv` (history preserved):
      `PROJECT.md`, `PROJECT_STATE.md`, `TASKS.md`, `ROADMAP.md`, `agents/`, `prompts/`, `workflows/`,
      `templates/`, `research-findings.md`, `architecture-review.md`,
      `ai_execution_framework_original.md`, and `original-framework-notes.md`.
- [x] Update every internal reference. — `AGENTS.md`, `README.md`, `CHANGELOG.md`, all `docs/`
      files, the moved workflow files, and one test comment now use the new paths; Markdown link
      destinations were recomputed relative to each file's new directory.
- [x] Keep the root layout. — `README.md`, `CHANGELOG.md`, `AGENTS.md`, config files, `src/`, and
      `tests/` remain at the root. No file was deleted; no `LICENSE` file existed at that time (the
      user added one later in `8ae119c`).
- [x] Verify links and the gate. — dependency-free Markdown link check: **0 broken links** across
      all tracked Markdown files; `npm run typecheck && npm run lint && npm test && npm run build`:
      all four pass with 15 test files and 238 tests. Evidence is in
      `docs/ai-workflow/PROJECT_STATE.md`.
- [x] No behavior change. — no source logic, dependency, database, or decision was touched.

### 11. Served Swagger UI (complete)
- [x] Check the registry and add one approved dependency. — `swagger-ui-dist` 5.35.1 is `latest`,
      has no restrictive `engines` field, and ships dependency-free browser assets; declared as
      `^5.35.1` per D14 with the v3 lockfile pinned to 5.35.1 and installed on Node 24.22.1. No other
      dependency was added.
- [x] Write D23 / `ADR-023` and add it to the decision register. — dependency justification,
      alternatives (`swagger-ui-express`, CDN, pre-rendered HTML, top-level `/docs`), route placement
      under `/api`, and consequences are recorded; the status is **Proposed** until the user approves
      it. The dependency approval did not approve the ADR.
- [x] Write tests first. — `tests/docs.test.ts` failed before implementation with 4 failures
      (missing `/api/docs`, asset, spec, and relative `servers` URL) while `/health`, `/:code`, the
      aliases, and the 404 envelope already passed.
- [x] Implement the routes. — `src/modules/docs/docs.routes.ts` serves the Swagger UI HTML,
      `express.static` over `swagger-ui-dist`, and the spec as `application/yaml`; `src/app.ts`
      mounts them under `/api` before `/:code`. No top-level `/docs` and no D6 alias change.
- [x] Resolve the spec from the module location. — `fileURLToPath(import.meta.url)` with a fixed
      relative depth to `docs/openapi.yaml`; the compiled server was started from
      `/tmp/opencode/slaq-dist-check` and `curl` confirmed all three routes, an identical spec, and
      the `404 NOT_FOUND` fallthrough.
- [x] Make "Try it out" work. — the OpenAPI `servers` entry is the relative URL `/`, and
      `GET /{code}` notes that browsers follow the `302`.
- [x] Update documentation. — `README.md`, `docs/api-specification.md`, `docs/openapi.yaml`,
      `CHANGELOG.md`, `docs/decisions/ADR-023.md`, `docs/decisions/DECISION-REGISTER.md`, this file,
      and `docs/ai-workflow/PROJECT_STATE.md`.
- [x] Check links and run the gate. — dependency-free Markdown link check: 69 files, 118 internal
      links, **0 broken links**; `npm run typecheck && npm run lint && npm test && npm run build`
      passes with 16 test files and 244 tests. Evidence is in `docs/ai-workflow/PROJECT_STATE.md`.

## Deferred unless time remains

- [ ] Rate limiting.
- [ ] Docker.
- [ ] QR codes.
- [ ] Authentication.
- [ ] Per-click analytics history.
- [ ] Frontend dashboard.

## Post-MVP (excluded by an approved decision)

- [ ] Link deletion — excluded from the MVP by D9 (`docs/decisions/ADR-009.md`), reconfirmed
      2026-11-19; revisit only through a new decision that supersedes it.
