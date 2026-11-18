# Coding Standards

> Conventions marked with a D-ID cite their decision. **D10–D16 are approved** (2026-11-18); any
> convention resting on D1–D7 is still a proposal. See
> [`decisions/DECISION-REGISTER.md`](decisions/DECISION-REGISTER.md).

## Language and toolchain

- Enable TypeScript `strict`. Also enable `noUncheckedIndexedAccess`; both are approved in D10.
- Target **TypeScript 6.0.3**, not 7.x: type-aware ESLint requires `typescript <6.1.0`. (D10)
- Target **Node.js 24 LTS**, declared in `.nvmrc` and `engines`. (D13)
- Use **native ESM**: `"type": "module"`, `module`/`moduleResolution: nodenext`, and `.js`
  extensions on every relative import. Use `import.meta.dirname`, never `__dirname`. (D16)
- Lint with the flat config and `recommendedTypeChecked`; `npm run lint` is `eslint .`. (D11)
- Use caret ranges in `package.json` and commit `package-lock.json`; install with `npm ci` when a
  lockfile exists. (D14)

## Types

- Prefer explicit, useful types; avoid `any`.
- Do not silence the compiler with `@ts-ignore`, `@ts-expect-error`, or non-null assertions when a
  real narrowing or guard is possible. No lint-rule suppressions to make a check pass.
- Wrap the untyped parts of `@types/better-sqlite3` (`pragma()`, `lastInsertRowid`) in small typed
  helpers instead of casting at every call site. (D12)
- Keep functions focused and small; use clear names that describe intent.

## Layers

- Keep Express-specific objects (`req`, `res`, `next`) at the HTTP boundary.
- Keep SQL in repository/database modules only.
- Keep business rules in services.
- Validate untrusted request input with Zod at the boundary; services may assume validated input.
- Return plain typed objects from repositories; do not leak driver row types upward.

## Data and time

- Use canonical UTC timestamps `YYYY-MM-DDTHH:mm:ss.sssZ` from `toISOString()` only. (D15)
- Never use SQLite date functions for application time; pass `now` from the injected clock.
- Compare expiry with `expiresAt <= now`.
- Use parameterized SQL statements; never build SQL from input.
- Prefer database constraints for uniqueness and range invariants.

## Errors

- Throw typed application errors from services; map them to HTTP once, in the error middleware.
- Use the documented codes (`VALIDATION_ERROR`, `RESERVED_ALIAS`, `NOT_FOUND`, `ALIAS_TAKEN`,
  `LINK_EXPIRED`, `INTERNAL_ERROR`) rather than ad-hoc strings. (D17)
- Do not swallow errors; do not leak internals in responses.

## Configuration

- Read configuration once at startup and validate it there (`PORT`, `NODE_ENV`,
  `PUBLIC_BASE_URL`).
- Fail fast on invalid production configuration instead of falling back silently. (D17)
- Never commit secrets; keep local values in `.env` (ignored) and document them in `.env.example`.

## Tests and comments

- Tests must be deterministic: fixed clock, isolated in-memory database, no shared state.
- Name tests by behavior, not by implementation detail.
- Comments should explain non-obvious reasoning, not restate code.
- Do not add abstractions or dependencies without a current use case and user approval
  (`AGENTS.md` §3).
