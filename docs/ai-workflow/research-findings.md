# Verified Research Findings — Prompts 00 and 01

> **Status:** Evidence record. Not an approval. Every decision derived from these findings is
> tracked in [`docs/decisions/DECISION-REGISTER.md`](../decisions/DECISION-REGISTER.md) with its own
> status. Nothing in this file authorizes implementation.

- **Research completed:** 2026-11-18
- **Verification method:** `npm view` against the public npm registry from this workspace,
  plus the official release notes and package manifests noted per section.
- **Scope:** Prompt 00 (repository/session review) and Prompt 01 (technical research), extended
  with the follow-up findings on compiler configuration, SQLite typing, timestamps,
  base-URL security, API contracts, and module system.
- **Not verified here:** anything that requires an installed dependency tree. See
  [§12 Unverified until scaffolding](#12-unverified-until-scaffolding).

## 1. Runtime and toolchain measured in this workspace

| Item | Value |
|---|---|
| Node.js | **v26.13.0** |
| npm | **11.20.0** |
| Module ABI | 147 (Node 26) |
| Project target runtime (approved, D13) | **Node.js 24 LTS** |
| Git branch | `dev` (created from `master`) |
| Git baseline | `b01087c` — `docs: establish execution framework baseline and sync project state` |
| Git remote | none configured in this workspace |

Node 24 entered Maintenance LTS on 2026-10-20 and is supported until 2028-04-30. Node 26
("Lithium") is the current Active LTS line. The sandbox runs 26, which is **not** the declared
target; this mismatch is recorded as a blocker in `docs/ai-workflow/PROJECT_STATE.md` and as an open question in
the decision register (D13).

## 2. Registry versions (verified 2026-11-18)

| Package | `latest` | Range (approved under D14) | Note |
|---|---|---|---|
| `typescript` | 7.0.2 | `^6.0.3` | 6.x latest is 6.0.3; see §3 |
| `eslint` | 10.15.0 | `^10.15.0` | 9.x latest is 9.39.5 |
| `@eslint/js` | 10.0.1 | `^10.0.1` | must match the ESLint major |
| `typescript-eslint` | 8.73.0 | `^8.73.0` | supports ESLint 8/9/10 |
| `globals` | 17.14.0 | `^17.14.0` | for `globals.node` in flat config |
| `express` | 5.3.0 | `^5.3.0` | `latest-4` is 4.22.3 |
| `zod` | 4.6.7 | `^4.6.7` | Zod 4 API |
| `vitest` | 5.1.1 | `^5.1.1` | |
| `tsx` | 4.23.15 | `^4.23.15` | dev runner |
| `supertest` | 7.3.2 | `^7.3.2` | dev-only, approved (D8) |
| `@types/supertest` | 7.2.1 | `^7.2.1` | dev-only, approved (D8) |
| `better-sqlite3` | 13.2.0 | `^13.2.0` | engines `>=22`, no bundled types |
| `@types/better-sqlite3` | 9.6.0 | `^9.6.0` | separate package required |
| `@types/express` | 5.0.6 | `^5.0.6` | for Express 5 |
| `@types/node` | 26.6.6 | `^24.19.2` | 24.x latest matches the target runtime |

## 3. TypeScript: use 6.0.3, not 7.0.2

`typescript-eslint@8.73.0` declares:

```json
"peerDependencies": {
  "eslint": "^8.57.0 || ^9.0.0 || ^10.0.0",
  "typescript": ">=4.8.4 <6.1.0"
}
```

TypeScript 7.0.2 is the registry `latest`, but it is outside that peer range and has no
programmatic compiler API, which type-aware linting needs. TypeScript **6.0.3** is the newest
version inside the supported window. TS 6 support was added in typescript-eslint 8.58.0
(2026-03-30).

TypeScript 6.0 changed defaults and removals that affect an explicit config:

- Defaults now include `strict: true`, `module: esnext`, `target: es2025`, `types: []`,
  `rootDir: "."`, `libReplacement: false`, `noUncheckedSideEffectImports: true`;
  `esModuleInterop` is forced on.
- Deprecated or removed: `target: es5`, `moduleResolution: node10`, `baseUrl`, `classic`
  resolution, `outFile`, `asserts`, `downlevelIteration`, `module: amd|umd|systemjs|none`.
- Running `tsc file.ts` while a `tsconfig.json` exists is now an error; always pass `-p`.

Approved configuration (D10) makes every relevant option explicit instead of relying on defaults:

```jsonc
// tsconfig.json — typecheck + editor, no emit
{
  "compilerOptions": {
    "target": "es2023",
    "lib": ["es2023"],
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "types": ["node"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src", "tests", "vitest.config.ts"]
}
```

```jsonc
// tsconfig.build.json — emits dist/
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "rootDir": "src",
    "outDir": "dist",
    "sourceMap": true
  },
  "include": ["src"]
}
```

`@types/node@24.19.2` declares `typeScriptVersion: 5.6` and only redirects `typesVersions` for
`<=5.6`/`<=5.7`, so TS 6 resolves the root `index.d.ts` — compatible.

## 4. ESLint 10 + typescript-eslint 8, flat config only

- ESLint 10 removed the legacy `.eslintrc` system; flat config is required.
- `typescript-eslint@8.73.0` accepts `eslint ^10`, so 10.15.0 is usable.
- Type-aware linting needs `parserOptions.projectService: true` (or an explicit `project`).
- `@eslint/js@10.0.1` ships `js.configs.recommended`; `globals@17.14.0` supplies `globals.node`.

Approved `eslint.config.js` (D11):

```js
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/'] },
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  { files: ['**/*.js'], extends: [tseslint.configs.disableTypeChecked] },
);
```

Script: `"lint": "eslint ."`.

## 5. better-sqlite3 13.2.0 and its typings

Manifest facts verified from the registry:

- `engines: { "node": ">=22" }` — compatible with the Node 24 target.
- `prebuilds/**` ships in `files`, `gypfile: false` → prebuilt N-API binaries, no compile step
  on supported platforms.
- Platform-specific `exports` subpaths.
- **No `types` field** → `@types/better-sqlite3@9.6.0` is mandatory.

Typing characteristics of `@types/better-sqlite3@9.6.0`:

- Written as CommonJS `export =`; default-import works because TS 6 forces `esModuleInterop`.
- Covers `prepare`, `run`, `get`, `all`, `iterate`, `transaction`, `pragma`, `exec`,
  `SqliteError`.
- Known gaps to absorb in a thin wrapper rather than with `any`:
  - `pragma()` returns `unknown` → a typed `pragmaValue<T>()` helper with a runtime cast.
  - `lastInsertRowid` is `number | bigint` → normalize before use.
  - `prepare()` uses a conditional generic that wraps object bind parameters differently from
    positional ones.
- `typeScriptVersion: 5.6`, dependency `@types/node: "*"` — no conflict with TS 6.

## 6. Node.js policy

Approved (D13): `.nvmrc` containing `24`, `"engines": { "node": "^24.0.0" }`, a committed
`package-lock.json`, and **no** `engine-strict`. Rationale: Node 24 is a supported LTS until
2028-04-30 with a predictable ABI, and `better-sqlite3` requires `>=22`. Without
`engine-strict`, a newer local Node (such as this sandbox's 26.13.0) can still run the project,
but only Node 24 is declared supported. `engine-strict` was rejected because it turns an
advisory mismatch into a hard `npm install` failure without improving correctness.

## 7. Native ESM

Approved (D16), matching `module: nodenext`:

- `"type": "module"` in `package.json`.
- Relative imports must carry the `.js` extension even in `.ts` sources
  (`import { createApp } from './app.js'`).
- Use `import.meta.dirname`, not `__dirname` / `__filename` (available since Node 20.11).
- `tsx watch src/server.ts` for development, `node dist/server.js` for the built output.
- Vitest consumes the TypeScript ESM sources directly; no separate transform config needed.
- Express 5 and Zod 4 both publish ESM-compatible entry points.

## 8. Canonical timestamps and expiration boundary

Approved (D15):

- One stored format: `YYYY-MM-DDTHH:mm:ss.sssZ`, produced only by `Date.prototype.toISOString()`.
- Timestamps are generated **only in application code** through an injected clock. SQL must
  never call `datetime('now')`, `strftime()`, `CURRENT_TIMESTAMP`, or `julianday()`.
- Because the format is fixed-width UTC, lexicographic comparison equals chronological
  comparison, so SQLite can compare `expires_at` to a bound parameter directly.
- A link is expired when `expiresAt <= now` (inclusive boundary).
- Input with an offset (`2026-12-31T00:00:00+02:00`) is accepted and normalized to UTC `Z`;
  fractional seconds are normalized to exactly three digits on output.
- `expiresAt` must be strictly in the future at creation time, otherwise `400`.

Eleven boundary cases to test are enumerated in `docs/testing-strategy.md`.

## 9. PUBLIC_BASE_URL and Host-header security

Approved (D17):

- `PUBLIC_BASE_URL` is the only source of the public origin used to build `shortUrl`.
- **Never** derive the short URL from the request `Host` or `X-Forwarded-Host` header; a
  header-controlled short URL is an injection and cache-poisoning vector.
- Validation at startup: trim; length ≤ 2048; absolute URL; `http:`/`https:` only; **no**
  username/password; no path, query, or fragment; normalize via `new URL(value).origin`.
- Development default: `http://localhost:${PORT}` when `NODE_ENV !== 'production'`.
- Production: fail fast at startup when unset or invalid; do not silently fall back to a
  guessed host.

## 10. Approved API contracts

Shapes below are the **approved contract** under D17 (2026-11-18, `ADR-017`), and the route set and
error-envelope shape were approved as D3 on 2026-11-19 (`ADR-003`).

Create `POST /api/links` → `201` with `Location: <shortUrl>`:

```json
{
  "code": "aB3xY9z",
  "shortUrl": "https://slaq.example/aB3xY9z",
  "originalUrl": "https://example.com/very/long",
  "createdAt": "2026-11-18T12:00:00.000Z",
  "expiresAt": null,
  "isCustom": false
}
```

Statistics `GET /api/links/:code/stats` → `200`, `Cache-Control: no-store`:

```json
{
  "code": "aB3xY9z",
  "shortUrl": "https://slaq.example/aB3xY9z",
  "originalUrl": "https://example.com/very/long",
  "createdAt": "2026-11-18T12:00:00.000Z",
  "expiresAt": null,
  "isExpired": false,
  "isCustom": false,
  "clickCount": 3,
  "lastClickedAt": "2026-11-18T12:04:11.482Z"
}
```

Error envelope: `{ "error": { "code", "message", "details"? } }`.

| HTTP | `error.code` | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | malformed body/URL/alias/expiry |
| 400 | `RESERVED_ALIAS` | alias collides with a reserved route name |
| 404 | `NOT_FOUND` | unknown code |
| 409 | `ALIAS_TAKEN` | alias already exists |
| 410 | `LINK_EXPIRED` | code exists but is expired |
| 500 | `INTERNAL_ERROR` | unexpected failure; no internals leaked |

Decisions still open inside D17: whether creation echoes `originalUrl`, whether stats of an
expired link returns `200` with `isExpired: true` (recommended) or `410`, and whether `isCustom`
is exposed at all.

## 11. Database and testing considerations

- Pragmas: `journal_mode = WAL`, `foreign_keys = ON`, `busy_timeout = 5000`, and
  `synchronous = NORMAL` under WAL. `journal_mode = WAL` is a no-op for `:memory:` databases,
  so tests must not assert WAL; assert `foreign_keys` and `busy_timeout` instead.
- Uniqueness is enforced by `UNIQUE(code)`; the service still retries generated-code collisions.
- Click counting uses a single conditional `UPDATE` whose `WHERE` clause carries the expiry guard,
  so a redirect that loses an expiry race does not increment. No explicit transaction is used
  (approved as D20 on 2026-11-19 — [`decisions/ADR-020.md`](../decisions/ADR-020.md)).
- `:memory:` gives each connection its own database. Tests must create one app/database per test
  or use a shared cache deliberately, and must not rely on cross-test state.
- `better-sqlite3` is synchronous; no async/pooling concerns, but long statements block the
  event loop. Acceptable at MVP scale and documented as a limitation.

## 12. Unverified until scaffolding

These cannot be proven without a package manifest and installed dependencies; none may be
reported as verified before then:

1. That the approved `tsconfig.json` compiles the agreed source layout with TS 6.0.3.
2. That `@types/better-sqlite3@9.6.0` covers every call the implementation makes without a
   cast or suppression.
3. That the first `npm install` resolves with no peer-dependency conflict.
4. That `eslint .` passes with the approved flat config and type-aware rules.
5. That `vitest run` starts and passes, and that `tsc -p tsconfig.build.json` emits a runnable
   `dist/server.js`.
6. That the `better-sqlite3` prebuilt binary loads under the Node version actually used.

The `AGENTS.md` §8.2 gate (`npm run typecheck && npm run lint && npm test && npm run build`)
cannot run until scaffolding exists, and running it is not authorized yet.
