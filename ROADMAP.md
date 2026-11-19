# Slaq Roadmap

This roadmap adapts the five phases of the supplied AI-Assisted Project Execution Framework to a
small backend URL shortener. Decision IDs refer to
[`docs/decisions/DECISION-REGISTER.md`](docs/decisions/DECISION-REGISTER.md).

## Phase 1 — Research & Product Framing

**Purpose:** Clarify the problem and keep scope realistic.

- [x] Capture project objective and target stack.
- [x] Define MVP features and non-goals.
- [x] Confirm exact MVP behavior and API contract — the contract (D17/D18) and the route set and
      error envelope (D3) are approved: see `docs/api-specification.md`.
- [x] Identify basic security and abuse considerations — `docs/security-guidelines.md`, plus
      D17 (Host-header/base-URL) and D18 (scheme allow-list, 2048 cap).

**Exit criteria:** User agrees on what the MVP includes and excludes.
**Status:** Met — scope, the API contract, and the route set are all approved.

## Phase 2 — Requirements, Epics & AI Context

**Purpose:** Turn the brief into testable requirements and shared AI instructions.

- [x] Create project brief and central agent instructions.
- [x] Create persistent state and task tracking.
- [x] Confirm acceptance criteria. — `docs/requirements.md` carries AC-01.1 … AC-12.3; the four
      gaps Q-2 … Q-5 were resolved by D19 and D1–D7 were approved on 2026-11-19, so every
      criterion is confirmed.
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
- [x] Consolidate every open decision into one register (D1–D21).
- [x] Approve or amend architecture and behavior (D1–D7) — approved 2026-11-19 with the
      deps-object signature (D1) and five generation attempts in total (D5). Evidence:
      `docs/decisions/ADR-001.md` … `ADR-007.md`.
- [x] Approve toolchain and contracts — D8, D10–D18 approved 2026-11-18.
- [x] Confirm API routes, error contract, aliases, code generation, expiry, and click counting —
      approved: the contract (D17/D18), routes/envelope (D3), aliases (D6), codes (D5), and expiry
      (D7).
- [x] Record approved decisions as ADRs — `docs/decisions/ADR-001.md` … `ADR-021.md`, one per
      decision, 21 of 21.
- [x] Review the approved architecture for five-hour MVP fit (Prompt 03) — `docs/architecture-review.md`
      recommends the layers, module, factory, repository boundary, schema, routes, and dependencies
      unchanged; D20, D21, and corrections C-1 … C-3 were approved on 2026-11-19.

**Exit criteria:** Architecture and key behavior decisions are explicitly approved.
**Status:** Met — 21 of 21 decisions approved with ADRs; the design is final and implementation can
start.

## Phase 4 — Component Specifications & Performance

**Purpose:** Define module boundaries and observable behavior.

- [x] Confirm repository/service/controller boundaries (D1, `ADR-001`).
- [x] Define validation schemas and error cases — bodies, codes, and limits approved under
      D17/D18 (`ADR-017`, `ADR-018`), and the envelope shape under D3 (`ADR-003`).
- [x] Define API request/response examples — approved under D17 (`ADR-017`).
- [x] Define tests for each feature — `docs/testing-strategy.md`, including boundary and
      security regression cases.
- [x] Identify basic performance and reliability constraints — synchronous `better-sqlite3`, WAL,
      `busy_timeout`, no rate limiting in the MVP (NFR-06).

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
