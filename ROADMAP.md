# Slaq Roadmap

This roadmap adapts the five phases of the supplied AI-Assisted Project Execution Framework to a
small backend URL shortener. Decision IDs refer to
[`docs/decisions/DECISION-REGISTER.md`](docs/decisions/DECISION-REGISTER.md).

## Phase 1 — Research & Product Framing

**Purpose:** Clarify the problem and keep scope realistic.

- [x] Capture project objective and target stack.
- [x] Define MVP features and non-goals.
- [x] Confirm exact MVP behavior and API contract — the contract is approved under D17/D18; the
      route set and error envelope (D3) remain pending: see `docs/api-specification.md`.
- [x] Identify basic security and abuse considerations — `docs/security-guidelines.md`, plus
      D17 (Host-header/base-URL) and D18 (scheme allow-list, 2048 cap).

**Exit criteria:** User agrees on what the MVP includes and excludes.
**Status:** Met for scope (brief and non-goals captured); the API contract is approved under
D17/D18, with the route set (D3) still pending.

## Phase 2 — Requirements, Epics & AI Context

**Purpose:** Turn the brief into testable requirements and shared AI instructions.

- [x] Create project brief and central agent instructions.
- [x] Create persistent state and task tracking.
- [ ] Confirm acceptance criteria. — Open questions in `docs/requirements.md` resolved as
      proposals; confirmation is part of Prompt 02.
- [x] Confirm project-specific coding conventions after inspecting repository. — Repository
      inspected 2026-11-18; `docs/coding-standards.md` covers ESM, timestamps, SQL, and the
      toolchain, all approved 2026-11-18 (D10–D16).

**Exit criteria:** Requirements and agent instructions are consistent and actionable.

## Phase 3 — Architecture, Data & Redirects

**Purpose:** Approve the design before implementation.

- [x] Capture proposed layered architecture.
- [x] Capture proposed folder structure and SQLite table.
- [x] Complete technical research: versions, compiler/lint configuration, driver typings, ESM,
      timestamps, base-URL security, API contracts, URL limits.
- [x] Consolidate every open decision into one register (D1–D18).
- [ ] Approve or amend architecture and behavior (D1–D7) — D8 and D9 are approved.
- [x] Approve toolchain and contracts — D8, D10–D18 approved 2026-11-18.
- [ ] Confirm API routes, error contract, aliases, code generation, expiry, and click counting —
      the API contract (D17/D18) is approved; routes/envelope (D3), aliases (D6), codes (D5), and
      expiry (D7) remain pending.
- [x] Record approved decisions as ADRs — `docs/decisions/ADR-008.md` … `ADR-018.md`.

**Exit criteria:** Architecture and key behavior decisions are explicitly approved.
**Status:** 🟡 11 of 18 decisions approved (D8–D18) with ADRs; D1–D7 still await approval.

## Phase 4 — Component Specifications & Performance

**Purpose:** Define module boundaries and observable behavior.

- [ ] Confirm repository/service/controller boundaries (D1).
- [x] Define validation schemas and error cases — bodies, codes, and limits approved under
      D17/D18 (`ADR-017`, `ADR-018`); the envelope shape awaits D3.
- [x] Define API request/response examples — approved under D17 (`ADR-017`).
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
