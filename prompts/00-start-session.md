# Prompt 00 — Start a Slaq Session

**Status:** Completed 2026-11-18. Re-run at the start of any new session; `PROJECT_STATE.md` may
be stale. The canonical decision status is `docs/decisions/DECISION-REGISTER.md`.

Act as the Slaq Project Manager. Read `AGENTS.md`, `PROJECT.md`, `PROJECT_STATE.md`, `ROADMAP.md`, and `TASKS.md`.

1. Inspect the actual repository structure and Git status before assuming anything.
2. Identify existing implementation, uncommitted changes, and mismatches with the state file.
3. Read `docs/architecture-proposal.md` and `docs/decisions/DECISION-REGISTER.md`.
4. Treat that architecture as **approved**: D1–D21 are recorded with ADRs and no decision is
   pending. Verify the repository against the register instead of assuming; changing an approved
   decision requires a new decision and a new ADR.
5. Summarize the current project state and recommend the next action.
6. List only decisions that genuinely need my approval.
7. Do not edit implementation files or install dependencies in this session.

I want to continue using Freebuff. Do not assume native subagents or Claude Code features. Keep the response concise and wait for my approval before implementation.
