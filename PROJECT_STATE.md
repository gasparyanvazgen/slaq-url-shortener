# Project State — Slaq

> Update this file at the start and end of every substantial AI-assisted session.
> **Last rewritten:** 2026-11-18 (D8–D18 approval synchronization).

## Current status

- **Overall:** Planning — **11 of 18 decisions approved** (D8–D18); D1–D7 pending
- **Current phase:** Phase 3 — Architecture, Data & Redirects (toolchain and contracts approved;
  architecture and behavior still awaiting approval)
- **Implementation started:** No — no `package.json`, `src/`, `tests/`, `tsconfig.json`, lockfile,
  or `node_modules` exists
- **Architecture status:** **Partially approved** — `docs/architecture-proposal.md` is still a
  proposal for D1–D7 (layers, routes, schema, redirect, codes, aliases, expiry)
- **Approved decisions:** **D8–D18** (2026-11-18), recorded as `docs/decisions/ADR-008.md` …
  `ADR-018.md`
- **Pending decisions:** **D1–D7**
- **Last verified test run:** None — no npm project or test script exists, so the `AGENTS.md` §8.2
  gate cannot run
- **Current timebox:** approximately five hours for the MVP, not started

## Repository and Git status (verified 2026-11-18 on the user's machine)

- Branch: **`dev`** (checked out), created from `master`; `master` and `dev` both track
  `origin/master`.
- Commits: `HEAD` = `master` = `origin/master` = **`c804101`**
  (`docs: synchronize research findings and consolidate decisions D1-D18`), parent `b01087c`
  (`docs: establish execution framework baseline and sync project state`).
- Remote: **`origin` = `git@github.com:gasparyanvazgen/slaq-url-shortener.git`**. The local and
  remote `master` are in sync; nothing is ahead or behind.
- `git ls-files` reports **46 tracked files** (documentation, framework, and templates only).
- Working tree: the approval-synchronization changes are **uncommitted** — the register, the
  synchronized status/design documents, and 11 new ADRs (`docs/decisions/ADR-008.md` …
  `ADR-018.md`); nothing is staged. Run `git status` for the exact list.
- The temporary Freebuff branches `freebuff/2628b5015cbd1c3ac4b90176` and `freebuff-base` were
  deleted on 2026-11-18 at the user's request; `freebuff-base` held only an orphan commit with an
  empty tree.
- `docs/decisions/` contains `README.md`, `DECISION-REGISTER.md`, and `ADR-008.md` … `ADR-018.md`.
  **No ADR exists for D1–D7**, because those decisions are not approved.

## Toolchain reality in this workspace

- **Node.js v24.22.1**, npm **12.2.1** — this satisfies the approved Node 24 LTS target (D13).
- The earlier Node 26.13.0 measurement came from a cloud sandbox, not from this machine; the
  runtime blocker it created is resolved.
- Nothing is installed: no `node_modules`, no lockfile. `better-sqlite3` prebuilt-binary loading
  and every npm script remain unproven.

## Approved decisions — D8–D18

| ID | Decision | ADR |
|---|---|---|
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

Sub-options resolved with the approval: expired-link statistics return `200` with
`isExpired: true`; `isCustom` is exposed; invalid or missing `PUBLIC_BASE_URL` fails fast in
production; URLs with embedded credentials are rejected.

## Pending decisions — D1–D7

| ID | Decision | Status |
|---|---|---|
| D1 | Layered architecture and feature-module layout | Pending User Approval |
| D2 | `links` schema and schema bootstrap (including the `CHECK` constraints) | Pending User Approval |
| D3 | API routes and error envelope | Pending User Approval |
| D4 | Redirect status `302` | Pending User Approval |
| D5 | 7-character Base62 codes, five collision retries | Pending User Approval |
| D6 | Alias rules, case sensitivity, reserved names | Pending User Approval |
| D7 | Lazy expiration, `410`, expired rows retained | Pending User Approval |

Full text: [`docs/decisions/DECISION-REGISTER.md`](docs/decisions/DECISION-REGISTER.md).

## Completed work

- [x] Initial product brief captured (`PROJECT.md`).
- [x] Architecture proposal captured as a proposal (`docs/architecture-proposal.md`).
- [x] **Prompt 00** session review completed and repository state inspected.
- [x] **Prompt 01** technical research completed and re-verified against the npm registry on
      2026-11-18; findings recorded in `docs/research-findings.md`.
- [x] All 18 decisions consolidated in `docs/decisions/DECISION-REGISTER.md` with no duplicates.
- [x] Documentation audit and synchronization (2026-11-18, commit `c804101`).
- [x] **D8–D18 approved by the user on 2026-11-18**; one ADR per decision written.
- [x] Register, proposal checklist, requirements, API specification, database design, testing
      strategy, security guidelines, roadmap, tasks, README, and changelog synchronized to the
      approved statuses.
- [ ] Approve or amend D1–D7.
- [ ] Record any D1–D7 approval as `ADR-001` … `ADR-007`.
- [ ] Confirm requirements and acceptance criteria (Prompt 02).
- [ ] Implementation scaffolded.
- [ ] Database and schema implemented.
- [ ] Create-link, redirect, alias, expiration, and statistics behavior implemented.
- [ ] Tests, API documentation, and README usage section completed.

## Known blockers

1. **Approval gate for implementation** — D1–D7 are unanswered. `AGENTS.md` §3 forbids implementing
   the architecture, schema, routes, redirect status, code generation, alias rules, or expiry
   behavior before they are approved.
2. **No npm project** — `npm run typecheck && npm run lint && npm test && npm run build` cannot
   run. Expected at this stage, not a failure.
3. **D2 `CHECK` constraints unresolved** — the refined constraint set from the final decision
   clarification report belongs to D2 and is not approved, so the schema remains provisional.

## Latest verification evidence

Commands run on 2026-11-18 from the project root on the user's machine:

```bash
git status -sb
# -> ## dev...origin/master   (modified docs + 11 untracked ADRs, nothing staged)

git rev-parse HEAD master origin/master
# -> c804101b32d1a0475f962413992cd1e4429ac167  (all three identical)

git branch -vv
# -> * dev    c804101 [origin/master] ...
#    master   c804101 [origin/master] ...

git ls-files | wc -l
# -> 46

ls docs/decisions/ADR-*.md | wc -l
# -> 11

node -v ; npm -v
# -> v24.22.1 / 12.2.1
```

Dependency versions were verified earlier against the registry (not installed):
`typescript` 6.0.3 in the 6.x line (latest 7.0.2), `eslint` 10.15.0, `@eslint/js` 10.0.1,
`typescript-eslint` 8.73.0, `globals` 17.14.0, `express` 5.3.0, `zod` 4.6.7, `vitest` 5.1.1,
`tsx` 4.23.15, `supertest` 7.3.2, `@types/supertest` 7.2.1, `better-sqlite3` 13.2.0,
`@types/better-sqlite3` 9.6.0, `@types/express` 5.0.6, `@types/node` 24.19.2.

No `npm install`, typecheck, lint, test, build, commit, or push was performed.

## Next recommended action

Ask the user to approve, amend, or reject **D1–D7**, including D2's `CHECK` constraint set. On
approval, write `ADR-001.md` … `ADR-007.md` from `templates/adr-template.md`, update the register
and the proposal checklist, then proceed to Prompt 02 (requirements and acceptance criteria).
Do not scaffold the Express application before the D1–D7 gate is complete.
