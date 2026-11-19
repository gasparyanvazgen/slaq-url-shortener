# Prompt 01 — Product Framing and Technical Research

**Status:** Completed 2026-11-18. Findings are recorded in `docs/ai-workflow/research-findings.md`; decisions
are in `docs/decisions/DECISION-REGISTER.md`. The user approved **D8–D18** on 2026-11-18
(`ADR-008` … `ADR-018`) and **D1–D7** on 2026-11-19 (`ADR-001` … `ADR-007`); every decision is
approved. Re-run only if the stack, versions, or scope change.

Follow `docs/ai-workflow/agents/project-manager.md` for framing and `docs/ai-workflow/agents/backend-architect.md` for technical
questions.

Review `docs/ai-workflow/PROJECT.md`, `docs/requirements.md`, and `docs/architecture-proposal.md`. Inspect the
repository and Git state before assuming anything.

## Part A — Product framing

Clarify the user problem, MVP boundary, non-goals, and the smallest useful feature set for Slaq.
Do not conduct broad competitor research unless it changes an actual product or engineering
decision.

## Part B — Technical research

Verify, against primary sources (npm registry, package manifests, official release notes), every
technical assumption implementation depends on:

- Dependency versions, peer ranges, and mutual compatibility.
- Runtime policy (Node major, `.nvmrc`, `engines`, lockfile).
- TypeScript version and required compiler options.
- Lint tooling and configuration model.
- SQLite driver, prebuilt binaries, and TypeScript definition coverage.
- Module system and import rules.
- Timestamp format, expiry boundary, and how time is generated and tested.
- Public base-URL configuration and Host-header trust.
- Request/response contracts, status codes, and error codes.
- Input limits (URL length, alias rules) and security consequences.
- Database constraints, pragmas, and testing isolation.

Distinguish **verified** facts from assumptions that can only be confirmed after scaffolding, and
say which is which.

## Output

- MVP scope and explicit non-goals.
- Verified findings, with the command or source used for each version claim.
- A decision register: one entry per decision, with status (`Proposed` /
  `Pending User Approval` / `Approved` / `Rejected` / `Superseded`), justification, alternatives,
  verification, affected documents, and dependencies on other decisions.
- Open questions requiring the user's decision, including sub-options.
- A list of documents that must be synchronized.

Use tables and acceptance-criteria lists rather than Given/When/Then prose; that is this
project's established format in `docs/requirements.md`.

## Rules

- Do not implement code. Do not install dependencies. Do not commit or push.
- Do not mark a decision `Approved`; only the user can (`AGENTS.md` §3).
- Do not expand scope without approval.
- If findings contradict an earlier document, record the correction instead of silently editing
  history.
