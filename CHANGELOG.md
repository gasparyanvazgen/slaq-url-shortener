# Changelog

## Unreleased

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
