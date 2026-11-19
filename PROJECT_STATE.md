# Project State — Slaq

> Update this file at the start and end of every substantial AI-assisted session.
> **Last rewritten:** 2026-11-19 (§1–§2 committed; §3 create-link behavior implemented and verified,
> awaiting the user's commit; §4 is the next step).

## Current status

- **Overall:** Design approved and final — **22 of 22 decisions approved**; the Prompt 03
  architecture review is approved in full and no architecture decision is pending
- **Current phase:** Phase 5 — implementation. `TASKS.md` §1–§3 are complete and verified; §4
  (redirect and click tracking) is the next step and is explicitly out of scope for this pass.
- **Implementation started:** Yes — §1 is committed as `acb51ec` and §2 as `93dd0f8`. §3 adds
  `src/lib/code-generator.ts`, `src/modules/links/*`, and four test files as untracked paths, plus
  modifications to the app, server, and existing test helpers. The create route and repository
  `insert`/`findByCode` exist; click increment, redirect routes, aliases, expiry, and statistics do
  not.
- **Architecture status:** **Approved** — `docs/architecture-proposal.md` records the approved
  layers, routes, schema, redirect, codes, aliases, and expiry (D1–D7)
- **Approved decisions:** **D8–D18** (2026-11-18); **D1–D7**, **D19**, **D20**, **D21**, and
  **D22** (2026-11-19), recorded as `docs/decisions/ADR-001.md` … `ADR-022.md`
- **Pending decisions:** none — **D1–D22 are all Approved**; C-1 … C-3 are applied
- **Requirements:** `docs/requirements.md` — FR-01 … FR-12, NFR-01 … NFR-09, and 77 acceptance
  criteria, every one confirmed or explicitly out of scope (FR-09); no requirement contains a
  proposal
- **Last verified test run:** 2026-11-19 (§3) — `npm run typecheck && npm run lint && npm test &&
  npm run build`: all four pass; 9 test files, 146 tests, 776 ms
- **Current timebox:** approximately five hours for the MVP; create-link route done, redirect,
  aliases, expiry, statistics, and final docs still pending

## Repository and Git status (re-verified 2026-11-19 from actual git output)

- Branch: **`dev`** (checked out) — **9 commits ahead of `origin/master`**, none pushed; local
  `master` sits one commit behind `origin/master`.
- `HEAD` = `dev` = **`93dd0f8`** (`feat: add database bootstrap, typed errors, and error middleware`).
  The user committed §2 after the previous session; `origin/master` is `43efa1a`.
- Remote: **`origin` = `git@github.com:gasparyanvazgen/slaq-url-shortener.git`** (fetch and push);
  remote-tracking branches are `origin/master` and `origin/dev`.
- `git ls-files` reports **93 tracked files**. `docs/decisions/` holds `ADR-001.md` … `ADR-022.md`,
  one record per approved decision, all 22 tracked.
- Working tree: **not clean** — `src/app.ts`, `src/server.ts`, `tests/errors.test.ts`,
  `tests/health.test.ts`, and `tests/server.test.ts` are modified; the §3 code and test paths are
  untracked. Nothing is staged and `git diff --check` reports no whitespace errors. `dist/`,
  `node_modules/`, and `*.db` files are ignored.
- The lockfile is version 3 and pins the exact approved versions; no dependency was added or changed
  in §3. All §3 files are ready for the user's commit; no commit or push was made in this session.
- `.gitignore` ignores `.env` and `.env.*` and exempts `!.env.example`, so a future example file
  stays trackable (evidence below).
- The temporary Freebuff branches `freebuff/2628b5015cbd1c3ac4b90176` and `freebuff-base` were
  deleted on 2026-11-18 at the user's request; `freebuff-base` held only an orphan commit with an
  empty tree.
- `docs/decisions/` contains `README.md`, `DECISION-REGISTER.md`, and `ADR-001.md` … `ADR-022.md`,
  one record per approved decision; **all 22 decisions are approved**.
- Evidence for the statements above:

  ```bash
  git rev-parse --abbrev-ref HEAD             # -> dev
  git rev-parse HEAD                          # -> 93dd0f837cbef45b8a4a0fe5c1b680f0a44e96ef
  git rev-parse origin/master                 # -> 43efa1a10919642a3e96ba54c7ad980a30bc4565
  git rev-list --count origin/master..HEAD    # -> 9
  git ls-files | wc -l                        # -> 93
  git status --porcelain                       # -> 5 modified, 8 untracked §3 paths
  git diff --check                            # -> clean (exit 0)
  ls docs/decisions/ADR-*.md | wc -l          # -> 22
  git check-ignore -v .env.local              # -> .gitignore:9:.env.*
  git check-ignore -v .env.example            # -> .gitignore:10:!.env.example
  ```

## Toolchain reality in this workspace

- **Node.js v24.22.1**, npm **12.2.1** — this satisfies the approved Node 24 LTS target (D13).
- The earlier Node 26.13.0 measurement came from a cloud sandbox, not from this machine; the
  runtime blocker it created is resolved.
- Dependencies are installed from the committed-range lockfile: `npm ls --depth=0` shows all 15
  packages at the exact versions in `docs/research-findings.md` §2.
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

Sub-options resolved with the approval: expired-link statistics return `200` with
`isExpired: true`; `isCustom` is exposed; invalid or missing `PUBLIC_BASE_URL` fails fast in
production; URLs with embedded credentials are rejected. D19 additionally reconfirmed that
deletion stays out of the MVP.

## Approval state

Every decision D1–D22 is approved and has a matching ADR; see
[`docs/decisions/DECISION-REGISTER.md`](docs/decisions/DECISION-REGISTER.md). D1–D7 were approved as
recommended on 2026-11-19 with two clarifications recorded in their ADRs: the deps object
`createApp({ db, clock, config })` (D1) and **five generation attempts in total** (D5). D2's `CHECK`
set is limited to `click_count >= 0` and `is_custom IN (0,1)`. D20 and D21 were approved on
2026-11-19 from the Prompt 03 review, with corrections C-1 … C-3 applied. D22 (`PORT` default
`3000` in every environment, ASCII-digit parsing in 1–65535 with insignificant leading zeros) closed
the last proposal in FR-11 the same day. No decision is pending, rejected, or superseded; changing
one requires a new decision and a new ADR.

## Completed work

- [x] Initial product brief captured (`PROJECT.md`).
- [x] Architecture proposal captured as a proposal (`docs/architecture-proposal.md`).
- [x] **Prompt 00** session review completed and repository state inspected.
- [x] **Prompt 01** technical research completed and re-verified against the npm registry on
      2026-11-18; findings recorded in `docs/research-findings.md`.
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
- [x] **Prompt 03 architecture review** completed 2026-11-19 in `docs/architecture-review.md`;
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
      tests across 9 files. Alias (§5), expiry (§6), statistics (§7), and redirect (§4) remain pending.
- [ ] Redirect, alias, expiration, and statistics behavior implemented.
- [ ] Tests, API documentation, and README usage section completed.

## Known blockers

1. **Commit is pending user action** — the §3 files and documentation updates are untracked or
   modified, not committed. The exact `git add … && git commit` command is in the session report;
   the user must run it. This is a handoff step, not a technical failure.
2. **Scope stop after §3** — per the user's instruction, §4 (redirect and click tracking) was not
   started in this pass. The repository's guarded `incrementClick` operation and `GET`/`HEAD /:code`
   routes are still pending.

No technical blocker is open for §3: the database filename was resolved by the user to a fixed
`slaq.db`, the `AGENTS.md` §8.2 gate passes, all 22 decisions are approved, and `better-sqlite3`
loads on this machine.

## Latest verification evidence

Commands run on 2026-11-19 for `TASKS.md` §3 (create short links), from the project root:

```bash
npm run typecheck && npm run lint && npm test && npm run build
# -> typecheck: tsc -p tsconfig.json                 (exit 0)
# -> lint:      eslint .                              (exit 0)
# -> test:      vitest run — 9 test files passed, 146 tests passed, 776 ms
# -> build:     tsc -p tsconfig.build.json            (exit 0)
```

The §3 tests were written first and run before implementation; that red run failed with four
"Cannot find module" errors for the new generator/repository/service modules. Two additional tests
covering alias and expiry field types were removed after the first green attempt because `TASKS.md`
assigns that validation to §§5–6; no scope was expanded to make them pass.

Earlier evidence from the §2 session follows.

Commands run on 2026-11-19 for `TASKS.md` §2 (database and shared infrastructure), from the
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

Commands run on 2026-11-19 for `TASKS.md` §1 (scaffold), from the project root:

```bash
node -e "const Database = require('better-sqlite3'); const db = new Database(':memory:'); console.log(db.prepare('SELECT sqlite_version() AS v').get().v); db.close();"
# -> 3.54.1

npm ls --depth=0
# -> slaq@0.1.0 with 15 packages, all at the exact versions approved in docs/research-findings.md §2
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

Run the prepared `git add … && git commit …` command to land the §3 files and status updates (do not
push until the user chooses). Then implement `TASKS.md` §4 using the already-approved repository
contract: add `incrementClick(code, nowIso)` to `src/modules/links/links.repository.ts` (the guarded
`UPDATE` with `expires_at IS NULL OR expires_at > @now`, returning `changes`, prepared once, no
explicit transaction), then `GET /:code` and a non-counting `HEAD /:code` through the service and
controller. Register the catch-all redirect route after `/health` and `/api` so it cannot shadow
them. The design gate is closed — do not reopen an approved decision without a new ADR. After §4,
work through `TASKS.md` §5–§8 and rerun the `AGENTS.md` §8.2 gate
(`npm run typecheck && npm run lint && npm test && npm run build`).
