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

### 0.2 Decisions (D8–D18 approved 2026-11-18; D1–D7 pending)

- [ ] Review `docs/architecture-proposal.md` and the register.
- [ ] Approve or amend D1 — layered architecture and feature-module layout.
- [ ] Approve or amend D2 — `links` schema and schema bootstrap (including the optional `CHECK`
      constraints).
- [ ] Approve or amend D3 — API routes and error envelope.
- [ ] Approve or amend D4 — `302` redirect.
- [ ] Approve or amend D5 — 7-character Base62 codes with five collision retries.
- [ ] Approve or amend D6 — alias rules, case sensitivity, reserved names.
- [ ] Approve or amend D7 — lazy expiration, `410`, rows retained.
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
- [x] Record the approved decisions as ADRs — `docs/decisions/ADR-008.md` … `ADR-018.md`.
- [ ] Record any future D1–D7 approval as `ADR-001` … `ADR-007`.
- [ ] Confirm the `.gitignore` change: `.env.*` is ignored, with `.env.example`
      exempted, so a future example file stays trackable.
- [ ] Confirm requirements and acceptance criteria (Prompt 02).

## Gate 1 — Requirements and specifications

- [ ] Turn approved decisions into confirmed functional and non-functional requirements.
- [ ] Confirm acceptance criteria for every MVP capability.
- [ ] Finalize the API specification (bodies, status codes, error codes).
- [ ] Finalize the database design and pragma rationale.
- [ ] Finalize the testing strategy, including the eleven expiration-boundary cases and the
      Host-injection regression test.

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
- [ ] Link deletion (see D9).
