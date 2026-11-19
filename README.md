# Slaq — URL Shortener

Slaq is a small, backend-focused URL shortener built with Node.js, TypeScript, Express, SQLite
(`better-sqlite3`), and Zod. It creates short links, redirects with a counted `302`, supports custom
aliases and expiry, and exposes read-only click statistics.

The API contract is specified in [`docs/api-specification.md`](docs/api-specification.md) and
described in machine-readable form in [`docs/openapi.yaml`](docs/openapi.yaml).

## Requirements

- Node.js **24 LTS** (see `.nvmrc`; `engines.node` is `^24.0.0`)
- npm (a lockfile is committed, so use `npm ci`)

## Install and run

```bash
npm ci                 # clean, reproducible install from package-lock.json
npm run build          # compile to dist/
npm start              # run the compiled server (creates ./slaq.db on first start)
```

For development with automatic reload:

```bash
npm ci
npm run dev            # tsx watch src/server.ts
```

The SQLite database file is fixed as `slaq.db` in the process working directory. Its schema is
created idempotently at startup. Run the server from a writable directory if you do not want the
database in the repository root (the file is Git-ignored).

### Configuration

Configuration is read from the process environment once at startup. An invalid `PORT` or
`PUBLIC_BASE_URL` aborts startup before the listener or database is opened.

| Variable | Required | Default | Rules |
|---|---|---|---|
| `PUBLIC_BASE_URL` | in production; optional in development | `http://localhost:${PORT}` in development | Absolute `http:`/`https:` origin only — no path, query, fragment, or credentials. Short URLs are built from this value, never from the request `Host` header. |
| `PORT` | no | `3000` in every environment | ASCII digits only, value 1–65535; leading zeros are insignificant (`03000` → `3000`), `0000` is rejected. |
| `NODE_ENV` | no | `development` | Any value other than `production` uses development defaults. |

`.env.example` lists the same variables. **The server does not load `.env` automatically** — there
is no `dotenv` dependency. Export the variables in your shell or set them with your process manager:

```bash
export PUBLIC_BASE_URL='http://localhost:3000'
export PORT=3000
export NODE_ENV=development
npm start
```

## API examples

These examples assume `PUBLIC_BASE_URL=http://localhost:3000`.

Health (liveness only — it does not check the database):

```bash
curl -i http://localhost:3000/health
# 200 {"status":"ok"}
```

Create a link. `alias` and `expiresAt` are optional; `expiresAt` must be a future ISO 8601 instant
and is returned normalized to UTC with three fractional digits:

```bash
curl -i -X POST http://localhost:3000/api/links \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com/path","alias":"my-link","expiresAt":"2026-12-31T00:00:00Z"}'
# 201, Location: http://localhost:3000/my-link
# {"code":"my-link","shortUrl":"http://localhost:3000/my-link",
#  "originalUrl":"https://example.com/path","createdAt":"...",
#  "expiresAt":"2026-12-31T00:00:00.000Z","isCustom":true}
```

A generated code needs only `url`:

```bash
curl -i -X POST http://localhost:3000/api/links \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com/very/long"}'
# 201 with a 7-character Base62 code and "expiresAt":null
```

Redirect. Only `GET` increments the click count; `HEAD` returns the same status and `Location`
without counting. An unknown code returns `404 NOT_FOUND`; an expired code returns
`410 LINK_EXPIRED` without a write:

```bash
curl -i http://localhost:3000/my-link
# 302 Location: https://example.com/path
curl -I http://localhost:3000/my-link
# 302 Location: https://example.com/path  (no increment)
```

Statistics are read-only, public, and sent with `Cache-Control: no-store`. Expired links still
return `200` with `isExpired: true`:

```bash
curl -i http://localhost:3000/api/links/my-link/stats
# 200 {"code":"my-link","shortUrl":"...","originalUrl":"https://example.com/path",
#      "createdAt":"...","expiresAt":"...","isExpired":false,"isCustom":true,
#      "clickCount":1,"lastClickedAt":"..."}
```

Errors use one envelope, `{ "error": { "code", "message", "details"? } }`. Validation details name
the offending field:

```bash
curl -i -X POST http://localhost:3000/api/links \
  -H 'Content-Type: application/json' -d '{"url":"javascript:alert(1)"}'
# 400 {"error":{"code":"VALIDATION_ERROR","message":"Request validation failed",
#      "details":[{"path":"url","message":"url must be a valid http or https URL"}]}}
```

There is no deletion route: `DELETE /api/links/:code` returns `404 NOT_FOUND` (D9).

## Verification

```bash
npm run typecheck   # tsc -p tsconfig.json
npm run lint        # eslint .
npm test            # vitest run
npm run build       # tsc -p tsconfig.build.json
```

The four commands are the project gate and must all pass. Tests use an in-memory SQLite database
and an injected clock; no external service is required.

## Design decisions summary

All 22 decisions (D1–D22) are approved and recorded in
[`docs/decisions/DECISION-REGISTER.md`](docs/decisions/DECISION-REGISTER.md), one ADR each:

- **D1–D7 — architecture and behavior:** layered app with a `createApp({ db, clock, config })` deps
  object; the `links` table with `UNIQUE(code)`; a stable route set; `302` redirects; 7-character
  Base62 codes with five generation attempts; 3–32 character aliases with `api`/`health` reserved
  case-insensitively; lazy expiry with `410` on redirect.
- **D8, D9 — scope:** `supertest` is the API test harness; link deletion is explicitly out of the
  MVP.
- **D10–D16 — toolchain:** TypeScript 6.0.3 with `strict` and `noUncheckedIndexedAccess`, ESLint 10
  flat config, `better-sqlite3` 13 with separate typings, Node 24 LTS, native ESM with `.js` import
  extensions, caret ranges with a committed lockfile, and canonical UTC timestamps.
- **D17, D18 — API contract:** `PUBLIC_BASE_URL` validation and fail-fast, `shortUrl` independent of
  `Host`, approved bodies and headers, absolute `http:`/`https:` URLs only, 2048-character limit, no
  embedded credentials.
- **D19 — resolved gaps:** unknown body fields ignored, duplicate destinations not deduplicated,
  `/health` is liveness only, body-parser failures map to `400 VALIDATION_ERROR` (never `413`).
- **D20, D21 — reliability:** counted redirect uses one guarded `UPDATE` with no explicit
  transaction and `HEAD` does not count; `SQLITE_BUSY` maps to a generic `500 INTERNAL_ERROR`.
- **D22 — `PORT`:** trimmed ASCII digits, default `3000`, invalid values abort startup.

## Known limitations

- No authentication or authorization. Anyone who can reach the service can create links and read
  statistics.
- No rate limiting, abuse detection, or per-origin quotas.
- Statistics are public: knowing a code reveals the destination URL, click count, and last click
  time.
- No deletion or update of links (D9). Expired rows are retained and there is no cleanup job, so the
  table grows without bound.
- A single local SQLite file and a single process: no shared database, horizontal scaling, or
  migration mechanism. Concurrent writes can contend (`SQLITE_BUSY` returns `500`, no retry).
- Only aggregate click data is stored — no per-click history, referrer, or user agent.
- `GET /health` is process liveness only; a `200` does not prove the database is reachable.
- Short URLs come from `PUBLIC_BASE_URL`, not the request `Host` header. Behind a proxy or custom
  domain, configure `PUBLIC_BASE_URL` explicitly or links will point to the wrong origin.
- The server does not read `.env` files automatically.

## Future work

Deferred unless explicitly approved: rate limiting and abuse prevention, authentication and
user-owned links, per-click analytics history, a migration mechanism and multi-process deployment,
operational monitoring, a frontend dashboard, Docker packaging, and QR codes. Link deletion would
require a new decision superseding D9.

## Project documentation

The repository also carries the portable AI execution framework used to build Slaq: `AGENTS.md`,
`PROJECT.md`, `PROJECT_STATE.md`, `ROADMAP.md`, `TASKS.md`, `agents/` (role cards), `prompts/`,
`workflows/`, and `templates/`. Requirements, security guidance, coding standards, testing
strategy, research findings, and ADRs are under `docs/`.
