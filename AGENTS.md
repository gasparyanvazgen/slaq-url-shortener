# AGENTS.md — Instructions for All AI Coding Assistants

## 1. Mission

Help build Slaq, a small, reliable, backend-focused URL shortener, in incremental and verifiable steps. The human user owns product and architecture approval.

## 2. Mandatory context

Before making a change, read the relevant parts of:
- `PROJECT.md`
- `PROJECT_STATE.md`
- `TASKS.md`
- The relevant design document under `docs/`
- The selected role card under `agents/`

At the start of a fresh session, inspect the actual repository and compare it with `PROJECT_STATE.md`. The state file may be stale.

## 3. Authority and decision rules

- The user has final authority over scope, architecture, dependencies, and trade-offs.
- `docs/architecture-proposal.md` is a proposal until the user explicitly approves it.
- Do not treat an AI suggestion as approval.
- Do not add dependencies, change frameworks, change database design, or expand scope without explaining the reason and asking for approval.
- If a decision is already recorded as approved in `docs/decisions/`, follow it unless the user requests reconsideration.
- If requirements conflict, stop and identify the conflict instead of silently choosing.

## 4. Implementation discipline

- Inspect before editing. Do not assume files, scripts, package versions, or existing implementation.
- Make the smallest coherent change that completes the requested task.
- Use TypeScript strict mode as a project requirement.
- Keep HTTP concerns in routes/controllers, business rules in services, and SQL in repository/database code if that architecture is approved.
- Validate external input at the boundary.
- Use parameterized SQL. Never interpolate untrusted values into SQL.
- Handle errors consistently and avoid leaking stack traces or secrets in production responses.
- Use UTC timestamps and document timestamp formats.
- Do not log full user-submitted destination URLs unless there is a clear reason.
- Avoid unnecessary abstractions, speculative extensibility, and premature optimization.
- Do not claim code works unless the relevant command was actually run and its output inspected.

## 5. Testing and verification

For each meaningful change:
1. Identify expected behavior and edge cases.
2. Add or update tests.
3. Run the narrowest relevant tests.
4. Run type-check/build/full tests when appropriate.
5. Report exact commands and outcomes.
6. If a command could not run, state why and provide the exact command for the user to run.

Never fabricate test output.

## 6. Working with Freebuff

This framework uses portable Markdown role cards and prompts. Do not assume native subagents, hooks, slash commands, or Claude Code-specific features exist.

When asked to use a role:
- Read its `agents/<role>.md` file.
- Follow it for the current task.
- If the role requires another specialist, recommend a handoff prompt; do not pretend a second agent ran.

## 7. Session and state management

At the beginning of a session:
- Read `PROJECT_STATE.md` and `TASKS.md`.
- Inspect Git status and relevant source files.
- Confirm the next task with the user if it is not explicit.

At the end of a meaningful session:
- Update `PROJECT_STATE.md` with completed work, current status, test evidence, blockers, and next action.
- Update `TASKS.md`.
- Update docs if behavior or design changed.
- Do not mark tasks complete without evidence.

## 8. Automatic End-of-Task Git Workflow

Whenever you finish implementing a prompt, task, user story, or epic, complete this workflow before reporting the work. Do not wait for the user to ask for a review, verification, status update, or suggested Git commands.

### 8.1 Fresh-eyes self-review (mandatory)

Before running checks, review the complete diff as if reviewing another developer's work. Inspect for:
- logic errors, missing requirements, and unhandled edge cases;
- incorrect or inconsistent validation and error handling;
- security regressions, unsafe SQL, exposed secrets, or sensitive logging;
- debug code, temporary workarounds, unused imports, dead code, and unnecessary dependencies;
- hard-coded user-facing strings that should follow an established project convention;
- unintended file changes, generated artifacts, and unrelated formatting churn.

Fix issues found during this review, then inspect the updated diff again.

### 8.2 Run the required verification checks

Run the following commands from the project root, in this order:

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

All four checks must pass before describing the task/story/epic as fully complete. Inspect the actual command output; never claim a check passed unless it was run successfully. If a required script is not defined in `package.json`, report that as a blocker and ask for approval before changing project scripts. If a check fails, investigate and fix the cause where it is within scope, then rerun the full sequence. Do not hide, skip, or misrepresent failures. If the environment prevents a check from running, state exactly which check could not run and why; mark the work partially complete instead of fully complete.

### 8.3 Synchronize project status and documentation

Update every relevant status reference so the repository tells one consistent story:
- `TASKS.md`: update the task/story/epic status and its checklist items;
- `PROJECT_STATE.md`: record what changed, current progress, verification evidence, blockers, and the next action;
- `ROADMAP.md`: update phase/epic progress if the completed work changes it;
- the relevant feature/story/specification document: update acceptance-criteria statuses and its Definition of Done, if present;
- the relevant prompt or workflow file: update any `Status:` fields, status tables, headings, and checklists that track this work.

Search for duplicate references to the item being updated; do not update only the first occurrence. Move completed items out of sections labelled `Not implemented` or equivalent. Use the project's existing status vocabulary. If work is partial, mark it as in progress/partially complete (🟡 where that convention is used) and state precisely what remains. Never mark an item complete unless its acceptance criteria are met and the required verification evidence is available.

Do not create or update `BACKEND_AGENT_PROMPTS.md` unless that file actually exists and is part of the active project. In this framework, use the existing project source-of-truth files listed above, especially `TASKS.md`, `PROJECT_STATE.md`, and the relevant files under `prompts/` and `docs/`.

### 8.4 Prepare the commit and push commands

After the review, checks, and status synchronization, inspect `git status` and the final diff. Do not include unrelated user changes. Prepare exact Git commands grouped logically when more than one group is appropriate (for example: implementation, tests, documentation). Use the project's conventional commit style:

```bash
git add <specific-files> && git commit -m "<type>: <short message>" && git push
```

Replace every placeholder with actual file paths and a concise commit message. Never use `git add .` or `git add -A` when unrelated changes may be present. If the work is best represented by one commit, provide one command group; do not manufacture multiple commits just to create groups. Never add `Co-Authored-By:`, `Generated with ...` or similar lines to commits. Never stage `.env*` files or secrets.

Automatically conclude the final response with the exact command(s) the user can run to commit and push the verified work. Do not wait for the user to request them. Do not execute `git commit` or `git push` yourself unless the user has explicitly authorized you to perform those Git operations. If the branch has no upstream or push would fail, explain that and provide the appropriate command only when the required remote/branch information is known; never guess remote names.

## 9. Communication

Be concise but explain important trade-offs. Separate:
- facts found in the repository,
- proposed changes,
- decisions requiring user approval,
- work actually completed,
- verification actually performed.

If uncertain, ask one focused question rather than inventing context.