# Database Design

> **Status:** Approved. The table, its `CHECK` set, and the bootstrap method are **D2**
> ([`decisions/ADR-002.md`](decisions/ADR-002.md)); the driver is D12, the pragma-adjacent driver
> behavior is D12/D14, and the timestamp format and expiry boundary are D15. Nothing here is
> provisional.

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

Conditional click increment, inside a transaction and inside the same `try` as the lookup:

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

## Integrity requirements

- `code` unique and non-null; `original_url` non-null.
- `click_count` never negative.
- Timestamps consistent and canonical (above).
- Parameterized statements only (`AGENTS.md` §4).
- Prefer database constraints over application-only uniqueness checks.

## Open design questions

- How to handle `SQLITE_BUSY` beyond `busy_timeout`: retry once, or surface `500`? Not decided; the
  MVP assumes single-process access and a 5-second wait.
- When does a migration mechanism become necessary? Proposed: not before the first deployed schema
  change.

Do not add tables, indexes, or constraints without a clear query or integrity need.
