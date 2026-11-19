# Architecture Decision Records

Decision status and technical detail live in one place:
[`DECISION-REGISTER.md`](DECISION-REGISTER.md). It is the single source of truth for D1–D19 and
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

## Current state (2026-11-19)

- Register: D1–D19, **all Approved**. D8–D18 were approved on 2026-11-18; D1–D7 and D19 on
  2026-11-19. D9 was reconfirmed on 2026-11-19.
- ADRs written: `ADR-001.md` … `ADR-019.md`, one per approved decision with matching numbers.
  D1–D7 were approved as recommended, with two clarifications recorded in the decisions
  themselves: `createApp({ db, clock, config })` (D1) and five generation attempts in total (D5).
- The nine-item approval checklist in `docs/architecture-proposal.md` maps onto D1–D9 and is fully
  checked.
- No decision is pending, rejected, or superseded. A later change to any of them needs a new
  decision and a new ADR; do not edit an accepted ADR to look consistent.
