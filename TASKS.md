# Slaq Task Tracker

Use `[ ]` pending, `[x]` completed with evidence, and `[-]` deferred. Keep tasks small and update
this file as work progresses. Decision IDs refer to
[`docs/decisions/DECISION-REGISTER.md`](docs/decisions/DECISION-REGISTER.md).

## Gate 0 — Research and decision approval

### 0.1 Repository and research (complete)

- [x] Inspect the repository and Git status. — 2026-11-18: baseline commit `b01087c`, clean tree,
      44 tracked files, no remote, documentation-only.
- [x] Complete Prompt 00 session review and record the stale-state corrections. — Evidence:
      `PROJECT_STATE.md` → Repository and Git status.
- [x] Complete Prompt 01 technical research and re-verify versions against the npm registry. —
      Evidence: `docs/research-findings.md`.
- [x] Consolidate D1–D18 into a single register with no duplicate records. — Evidence:
      `docs/decisions/DECISION-REGISTER.md`.
- [x] Audit and synchronize project documentation with the findings. — Evidence: `CHANGELOG.md`
      entry of 2026-11-18.

### 0.2 Decisions (D1–D19 all approved)

- [x] Review `docs/architecture-proposal.md` and the register. — Reviewed before the D1–D7
      walkthrough on 2026-11-19.
- [x] **D1 approved 2026-11-19** — layered architecture and feature-module layout, with
      `createApp({ db, clock, config })`. Evidence: `docs/decisions/ADR-001.md`.
- [x] **D2 approved 2026-11-19** — `links` schema and idempotent bootstrap; `CHECK` set limited to
      `click_count >= 0` and `is_custom IN (0,1)`. Evidence: `ADR-002.md`.
- [x] **D3 approved 2026-11-19** — API routes and error envelope. Evidence: `ADR-003.md`.
- [x] **D4 approved 2026-11-19** — `302` redirect. Evidence: `ADR-004.md`.
- [x] **D5 approved 2026-11-19** — 7-character Base62 codes, five generation attempts in total.
      Evidence: `ADR-005.md`.
- [x] **D6 approved 2026-11-19** — alias rules, case-sensitive matching, case-insensitive reserved
      names. Evidence: `ADR-006.md`.
- [x] **D7 approved 2026-11-19** — lazy expiration, `410`, rows retained. Evidence: `ADR-007.md`.
- [x] **D8 approved 2026-11-18** — `supertest` + `@types/supertest`, dev-only. Evidence:
      `docs/decisions/ADR-008.md`.
- [x] **D9 approved 2026-11-18** — deletion stays out of scope. Evidence: `ADR-009.md`.
- [x] **D10 approved 2026-11-18** — TypeScript 6.0.3 and the tsconfig split. Evidence:
      `ADR-010.md`.
- [x] **D11 approved 2026-11-18** — ESLint 10 flat config, type-aware. Evidence: `ADR-011.md`.
- [x] **D12 approved 2026-11-18** — `better-sqlite3` 13 + `@types/better-sqlite3` 9. Evidence:
      `ADR-012.md`.
- [x] **D13 approved 2026-11-18** — Node.js 24 LTS policy. Evidence: `ADR-013.md`.
- [x] **D14 approved 2026-11-18** — caret ranges + committed lockfile. Evidence: `ADR-014.md`.
- [x] **D15 approved 2026-11-18** — canonical UTC timestamps and the `expiresAt <= now`
      boundary. Evidence: `ADR-015.md`.
- [x] **D16 approved 2026-11-18** — native ESM. Evidence: `ADR-016.md`.
- [x] **D17 approved 2026-11-18** — API contracts, `PUBLIC_BASE_URL`, Host-header safety;
      sub-options resolved to `200` + `isExpired`, `isCustom` exposed, fail-fast. Evidence:
      `ADR-017.md`.
- [x] **D18 approved 2026-11-18** — scheme allow-list, 2048-character cap, credentials rejected.
      Evidence: `ADR-018.md`.
- [x] **D19 approved 2026-11-19** — adopted the defaults for Q-2 … Q-5 (unknown fields ignored,
      no duplicate-destination deduplication, `/health` liveness only, body-parser failures →
      `400 VALIDATION_ERROR`) and reconfirmed D9. Evidence: `docs/decisions/ADR-019.md`.
- [x] Record the approved decisions as ADRs — `docs/decisions/ADR-008.md` … `ADR-019.md`.
- [x] Record the D1–D7 approval as `ADR-001` … `ADR-007`. — Evidence:
      `docs/decisions/ADR-001.md` … `ADR-007.md`, 2026-11-19.
- [ ] Confirm the `.gitignore` change: `.env.*` is ignored, with `.env.example`
      exempted, so a future example file stays trackable.
- [x] Draft requirements and acceptance criteria (Prompt 02). — Evidence:
      `docs/requirements.md`, 2026-11-18, finalized 2026-11-19; every requirement is now
      **Confirmed** or **Out of scope**, and no requirement is provisional.
- [x] Resolve the four requirements gaps Q-2 … Q-5 — D19 approved 2026-11-19, folded into
      `docs/requirements.md` FR-01, FR-07, FR-08, and FR-10 and their new acceptance criteria.
- [x] Confirm the drafted acceptance criteria. — Every criterion is confirmed: D19 closed the
      gaps and D1–D7 were approved on 2026-11-19; no decision is pending.

## Gate 1 — Requirements and specifications

- [x] Turn approved decisions into confirmed functional and non-functional requirements. —
      Evidence: `docs/requirements.md` FR-01 … FR-12 and NFR-01 … NFR-09, every one **Confirmed**
      or **Out of scope** after the D1–D7 approval.
- [x] Confirm acceptance criteria for every MVP capability — AC-01.1 … AC-12.3, all confirmed
      after D19 and the D1–D7 approval. Evidence: `docs/requirements.md`, 2026-11-19.
- [x] Finalize the API specification (bodies, status codes, error codes). — Evidence:
      `docs/api-specification.md`, status Approved; routes D3, `302` D4, aliases D6, expiry D7.
- [x] Finalize the database design and pragma rationale. — Evidence: `docs/database-design.md`,
      status Approved; D2 schema with the two approved `CHECK` constraints.
- [x] Finalize the testing strategy, including the eleven expiration-boundary cases and the
      Host-injection regression test. — Evidence: `docs/testing-strategy.md`, status Approved. No
      test has been executed; there is no npm project yet.

## MVP implementation

### 1. Scaffold
- [ ] Initialize the npm project with `"type": "module"`.
- [ ] Add `.nvmrc` (`24`) and `"engines": { "node": "^24.0.0" }`.
- [ ] Add runtime deps (`express`, `better-sqlite3`, `zod`) at approved versions.
- [ ] Add dev deps (TypeScript, ESLint set, `@types/*`, `tsx`, `vitest`, `supertest` — approved
      D8).
- [ ] Configure `tsconfig.json` (no emit) and `tsconfig.build.json` (emit to `dist/`).
- [ ] Configure ESLint flat config with type-aware rules.
- [ ] Configure Vitest.
- [ ] Add scripts `typecheck`, `lint`, `test`, `build`, `dev`, `start`.
- [ ] Commit the lockfile.
- [ ] Create the Express app factory and server entry point.
- [ ] Add startup configuration with `PUBLIC_BASE_URL` validation.
- [ ] Add `GET /health`.
- [ ] Verify typecheck, lint, and the health test.

### 2. Database and shared infrastructure
- [ ] Create the SQLite connection.
- [ ] Apply approved pragmas and document the rationale.
- [ ] Create the `links` table with `UNIQUE(code)` and approved `CHECK` constraints.
- [ ] Add a typed `pragma()` / `lastInsertRowid` wrapper instead of `any`.
- [ ] Add typed application errors.
- [ ] Add centralized error middleware and a 404 handler.
- [ ] Test database initialization and the error response shape.

### 3. Create short links
- [ ] Add URL and optional-field validation (scheme allow-list, 2048 cap).
- [ ] Implement the short-code generator.
- [ ] Implement repository insert and lookup.
- [ ] Implement the create-link service with collision retries.
- [ ] Implement `POST /api/links` returning the approved body and `Location`.
- [ ] Test valid creation, invalid URL, over-long URL, unsupported scheme, and collisions.

### 4. Redirect and click tracking
- [ ] Implement lookup and atomic click increment in one transaction.
- [ ] Implement `GET /:code`.
- [ ] Test the `302` status and exact `Location` header.
- [ ] Test unknown code.
- [ ] Test that only successful redirects increment the count.

### 5. Custom aliases
- [ ] Validate alias length and character set.
- [ ] Reject reserved route names.
- [ ] Enforce uniqueness in the database.
- [ ] Return the approved conflict error.
- [ ] Test alias success, invalid alias, reserved alias, and collision.

### 6. Expiration
- [ ] Validate expiration input and reject past or equal-to-now dates at creation.
- [ ] Inject the clock into service logic.
- [ ] Return `410` for expired links on redirect.
- [ ] Keep expired records available for statistics.
- [ ] Test all eleven boundary cases in `docs/testing-strategy.md`.

### 7. Statistics
- [ ] Implement `GET /api/links/:code/stats`.
- [ ] Return the approved metadata and click count with `Cache-Control: no-store`.
- [ ] Test the approved expired-link behavior.
- [ ] Test unknown code.

### 8. Final quality and docs
- [ ] Run `npm run typecheck && npm run lint && npm test && npm run build`.
- [ ] Review security and error handling.
- [ ] Write setup and usage README.
- [ ] Write API documentation / OpenAPI description.
- [ ] Review the Git diff and repository status.
- [ ] Record known limitations and future work.

## Deferred unless time remains

- [ ] Rate limiting.
- [ ] Docker.
- [ ] QR codes.
- [ ] Authentication.
- [ ] Per-click analytics history.
- [ ] Frontend dashboard.

## Post-MVP (excluded by an approved decision)

- [ ] Link deletion — excluded from the MVP by D9 (`docs/decisions/ADR-009.md`), reconfirmed
      2026-11-19; revisit only through a new decision that supersedes it.
