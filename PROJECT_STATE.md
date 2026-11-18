# Project State — Slaq

> Update this file at the start and end of every substantial AI-assisted session.
> **Last rewritten:** 2026-11-18 (documentation synchronization after Prompt 00/01 research).

## Current status

- **Overall:** Planning — research complete, **18 decisions awaiting user approval**
- **Current phase:** Phase 3 — Architecture, Data & Redirects (research sub-step complete)
- **Implementation started:** No — no `package.json`, `src/`, `tests/`, `tsconfig.json`,
  lockfile, or `node_modules` exists
- **Architecture status:** **Proposed** — `docs/architecture-proposal.md` is still a proposal and
  every decision D1–D18 is **Pending User Approval**
- **Approved decisions:** none
- **Last verified test run:** None — no npm project or test script exists, so the `AGENTS.md` §8.2
  gate cannot run
- **Current timebox:** approximately five hours for the MVP, not started

## Repository and Git status (verified 2026-11-18)

- Branch: **`dev`** — the only local branch, created from `master` at commit `b01087c`.
- Base branch: **`master`** (GitHub `gasparyanvazgen/slaq-url-shortener`), same commit and tree as `dev`.
- The temporary Freebuff branches `freebuff/2628b5015cbd1c3ac4b90176` and `freebuff-base` were
  deleted on 2026-11-18 at the user's request; `freebuff-base` held only an orphan commit with an
  empty tree.
- Baseline commit: **`b01087c`** — `docs: establish execution framework baseline and sync project state`.
- Working tree has the **uncommitted documentation audit changes**: 17 modified files plus 2 new
  files (`docs/decisions/DECISION-REGISTER.md`, `docs/research-findings.md`); nothing is staged.
- `git ls-files` reports **44 tracked files** (documentation, framework, and templates only).
- **No Git remote is configured** in this workspace (`git remote -v` is empty), so there is no
  `origin/master`, no ahead/behind comparison, and nothing to push to from here.
- The repository is documentation only: no application source, package manifest, lockfile, or
  installed dependencies.
- `docs/decisions/` contains `README.md` and `DECISION-REGISTER.md`; **no ADR has been written**,
  because no decision has been approved.

> **Correction:** earlier revisions of this file claimed `master` had no commits and that every
> file was untracked. That was true before the baseline commit and is **no longer accurate**.
> The §8.1 whole-diff self-review is now possible against `b01087c`.

## Toolchain reality in this workspace

- Node.js **v26.13.0**, npm **11.20.0**, module ABI 147.
- Proposed project target is **Node.js 24 LTS** (D13). The sandbox is two majors ahead, so the
  declared runtime cannot be exercised here. `engines` is advisory (no `engine-strict`), so
  development is possible, but Node 24 support remains unverified until run under 24.

## Approved decisions

**None.** No architecture, schema, API, dependency, or toolchain decision has been approved by
the user. Do not implement against any item in the register as though it were settled.

## Pending decisions — D1–D18

The full text, justification, alternatives, verification, and affected documents for every item
live in [`docs/decisions/DECISION-REGISTER.md`](docs/decisions/DECISION-REGISTER.md). Summary:

| Group | IDs | Status |
|---|---|---|
| Architecture and behavior (from the proposal's nine-item checklist) | D1–D9 | Pending User Approval |
| Toolchain and contracts (Prompt 01 research) | D10–D18 | Pending User Approval |

Open sub-options that block a clean "approved" state:

1. **D8** — `supertest` (recommended) or built-in `fetch` for API tests.
2. **D9** — confirm deletion is **out of scope**.
3. **D2** — add `CHECK (click_count >= 0)` / `CHECK (is_custom IN (0,1))`.
4. **D17** — stats of an expired link (`200` + `isExpired`, recommended) vs `410`; expose
   `isCustom`; production fail-fast (recommended) vs warn.
5. **D18** — reject URLs with embedded credentials (recommended yes).
6. **D13** — keep Node 24 LTS (recommended) or move to Node 26, which this sandbox already runs.
7. **D6** — confirm aliases are case-sensitive.
8. **D14** — confirm caret ranges plus a committed `package-lock.json`.
9. `.gitignore` — `.env.*` is currently **not** ignored (only `.env`). Recommended:
   ignore `.env.*` while keeping `.env.example` trackable.

## Completed work

- [x] Initial product brief captured (`PROJECT.md`).
- [x] Architecture proposal captured as a proposal (`docs/architecture-proposal.md`).
- [x] Repository and Git status inspected — 2026-11-18: baseline commit `b01087c`, clean tree,
      44 tracked files, no remote, documentation-only.
- [x] **Prompt 00** session review completed: repository, Git, documents, and stale state
      identified.
- [x] **Prompt 01** technical research completed and re-verified against the npm registry on
      2026-11-18: TypeScript/ESLint compatibility, `better-sqlite3` + typings, Node policy,
      dependency ranges, ESM, timestamps, expiration boundary, `PUBLIC_BASE_URL`/Host-header
      safety, API contracts, URL limits, database and testing considerations.
- [x] Verified findings recorded in `docs/research-findings.md` (no longer only in chat).
- [x] All 18 decisions consolidated in `docs/decisions/DECISION-REGISTER.md` with statuses and
      no approvals.
- [x] Documentation audit and synchronization: `PROJECT.md`, `README.md`, `ROADMAP.md`,
      `TASKS.md`, `CHANGELOG.md`, and the `docs/` design set cross-referenced to the register.
- [ ] Approve or amend D1–D9.
- [ ] Approve or amend D10–D18.
- [ ] Record approved decisions as `docs/decisions/ADR-NNN.md`.
- [ ] Confirm requirements and acceptance criteria (Prompt 02).
- [ ] Implementation scaffolded.
- [ ] Database and schema implemented.
- [ ] Create-link, redirect, alias, expiration, and statistics behavior implemented.
- [ ] Tests, API documentation, and README usage section completed.

## Known blockers

1. **Approval gate** — all 18 decisions are unanswered; `AGENTS.md` §3 forbids implementing
   architectural or dependency choices without approval.
2. **No npm project** — the §8.2 sequence
   (`npm run typecheck && npm run lint && npm test && npm run build`) cannot run. This is expected
   at this stage, not a failure.
3. **Node version mismatch** — the workspace has Node 26.13.0 while D13 targets Node 24 LTS.
   Verification under the declared runtime is impossible here.
4. **No Git remote** — commit/push commands for the upstream repository cannot be produced from
   this workspace; only local commit guidance is meaningful.

## Latest verification evidence

Commands run on 2026-11-18 from the project root:

```bash
git status --short --branch
# -> ## dev   (17 modified + 2 untracked documentation files, nothing staged)

git log --oneline -20
# -> b01087c docs: establish execution framework baseline and sync project state

git ls-files | wc -l
# -> 44

git remote -v
# -> (empty)

node -v ; npm -v
# -> v26.13.0 / 11.20.0
```

Dependency versions were re-checked against the registry (not installed):

```bash
npm view typescript version          # 7.0.2   (6.x latest: 6.0.3)
npm view eslint version              # 10.15.0
npm view @eslint/js version          # 10.0.1
npm view typescript-eslint version   # 8.73.0
npm view globals version             # 17.14.0
npm view express version             # 5.3.0
npm view zod version                 # 4.6.7
npm view vitest version              # 5.1.1
npm view tsx version                 # 4.23.15
npm view supertest version           # 7.3.2
npm view @types/supertest version    # 7.2.1
npm view better-sqlite3 version      # 13.2.0
npm view @types/better-sqlite3 version # 9.6.0
npm view @types/express version      # 5.0.6
npm view @types/node version         # 26.6.6  (24.x latest: 24.19.2)
npm view typescript-eslint peerDependencies
# -> { eslint: "^8.57.0 || ^9.0.0 || ^10.0.0", typescript: ">=4.8.4 <6.1.0" }
```

No `npm install`, typecheck, lint, test, build, commit, or push was performed, by instruction.

## Next recommended action

Ask the user to approve, amend, or reject **D1–D18** — preferably in two passes (D1–D9
architecture/behavior, then D10–D18 toolchain/contracts), answering the nine open sub-options
above. On approval, write one `docs/decisions/ADR-001.md` … `ADR-018.md` per decision from
`templates/adr-template.md`, then proceed to Prompt 02 (requirements and acceptance criteria).
Do not scaffold the Express application before the approval gate is complete.
