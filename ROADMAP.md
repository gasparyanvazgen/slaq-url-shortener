# Slaq Roadmap

This roadmap adapts the five phases of the supplied AI-Assisted Project Execution Framework to a
small backend URL shortener. Decision IDs refer to
[`docs/decisions/DECISION-REGISTER.md`](docs/decisions/DECISION-REGISTER.md).

## Phase 1 — Research & Product Framing

**Purpose:** Clarify the problem and keep scope realistic.

- [x] Capture project objective and target stack.
- [x] Define MVP features and non-goals.
- [x] Confirm exact MVP behavior and API contract — **proposed, not approved**: see D3, D17,
      and `docs/api-specification.md`.
- [x] Identify basic security and abuse considerations — `docs/security-guidelines.md`, plus
      D17 (Host-header/base-URL) and D18 (scheme allow-list, 2048 cap).

**Exit criteria:** User agrees on what the MVP includes and excludes.
**Status:** Met for scope (brief and non-goals captured); the API contract still awaits D3/D17.

## Phase 2 — Requirements, Epics & AI Context

**Purpose:** Turn the brief into testable requirements and shared AI instructions.

- [x] Create project brief and central agent instructions.
- [x] Create persistent state and task tracking.
- [ ] Confirm acceptance criteria. — Open questions in `docs/requirements.md` resolved as
      proposals; confirmation is part of Prompt 02.
- [ ] Confirm project-specific coding conventions after inspecting repository. — Repository
      inspected 2026-11-18; `docs/coding-standards.md` now covers ESM, timestamps, SQL, and
      toolchain, but awaits approval (D10–D16).

**Exit criteria:** Requirements and agent instructions are consistent and actionable.

## Phase 3 — Architecture, Data & Redirects

**Purpose:** Approve the design before implementation.

- [x] Capture proposed layered architecture.
- [x] Capture proposed folder structure and SQLite table.
- [x] Complete technical research: versions, compiler/lint configuration, driver typings, ESM,
      timestamps, base-URL security, API contracts, URL limits.
- [x] Consolidate every open decision into one register (D1–D18, all Pending User Approval).
- [ ] Approve or amend architecture (D1–D9).
- [ ] Approve or amend toolchain and contracts (D10–D18).
- [ ] Confirm API routes, error contract, aliases, code generation, expiry, and click counting.
- [ ] Record approved decisions as ADRs under `docs/decisions/`.

**Exit criteria:** Architecture and key behavior decisions are explicitly approved.
**Status:** 🟡 Research complete; approval not started. No decision is approved.

## Phase 4 — Component Specifications & Performance

**Purpose:** Define module boundaries and observable behavior.

- [ ] Confirm repository/service/controller boundaries (D1).
- [x] Define validation schemas and error cases — proposed in `docs/api-specification.md` and
      `docs/research-findings.md` §10; pending D3/D17/D18.
- [x] Define API request/response examples — proposed; pending D17.
- [x] Define tests for each feature — `docs/testing-strategy.md`, including boundary and
      security regression cases.
- [ ] Identify basic performance and reliability constraints. — Draft: synchronous
      `better-sqlite3`, WAL, `busy_timeout`, no rate limiting in the MVP.

**Exit criteria:** Each implementation task has clear inputs, outputs, and acceptance criteria.

## Phase 5 — Implementation & Operations

**Purpose:** Build, test, review, and document the MVP.

Suggested order:
1. Scaffold, configuration validation, health endpoint.
2. Database connection, pragmas, schema, errors, middleware.
3. Create short link.
4. Redirect and click counting.
5. Custom aliases.
6. Expiration.
7. Statistics.
8. API documentation and README.
9. Final verification and review.

**Exit criteria:** Core behavior is implemented, automated checks are run, and limitations are
documented.

## After MVP

Potential future improvements, not part of the five-hour commitment:
- Rate limiting and abuse prevention.
- Per-click event table and richer analytics.
- Authentication and user-owned links.
- Deployment and operational monitoring.
- Frontend dashboard.
- A real migration mechanism once the schema is deployed.
