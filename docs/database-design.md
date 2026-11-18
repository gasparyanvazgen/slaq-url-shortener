# Database Design — Draft

The architecture proposal contains one `links` table. This remains a draft until approved.

## Proposed table

See `architecture-proposal.md` for the proposed SQL.

## Integrity requirements

- `code` must be unique and non-null.
- `original_url` must be non-null.
- `click_count` must never be negative.
- Store timestamps consistently in UTC ISO 8601 format.
- Use parameterized statements.
- Prefer database constraints over application-only uniqueness checks.

## Open design questions

- Whether to add `CHECK (click_count >= 0)`.
- Whether to index `expires_at` (likely unnecessary for lazy expiry in the MVP).
- Whether schema creation is sufficient or a migration mechanism is needed for this small first version.
- How to handle SQLite busy/locking errors, if encountered.

Do not add tables or indexes without a clear query or integrity need.
