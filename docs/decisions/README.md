# Architecture Decision Records

Decision status and technical detail live in one place:
[`DECISION-REGISTER.md`](DECISION-REGISTER.md). It is the single source of truth for D1–D18 and
prevents duplicate decision records.

## Rules

- One ADR per **approved** decision, created from `templates/adr-template.md`.
- File name: `ADR-NNN.md`, using the same number as its `D-NNN` register entry (`ADR-010.md` for
  D10). Do not renumber approved decisions.
- Allowed statuses: `Proposed`, `Accepted`, `Rejected`, `Superseded`.
  Only the user's explicit approval makes a decision `Accepted` (`AGENTS.md` §3).
- The ADR records the final decision, the alternatives that lost, and the verification evidence.
  It links back to the register entry rather than restating every justification.
- If a decision changes after acceptance, write a new ADR with the next number and mark the old
  one `Superseded by ADR-NNN`. Do not edit history to look consistent.
- `docs/architecture-proposal.md` is **not** an ADR and is not approval of anything.

## Current state (2026-11-18)

- Register: D1–D18, all **Pending User Approval**.
- ADRs written: **none**.
- The nine-item approval checklist in `docs/architecture-proposal.md` maps onto D1–D9.
