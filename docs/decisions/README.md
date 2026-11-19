# Architecture Decision Records

Decision status and technical detail live in one place:
[`DECISION-REGISTER.md`](DECISION-REGISTER.md). It is the single source of truth for D1–D23
(D1–D22 approved, D23 **Proposed**) and prevents duplicate decision records.

## Rules

- One ADR per **approved** decision, created from `docs/ai-workflow/templates/adr-template.md`.
  D23 is the user-directed exception: a draft ADR marked **Proposed** before approval.
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

- Register: D1–D23 — D8–D18 on 2026-11-18; D1–D7, D19, D20, D21, and D22 on
  2026-11-19, with D9 reconfirmed on 2026-11-19. D20 and D21 came from the Prompt 03 architecture
  review ([`docs/ai-workflow/architecture-review.md`](../ai-workflow/architecture-review.md)) and were approved with corrections
  C-1 … C-3; D22 settled the `PORT` default and parsing rule that FR-11 had carried as a proposal.
- D23 is **Proposed** — [`ADR-023.md`](ADR-023.md): the user approved only the `swagger-ui-dist`
  dependency for the local Swagger UI work and asked that the ADR stay a draft until further
  approval. It is not an approved decision.
- ADRs written: `ADR-001.md` … `ADR-023.md`, one per decision with matching numbers; `ADR-001.md` …
  `ADR-022.md` are approved and `ADR-023.md` is Proposed.
  D1–D7 were approved as recommended, with two clarifications recorded in the decisions
  themselves: `createApp({ db, clock, config })` (D1) and five generation attempts in total (D5).
- The nine-item approval checklist in `docs/architecture-proposal.md` maps onto D1–D9 and is fully
  checked, as is the Prompt 03 review checklist (D20, D21, C-1 … C-3) and the D22 startup item.
- No decision is rejected or superseded; D23 is the only one not approved. Three wording corrections
  (C-1 … C-3) were applied on 2026-11-19; they changed descriptions, not decisions, and each
  affected ADR carries a dated clarification. A later change to any approved decision needs a new decision and a new ADR;
  do not edit an accepted ADR to look consistent.
