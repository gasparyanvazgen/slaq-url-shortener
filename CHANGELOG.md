# Changelog

## Unreleased

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
