# Database Design — Draft

> **Status:** Draft proposal. The table comes from `docs/architecture-proposal.md` §3. The driver
> (D12) and the timestamp rules (D15) are **approved** on 2026-11-18; the table itself, its
> `CHECK` constraints, and the pragma list belong to **D2, which remains Pending User Approval**.

SQLite through `better-sqlite3` (synchronous, N-API prebuilds, `engines.node >= 22`).

## Proposed table

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

Recommended optional constraints — **still pending under D2**, not in force:

```sql
  CHECK (is_custom IN (0, 1)),
  CHECK (click_count >= 0),
  CHECK (original_url <> ''),
  CHECK (length(code) BETWEEN 3 AND 32)
```

- Generated codes and custom aliases share one namespace through `UNIQUE(code)`.
- No foreign keys in the MVP; no per-click history table.
- Schema is created idempotently at startup (`CREATE TABLE IF NOT EXISTS`). No migration
  framework is proposed for the first version; that becomes necessary only once a schema is
  deployed and changed.
- `expires_at` is **not** indexed: expiry is evaluated lazily per row and there is no range query.
- The final decision clarification report proposed a refined set for the still-pending D2 decision:
  `CHECK (length(original_url) BETWEEN 1 AND 2048)` in place of `original_url <> ''`, plus
  `CHECK (expires_at IS NULL OR expires_at > created_at)`. Neither is approved.

## Pragmas

Applied on connection open, with rationale:

| Pragma | Value | Why |
|---|---|---|
| `journal_mode` | `WAL` | concurrent readers alongside the writer |
| `foreign_keys` | `ON` | correctness if relations are added; also catches mistakes now |
| `busy_timeout` | `5000` | bounded wait instead of an immediate `SQLITE_BUSY` |
| `synchronous` | `NORMAL` | safe with WAL, avoids an fsync per commit |

`journal_mode = WAL` is a no-op for `:memory:` databases, so tests must not assert it; they
should assert `foreign_keys` and `busy_timeout`. `PRAGMA` results come back untyped from
`@types/better-sqlite3` (`pragma(): unknown`), so read them through a small typed helper rather
than `any`.

## Timestamps

Approved 2026-11-18 under D15 ([`decisions/ADR-015.md`](decisions/ADR-015.md)).

- One format only: `YYYY-MM-DDTHH:mm:ss.sssZ` (UTC, milliseconds, `Z` suffix).
- Produced exclusively by `Date.prototype.toISOString()` in application code, through an injected
  clock so tests can freeze time.
- **Never** use `CURRENT_TIMESTAMP`, `datetime('now')`, `strftime()`, or `julianday()` in SQL:
  they are second-precision, timezone-implicit, and untestable here.
- Because the format is fixed-width UTC, text comparison is chronological comparison, so
  `expires_at > @now` is a valid SQL predicate with a bound parameter.
- Input with an offset (`2026-12-31T00:00:00+02:00`) is accepted and normalized to `Z`.
- A link is expired when `expiresAt <= now` (inclusive).

## Query patterns

Insert (parameters bound, never interpolated):

```sql
INSERT INTO links (code, original_url, is_custom, created_at, expires_at)
VALUES (@code, @originalUrl, @isCustom, @createdAt, @expiresAt);
```

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
redirect decision is a requirement (FR-04).

## Integrity requirements

- `code` unique and non-null; `original_url` non-null.
- `click_count` never negative.
- Timestamps consistent and canonical (above).
- Parameterized statements only (`AGENTS.md` §4).
- Prefer database constraints over application-only uniqueness checks.

## Open design questions

- Add the four optional `CHECK` constraints? (D2)
- Is `AUTOINCREMENT` warranted, or is plain `INTEGER PRIMARY KEY` enough? `AUTOINCREMENT` prevents
  rowid reuse after deletion, which is moot while deletion is out of scope (D9).
- How to handle `SQLITE_BUSY` beyond `busy_timeout`: retry once, or surface `500`?
- When does a migration mechanism become necessary? Proposed: not before the first deployed
  schema change.

Do not add tables or indexes without a clear query or integrity need.
