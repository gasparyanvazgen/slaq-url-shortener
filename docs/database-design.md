# Database Design

> **Status:** Approved. The table, its `CHECK` set, and the bootstrap method are **D2**
> ([`decisions/ADR-002.md`](decisions/ADR-002.md)); the driver is D12, the pragma-adjacent driver
> behavior is D12/D14, and the timestamp format and expiry boundary are D15. The redirect write
> path is **D20** ([`ADR-020`](decisions/ADR-020.md)) and the busy-error policy is **D21**
> ([`ADR-021`](decisions/ADR-021.md)). Nothing here is provisional.

SQLite through `better-sqlite3` (synchronous, N-API prebuilds, `engines.node >= 22`).

## Table

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

### Constraints

- `UNIQUE(code)` is the only integrity rule that must survive concurrency: generated codes and
  custom aliases share one namespace, and the index is case-sensitive (BINARY), matching the
  case-sensitive alias rule in D6. Uniqueness is never checked in application code before an insert.
- The approved `CHECK` set is exactly two invariants:
  - `CHECK (is_custom IN (0, 1))` — the column is a boolean flag, not a free integer.
  - `CHECK (click_count >= 0)` — a bug must not be able to record negative clicks.
- Deliberately **not** constrained: `original_url <> ''`, `length(original_url) BETWEEN 1 AND 2048`,
  `length(code) BETWEEN 3 AND 32`, and `expires_at > created_at`. The first three duplicate
  validation rules that already run on every write (D18, D6), and all four would have to be dropped
  and re-added through a full table rebuild if a limit ever changed. SQLite cannot add or remove a
  `CHECK` in place, which is why the set was settled before the first `CREATE TABLE`.
- No foreign keys in the MVP; no per-click history table.
- `expires_at` is **not** indexed: expiry is evaluated per row on read and there is no range query.
- `id` keeps `AUTOINCREMENT`. Deletion is out of scope (D9), so rowid reuse cannot occur today; the
  keyword documents that the surrogate key is never reused.

### Bootstrap

- `CREATE TABLE IF NOT EXISTS` runs at startup from `src/db/schema.ts`. It is idempotent and safe to
  run on every boot.
- No migration framework in the MVP; no seed data, views, or triggers. The first deployed schema
  change is the point at which a real migration mechanism becomes necessary.

## Pragmas

Applied on connection open, with rationale:

| Pragma | Value | Why |
|---|---|---|
| `journal_mode` | `WAL` | concurrent readers alongside the writer |
| `foreign_keys` | `ON` | correctness if relations are added; also catches mistakes now |
| `busy_timeout` | `5000` | bounded wait instead of an immediate `SQLITE_BUSY` |
| `synchronous` | `NORMAL` | safe with WAL, avoids an fsync per commit |

`journal_mode = WAL` is a no-op for `:memory:` databases, so tests must not assert it; they should
assert `foreign_keys` and `busy_timeout`. `PRAGMA` results come back untyped from
`@types/better-sqlite3` (`pragma(): unknown`), so read them through a small typed helper rather than
`any`.

## Timestamps

Approved 2026-11-18 under D15 ([`decisions/ADR-015.md`](decisions/ADR-015.md)).

- One format only: `YYYY-MM-DDTHH:mm:ss.sssZ` (UTC, milliseconds, `Z` suffix).
- Produced exclusively by `Date.prototype.toISOString()` in application code, through an injected
  clock so tests can freeze time. `createApp({ db, clock, config })` is where the clock enters (D1).
- **Never** use `CURRENT_TIMESTAMP`, `datetime('now')`, `strftime()`, or `julianday()` in SQL: they
  are second-precision, timezone-implicit, and untestable here.
- Because the format is fixed-width UTC, text comparison is chronological comparison, so
  `expires_at > @now` is a valid SQL predicate with a bound parameter.
- Input with an offset (`2026-12-31T00:00:00+02:00`) is accepted and normalized to `Z`.
- A link is expired when `expiresAt <= now` (inclusive). `expires_at` is `NULL` for links that never
  expire.

## Query patterns

Insert (parameters bound, never interpolated):

```sql
INSERT INTO links (code, original_url, is_custom, created_at, expires_at)
VALUES (@code, @originalUrl, @isCustom, @createdAt, @expiresAt);
```

A `UNIQUE` violation here is the alias-conflict signal (`409 ALIAS_TAKEN` for a custom alias) or the
collision signal for the generator's bounded retry (D5). Nothing pre-checks existence.

Lookup:

```sql
SELECT id, code, original_url, is_custom, click_count, created_at, expires_at, last_clicked_at
  FROM links
 WHERE code = @code;
```

Conditional click increment — one guarded statement, **no explicit transaction** (D20):

```sql
UPDATE links
   SET click_count = click_count + 1,
       last_clicked_at = @now
 WHERE code = @code
   AND (expires_at IS NULL OR expires_at > @now);
```

`changes === 0` means the link expired (or vanished) between lookup and update; the handler then
answers `410`/`404` and no count is lost or double-counted. Incrementing only after a successful
redirect decision is a requirement (FR-04, D7).

The lookup exists to distinguish `404` from `410`; the increment itself needs no transaction
because the expiry guard is inside the `WHERE` clause and is therefore applied atomically. With one
process, one connection, and a synchronous driver, no statement can interleave between the two.
`HEAD` requests return the same redirect response without executing the update (D20).

## Repository contract

SQL lives behind one factory and never leaves it (D1; `AGENTS.md` §4). The module set is fixed by
`ADR-002` and `ADR-020`; nothing in this section is implemented yet.

| File | Responsibility |
|---|---|
| `src/db/connection.ts` | `openDatabase(filename)` — opens `better-sqlite3`, applies the pragmas above, returns the handle. WAL is requested only for file databases. |
| `src/db/pragma.ts` | `pragmaValue(db, name)` and the `PragmaMap` declared by D12, so `pragma()` results are typed without `any`. |
| `src/db/schema.ts` | `createSchema(db)` — executes the approved `CREATE TABLE IF NOT EXISTS` verbatim. |
| `src/db/id.ts` | `toSafeId(value: number \| bigint)` — normalizes `lastInsertRowid` and rejects non-safe integers (D12). |
| `src/modules/links/links.types.ts` | `LinkRow` (snake_case driver row, internal) and `Link` (camelCase domain object). |
| `src/modules/links/links.repository.ts` | `createLinkRepository(db)` — the three statements below, prepared once in the factory. |

`createLinkRepository(db)` returns exactly three operations:

- `insert(input: NewLink): Link` — binds `code`, `originalUrl`, `isCustom` (`0 | 1`), `createdAt`,
  `expiresAt`; returns the domain object assembled from those values plus a `toSafeId`-normalized
  `lastInsertRowid`, with `clickCount: 0` and `lastClickedAt: null`. The row is not re-read: one
  round trip, and every stored value is exactly what the caller passed.
- `findByCode(code: string): Link | undefined` — the lookup above; an absent code is a normal
  `undefined` at this layer, not an error, because the service owns `404` versus `410`.
- `incrementClick(code: string, nowIso: string): number` — the guarded update above; returns
  `changes`. No transaction (D20).

Rules for this layer:

- Every statement is prepared once and bound with named parameters; no identifier, value, or clause
  is ever assembled from input.
- The repository never reads a clock. Every timestamp arrives as an already-canonical string from
  the injected clock (D15), so SQL contains no `CURRENT_TIMESTAMP`, `datetime()`, or `strftime()`.
- `is_custom` is mapped `1 → true`, `0 → false` on the way out and back to `0 | 1` on the way in;
  `LinkRow` never escapes the module (D12).
- `insert` catches only the driver's UNIQUE failure (`SQLITE_CONSTRAINT_UNIQUE`) and rethrows a
  typed `UniqueCodeError`. It never pre-checks existence: the service decides between
  `409 ALIAS_TAKEN` and a generator retry (D5, D6).
- `SQLITE_BUSY` is **not** caught here; the centralized error middleware maps it (D21).
- No `db.transaction()` call exists anywhere in this layer, and no statement mutates more than one
  row.

### Persistence tests

The cases already required by `docs/testing-strategy.md` — schema idempotency, both `CHECK`
constraints, `UNIQUE(code)`, pragma values, and the `SQLITE_BUSY` mapping — are joined by these
repository-level checks, all on an isolated `:memory:` database with fixed timestamp strings:

- `insert` stores the exact trimmed URL and canonical timestamps, returns `clickCount: 0` and
  `lastClickedAt: null`, and maps `isCustom` both ways.
- A duplicate `code` throws `UniqueCodeError` and leaves the row count unchanged.
- `findByCode` is case-sensitive (`MyLink` does not find `mylink`), returns `undefined` for an
  unknown code, and returns `undefined` for an injection-shaped code such as `x' OR 1=1 --` with the
  table unchanged (bound-parameter regression).
- `incrementClick` returns `1` on an active row, `0` on an expired row (`expires_at === now` and
  older), `0` for an unknown code, and preserves `click_count` and `last_clicked_at` in every `0`
  case.
- Fifty sequential increments produce exactly `50`, and `last_clicked_at` equals the last bound
  instant.
- `openDatabase(':memory:')` reports `foreign_keys = 1`, `busy_timeout = 5000`, and
  `synchronous = 1`; it does not assert `journal_mode`.

## Integrity requirements

- `code` unique and non-null; `original_url` non-null.
- `click_count` never negative.
- Timestamps consistent and canonical (above).
- Parameterized statements only (`AGENTS.md` §4).
- Prefer database constraints over application-only uniqueness checks.

## Resolved operational question

`SQLITE_BUSY` after `busy_timeout` surfaces `500 INTERNAL_ERROR` with a generic message and **no
retry** (D21, [`ADR-021`](decisions/ADR-021.md)). The driver detail is logged server-side and never
returned to the client.

## Open design questions

- When does a migration mechanism become necessary? Proposed: not before the first deployed schema
  change.

Do not add tables, indexes, or constraints without a clear query or integrity need.
