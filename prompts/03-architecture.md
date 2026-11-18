# Prompt 03 — Architecture Review

Follow `agents/backend-architect.md`.

Inspect the repository and review `docs/architecture-proposal.md`. Evaluate whether the proposed layered architecture, feature module, app factory, repository boundary, SQLite schema, API paths, and dependency list are appropriate for the five-hour MVP.

Identify concrete trade-offs, not theoretical alternatives. Preserve the requested stack.

Return:
1. Recommended architecture.
2. Any changes from the proposal and why.
3. Dependency decisions, including `supertest` versus built-in `fetch`.
4. API and database contracts.
5. Risks and testability considerations.
6. A short approval checklist.

Do not implement code. Do not mark any decision accepted until I explicitly approve it.
