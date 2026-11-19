# Project State — Slaq

> Update this file at the start and end of every substantial AI-assisted session.
> **Last rewritten:** 2026-11-19 (D22 approval, `PORT` default recorded, design final).

## Current status

- **Overall:** Design approved and final — **22 of 22 decisions approved**; the Prompt 03
  architecture review is approved in full and no architecture decision is pending
- **Current phase:** Phase 5 entry — requirements, architecture, API contract, schema, testing
  strategy, and the Prompt 03 architecture review are final; the implementation scaffold is the next
  step
- **Implementation started:** No — no `package.json`, `src/`, `tests/`, `tsconfig.json`, lockfile,
  or `node_modules` exists
- **Architecture status:** **Approved** — `docs/architecture-proposal.md` records the approved
  layers, routes, schema, redirect, codes, aliases, and expiry (D1–D7)
- **Approved decisions:** **D8–D18** (2026-11-18); **D1–D7**, **D19**, **D20**, **D21**, and
  **D22** (2026-11-19), recorded as `docs/decisions/ADR-001.md` … `ADR-022.md`
- **Pending decisions:** none — **D1–D22 are all Approved**; C-1 … C-3 are applied
- **Requirements:** `docs/requirements.md` — FR-01 … FR-12, NFR-01 … NFR-09, and 77 acceptance
  criteria, every one confirmed or explicitly out of scope (FR-09); no requirement contains a
  proposal
- **Last verified test run:** None — no npm project or test script exists, so the `AGENTS.md` §8.2
  gate cannot run
- **Current timebox:** approximately five hours for the MVP, not started

## Repository and Git status (verified 2026-11-19 on the user's machine)

- Branch: **`dev`** (checked out), tracking `origin/master`.
- Commits: `HEAD` = `dev` = **`56f1915`** (`docs: approve D20/D21 and apply Prompt 03 corrections`),
  whose history is `56f1915` → `dcc4698` (`docs: add Prompt 03 architecture review with pending
  proposals`) → `731b59c` (`docs: sync project state after requirements finalization`) → `24a83b0`
  (`docs: resolve requirement gaps as D19`). `dev` is **four commits ahead of `origin/master`**, and
  none of them has been pushed.
- Remote: **`origin` = `git@github.com:gasparyanvazgen/slaq-url-shortener.git`**.
- `git ls-files` reports **68 tracked files**; the D22 session adds `docs/decisions/ADR-022.md`
  as the one new path, so the tracked set becomes 69 once it is committed. `docs/decisions/` holds
  `ADR-001.md` … `ADR-022.md`, one record per approved decision.
- Working tree: **13 modified + 1 untracked** (`ADR-022.md`), nothing staged — this is the D22
  documentation synchronization described below, not unrelated change.
- The temporary Freebuff branches `freebuff/2628b5015cbd1c3ac4b90176` and `freebuff-base` were
  deleted on 2026-11-18 at the user's request; `freebuff-base` held only an orphan commit with an
  empty tree.
- `docs/decisions/` contains `README.md`, `DECISION-REGISTER.md`, and `ADR-001.md` … `ADR-022.md`,
  one record per approved decision; **all 22 decisions are approved**.

## Toolchain reality in this workspace

- **Node.js v24.22.1**, npm **12.2.1** — this satisfies the approved Node 24 LTS target (D13).
- The earlier Node 26.13.0 measurement came from a cloud sandbox, not from this machine; the
  runtime blocker it created is resolved.
- Nothing is installed: no `node_modules`, no lockfile. `better-sqlite3` prebuilt-binary loading
  and every npm script remain unproven.

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
- [ ] Implementation scaffolded.
- [ ] Database and schema implemented.
- [ ] Create-link, redirect, alias, expiration, and statistics behavior implemented.
- [ ] Tests, API documentation, and README usage section completed.

## Known blockers

1. **No npm project** — `npm run typecheck && npm run lint && npm test && npm run build` cannot
   run. Expected before scaffolding, not a failure.

The approval gate is closed: D1–D7 were approved on 2026-11-19, so implementation may begin. No other
blocker is open.

## Latest verification evidence

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
`ADR-022` references. D22 added no code, dependency, install, or test execution; the
`AGENTS.md` §8.2 gate still cannot run because there is no npm project.

The Markdown-link check covers every `.md` file in the repository and reported **0 broken links**.

Dependency versions were verified earlier against the registry (not installed):
`typescript` 6.0.3 in the 6.x line (latest 7.0.2), `eslint` 10.15.0, `@eslint/js` 10.0.1,
`typescript-eslint` 8.73.0, `globals` 17.14.0, `express` 5.3.0, `zod` 4.6.7, `vitest` 5.1.1,
`tsx` 4.23.15, `supertest` 7.3.2, `@types/supertest` 7.2.1, `better-sqlite3` 13.2.0,
`@types/better-sqlite3` 9.6.0, `@types/express` 5.0.6, `@types/node` 24.19.2.

No `npm install`, typecheck, lint, test, build, commit, or push was performed.

## Next recommended action

Start implementation at `TASKS.md` §1: initialize the npm project with `"type": "module"`, pin
the approved dependency set, configure TypeScript/ESLint/Vitest, resolve `PORT` per D22 alongside
`PUBLIC_BASE_URL`, and add `GET /health` through `createApp({ db, clock, config })`. Prompt 04's
persistence design is ready and needs no new decision; once the scaffold exists, implement it as
`src/db/connection.ts`, `src/db/pragma.ts`, `src/db/schema.ts`, `src/db/id.ts`,
`src/modules/links/links.types.ts`, and `src/modules/links/links.repository.ts`, with tests for
schema, connection/pragmas, and the repository. The design gate is closed — do not reopen an approved decision
without a new ADR. Then work through `TASKS.md` §2–§8 and run the `AGENTS.md` §8.2 gate
(`npm run typecheck && npm run lint && npm test && npm run build`).
