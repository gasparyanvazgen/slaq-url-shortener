# Slaq — AI Execution Framework

A portable, lightweight framework for building **Slaq**, a backend-focused URL shortener, with Freebuff or another AI coding assistant.

This package contains project context, agent role instructions, staged prompts, workflows, and persistent progress tracking. It is designed for an AI assistant that can inspect and edit files in the repository, but **does not require native multi-agent support**.

## Current project status

- Project: Slaq — URL Shortener
- Stack requested: Node.js, TypeScript, Express.js, SQLite, better-sqlite3, Zod, Vitest
- Initial timebox: approximately five hours
- Phase: requirements and architecture approved — implementation is the next step (Phase 5)
- Architecture: approved — layer boundaries and the `createApp({ db, clock, config })` deps object,
  routes, schema, `302` redirect, code generation, aliases, and expiry (D1–D7), plus the toolchain
  and contract decisions (D8–D19).
- Decisions: 19 recorded (D1–D19) in [`docs/decisions/DECISION-REGISTER.md`](docs/decisions/DECISION-REGISTER.md);
  **all approved** — D8–D18 on 2026-11-18, D1–D7 and D19 on 2026-11-19 — and recorded as
  [`docs/decisions/ADR-001.md`](docs/decisions/ADR-001.md) … `ADR-019.md`. None is pending.
- Requirements: [`docs/requirements.md`](docs/requirements.md) — FR-01 … FR-12 and NFR-01 … NFR-09,
  every requirement confirmed or explicitly out of scope.
- Research evidence: [`docs/research-findings.md`](docs/research-findings.md) (versions verified
  2026-11-18; configuration, timestamps, API contracts, URL limits).
- Implementation: not started by this framework.
- Verification: no `npm` project exists, so no typecheck, lint, test, or build has been run.

## Start here

1. Extract this ZIP into the root of your Slaq repository (or copy its contents into the existing repository).
2. Keep the existing `ai_execution_framework.md` file if you have it. The framework's `docs/original-framework-notes.md` records how its five-phase method is adapted.
3. Open the Slaq repository in Freebuff.
4. Start a new Freebuff session and provide these files as context:
   - `AGENTS.md`
   - `PROJECT.md`
   - `PROJECT_STATE.md`
   - `docs/architecture-proposal.md`
   - `ROADMAP.md`
5. Run the prompt in `prompts/00-start-session.md`.
6. Review the approved architecture and the decision register. All decisions **D1–D19** are
   approved; changing any of them requires a new decision and a new ADR before implementation.
7. Work through `TASKS.md` one task at a time. Ask Freebuff to inspect the repository before changing anything.
8. At the end of each session, use `prompts/10-session-handoff.md` and update `PROJECT_STATE.md` and `TASKS.md`.

## Suggested Freebuff operating pattern

Freebuff may not implement Claude Code's subagents or agent orchestration. Treat `agents/*.md` as **role cards**:

- For architecture work, tell Freebuff: "Follow `agents/backend-architect.md` for this task."
- For implementation, tell it: "Follow `agents/backend-developer.md`."
- For tests, tell it: "Follow `agents/qa-engineer.md`."
- For review, tell it: "Follow `agents/code-reviewer.md`."

You can use one role at a time in separate prompts. Do not assume multiple agents are running concurrently.

## Important rules

- Do not ask the AI to implement the whole application in one prompt.
- Do not let it silently change the stack, scope, or approved design.
- Require it to inspect current files before editing.
- Require actual command output before accepting claims that tests or builds pass.
- Prefer small changes that can be reviewed and verified.
- Keep the MVP within the timebox; defer optional hardening and features.
- Never paste secrets, API keys, or private credentials into prompts.

## Directory map

- `AGENTS.md`: central, tool-independent instructions.
- `PROJECT.md`: stable project brief.
- `PROJECT_STATE.md`: current, changing state; update every session.
- `ROADMAP.md`, `TASKS.md`: staged delivery plan and task checklist.
- `docs/`: requirements, proposal, data/API design, security, testing, research findings,
  and decisions (`DECISION-REGISTER.md`, ADRs).
- `agents/`: role cards to load selectively.
- `prompts/`: ready-to-use task prompts.
- `workflows/`: repeatable procedures.
- `templates/`: reusable task, feature, bug, and decision templates.

## First action

Do not begin coding immediately. Start with `prompts/00-start-session.md`. The first goal is to inspect the repository, review the proposed architecture, identify any mismatch, and ask you to approve or change the architecture.
