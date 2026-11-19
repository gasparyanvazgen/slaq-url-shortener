# Changelog

## Unreleased

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
