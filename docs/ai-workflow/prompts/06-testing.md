# Prompt 06 — Test a Feature or Release

Follow `docs/ai-workflow/agents/qa-engineer.md`.

Inspect the implementation and test setup. Map the relevant requirements to tests.

Cover successful behavior, invalid inputs, not-found behavior, conflict behavior, expiry boundaries, and redirect/click-count semantics where relevant.

Run the tests and type-check if possible. Report:
- Exact commands.
- Actual pass/fail counts or output.
- Tests not run and why.
- Missing coverage.
- Defects ordered by severity.

Do not claim unexecuted tests pass. Do not weaken assertions merely to obtain a green run.
