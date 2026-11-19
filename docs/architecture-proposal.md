# Architecture Proposal — Approved

> Source: the initial Claude response supplied by the user. This document records that proposal and
> the design derived from it. **Every decision it contains is approved:** D8–D18 on 2026-11-18
> (`ADR-008` … `ADR-018`), and D1–D7 plus D19 on 2026-11-19 (`ADR-001` … `ADR-007`, `ADR-019`).
> The ADRs are the records of those approvals; nothing below is provisional.

## 1. Layered architecture

```text
HTTP request
   |
   v
Routes       -> map URL + method to controller (no logic, no parsing)
   |
   v
Controllers  -> parse/validate input, call service, shape HTTP response
   |
   v
Services     -> business rules (code generation, expiry, alias conflicts)
   |
   v
Repository   -> SQL only; returns plain typed objects
   |
   v
SQLite (better-sqlite3)
```

### Proposed rules

- Routes only map method and path; validation has one owner — the controller applies the
  module's zod schema (`links.schemas.ts`), and routes never parse input.
- Controllers do not execute SQL.
- Services do not depend on Express `req` or `res`.
- Services throw typed application errors.
- A centralized error middleware maps errors to HTTP responses.
- Dependencies are passed through factory functions that take a deps object, e.g.
  `createLinkService({ repo, clock, config })`.
- `createApp({ db, clock, config })` builds the Express app from an injected database, clock, and
  validated configuration.
- Tests use an in-memory database and a fixed clock through the same deps object.

## 2. Proposed folder structure

```text
slaq/
├── src/
│   ├── server.ts
│   ├── app.ts
│   ├── config.ts
│   ├── db/
│   │   ├── connection.ts
│   │   └── schema.ts
│   ├── modules/
│   │   └── links/
│   │       ├── links.routes.ts
│   │       ├── links.controller.ts
│   │       ├── links.service.ts
│   │       ├── links.repository.ts
│   │       ├── links.schemas.ts
│   │       └── links.types.ts
│   ├── middleware/
│   │   ├── error-handler.ts
│   │   └── not-found.ts
│   └── lib/
│       ├── errors.ts
│       └── code-generator.ts
├── tests/
│   ├── helpers/test-app.ts
│   ├── code-generator.test.ts
│   ├── links.service.test.ts
│   └── links.api.test.ts
├── docs/API.md
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

The proposal prefers a feature module (`modules/links`) over global top-level controller/service folders.

## 3. Database schema

```sql
CREATE TABLE IF NOT EXISTS links (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  code            TEXT    NOT NULL UNIQUE,
  original_url    TEXT    NOT NULL,
  is_custom       INTEGER NOT NULL DEFAULT 0
                          CHECK (is_custom IN (0, 1)),
  click_count     INTEGER NOT NULL DEFAULT 0
                          CHECK (click_count >= 0),
  created_at      TEXT    NOT NULL,
  expires_at      TEXT,
  last_clicked_at TEXT
);
```

Rationale (approved as D2, [`ADR-002`](decisions/ADR-002.md)):
- `UNIQUE(code)` protects code uniqueness at the database layer.
- Generated codes and custom aliases share the same namespace.
- Timestamps are ISO 8601 UTC text (D15).
- `click_count` is incremented atomically.
- The `CHECK` set is limited to `click_count >= 0` and `is_custom IN (0,1)`; length, URL, and
  expiry-ordering checks are declined and enforced in validation instead.
- A per-click history table is deferred.

## 4. API

| Method | Path | Purpose | Success |
|---|---|---|---|
| POST | `/api/links` | Create short URL | 201 |
| GET | `/api/links/:code/stats` | Get statistics | 200 |
| GET | `/:code` | Redirect | 302 |
| GET | `/health` | Liveness check | 200 |

Create body:

```json
{
  "url": "https://example.com/very/long",
  "alias": "my-link",
  "expiresAt": "2026-12-31T00:00:00Z"
}
```

`alias` and `expiresAt` are optional.

Error body:

```json
{
  "error": {
    "code": "ALIAS_TAKEN",
    "message": "Alias is already in use"
  }
}
```

Validation errors may add a `details` array.

Status codes (approved D3, [`ADR-003`](decisions/ADR-003.md)):
- 400: validation error
- 404: unknown code
- 409: alias conflict
- 410: expired link

## 5. Technical decisions — all approved

> These eight items and the checklist's ninth item are consolidated as **D1–D9** in
> [`decisions/DECISION-REGISTER.md`](decisions/DECISION-REGISTER.md), which is the canonical record
> of status. The numbering below is the proposal's own and is kept for traceability.

1. Random 7-character Base62 codes using `crypto.randomInt`; collisions retried for at most five
   generation attempts in total (D5, [`ADR-005`](decisions/ADR-005.md)).
2. Use 302 redirects so repeat visits reach the server and can be counted (D4).
3. Check expiration lazily on redirect; expired rows remain stored (D7).
4. Alias length 3–32, `[A-Za-z0-9_-]`, case-sensitive; reserve `api` and `health`, matched
   case-insensitively (D6).
5. Accept only `http:` and `https:` URLs; maximum length 2048 (approved, D18).
6. Increment click count atomically in the redirect path.
7. Inject a clock function for deterministic expiration tests.
8. Use `supertest` for API integration tests — approved 2026-11-18 (D8, [`ADR-008`](decisions/ADR-008.md)).

## 6. Dependencies

> Exact versions were verified on 2026-11-18 and recorded in
> [`research-findings.md`](research-findings.md) §2. Version pinning, the Node policy, and the
> lockfile rule are **D10–D14** and were approved on 2026-11-18.

Requested runtime dependencies:
- `express`
- `better-sqlite3`
- `zod`

Approved development dependencies (D10–D14):
- `typescript`
- `@types/node`
- `@types/express`
- `@types/better-sqlite3`
- `tsx`
- `vitest`
- `eslint`, `@eslint/js`, `typescript-eslint`, `globals` (D11 — the type-aware ESLint 10 set)

Approved additional dependency (D8, 2026-11-18 — [`ADR-008`](decisions/ADR-008.md)):
- `supertest@^7.3.2` and `@types/supertest@^7.2.1`, dev-only, for API integration tests. It opens
  an ephemeral loopback listener per request and closes it, so the suite binds no fixed port and
  writes no listener lifecycle. No `fetch` harness is needed.

## 7. Verified technical configuration (approved under D10–D18)

The research pass added decisions this proposal did not originally cover. They are recorded in
[`research-findings.md`](research-findings.md), tracked as **D10–D18**, and **approved on
2026-11-18** (`ADR-010` … `ADR-018`). The bullets below are the approved configuration, not
proposals.

- **TypeScript 6.0.3**, not 7.0.2: `typescript-eslint@8.73.0` peers
  `typescript >=4.8.4 <6.1.0`. A no-emit `tsconfig.json` plus an emitting `tsconfig.build.json`
  keeps tests out of `dist/`. (D10)
- **ESLint 10 flat config** with type-aware `typescript-eslint`; `lint` is `eslint .`. (D11)
- **`better-sqlite3` 13.2.0** with separate `@types/better-sqlite3@9.6.0`; a typed wrapper covers
  `pragma()` and `lastInsertRowid` rather than using `any`. (D12)
- **Node.js 24 LTS** policy: `.nvmrc`, `engines.node ^24.0.0`, committed lockfile, no
  `engine-strict`. (D13)
- **Caret ranges plus a committed `package-lock.json`**; no exact pins, no `latest`. (D14)
- **Native ESM**: `"type": "module"`, `nodenext`, `.js` relative import extensions,
  `import.meta.dirname`. (D16)
- **Canonical UTC timestamps** `YYYY-MM-DDTHH:mm:ss.sssZ`, generated only in application code via
  an injected clock, with `expiresAt <= now` as the expiry boundary. (D15)
- **`PUBLIC_BASE_URL`** validated at startup; short URLs are never derived from the `Host`
  header. (D17)
- **`PORT`** resolved once at startup: unset or empty → `3000` in every environment; otherwise
  ASCII digits only with a numeric value in 1–65535, leading zeros insignificant (`03000` →
  `3000`, `0000` rejected), and no prefix-coercing `parseInt`. (D22)
- **Complete create/statistics bodies** and a fixed error-code table. (D17)
- **Destination URL limits**: `http`/`https` only, 2048 characters maximum. (D18)

## 8. Implementation sequence

1. Scaffold, strict TypeScript, Vitest, health endpoint.
2. Config, database, schema, errors, middleware.
3. Create short URL.
4. Redirect and click tracking.
5. Custom aliases.
6. Expiration.
7. Statistics.
8. API docs, README, full verification.

The original estimate was approximately 4h20m plus 40m buffer. Treat this as an estimate, not a guarantee.

## 9. Approval checklist

Every item maps to a decision ID and is checked below. **D8–D18 were explicitly approved by the
user on 2026-11-18**, and **D1–D7 were approved on 2026-11-19** as recommended, with the deps-object
signature (D1) and five generation attempts in total (D5). Status detail:
[`decisions/DECISION-REGISTER.md`](decisions/DECISION-REGISTER.md).

Architecture and behavior — all approved 2026-11-19:

- [x] **D1** — Layered architecture and feature-module layout, with
      `createApp({ db, clock, config })` ([`ADR-001`](decisions/ADR-001.md)).
- [x] **D2** — The database schema; `CHECK` set fixed to `click_count >= 0` and
      `is_custom IN (0,1)` ([`ADR-002`](decisions/ADR-002.md)).
- [x] **D3** — API routes and the error envelope ([`ADR-003`](decisions/ADR-003.md)).
- [x] **D4** — `302` redirects ([`ADR-004`](decisions/ADR-004.md)).
- [x] **D5** — 7-character Base62 codes, five generation attempts total
      ([`ADR-005`](decisions/ADR-005.md)).
- [x] **D6** — Alias rules, case sensitivity, and reserved names
      ([`ADR-006`](decisions/ADR-006.md)).
- [x] **D7** — Lazy expiration, `410`, and retained rows ([`ADR-007`](decisions/ADR-007.md)).
- [x] **D8** — `supertest` — approved 2026-11-18 ([`ADR-008`](decisions/ADR-008.md)).
- [x] **D9** — Deletion stays out of the MVP — approved 2026-11-18
      ([`ADR-009`](decisions/ADR-009.md)).

Toolchain and contracts — all approved 2026-11-18:

- [x] **D10** — TypeScript 6.0.3 and the tsconfig split ([`ADR-010`](decisions/ADR-010.md)).
- [x] **D11** — ESLint 10 flat config with type-aware linting
      ([`ADR-011`](decisions/ADR-011.md)).
- [x] **D12** — `better-sqlite3` 13 and its typings ([`ADR-012`](decisions/ADR-012.md)).
- [x] **D13** — Node.js 24 LTS policy ([`ADR-013`](decisions/ADR-013.md)).
- [x] **D14** — Caret ranges and a committed lockfile ([`ADR-014`](decisions/ADR-014.md)).
- [x] **D15** — Canonical UTC timestamps and the expiry boundary
      ([`ADR-015`](decisions/ADR-015.md)).
- [x] **D16** — Native ESM ([`ADR-016`](decisions/ADR-016.md)).
- [x] **D17** — API contracts, `PUBLIC_BASE_URL` policy, and the Host-header rule
      ([`ADR-017`](decisions/ADR-017.md)).
- [x] **D18** — URL scheme and length limits ([`ADR-018`](decisions/ADR-018.md)).

### Prompt 03 review — approved 2026-11-19

[`architecture-review.md`](architecture-review.md) recommends this design unchanged. The user
approved its two decisions and all three corrections on 2026-11-19:

- [x] **D20** — Redirect write path: the guarded `UPDATE` runs without an explicit transaction, and
      `HEAD /:code` returns the same status and `Location` without incrementing
      ([`ADR-020`](decisions/ADR-020.md)).
- [x] **D21** — `SQLITE_BUSY` after `busy_timeout` maps to `500 INTERNAL_ERROR` with no retry
      ([`ADR-021`](decisions/ADR-021.md)).
- [x] **C-1** — Validation has one owner: controllers apply the zod schema; routes only wire.
- [x] **C-2** — §6 lists the full ESLint set (`eslint`, `@eslint/js`, `typescript-eslint`,
      `globals`) required by D11.
- [x] **C-3** — `supertest` is described accurately: an ephemeral loopback listener per request, no
      fixed port, no manual lifecycle.

No stack, route, error-code, or schema change follows from any of these.

### Startup configuration — approved 2026-11-19

- [x] **D22** — `PORT` default and parsing: `3000` in every environment when unset or empty;
      otherwise ASCII digits only with a numeric value in 1–65535, leading zeros insignificant and
      `0` rejected ([`ADR-022`](decisions/ADR-022.md)). Closes the last value FR-11 carried as a
      proposal; no requirement is provisional.
