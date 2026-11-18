# Architecture Proposal — Pending User Approval

> Source: the initial Claude response supplied by the user. This document records that proposal; it is not an approved architecture.

## 1. Layered architecture

```text
HTTP request
   |
   v
Routes       -> map URL + method to controller; attach validation
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

- Controllers do not execute SQL.
- Services do not depend on Express `req` or `res`.
- Services throw typed application errors.
- A centralized error middleware maps errors to HTTP responses.
- Dependencies are passed through factory functions, e.g. `createLinkService(repo)`.
- `createApp(db)` builds the Express app and accepts a database instance.
- Tests use an in-memory database.

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

## 3. Proposed database schema

```sql
CREATE TABLE IF NOT EXISTS links (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  code            TEXT    NOT NULL UNIQUE,
  original_url    TEXT    NOT NULL,
  is_custom       INTEGER NOT NULL DEFAULT 0,
  click_count     INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT    NOT NULL,
  expires_at      TEXT,
  last_clicked_at TEXT
);
```

Proposed rationale:
- `UNIQUE(code)` protects code uniqueness at the database layer.
- Generated codes and custom aliases share the same namespace.
- Timestamps are ISO 8601 UTC text.
- `click_count` is incremented atomically.
- A per-click history table is deferred.

## 4. Proposed API

| Method | Path | Purpose | Success |
|---|---|---|---|
| POST | `/api/links` | Create short URL | 201 |
| GET | `/api/links/:code/stats` | Get statistics | 200 |
| GET | `/:code` | Redirect | 302 |
| GET | `/health` | Health check | 200 |

Proposed create body:

```json
{
  "url": "https://example.com/very/long",
  "alias": "my-link",
  "expiresAt": "2026-12-31T00:00:00Z"
}
```

`alias` and `expiresAt` are optional.

Proposed error body:

```json
{
  "error": {
    "code": "ALIAS_TAKEN",
    "message": "Alias is already in use"
  }
}
```

Validation errors may add a `details` array.

Proposed status codes:
- 400: validation error
- 404: unknown code
- 409: alias conflict
- 410: expired link

## 5. Proposed technical decisions — all require approval

> These eight items and the checklist's ninth item are consolidated as **D1–D9** in
> [`decisions/DECISION-REGISTER.md`](decisions/DECISION-REGISTER.md), which is now the canonical
> record of status. The numbering below is the proposal's own and is kept for traceability.

1. Random 7-character Base62 codes using `crypto.randomInt`; retry collisions up to five times.
2. Use 302 redirects so repeat visits reach the server and can be counted.
3. Check expiration lazily on redirect; expired rows remain stored.
4. Alias length 3–32, `[A-Za-z0-9_-]`, case-sensitive; reserve `api` and `health`.
5. Accept only `http:` and `https:` URLs; proposed maximum length 2048.
6. Increment click count atomically in the redirect path.
7. Inject a clock function for deterministic expiration tests.
8. Consider `supertest` for API integration tests; this is an additional dependency and requires approval.

## 6. Dependency proposal

> Exact versions were verified on 2026-11-18 and recorded in
> [`research-findings.md`](research-findings.md) §2. Version pinning, the Node policy, and the
> lockfile rule are **D10–D14** and are not approved.

Requested runtime dependencies:
- `express`
- `better-sqlite3`
- `zod`

Proposed development dependencies:
- `typescript`
- `@types/node`
- `@types/express`
- `@types/better-sqlite3`
- `tsx`
- `vitest`

Additional proposed dependency:
- `supertest` and `@types/supertest` for integration tests. Decide whether to approve or use built-in `fetch` with an ephemeral server.

## 7. Verified technical configuration (proposed under D10–D18)

The research pass added decisions this proposal did not originally cover. They are recorded in
[`research-findings.md`](research-findings.md) and tracked as **D10–D18**; none is approved.

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
- **Complete create/statistics bodies** and a fixed error-code table. (D17)
- **Destination URL limits**: `http`/`https` only, 2048 characters maximum. (D18)

## 8. Proposed implementation sequence

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

Every item maps to a decision ID. **No checkbox may be checked on the user's behalf**, and no
item is approved as of 2026-11-18. Status detail: [`decisions/DECISION-REGISTER.md`](decisions/DECISION-REGISTER.md).

Architecture and behavior:

- [ ] **D1** — Approve layered architecture and feature-module layout.
- [ ] **D2** — Approve the database schema (and decide the optional `CHECK` constraints).
- [ ] **D3** — Approve API routes and the error envelope.
- [ ] **D4** — Approve `302` redirects.
- [ ] **D5** — Approve random 7-character Base62 codes and the retry strategy.
- [ ] **D6** — Approve alias rules, case sensitivity, and reserved words.
- [ ] **D7** — Approve lazy expiration and `410` behavior.
- [ ] **D8** — Approve `supertest` or choose built-in `fetch`.
- [ ] **D9** — Decide whether deletion is in the MVP.

Toolchain and contracts:

- [ ] **D10** — Approve TypeScript 6.0.3 and the tsconfig split.
- [ ] **D11** — Approve ESLint 10 flat config with type-aware linting.
- [ ] **D12** — Approve `better-sqlite3` 13 and its typings.
- [ ] **D13** — Approve the Node.js 24 LTS policy.
- [ ] **D14** — Approve caret ranges and a committed lockfile.
- [ ] **D15** — Approve canonical UTC timestamps and the expiry boundary.
- [ ] **D16** — Approve native ESM.
- [ ] **D17** — Approve the API contracts, `PUBLIC_BASE_URL` policy, and Host-header rule.
- [ ] **D18** — Approve the URL scheme and length limits.
