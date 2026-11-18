# Slaq Task Tracker

Use `[ ]` pending, `[x]` completed with evidence, and `[-]` deferred. Keep tasks small and update this file as work progresses.

## Gate 0 — Architecture approval

- [x] Inspect the existing repository and Git status. — 2026-11-18: branch `master` has no commits; all files untracked; documentation-only tree; no `package.json`, `src/`, or `tests/`.
- [ ] Review `docs/architecture-proposal.md`.
- [ ] Decide `supertest` versus built-in `fetch` integration tests.
- [ ] Approve or amend the module layout.
- [ ] Confirm API paths and response contracts.
- [ ] Confirm code generation, aliases, expiration, and redirect behavior.
- [ ] Record approved decisions in `docs/decisions/`.

## MVP implementation

### 1. Scaffold
- [ ] Initialize or verify npm project.
- [ ] Configure TypeScript strict mode.
- [ ] Configure Vitest.
- [ ] Create Express app factory and server entry point.
- [ ] Add `GET /health`.
- [ ] Verify type-check and health test.

### 2. Database and shared infrastructure
- [ ] Create SQLite connection.
- [ ] Apply required SQLite pragmas, with rationale documented.
- [ ] Create links table and unique code index.
- [ ] Add typed application errors.
- [ ] Add centralized error middleware.
- [ ] Test database initialization and error response shape.

### 3. Create short links
- [ ] Add URL and optional fields validation.
- [ ] Implement short-code generator.
- [ ] Implement repository insert and lookup.
- [ ] Implement create-link service.
- [ ] Implement `POST /api/links`.
- [ ] Test valid creation, invalid URL, and code collision handling.

### 4. Redirect and click tracking
- [ ] Implement lookup and atomic click increment.
- [ ] Implement `GET /:code`.
- [ ] Test redirect status and `Location` header.
- [ ] Test unknown code.
- [ ] Test click count increments only for successful redirects.

### 5. Custom aliases
- [ ] Validate alias length and character set.
- [ ] Reject reserved route names.
- [ ] Enforce uniqueness in the database.
- [ ] Return consistent conflict error.
- [ ] Test alias success, invalid alias, reserved alias, and collision.

### 6. Expiration
- [ ] Validate expiration input and reject past dates at creation.
- [ ] Inject clock into service logic.
- [ ] Return `410` for expired links.
- [ ] Keep expired records available for statistics unless user decides otherwise.
- [ ] Test boundary time behavior.

### 7. Statistics
- [ ] Implement `GET /api/links/:code/stats`.
- [ ] Return documented metadata and click count.
- [ ] Decide and test whether expired links remain viewable.
- [ ] Test unknown code.

### 8. Final quality and docs
- [ ] Run all tests.
- [ ] Run TypeScript type-check.
- [ ] Review security and error handling.
- [ ] Write setup and usage README.
- [ ] Write API documentation / OpenAPI description.
- [ ] Review Git diff and repository status.
- [ ] Record known limitations and future work.

## Deferred unless time remains

- [ ] Rate limiting.
- [ ] Docker.
- [ ] QR codes.
- [ ] Authentication.
- [ ] Per-click analytics history.
- [ ] Frontend dashboard.
