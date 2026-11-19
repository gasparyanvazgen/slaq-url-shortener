# Project State — Slaq

> Update this file at the start and end of every substantial AI-assisted session.
> **Last rewritten:** 2026-11-19 (`docs/ai-workflow/TASKS.md` §§1–13 complete; v0.2.0 tagged and
> pushed at `9e363ea`; README screenshot added afterwards).

## Current status

- **Overall:** Design approved and final — **22 of 22 decisions approved**; the Prompt 03
  architecture review is approved in full and no architecture decision is pending
- **Current phase:** Phase 5 — implementation and operations are complete. `docs/ai-workflow/TASKS.md` §1–§13
  are complete and verified; v0.2.0 was committed, pushed to `dev` and `master`, and tagged. Currently
  on `dev` with one uncommitted, docs-only README screenshot change.
- **Implementation started:** Yes — §1 as `acb51ec`, §2 as `93dd0f8`, §3 as `26dc26e`, §§4–7 as
  `5148145`, §8 as `f5d5a2e`, §9 as `8a03267`; the user then committed the §10 tidy-up as `fe9bd1d`,
  a README revision as `4ab7c27`, and the MIT LICENSE as `8ae119c`. §11 was committed as `fc22d69`
  with a follow-up README edit as `dac6bf2`; it adds locally served Swagger UI with the single
  user-approved `swagger-ui-dist` dependency. No table, index, error code, or link contract changed.
- **Architecture status:** **Approved** — `docs/architecture-proposal.md` records the approved
  layers, routes, schema, redirect, codes, aliases, and expiry (D1–D7)
- **Approved decisions:** **D8–D18** (2026-11-18); **D1–D7**, **D19**, **D20**, **D21**, and
  **D22** (2026-11-19), recorded as `docs/decisions/ADR-001.md` … `ADR-022.md`
- **Pending decisions:** **D23** — the user approved only the `swagger-ui-dist` dependency and asked
  for `ADR-023` to stay **Proposed** until they approve it; C-1 … C-3 are applied
- **Requirements:** `docs/requirements.md` — FR-01 … FR-12, NFR-01 … NFR-09, and 77 acceptance
  criteria, every one confirmed or explicitly out of scope (FR-09); no requirement contains a
  proposal. FR-12 is now also served interactively at `/api/docs`.
- **Last verified test run:** 2026-11-19 (after §11) — `npm run typecheck && npm run lint && npm test
  && npm run build`: all four pass; 16 test files, 244 tests, 1.31 s. The earlier clean-install run
  (`rm -rf node_modules && npm ci`) passed all four with 217 tests in 1.32 s; `npm ci` blocked the
  `better-sqlite3`/`esbuild` install scripts under this environment's allowScripts policy, but the
  driver loaded and the suite passed.
- **Current timebox:** approximately five hours for the MVP; all core routes, documentation, and the
  three user-approved review fixes are done. No approved finding remains open.
- **Release:** v0.2.0 records `v0.1.0..HEAD` (`fe9bd1d`, `4ab7c27`, `8ae119c`, `fc22d69`, `dac6bf2`):
  repository tidy-up, README revision, MIT LICENSE, and locally served Swagger UI. The §9 fixes and
  all earlier work were already released in v0.1.0 and are not listed in the 0.2.0 section. Evidence
  for the release gate and the compiled-server check is in this file.

## Repository and Git status (re-verified 2026-11-19 from actual git output)

- Branch: **`dev`** (checked out), tracking `origin/dev` and **3 commits ahead** — `git status -sb`
  shows `## dev...origin/dev [ahead 3]`. `HEAD` = **`8ae119c`** (`docs: add MIT license`);
  `origin/dev` = `8a03267`. The three local commits are `fe9bd1d` (§10 tidy-up), `4ab7c27` (README
  revision), and `8ae119c` (LICENSE); nothing was pushed.
- Remote: **`origin` = `git@github.com:gasparyanvazgen/slaq-url-shortener.git`** (fetch and push);
  remote-tracking branches are `origin/master` and `origin/dev`.
- `git ls-files` reports **114 tracked files** (plus the three untracked §11 additions: `ADR-023.md`,
  `src/modules/docs/docs.routes.ts`, `tests/docs.test.ts`). `docs/decisions/` holds `ADR-001.md` …
  `ADR-022.md`, one per approved decision, plus the Proposed `ADR-023.md`.
- Working tree: **not clean** — `package.json`, `package-lock.json`, `src/app.ts`, `README.md`,
  `CHANGELOG.md`, `docs/api-specification.md`, `docs/openapi.yaml`, and
  `docs/decisions/DECISION-REGISTER.md` are modified, and three files are untracked. `git diff --check`
  reports no whitespace errors. `dist/`, `node_modules/`, and `*.db` files are ignored.
- The lockfile is version 3 and pins exact versions; `swagger-ui-dist@^5.35.1` resolved to 5.35.1 and
  is the only dependency added in §11. A clean `npm ci` succeeded on 2026-11-19. The §11 work is
  ready for the user's commit; no commit or push was made in this session.
- `.gitignore` ignores `.env` and `.env.*` and exempts `!.env.example`, so a future example file
  stays trackable (evidence below).
- The temporary Freebuff branches `freebuff/2628b5015cbd1c3ac4b90176` and `freebuff-base` were
  deleted on 2026-11-18 at the user's request; `freebuff-base` held only an orphan commit with an
  empty tree.
- `docs/decisions/` contains `README.md`, `DECISION-REGISTER.md`, `ADR-001.md` … `ADR-022.md`,
  one record per approved decision, and the Proposed `ADR-023.md`; **D1–D22 are approved, D23 is not**.
- Evidence for the statements above:

  ```bash
  git status -sb                              # -> ## dev...origin/dev [ahead 3] + §11 paths
  git rev-parse HEAD                          # -> 8ae119c761d1e3f169ae623911e0750fe6e9b7f0
  git rev-parse origin/dev                    # -> 8a0326741d564c4fff40258550d4068eb50c876f
  git rev-list --count origin/dev..HEAD       # -> 3
  git ls-files | wc -l                        # -> 114
  git status --porcelain                       # -> 8 modified + 3 untracked §11 paths
  git diff --check                            # -> clean (exit 0)
  ls docs/decisions/ADR-*.md | wc -l          # -> 23
  git check-ignore -v .env.local              # -> .gitignore:9:.env.*
  git check-ignore -v .env.example            # -> no output, exit 1 (exempt at .gitignore:10)
  ```

## Toolchain reality in this workspace

- **Node.js v24.22.1**, npm **12.2.1** — this satisfies the approved Node 24 LTS target (D13).
- The earlier Node 26.13.0 measurement came from a cloud sandbox, not from this machine; the
  runtime blocker it created is resolved.
- Dependencies are installed from the committed-range lockfile: `npm ls --depth=0` shows all 15
  packages at the exact versions in `docs/ai-workflow/research-findings.md` §2.
- `better-sqlite3` prebuilt-binary loading is **proven**: `node -e "const Database =
  require('better-sqlite3'); const db = new Database(':memory:'); console.log(db.prepare('SELECT
  sqlite_version() AS v').get().v); db.close();"` → **3.54.1**. This replaces the earlier
  "unproven" status in §12 of the research findings.
- All six npm scripts run; see "Latest verification evidence" below.

## Approved decisions — D1–D22

D20 and D21 were approved on 2026-11-19 from the Prompt 03 architecture review; the three
corrections C-1 … C-3 from the same review are applied across the design documents. D22 was approved
on 2026-11-19 and closes the last unsourced value in a confirmed requirement (the `PORT` default).

| ID | Decision | ADR |
|---|---|---|
| D1 | Layers + `links` feature module; `createApp({ db, clock, config })` | `ADR-001` |
| D2 | `links` schema; `CHECK` set `click_count >= 0`, `is_custom IN (0,1)` | `ADR-002` |
| D3 | `/api` routes + error envelope; static routes before `/:code` | `ADR-003` |
| D4 | `302 Found` redirect | `ADR-004` |
| D5 | 7-character Base62 codes, five generation attempts in total | `ADR-005` |
| D6 | Aliases 3–32 `[A-Za-z0-9_-]`, case-sensitive, reserve `api`/`health` | `ADR-006` |
| D7 | Lazy expiry, `410`, expired rows retained | `ADR-007` |
| D8 | `supertest` + `@types/supertest` (dev-only) for API integration tests | `ADR-008` |
| D9 | Deletion out of MVP scope — no endpoint, no `deleted_at` | `ADR-009` |
| D10 | TypeScript 6.0.3, no-emit `tsconfig.json` + emitting `tsconfig.build.json` | `ADR-010` |
| D11 | ESLint 10 flat config with type-aware linting | `ADR-011` |
| D12 | `better-sqlite3` 13 + `@types/better-sqlite3` 9 with typed helpers | `ADR-012` |
| D13 | Node.js 24 LTS: `.nvmrc`, `engines ^24.0.0`, no `engine-strict` | `ADR-013` |
| D14 | Caret ranges plus a committed `package-lock.json`; `npm ci` | `ADR-014` |
| D15 | Canonical UTC timestamps `YYYY-MM-DDTHH:mm:ss.sssZ`, `expiresAt <= now` | `ADR-015` |
| D16 | Native ESM: `"type": "module"`, `nodenext`, `.js` import extensions | `ADR-016` |
| D17 | API contracts, `PUBLIC_BASE_URL` fail-fast, Host-header safety | `ADR-017` |
| D18 | `http`/`https` only, 2048-character cap, credentials rejected | `ADR-018` |
| D19 | Requirement-gap resolutions: unknown fields ignored, no duplicate-destination dedup, `/health` liveness only, body-parser failures → `400 VALIDATION_ERROR` | `ADR-019` |
| D20 | Redirect: guarded increment, no explicit transaction; `HEAD` does not count a click | `ADR-020` |
| D21 | `SQLITE_BUSY` after `busy_timeout` → `500 INTERNAL_ERROR`, no retry | `ADR-021` |
| D22 | `PORT` default `3000` in every environment; digits-only 1–65535, leading zeros insignificant | `ADR-022` |
| D23 | Locally served Swagger UI via `swagger-ui-dist` under `/api` | **Proposed** — `ADR-023` |

Sub-options resolved with the approval: expired-link statistics return `200` with
`isExpired: true`; `isCustom` is exposed; invalid or missing `PUBLIC_BASE_URL` fails fast in
production; URLs with embedded credentials are rejected. D19 additionally reconfirmed that
deletion stays out of the MVP.

## Approval state

Every decision D1–D22 is approved and has a matching ADR; see
[`docs/decisions/DECISION-REGISTER.md`](../decisions/DECISION-REGISTER.md). D1–D7 were approved as
recommended on 2026-11-19 with two clarifications recorded in their ADRs: the deps object
`createApp({ db, clock, config })` (D1) and **five generation attempts in total** (D5). D2's `CHECK`
set is limited to `click_count >= 0` and `is_custom IN (0,1)`. D20 and D21 were approved on
2026-11-19 from the Prompt 03 review, with corrections C-1 … C-3 applied. D22 (`PORT` default
`3000` in every environment, ASCII-digit parsing in 1–65535 with insignificant leading zeros) closed
the last proposal in FR-11 the same day. **D23 is Proposed, not approved**: the user approved only
the `swagger-ui-dist` dependency and asked for `ADR-023` to remain a draft. No decision is rejected
or superseded; changing one requires a new decision and a new ADR.

## Completed work

- [x] Initial product brief captured (`docs/ai-workflow/PROJECT.md`).
- [x] Architecture proposal captured as a proposal (`docs/architecture-proposal.md`).
- [x] **Prompt 00** session review completed and repository state inspected.
- [x] **Prompt 01** technical research completed and re-verified against the npm registry on
      2026-11-18; findings recorded in `docs/ai-workflow/research-findings.md`.
- [x] All decisions consolidated in `docs/decisions/DECISION-REGISTER.md` with no duplicates —
      18 on 2026-11-18, plus D19, D20, and D21 on 2026-11-19.
- [x] Documentation audit and synchronization (2026-11-18, commit `c804101`).
- [x] **D8–D18 approved by the user on 2026-11-18**; one ADR per decision written.
- [x] Register, proposal checklist, requirements, API specification, database design, testing
      strategy, security guidelines, roadmap, tasks, README, and changelog synchronized to the
      approved statuses.
- [x] **Prompt 02** requirements and acceptance criteria drafted in `docs/requirements.md`:
      FR-01 … FR-12 and NFR-01 … NFR-09, each with inputs, success behavior, validation rules,
      error cases and status codes, data changes, acceptance criteria, and tests needed.
- [x] **D1–D7 approved by the user on 2026-11-19** as recommended, with the deps-object signature
      (D1) and five generation attempts total (D5).
- [x] Recorded as `ADR-001.md` … `ADR-007.md`; register, proposal checklist, requirements, API
      specification, and database design finalized against them.
- [x] **Prompt 03 architecture review** completed 2026-11-19 in `docs/ai-workflow/architecture-review.md`;
      **D20** and **D21** approved (`ADR-020.md`, `ADR-021.md`) and corrections C-1 … C-3 applied
      across the design documents.
- [x] **D19 approved by the user on 2026-11-19** — the defaults for Q-2 … Q-5 adopted (unknown
      fields ignored, no duplicate-destination deduplication, `/health` liveness only,
      body-parser failures → `400 VALIDATION_ERROR`) and D9 reconfirmed. Folded into
      `docs/requirements.md` (FR-01, FR-07, FR-08, FR-10; AC-01.9, AC-01.10, AC-07.7, AC-08.6),
      `docs/api-specification.md`, and `docs/testing-strategy.md`.
- [x] Confirm the drafted acceptance criteria — all 77 are confirmed after D19, the D1–D7
      approval, and D22.
- [x] **Prompt 04 persistence design recorded (2026-11-19)** — `docs/database-design.md` now states
      the repository contract (six files, three operations, row mapping, UNIQUE translation, no
      transaction) and the repository-level test cases. No code, dependency, table, index, or
      migration was added; implementation needs the §1 scaffold first.
- [x] **D22 approved by the user on 2026-11-19** — `PORT` defaults to `3000` in every environment
      when unset or empty; a set value must be ASCII digits only with a numeric value in 1–65535,
      leading zeros are insignificant (`03000` → `3000`, `0000` rejected), and it is never parsed
      with a coercing `parseInt`. Recorded as `ADR-022.md`; FR-11 and AC-11.6 … AC-11.10,
      `docs/security-guidelines.md`, `docs/coding-standards.md`, `docs/testing-strategy.md`, and
      `docs/architecture-proposal.md` §7/§9 synchronized.
- [x] **§1 scaffold implemented and verified (2026-11-19)** — native ESM npm project, approved
      dependency set, tsconfig split, type-aware ESLint flat config, Vitest, all six scripts, lockfile,
      `createApp({ db, clock, config })` with a `db: unknown` placeholder (D1), startup `PORT`/`PUBLIC_BASE_URL`
      resolution (D17, D22), and liveness-only `GET /health` (D19). 91 tests pass across 3 files;
      all four `AGENTS.md` §8.2 checks pass. No table or link route was added.
- [x] **§2 database and shared infrastructure implemented and verified (2026-11-19)** —
      `src/db/connection.ts` (approved pragmas, file-only WAL), `src/db/schema.ts` (verbatim D2
      `CREATE TABLE IF NOT EXISTS`), `src/db/pragma.ts` and `src/db/id.ts` (typed helpers, no `any`),
      `src/lib/errors.ts` (six code-specific `AppError` subclasses), and
      `src/middleware/error-handler.ts` / `not-found.ts` (single envelope writer, `SQLITE_BUSY` →
      generic 500 with server-side logging per D21, body-parser failures → 400 per D19). 18 new
      tests; full gate passes with 109 tests across 5 files. No table other than `links`, no link
      routes, and no new dependency.
- [x] **§3 create-link behavior implemented and verified (2026-11-19)** — `links.schemas.ts` trims and
      validates `url` (D18) and strips unknown fields (D19); `code-generator.ts` uses
      `crypto.randomInt` for 7 Base62 characters (D5); `links.repository.ts` prepares bound
      `insert`/`findByCode` statements and translates `SQLITE_CONSTRAINT_UNIQUE`; `links.service.ts`
      retries five total attempts; and the routes/controller layers serve `POST /api/links` with the
      approved body and `Location` from `PUBLIC_BASE_URL`. The user approved a fixed `slaq.db`, so
      `startServer` opens and bootstraps it before `listen`. 37 new tests; full gate passes with 146
      tests across 9 files.
- [x] **§§4–7 implemented and verified (2026-11-19)** — §4 adds the guarded `incrementClick` (no
      transaction, D20), explicit `GET`/`HEAD /:code`, and exact `Location`/`302` behavior; §5 adds
      alias validation, case-insensitive reserved names, and `409 ALIAS_TAKEN`; §6 adds canonical
      future-only `expiresAt`, `410 LINK_EXPIRED` with no write, retained rows, and all eleven
      `docs/testing-strategy.md` boundary cases; §7 adds the full `GET /api/links/:code/stats` body
      with `Cache-Control: no-store` and `404` for unknown codes. Each section passed its own full
      gate (174, 162, 195, and 204 tests respectively); that §§4–7 gate had 204 tests in 14 files
      and was superseded by the §8 clean-install run with 217 tests in 15 files.
- [x] **§§4–7 committed** — the user committed the feature work and status updates locally as
      `5148145`; no push was made.
- [x] **§8 tests, API documentation, and README completed (2026-11-19)** — all examples in
      `docs/api-specification.md` were exercised against a live compiled server and the two observed
      mismatches were corrected; `docs/openapi.yaml` was added without a dependency; `README.md`
      now documents setup, usage, decisions, limitations, and future work; 13 coverage tests were
      added in `tests/acceptance-gaps.test.ts`. Production code was not changed.
- [x] **§8 committed** — the user committed the docs, coverage tests, and status updates as
      `f5d5a2e`; `origin/dev` now points at the same commit.
- [x] **§9 approved review fixes completed (2026-11-19)** — all three findings were written as
      failing tests first, then fixed in `links.schemas.ts` and `links.controller.ts`: control
      characters in a destination now return `400 VALIDATION_ERROR`, impossible `expiresAt` calendar
      dates are rejected while UTC normalization is preserved, and `404` statistics responses carry
      `Cache-Control: no-store`. Docs and task status were synchronized; the full gate passes with
      238 tests in 15 files.

## Known blockers

1. **Commit is pending user action** — the §11 Swagger UI work is modified/untracked but not
   committed. The exact `git add … && git commit` command is in the session report; the user must run
   it. This is a handoff step, not a technical failure.
2. **Push is a user decision** — `dev` is 3 commits ahead of `origin/dev`; nothing was pushed in this
   session.
3. **D23 is not approved** — `ADR-023` stays **Proposed** until the user approves it. Only the
   `swagger-ui-dist` dependency was explicitly approved for this task.

No review finding remains open: all three were approved by the user and fixed in §9.

No technical blocker is open for §§4–11: the §4 dependency was resolved by the user (implement §4
first), the stale AC-02.3 alias line was resolved by the user (case-insensitive reserved names), the
expiry/stats split was resolved by the user (minimal stats in §6), the three review findings were
approved and fixed in §9, the §10 tidy-up has 0 broken links, and §11 passes the `AGENTS.md` §8.2
gate plus a compiled-server smoke test from another working directory. D1–D22 are approved and
`better-sqlite3` loads on this machine.

## Latest verification evidence

### README screenshot (2026-11-19)

`swagger-screenshot.png` moved from the repository root to `docs/images/` and is embedded in the
"Interactive API documentation" section of `README.md`; the project tree lists the new directory.
The image bytes were not changed, and no source, test, dependency, or decision changed.

```bash
node /tmp/opencode/check-links.mjs
# -> Markdown files scanned: 69
# -> Internal links checked: 119
# -> Broken links: 0
```

### §11 locally served Swagger UI (2026-11-19)

```bash
node /tmp/opencode/check-links.mjs
# -> Markdown files scanned: 69
# -> Internal links checked: 118
# -> Broken links: 0

npm view swagger-ui-dist version dist-tags engines --json
# -> "version": "5.35.1", dist-tags.latest = "5.35.1", no engines field
node -v                                         # -> v24.22.1

npx vitest run tests/docs.test.ts               # before implementation
# -> Test Files 1 failed (1); Tests 4 failed | 2 passed (6)
# -> failures: /api/docs 404, asset 404, /api/openapi.yaml 404, relative servers URL absent

npx vitest run tests/docs.test.ts               # after implementation
# -> Test Files 1 passed (1); Tests 6 passed (6)

npm run build
cd /tmp/opencode/slaq-dist-check
PORT=3101 NODE_ENV=development PUBLIC_BASE_URL=http://localhost:3101 \
  node /home/vazgen/Desktop/slaq-url-shortener/dist/server.js &
# cwd: /tmp/opencode/slaq-dist-check
# GET /api/docs -> 200 text/html; charset=utf-8
# GET /api/openapi.yaml -> 200 application/yaml
# GET /api/docs/assets/swagger-ui.css -> 200 text/css; charset=utf-8
# GET /api/docs/assets/missing.js -> 404 application/json; charset=utf-8
# SwaggerUIBundle occurrences: 1
# served spec identical to docs/openapi.yaml: yes
# asset bytes: 187956
# 404 body: {"error":{"code":"NOT_FOUND","message":"Route not found"}}

npm run typecheck && npm run lint && npm test && npm run build
# -> typecheck:  tsc -p tsconfig.json                 (exit 0)
# -> lint:       eslint .                              (exit 0)
# -> test:       vitest run — 16 test files passed, 244 tests passed, 1.31 s
# -> build:      tsc -p tsconfig.build.json            (exit 0)
```

The compiled server resolved `docs/openapi.yaml` from its module location while running outside the
repository, so no `process.cwd()` dependency remains. `@scarf/scarf` was the only install-script
warning from adding `swagger-ui-dist`; it is install-time analytics and is not part of the runtime
path.

### §10 repository tidy-up: link check and gate (2026-11-19)

```bash
node /tmp/opencode/check-links.mjs
# -> Markdown files scanned: 68
# -> Internal links checked: 114
# -> Broken links: 0

npm run typecheck && npm run lint && npm test && npm run build
# -> typecheck:  tsc -p tsconfig.json                 (exit 0)
# -> lint:       eslint .                              (exit 0)
# -> test:       vitest run — 15 test files passed, 238 tests passed, 1.04 s
# -> build:      tsc -p tsconfig.build.json            (exit 0)
```

The link checker is a temporary dependency-free Node script outside the repository; it scans every
tracked Markdown file, resolves internal inline/reference links relative to each file, and validates
file targets and heading anchors.

### §9 approved fixes: red-first evidence and final gate (2026-11-19)

Each test was run before its fix and observed failing:

```bash
npx vitest run tests/create-link.test.ts -t 'control character'
# -> 5 failed: expected 201 to be 400

npx vitest run tests/expiry.test.ts tests/expiration.test.ts
# -> 5 failed: schema accepted impossible dates; one API case not yet isolated

npx vitest run tests/expiration.test.ts -t 'impossible calendar date'
# -> 1 failed: expected 201 to be 400 (2027-02-30, impossible but future)

npx vitest run tests/stats.test.ts -t '404 statistics response'
# -> 1 failed: expected undefined to be 'no-store'
```

Final gate after fixing the lint error (`no-control-regex` rejected a literal control-character
regex, replaced by an explicit `charCodeAt` check) and self-review cleanup:

```bash
npm run typecheck && npm run lint && npm test && npm run build
# -> typecheck:  tsc -p tsconfig.json                 (exit 0)
# -> lint:       eslint .                              (exit 0)
# -> test:       vitest run — 15 test files passed, 238 tests passed, 713 ms (final run)
# -> build:      tsc -p tsconfig.build.json            (exit 0)
```

### §8 clean-install gate and live API verification (2026-11-19)

```bash
rm -rf node_modules && npm ci && npm run typecheck && npm run lint && npm test && npm run build
# -> npm ci:     added 234 packages, audited 235, 0 vulnerabilities; install scripts for
#               better-sqlite3 and esbuild were blocked by this environment's allowScripts policy
# -> typecheck:  tsc -p tsconfig.json                 (exit 0)
# -> lint:       eslint .                              (exit 0)
# -> test:       vitest run — 15 test files passed, 217 tests passed, 1.32 s
# -> build:      tsc -p tsconfig.build.json            (exit 0)
```

A compiled server (`npm run build`) was started from `dist/` in `/tmp/opencode/slaq-live*` with its
own `slaq.db` and exercised with `curl`: `GET /health`, `POST /api/links` (generated, alias, expiry,
query/fragment, unknown fields, duplicate destination), `GET`/`HEAD /:code`, statistics (fresh,
clicked, expired, unknown code), `410` expiry, reserved and duplicate aliases, invalid URL,
malformed JSON, unmatched routes, `DELETE`, `Host` header, and response headers. Two doc mismatches
were fixed (`expiresAt` normalization and the validation error envelope). The hand-written
`docs/openapi.yaml` was parsed with `python3 -c "import yaml; yaml.safe_load(open('docs/openapi.yaml'))"`
— 3.1.0, 4 paths, 6 schemas. No new dependency.

### Earlier §§4–7 evidence

Commands run on 2026-11-19 for `docs/ai-workflow/TASKS.md` §§4–7 and the final §8 review, from the project root:

```bash
npm run typecheck && npm run lint && npm test && npm run build
# -> typecheck: tsc -p tsconfig.json                 (exit 0)
# -> lint:      eslint .                              (exit 0)
# -> test:      vitest run — 14 test files passed, 204 tests passed, 867 ms
# -> build:     tsc -p tsconfig.build.json            (exit 0)
```

Each section also passed the same gate on its own: §4 174 tests / 11 files, §5 162 tests / 10 files,
§6 195 tests / 13 files, and §7 204 tests / 14 files. Every section's tests were written first and
observed failing before implementation: §4 failed on `repo.incrementClick is not a function` and
missing redirect routes; §5 failed because aliases were ignored; §6 failed on missing expiry
validation and stats; §7 failed only on the absent `Cache-Control: no-store` header.

Earlier evidence from the §3 session follows.

Commands run on 2026-11-19 for `docs/ai-workflow/TASKS.md` §3 (create short links), from the project root:

```bash
npm run typecheck && npm run lint && npm test && npm run build
# -> typecheck: tsc -p tsconfig.json                 (exit 0)
# -> lint:      eslint .                              (exit 0)
# -> test:      vitest run — 9 test files passed, 146 tests passed, 776 ms
# -> build:     tsc -p tsconfig.build.json            (exit 0)
```

The §3 tests were written first and run before implementation; that red run failed with four
"Cannot find module" errors for the new generator/repository/service modules. Two additional tests
covering alias and expiry field types were removed after the first green attempt because `docs/ai-workflow/TASKS.md`
assigns that validation to §§5–6; no scope was expanded to make them pass.

Earlier evidence from the §2 session follows.

Commands run on 2026-11-19 for `docs/ai-workflow/TASKS.md` §2 (database and shared infrastructure), from the
project root:

```bash
npm run typecheck && npm run lint && npm test && npm run build
# -> typecheck: tsc -p tsconfig.json                 (exit 0)
# -> lint:      eslint .                              (exit 0)
# -> test:      vitest run — 5 test files passed, 109 tests passed, 688 ms
# -> build:     tsc -p tsconfig.build.json            (exit 0)

node -e "const D=require('better-sqlite3'); const db=new D(':memory:'); db.pragma('foreign_keys = ON'); db.pragma('busy_timeout = 5000'); db.pragma('synchronous = NORMAL'); console.log(db.pragma('foreign_keys',{simple:true}), db.pragma('busy_timeout',{simple:true}), db.pragma('synchronous',{simple:true}));"
# -> 1 5000 1
```

The first gate attempt failed lint with one `@typescript-eslint/no-unused-vars` error on the
fourth argument of the Express error middleware. Express selects error middleware by arity, so
`void _next;` documents the intentional non-use; no rule suppression was added. The full gate was
rerun and passed.

Earlier evidence from the §1 scaffold session follows.

Commands run on 2026-11-19 for `docs/ai-workflow/TASKS.md` §1 (scaffold), from the project root:

```bash
node -e "const Database = require('better-sqlite3'); const db = new Database(':memory:'); console.log(db.prepare('SELECT sqlite_version() AS v').get().v); db.close();"
# -> 3.54.1

npm ls --depth=0
# -> slaq@0.1.0 with 15 packages, all at the exact versions approved in docs/ai-workflow/research-findings.md §2
#    (better-sqlite3 13.2.0, express 5.3.0, zod 4.6.7, typescript 6.0.3, eslint 10.15.0,
#     @eslint/js 10.0.1, typescript-eslint 8.73.0, globals 17.14.0, vitest 5.1.1,
#     tsx 4.23.15, supertest 7.3.2, @types/* 5.0.6 / 24.19.2 / 9.6.0 / 7.2.1)

npm run typecheck && npm run lint && npm test && npm run build
# -> typecheck: tsc -p tsconfig.json                 (exit 0)
# -> lint:      eslint .                              (exit 0)
# -> test:      vitest run — 3 test files passed, 91 tests passed, 473 ms
# -> build:     tsc -p tsconfig.build.json            (exit 0)

node -e "const l=require('./package-lock.json'); console.log(l.lockfileVersion)"
# -> 3
```

The first gate attempt failed lint with 7 `@typescript-eslint/no-unsafe-*` errors caused by
`any`-typed Vitest asymmetric matchers and an untyped spy. Both test files were fixed with an
explicitly typed `ConfigError` helper and `Mock<typeof Server.prototype.listen>`; no rule
suppression, `@ts-ignore`, or `any` was introduced. The full gate was then rerun and passed.

Historical evidence from earlier documentation sessions follows.

Commands run on 2026-11-18 from the project root on the user's machine:

```bash
git log --oneline -4
# -> 43efa1a docs: record D8-D18 approvals and synchronize decision status
#    c804101 docs: synchronize research findings and consolidate decisions D1-D18
#    b01087c docs: establish execution framework baseline and sync project state

git rev-parse HEAD master origin/master
# -> 43efa1a10919642a3e96ba54c7ad980a30bc4565  (dev)
#    c804101b32d1a0475f962413992cd1e4429ac167  (master)
#    c804101b32d1a0475f962413992cd1e4429ac167  (origin/master)

git ls-files | wc -l          # -> 57
ls docs/decisions/ADR-*.md | wc -l   # -> 11
git status -sb                # -> ## dev...origin/master (6 modified, nothing staged)
git diff --check              # -> clean
node -v ; npm -v              # -> v24.22.1 / 12.2.1
```

Commands run on 2026-11-19 (D19 documentation update):

```bash
node /tmp/slaq-linkcheck.mjs          # -> markdown links checked: 60 broken: 0
git status -sb                        # -> 11 modified + ADR-019.md untracked, nothing staged
git diff --check                      # -> clean
ls docs/decisions/ADR-*.md | wc -l    # -> 12
grep -c '^## FR-' docs/requirements.md    # -> 12
grep -c '^### NFR-' docs/requirements.md  # -> 9
```

Commands run on 2026-11-19 (D1–D7 approval):

```bash
node /tmp/slaq-linkcheck.mjs        # -> markdown links checked: 87 broken: 0
git diff --check                    # -> clean (exit 0)
ls docs/decisions/ADR-*.md | wc -l  # -> 19
git status --porcelain              # -> 18 modified, 8 untracked ADRs, 0 staged
grep -c 'Partly confirmed' docs/requirements.md   # -> 0
grep -c '^## FR-' docs/requirements.md           # -> 12
grep -c '^### NFR-' docs/requirements.md         # -> 9
```

Commands run on 2026-11-19 after committing the D1–D7 work:

```bash
git log --oneline -4               # -> 24a83b0 docs: resolve requirement gaps as D19
                                   #    43efa1a docs: record D8-D18 approvals ...
git status -sb                     # -> ## dev...origin/master [ahead 1]; clean tree
git ls-files | wc -l               # -> 65
ls docs/decisions/ADR-*.md | wc -l # -> 19, all tracked
node /tmp/slaq-linkcheck.mjs       # -> markdown links checked: 87 broken: 0
```

Commands run on 2026-11-19 for the Prompt 03 architecture review:

```bash
node /tmp/slaq-linkcheck.mjs              # -> 112 links checked, 0 broken
git diff --check                          # -> clean
grep -cE '^\| D[0-9]+ ' docs/decisions/DECISION-REGISTER.md   # -> 21 entries, 2 Pending
ls docs/decisions/ADR-*.md | wc -l        # -> 21
git status --porcelain                    # -> docs only; no code, no dependency changes
```

The review added no code and installed nothing. D20 and D21 were approved on 2026-11-19 and are
recorded as `ADR-020` and `ADR-021`; C-1 … C-3 are applied across the design documents.

Commands run on 2026-11-19 for the D22 documentation synchronization:

```bash
node -e '<repository Markdown link check>'   # -> markdown links checked: 118 broken: 0
git diff --check                             # -> clean (exit 0)
ls docs/decisions/ADR-*.md | wc -l           # -> 22
grep -cE '^\| D[0-9]+ \|' docs/decisions/DECISION-REGISTER.md   # -> 22 summary rows
grep -E '^\| D[0-9]+ \|' … | grep -vc 'Approved'               # -> 0 non-Approved rows
grep -n 'Pending User Approval:' docs/decisions/DECISION-REGISTER.md
# -> none — D1–D22 are all Approved
grep -cE '^[[:space:]]*[0-9]+\. AC-' docs/requirements.md      # -> 77 acceptance criteria
ls package.json src node_modules             # -> none exist
git status --porcelain                       # -> 14 modified + ADR-022.md untracked, nothing staged
```

The link check scanned every `.md` file and found **0 broken links**, including the new
`ADR-022` references. D22 added no code, dependency, install, or test execution; at that time the
`AGENTS.md` §8.2 gate could not run because there was no npm project. The §1 evidence at the top of
this section supersedes that status.

The Markdown-link check covers every `.md` file in the repository and reported **0 broken links**.

Dependency versions were verified earlier against the registry (not installed):
`typescript` 6.0.3 in the 6.x line (latest 7.0.2), `eslint` 10.15.0, `@eslint/js` 10.0.1,
`typescript-eslint` 8.73.0, `globals` 17.14.0, `express` 5.3.0, `zod` 4.6.7, `vitest` 5.1.1,
`tsx` 4.23.15, `supertest` 7.3.2, `@types/supertest` 7.2.1, `better-sqlite3` 13.2.0,
`@types/better-sqlite3` 9.6.0, `@types/express` 5.0.6, `@types/node` 24.19.2.

In that documentation-only session, no code, dependency, install, test, build, commit, or push was
performed. The §1 scaffold session at the top of this section supersedes that status.

## Next recommended action

Run the prepared `git add … && git commit …` command to land §11, the dependency/lockfile update,
ADR-023, and the status updates (do not push until the user chooses; `dev` is 3 commits ahead of
`origin/dev`). Link checking reports 0 broken links and the full gate passes. D23 remains **Proposed**
until the user approves it; do not reopen an approved decision without a new ADR.
