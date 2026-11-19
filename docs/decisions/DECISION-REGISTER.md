# Slaq Decision Register

> Single source of truth for technical decisions. One entry per decision; no duplicates.
> An ADR under `docs/decisions/ADR-NNN.md` is created only when the user approves the
> corresponding `D-NNN`, and reuses the same number. D23 is the one user-directed exception: the
> user asked for a **Proposed** ADR before approval; it is a draft and is not an approved decision.

- **Register updated:** 2026-11-19 (D23 recorded as **Proposed** — local Swagger UI; D22 approved —
  `PORT` default; C-1 … C-3 applied; D20 and D21 approved)
- **Decisions:** D1–D23
- **Approved by the user:** **D8–D18** on 2026-11-18; **D1–D7** and **D19** on 2026-11-19; **D20**
  and **D21** on 2026-11-19; **D22** on 2026-11-19 — every decision is recorded as `ADR-001` …
  `ADR-022`
- **Pending User Approval:** **D23** — fully specified and implemented under the user's explicit
  one-dependency approval, but the ADR is **Proposed** until the user approves it. **D1–D22 are all
  Approved.**
- **Decision owner:** User (`AGENTS.md` §3)

## Status vocabulary

| Status | Meaning |
|---|---|
| **Proposed** | An idea captured without enough verified detail to act on. |
| **Pending User Approval** | Fully specified and technically verified; waiting for the user's explicit yes/no/amendment. |
| **Approved** | Explicitly approved by the user. Recorded as an ADR. May be implemented. |
| **Rejected** | Explicitly declined by the user. Kept for traceability. |
| **Superseded** | Replaced by a later decision; the replacement is named. |

All twenty-two original decisions (D1–D22) are **Approved** by the user, each with an ADR:
D8–D18 on 2026-11-18; D1–D7, D19, D20, D21, and D22 on 2026-11-19. D1–D7 were approved as recommended with two recorded
clarifications — the `createApp({ db, clock, config })` deps object (D1) and **five generation
attempts in total** (D5). D20 and D21 were approved on 2026-11-19 after the Prompt 03 architecture
review, together with corrections C-1 … C-3. D22 settled the last unsourced startup value — the
`PORT` default and its parsing rule. D23 is the only later entry and is **Proposed**, awaiting
approval; no entry is **Rejected** or **Superseded**.

## Status summary

| ID | Decision | Status |
|---|---|---|
| D1 | Layered architecture and feature-module layout | **Approved** — `ADR-001` |
| D2 | `links` table schema and schema bootstrap | **Approved** — `ADR-002` |
| D3 | API routes and error envelope | **Approved** — `ADR-003` |
| D4 | Redirect status `302` | **Approved** — `ADR-004` |
| D5 | Short-code generation (7-char Base62, 5 attempts) | **Approved** — `ADR-005` |
| D6 | Alias rules and reserved names | **Approved** — `ADR-006` |
| D7 | Expiration behavior (`410`, lazy, rows retained) | **Approved** — `ADR-007` |
| D8 | Integration-test dependency: `supertest` vs built-in `fetch` | **Approved** — `ADR-008` |
| D9 | Deletion in the MVP | **Approved** — `ADR-009` |
| D10 | TypeScript 6.0.3 and tsconfig layout | **Approved** — `ADR-010` |
| D11 | ESLint 10 flat config with type-aware linting | **Approved** — `ADR-011` |
| D12 | `better-sqlite3` 13 + `@types/better-sqlite3` 9 typings | **Approved** — `ADR-012` |
| D13 | Node.js 24 LTS runtime policy | **Approved** — `ADR-013` |
| D14 | Dependency ranges (caret) plus committed lockfile | **Approved** — `ADR-014` |
| D15 | Canonical UTC timestamps and expiry boundary | **Approved** — `ADR-015` |
| D16 | Native ESM module system | **Approved** — `ADR-016` |
| D17 | API response contracts, `PUBLIC_BASE_URL`, Host-header safety | **Approved** — `ADR-017` |
| D18 | Destination URL format and length limits | **Approved** — `ADR-018` |
| D19 | Requirement-gap resolutions (unknown fields, duplicate destinations, `/health`, body-parser errors) | **Approved** — `ADR-019` |
| D20 | Redirect write path: guarded increment, no explicit transaction, `HEAD` does not count | **Approved** — `ADR-020` |
| D21 | `SQLITE_BUSY` maps to `500 INTERNAL_ERROR`, no retry | **Approved** — `ADR-021` |
| D22 | `PORT` default (`3000` in every environment) and ASCII-digit parsing in 1–65535 | **Approved** — `ADR-022` |
| D23 | Serve Swagger UI locally with `swagger-ui-dist` under `/api` | **Proposed** — `ADR-023` |

D1–D9 come from the nine-item approval checklist in `docs/architecture-proposal.md`.
D10–D18 are the toolchain and contract findings verified in `docs/ai-workflow/research-findings.md`.

---

## D1 — Layered architecture and feature-module layout

- **Status:** **Approved** 2026-11-19 — [`ADR-001.md`](ADR-001.md). Includes the deps-object
  clarification.
- **Decision:** Adopt routes → controllers → services → repository inside a single feature module
  `src/modules/links/`, with factories that take a **deps object**: `createApp({ db, clock, config })`
  builds the repository and the link service, and `createLinkService({ repo, clock, config })` is
  testable without a port. Controllers never run SQL; services never touch `req`/`res`; SQL lives
  only in repositories.
- **Justification:** Four small layers are enough to separate HTTP, rules, and persistence while
  remaining readable in a five-hour MVP. Factories make the service testable without a port.
- **Alternatives / trade-offs:** A single `app.ts` with inline handlers is faster to write but
  mixes concerns and weakens tests. Global `controllers/`+`services/` folders add navigation cost
  for one feature.
- **Verification:** Structural review only; nothing to install. Matches `AGENTS.md` §4.
- **Affected documents:** `docs/architecture-proposal.md` §1–2, `docs/ai-workflow/ROADMAP.md` Phase 3–4,
  `docs/testing-strategy.md`, `docs/ai-workflow/TASKS.md`.
- **Depends on / constrains:** Nothing. Constrains D10 (path aliases are unnecessary), D16
  (import extensions).

## D2 — `links` table schema and schema bootstrap

- **Status:** **Approved** 2026-11-19 — [`ADR-002.md`](ADR-002.md). The `CHECK` set is settled.
- **Decision:** One table:

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

  Generated codes and custom aliases share one namespace through `UNIQUE(code)`. Schema is
  created idempotently at startup; **no** migration framework in the MVP. The approved `CHECK` set
  is **only** `click_count >= 0` and `is_custom IN (0,1)`; the length, non-empty-URL, and
  `expires_at > created_at` checks are **not** adopted, because those rules are enforced where the
  input arrives (D18) and SQLite cannot add a `CHECK` later without rebuilding the table.
  `expires_at` is **not** indexed (lazy expiry, no range queries).
- **Justification:** `UNIQUE(code)` is the only integrity rule that must survive concurrency;
  the rest are cheap guards. A migration framework is unjustified for an unshipped schema.
- **Alternatives / trade-offs:** Separate alias/code columns would double the lookup logic.
  `INTEGER` epoch timestamps would compare quickly but lose readability; canonical ISO text is
  readable and lexicographically ordered. A migration tool adds a dependency and process for no
  current benefit.
- **Verification:** SQLite `UNIQUE`/`CHECK` semantics; `better-sqlite3` executes DDL via `exec`.
  Not yet executed — no database exists.
- **Affected documents:** `docs/architecture-proposal.md` §3, `docs/database-design.md`,
  `docs/testing-strategy.md`, `docs/ai-workflow/TASKS.md` §2.
- **Depends on / constrains:** D15 (timestamp format), D12 (driver), D13 (runtime). D7 relies on
  expired rows being retained.

## D3 — API routes and error envelope

- **Status:** **Approved** 2026-11-19 — [`ADR-003.md`](ADR-003.md).
- **Decision:** `POST /api/links`, `GET /api/links/:code/stats`, `GET /:code`, `GET /health`,
  with the static routes registered before `/:code`. Body fields `url`, `alias`, `expiresAt`.
  Errors are always `{ "error": { "code", "message", "details"? } }`.
- **Justification:** A namespaced API avoids colliding with the `/:code` redirect namespace, and
  one error envelope keeps clients simple. `details` is optional so it never appears on 404/410.
- **Alternatives / trade-offs:** `POST /links` risks shadowing codes; RFC 9457
  `application/problem+json` is more standard but heavier than this MVP needs. Returning bare
  strings saves bytes but breaks the "one documented shape" requirement (FR-08).
- **Verification:** Express 5 routing behavior for `/:code` and the static `/api` prefix; no
  runtime check yet.
- **Affected documents:** `docs/architecture-proposal.md` §4, `docs/api-specification.md`,
  `docs/requirements.md` (FR-07/FR-08), `docs/testing-strategy.md`.
- **Depends on / constrains:** D17 (response bodies), D6 (reserved names must include `api`),
  D4 (redirect status).

## D4 — Redirect status `302`

- **Status:** **Approved** 2026-11-19 — [`ADR-004.md`](ADR-004.md).
- **Decision:** `GET /:code` answers `302 Found` with a `Location` header and no body.
- **Justification:** A temporary redirect keeps repeat visits hitting the server so clicks stay
  countable. A permanent `301` would be cached by browsers and silently stop counting.
- **Alternatives / trade-offs:** `307` preserves the method, which is wrong for a browser
  navigation and offers no benefit here. `301` improves latency at the cost of analytics
  correctness.
- **Verification:** Express `res.redirect(302, url)` semantics; no runtime check yet.
- **Affected documents:** `docs/api-specification.md`, `docs/architecture-proposal.md` §5.2,
  `docs/requirements.md` FR-03/FR-04, `docs/ai-workflow/TASKS.md` §4.
- **Depends on / constrains:** D7 (expired links must not redirect), D18 (only validated targets
  are ever placed in `Location`).

## D5 — Short-code generation

- **Status:** **Approved** 2026-11-19 — [`ADR-005.md`](ADR-005.md). Includes the
  five-attempts-total clarification.
- **Decision:** Random 7-character Base62 codes from a 62-symbol alphabet, generated with
  `crypto.randomInt` (never `Math.random`), retrying on collision for at most **five generation
  attempts in total** — the first attempt plus four retries — then failing with `INTERNAL_ERROR`.
  Uniqueness is enforced by `UNIQUE(code)`, not by a pre-check.
- **Justification:** 62⁷ ≈ 3.5 × 10¹² codes makes collisions negligible at MVP scale, and
  `randomInt` is unbiased and cryptographically strong. Five retries absorbs the residual case
  without a loop that can spin forever.
- **Alternatives / trade-offs:** Sequential IDs leak volume and enable enumeration. Hash-derived
  codes need truncation and still collide. Longer codes hurt usability; shorter ones raise retry
  pressure.
- **Verification:** `node:crypto.randomInt(max)` is uniform over `[0, max)`; no code exists yet.
- **Affected documents:** `docs/architecture-proposal.md` §5.1, `docs/testing-strategy.md`
  (generator + collision cases), `docs/ai-workflow/TASKS.md` §3.
- **Depends on / constrains:** D6 (aliases share the namespace), D2 (`UNIQUE(code)` is the real
  guarantee).

## D6 — Alias rules and reserved names

- **Status:** **Approved** 2026-11-19 — [`ADR-006.md`](ADR-006.md). Includes the
  case-insensitive reserved-name check.
- **Decision:** Aliases are 3–32 characters, `[A-Za-z0-9_-]`, **case-sensitive**, and must not
  equal a reserved name. Reserved, matched case-insensitively: `api`, `health`. Alias
  length/charset failures return `400 VALIDATION_ERROR`; a reserved name returns
  `400 RESERVED_ALIAS`; an existing alias returns `409 ALIAS_TAKEN`.
- **Justification:** The charset is URL-safe without encoding, and case sensitivity matches the
  case-sensitive `UNIQUE` index, avoiding a mismatch between validation and storage. Reserving
  `api`/`health` prevents alias shadowing of real routes.
- **Alternatives / trade-offs:** Case-insensitive aliases would need `COLLATE NOCASE` and a
  documented canonical form. Allowing dots or slashes creates routing ambiguity. A longer
  reserved list is safer if new top-level routes are added later.
- **Verification:** Regex and length rules are pure functions; `UNIQUE` is the storage guarantee.
- **Affected documents:** `docs/architecture-proposal.md` §5.4, `docs/requirements.md`
  (open question resolved as a proposal), `docs/api-specification.md`, `docs/ai-workflow/TASKS.md` §5.
- **Depends on / constrains:** D3 (route names), D5 (shared namespace), D17 (error codes).

## D7 — Expiration behavior

- **Status:** **Approved** 2026-11-19 — [`ADR-007.md`](ADR-007.md).
- **Decision:** Expiration is evaluated lazily on redirect and on stats. An expired code
  returns `410 LINK_EXPIRED` on redirect and does **not** increment the click count. Expired rows
  are retained so statistics remain available. `expiresAt` must be in the future at creation.
- **Justification:** Lazy evaluation needs no scheduler, background job, or extra dependency, and
  retention keeps the click history of a campaign readable after it ends.
- **Alternatives / trade-offs:** A cleanup job deletes rows and breaks stats history. A `404` for
  expired links hides the reason and is indistinguishable from a typo. Returning `410` is
  explicit but reveals that a code once existed — acceptable for this product.
- **Verification:** Boundary semantics fixed by D15; no runtime check yet.
- **Affected documents:** `docs/architecture-proposal.md` §5.3, `docs/requirements.md` FR-05,
  `docs/api-specification.md`, `docs/testing-strategy.md`, `docs/ai-workflow/TASKS.md` §6–7.
- **Depends on / constrains:** D2 (rows retained), D15 (format and `<=` boundary), D17 (stats
  contract for expired links).

## D8 — Integration-test dependency: `supertest` vs built-in `fetch`

- **Status:** **Approved** 2026-11-18 — [`ADR-008.md`](ADR-008.md). Selected: `supertest`.
- **Decision:** Use **`supertest@^7.3.2`** with `@types/supertest@^7.2.1` for API tests,
  driving the Express app in-process without binding a port.
- **Justification:** `supertest` asserts status, headers, and JSON in one chain and starts an
  ephemeral listener automatically, which keeps redirect and header tests short. It is a
  dev-only dependency. Built-in `fetch` requires manually starting and closing a server per test
  and re-implementing header/body assertions.
- **Alternatives / trade-offs:** Node's `fetch` + `app.listen(0)` has zero dependencies and is
  closer to production behavior, at the cost of more boilerplate and port lifecycle bugs.
  `vitest` + `fetch` also works but does not reduce the boilerplate.
- **Verification:** `supertest` 7.3.2 supports Express 5 apps; typings 7.2.1 exist. Not installed.
- **Affected documents:** `docs/ai-workflow/PROJECT.md` (dependency note), `docs/architecture-proposal.md` §6,
  `docs/testing-strategy.md`, `docs/ai-workflow/TASKS.md` Gate 0.
- **Depends on / constrains:** D1 (`createApp` must be importable without listening), D14
  (lockfile records the resolution).

## D9 — Deletion in the MVP

- **Status:** **Approved** 2026-11-18, reconfirmed 2026-11-19 — [`ADR-009.md`](ADR-009.md).
  Deletion stays out of scope.
- **Decision:** **Out of scope** for the MVP. No `DELETE` endpoint and no `deleted_at`
  column.
- **Justification:** Nothing in the ten MVP capabilities requires deletion, and it introduces
  authorization questions (anyone could delete any link) that the project explicitly excludes.
- **Alternatives / trade-offs:** Adding `DELETE /api/links/:code` costs an endpoint, a test file,
  and an unauthenticated destructive capability. Soft delete complicates every read path.
- **Verification:** Scope review against `docs/ai-workflow/PROJECT.md` non-goals; no code involved.
- **Affected documents:** `docs/requirements.md` FR-09, `docs/ai-workflow/PROJECT.md`, `docs/api-specification.md`,
  `docs/ai-workflow/TASKS.md`.
- **Depends on / constrains:** Nothing.

## D10 — TypeScript 6.0.3 and tsconfig layout

- **Status:** **Approved** 2026-11-18 — [`ADR-010.md`](ADR-010.md).
- **Decision:** `typescript@^6.0.3` (not 7.0.2), with a no-emit `tsconfig.json` for
  typecheck/editor and a `tsconfig.build.json` that emits `dist/`, as specified in
  `docs/ai-workflow/research-findings.md` §3.
- **Justification:** `typescript-eslint@8.73.0` peers `typescript >=4.8.4 <6.1.0`; 7.0.2 also has
  no programmatic API for type-aware linting. Splitting build config keeps tests out of `dist/`.
- **Alternatives / trade-offs:** TS 7 would require dropping type-aware linting. A single
  emitting config would ship tests in `dist/` or force `exclude` gymnastics. `ts-node` is
  unnecessary given `tsx`.
- **Verification:** Registry peer range and TS 6.0 release notes verified 2026-11-18; the config
  itself is unproven until scaffolding.
- **Affected documents:** `docs/ai-workflow/PROJECT.md`, `docs/coding-standards.md`, `docs/ai-workflow/TASKS.md` §1,
  `docs/ai-workflow/research-findings.md`.
- **Depends on / constrains:** D11 (must stay within the peer range), D16 (`nodenext`),
  D13 (`@types/node` major).

## D11 — ESLint 10 flat config with type-aware linting

- **Status:** **Approved** 2026-11-18 — [`ADR-011.md`](ADR-011.md).
- **Decision:** `eslint@^10.15.0`, `@eslint/js@^10.0.1`, `typescript-eslint@^8.73.0`,
  `globals@^17.14.0`, one `eslint.config.js` using `recommendedTypeChecked` with
  `projectService: true`; script `"lint": "eslint ."`.
- **Justification:** ESLint 10 requires flat config, and type-aware rules catch the SQL/typing
  mistakes this project is most exposed to. These versions are mutually compatible.
- **Alternatives / trade-offs:** `recommended` (non-type-aware) is faster but cannot catch
  floating promises or unsafe `any`. Prettier would add another dependency and is not requested.
- **Verification:** Peer ranges cross-checked; unproven until `npm install` and `eslint .` run.
- **Affected documents:** `docs/ai-workflow/PROJECT.md`, `docs/coding-standards.md`, `docs/ai-workflow/TASKS.md` §1, `AGENTS.md`
  §8.2 script names.
- **Depends on / constrains:** D10 (TS version), D16 (ESM config file), D14.

## D12 — `better-sqlite3` 13 with separate typings

- **Status:** **Approved** 2026-11-18 — [`ADR-012.md`](ADR-012.md).
- **Decision:** `better-sqlite3@^13.2.0` plus `@types/better-sqlite3@^9.6.0`; a thin
  typed wrapper for `pragma()` and `lastInsertRowid` instead of `any` or lint suppressions.
- **Justification:** The package ships prebuilt N-API binaries (`gypfile: false`) and declares
  `engines.node >= 22`, matching D13. It has **no** bundled types, so the DefinitelyTyped package
  is required. Its `pragma()` returns `unknown` and `lastInsertRowid` is `number | bigint`.
- **Alternatives / trade-offs:** `node:sqlite` is built in but still experimental/unstable in the
  target line and its API differs. `sqlite3` is callback-based and needs a native build. An ORM
  adds a large dependency the brief did not request.
- **Verification:** Manifest fields (`engines`, `files`, `gypfile`, absence of `types`) verified
  2026-11-18; the wrapper's sufficiency is unproven until compilation.
- **Affected documents:** `docs/ai-workflow/PROJECT.md`, `docs/database-design.md`, `docs/coding-standards.md`,
  `docs/ai-workflow/TASKS.md` §2.
- **Depends on / constrains:** D13 (Node range), D10 (typings under TS 6), D16 (CJS default
  import under ESM).

## D13 — Node.js 24 LTS runtime policy

- **Status:** **Approved** 2026-11-18 — [`ADR-013.md`](ADR-013.md).
- **Decision:** Target Node.js 24 LTS: `.nvmrc` = `24`,
  `"engines": { "node": "^24.0.0" }`, committed `package-lock.json`, **no** `engine-strict`.
- **Justification:** Node 24 is a supported LTS until 2028-04-30, satisfies
  `better-sqlite3`'s `>=22`, and is the conservative choice for a portfolio project. Without
  `engine-strict`, a newer Node can still run the project locally.
- **Alternatives / trade-offs:** Node 26 is the current Active LTS and is what this sandbox
  provides, but it shortens the support horizon and is newer than most CI images. Pinning 22
  narrows the window unnecessarily.
- **Verification:** Node release schedule (24 Maintenance LTS since 2026-10-20, EOL 2028-04-30);
  `better-sqlite3` engines. The user's machine runs **Node 24.22.1**, which satisfies the target;
  the earlier mismatch came from a cloud sandbox running Node 26.13.0.
- **Affected documents:** `docs/ai-workflow/PROJECT.md`, `docs/ai-workflow/PROJECT_STATE.md` (blocker), `README.md`, `docs/ai-workflow/TASKS.md` §1,
  `docs/ai-workflow/research-findings.md` §1/§6.
- **Depends on / constrains:** D12 (`engines.node >= 22`), D10 (`@types/node` 24.x), D14.

## D14 — Dependency ranges plus a committed lockfile

- **Status:** **Approved** 2026-11-18 — [`ADR-014.md`](ADR-014.md).
- **Decision:** Use caret ranges in `package.json` (`"express": "^5.3.0"`) and commit
  `package-lock.json`; install with `npm ci` when a lockfile exists. No `latest` tags, no exact
  pins.
- **Justification:** Caret ranges express the tested compatibility window while the lockfile
  makes installs reproducible; `npm ci` then installs exactly what was reviewed.
- **Alternatives / trade-offs:** Exact pins are maximally reproducible but make security updates
  manual. `latest` is unreviewable. Floating ranges without a lockfile are not reproducible at
  all.
- **Verification:** npm lockfile v3 behavior; no lockfile exists yet.
- **Affected documents:** `docs/ai-workflow/PROJECT.md`, `README.md` (setup), `docs/ai-workflow/TASKS.md` §1,
  `docs/ai-workflow/research-findings.md` §2.
- **Depends on / constrains:** Every dependency decision (D8, D10–D13) feeds the lockfile.

## D15 — Canonical UTC timestamps and expiry boundary

- **Status:** **Approved** 2026-11-18 — [`ADR-015.md`](ADR-015.md).
- **Decision:** Store `YYYY-MM-DDTHH:mm:ss.sssZ` produced only by `toISOString()` in
  application code, using an injected clock. SQL never calls SQLite date functions. Inputs with
  offsets are normalized to `Z`. A link is expired when `expiresAt <= now`. `expiresAt` must be
  strictly future at creation.
- **Justification:** One fixed-width format is unambiguous, sorts lexicographically, and compares
  correctly as text in SQLite. An injected clock makes boundary tests deterministic.
- **Alternatives / trade-offs:** SQLite `CURRENT_TIMESTAMP` is not millisecond-precise and is
  untestable without freezing time. Epoch integers compare fast but are opaque in the database.
  Storing local time or mixed offsets breaks ordering.
- **Verification:** Documented `toISOString()` output and SQLite text comparison semantics;
  boundary cases enumerated in `docs/testing-strategy.md`. No runtime check yet.
- **Affected documents:** `docs/database-design.md`, `docs/api-specification.md`,
  `docs/testing-strategy.md`, `docs/requirements.md` NFRs.
- **Depends on / constrains:** D2 (text columns), D7 (expiry behavior), D17 (`createdAt` etc. in
  responses). **D15 must precede any D7 implementation.**

## D16 — Native ESM module system

- **Status:** **Approved** 2026-11-18 — [`ADR-016.md`](ADR-016.md).
- **Decision:** `"type": "module"`, `module`/`moduleResolution` = `nodenext`, `.js`
  extensions on relative imports, `import.meta.dirname`, `tsx` for dev, `node dist/server.js`
  for production.
- **Justification:** ESM is the modern default, works with the ESM-only direction of the
  ecosystem, and removes the CJS/ESM dual-package hazard. `nodenext` makes TypeScript enforce
  Node's real resolution rules instead of papering over them.
- **Alternatives / trade-offs:** CommonJS avoids import extensions and lets `require` work
  everywhere, but is legacy and awkward with ESM-only dependencies. Bundling with `tsup`/`esbuild`
  adds a build dependency for no MVP need.
- **Verification:** Node ESM resolution rules and `import.meta.dirname` availability (Node
  ≥20.11). Unproven until build/run.
- **Affected documents:** `docs/coding-standards.md`, `docs/ai-workflow/research-findings.md` §7,
  `docs/ai-workflow/TASKS.md` §1, `docs/ai-workflow/PROJECT_STATE.md`.
- **Depends on / constrains:** D10 (`nodenext`), D12 (`export =` default import), D11 (ESM
  `eslint.config.js`).

## D17 — API response contracts, `PUBLIC_BASE_URL`, Host-header safety

- **Status:** **Approved** 2026-11-18 — [`ADR-017.md`](ADR-017.md). All three sub-options are
  resolved below.
- **Decision:** Adopt the create/statistics bodies, error codes, and security rules in
  `docs/ai-workflow/research-findings.md` §9–10 and `docs/api-specification.md`. `shortUrl` is built only
  from validated `PUBLIC_BASE_URL`; the `Host`/`X-Forwarded-Host` header is never used.
  `PUBLIC_BASE_URL` is validated at startup, defaults to `http://localhost:${PORT}` in
  development, and fails fast in production.
- **Justification:** Clients need a complete, stable body; a header-derived origin allows an
  attacker to mint links pointing at their own host and to poison caches. Startup validation
  converts a misconfiguration into an immediate, obvious failure.
- **Alternatives / trade-offs:** Deriving the origin from `Host` needs no configuration but is
  unsafe. Returning a relative `shortUrl` avoids configuration but is less useful. Warning
  instead of failing in production risks serving wrong links silently.
- **Resolved sub-options (2026-11-18):** (a) stats for an expired link → `200` with
  `isExpired: true`; (b) `isCustom` **is** exposed; (c) production behaviour → **fail fast**.
- **Verification:** `new URL()` normalization, Zod 4 `z.url()`/`z.iso.datetime()` behavior.
  Unproven until implemented and tested with a forged `Host` header.
- **Affected documents:** `docs/api-specification.md`, `docs/security-guidelines.md`,
  `docs/requirements.md` FR-06, `docs/testing-strategy.md`, `docs/ai-workflow/TASKS.md` §7.
- **Depends on / constrains:** D3 (routes/envelope), D15 (timestamps), D7 (expired stats). D17 is
  settled as of 2026-11-18; the create-link controller is gated only by D1–D7.

## D18 — Destination URL format and length limits

- **Status:** **Approved** 2026-11-18 — [`ADR-018.md`](ADR-018.md). Credentials are rejected.
- **Decision:** Accept only absolute `http:`/`https:` URLs, 2048 characters maximum
  measured after trimming, stored as submitted after trim (no rewriting of path/query, no
  trailing-slash normalization). Reject `javascript:`, `data:`, `file:`, protocol-relative, and
  unparseable values with `400 VALIDATION_ERROR`.
- **Justification:** The scheme allow-list is what prevents the shortener from becoming a
  script-injection vector; the 2048 cap bounds storage and header size. Not normalizing keeps
  the redirect faithful to what the user supplied.
- **Alternatives / trade-offs:** Normalizing (lowercasing host, stripping default ports) makes
  deduplication possible but changes user intent. A larger cap accommodates edge cases at the
  cost of header limits. `z.httpUrl()` additionally requires a registrable domain and would
  reject `localhost`, so plain `z.url()` plus explicit checks is used.
- **Resolved sub-option (2026-11-18):** URLs containing embedded credentials
  (`https://user:pass@host/`) **are rejected** with `400 VALIDATION_ERROR`.
- **Verification:** Zod 4 `z.url()` is permissive and does not normalize unless asked; scheme and
  length must be checked explicitly. Not yet implemented.
- **Affected documents:** `docs/requirements.md` (open question resolved as proposal),
  `docs/security-guidelines.md`, `docs/api-specification.md`, `docs/ai-workflow/TASKS.md` §3.
- **Depends on / constrains:** D3 (validation errors), D17 (error codes).

## D19 — Requirement-gap resolutions for the MVP contract

- **Status:** **Approved** 2026-11-19 — [`ADR-019.md`](ADR-019.md).
- **Decision:** The user adopted the proposed default for all four requirements gaps:
  - Unknown body fields are **ignored** (stripped), never rejected; only `url`, `alias`, and
    `expiresAt` are read.
  - Duplicate destinations are **not deduplicated**: every successful create produces a new link
    and code.
  - `GET /health` is **liveness only**: no database probe, no readiness state, no `503`.
  - Body-parser failures (malformed JSON, payload above the default limit) map to
    `400 VALIDATION_ERROR`; the default body limit is kept and no `413` is added.
  - Deletion stays out of the MVP, reconfirming D9.
- **Justification:** Each gap kept acceptance criteria from being settled. The adopted defaults add
  no dependency, route, column, or error code, and keep one error shape and one create path.
- **Alternatives / trade-offs:** Strict rejection of unknown fields, destination deduplication, a
  readiness probe, and `413` were each considered and declined as contract surface a five-hour MVP
  does not need ([`ADR-019.md`](ADR-019.md)).
- **Verification:** Documentation review only; no code exists. The Express `express.json()` default
  limit and `body-parser` failure types must be confirmed when the middleware is written.
- **Affected documents:** `docs/requirements.md` (FR-01, FR-07, FR-08, FR-10 and the gaps section),
  `docs/api-specification.md`, `docs/testing-strategy.md`, `docs/ai-workflow/TASKS.md`, `docs/ai-workflow/PROJECT_STATE.md`,
  `docs/ai-workflow/ROADMAP.md`, `CHANGELOG.md`.
- **Depends on / constrains:** D3 (the `/health` route and the validation envelope), D17 (error
  codes), D18 (create validation). D7 governs whether expired rows are retained.

## D20 — Redirect write path and click-count semantics

- **Status:** **Approved** 2026-11-19 — [`ADR-020.md`](ADR-020.md). Raised by the Prompt 03
  architecture review ([`docs/ai-workflow/architecture-review.md`](../ai-workflow/architecture-review.md) §2).
- **Decision:** the redirect path loads the row to distinguish `404` from `410`, then runs
  the single guarded update
  `UPDATE links SET click_count = click_count + 1, last_clicked_at = @now WHERE code = @code AND
  (expires_at IS NULL OR expires_at > @now)` **without** an explicit `BEGIN`/`COMMIT` transaction,
  treating `changes === 0` as `410`. `HEAD /:code` answers like `GET` but does **not** increment.
- **Justification:** the expiry guard is inside the statement, so the increment is atomic on its
own; with one process and one synchronous `better-sqlite3` connection there is no interleaving to
  guard, and a transaction adds a `BEGIN`/`COMMIT` pair to the hottest path for no correctness gain.
  Express routes `HEAD` to the `GET` handler, so without an explicit rule a monitoring probe would
  add a click.
- **Alternatives / trade-offs:** keep the explicit transaction (harmless, but implies a correctness
  dependency that does not exist and complicates the repository surface); increment on `HEAD`
  (simplest, but makes click counts depend on probe behavior); use one `UPDATE ... RETURNING`
  statement (atomic and single-statement, but cannot distinguish `404` from `410` without a second
  read).
- **Verification:** must be proven by a repository test for the `changes === 0` path and an API test
  asserting a `HEAD` request leaves `click_count` unchanged. Nothing is implemented.
- **Affected documents (synchronized 2026-11-19):** `docs/database-design.md` (query pattern),
  `docs/requirements.md` (FR-04, NFR-06), `docs/api-specification.md` (HEAD behavior),
  `docs/testing-strategy.md` (HEAD case), `docs/ai-workflow/TASKS.md` §4.
- **Depends on / constrains:** D7 (expiry boundary and `410`), D2 (schema), D3 (status codes).

## D21 — `SQLITE_BUSY` handling

- **Status:** **Approved** 2026-11-19 — [`ADR-021.md`](ADR-021.md). Raised by the Prompt 03
  architecture review ([`docs/ai-workflow/architecture-review.md`](../ai-workflow/architecture-review.md) §2).
- **Decision:** do not retry. After `busy_timeout = 5000` elapses, the driver's
  `SQLITE_BUSY` error is handled by the centralized error middleware as `500 INTERNAL_ERROR` with a
  generic message; the detail is logged server-side only.
- **Justification:** in a single-process, single-connection MVP the only source of `SQLITE_BUSY` is
  an external writer holding the lock. A retry loop adds a second failure path and can hold a
  request for about ten seconds to rescue a condition that should not occur; `500` is already in the
  contract and is the honest answer.
- **Alternatives / trade-offs:** retry once (absorbs a transient external lock, doubles worst-case
  latency and code); retry with backoff (more surface than the MVP needs); drop `busy_timeout` to
  fail fast (turns brief external locks into user-visible errors).
- **Verification:** not unit-testable in-process without a second connection; verify by code review
  of the error mapping and, if cheap, by a test that injects a repository throwing a `SQLITE_BUSY`
  error and asserts the `500` envelope shape. Nothing is implemented.
- **Affected documents (synchronized 2026-11-19):** `docs/database-design.md` (open questions),
  `docs/requirements.md` (NFR-06), `docs/ai-workflow/TASKS.md` §2, `docs/testing-strategy.md`.
- **Depends on / constrains:** D2 (connection setup), D3 (error envelope), D12 (driver).

## D22 — `PORT` default and startup parsing

- **Status:** **Approved** 2026-11-19 — [`ADR-022.md`](ADR-022.md). Closes the last unsourced value
  in `docs/requirements.md` FR-11.
- **Decision:** `PORT` is read once at startup, trimmed, and resolved before any listener exists.
  Unset or empty after trimming → **`3000` in every environment** (no `NODE_ENV` branch). When set,
  the trimmed value must contain **only ASCII digits `0`–`9`** and its numeric value must be in
  **1–65535 inclusive**; it is never parsed with a prefix-coercing `parseInt`. **Leading zeros are
  allowed** — `PORT=03000` resolves to port `3000` — while `PORT=0000` is rejected because its
  numeric value is `0`. An invalid value aborts startup before `listen` in every environment, with
  a log line naming `PORT` and the failed rule and no raw value echoed. `PORT` is used only for
  `listen` and for D17's development `PUBLIC_BASE_URL` default; no `HOST` variable is added.
- **Justification:** D17's environment split exists because a wrong origin silently mints broken
  short URLs; a wrong port is immediately unreachable and corrupts nothing, so a second
  `NODE_ENV` branch buys no safety. A single rule keeps `config.ts`, its tests, and the reviewer's
  "install, run, test" path short, and the digit-only rule turns configuration typos into visible
  startup failures instead of a silently different port.
- **Alternatives / trade-offs:** development default with production required (symmetry with D17,
  but a second failure mode for a self-announcing problem); `PORT` required everywhere (explicit,
  but a fresh clone cannot start without `.env`); accepting `0` (convenient, but no test binds a
  port and it breaks the development `PUBLIC_BASE_URL` default); `parseInt` with a range check
  (shorter, but accepts `3000abc` and `3000.9` as `3000`); rejecting leading zeros (stricter, but
  needless when the numeric value is unambiguous).
- **Verification:** documentation review and reasoning only — no `package.json`, `src/`, or test
  exists, so nothing ran. The planned configuration unit tests cover the default, the trim,
  `03000` → `3000`, `00001` → `1`, the range boundaries `1` and `65535`, and the rejections `0`,
  `0000`, `65536`, `-1`, `+3000`, `3000.5`, `1e3`, `abc`, and `3000abc`, plus a startup test
  asserting no listener is created for each rejection.
- **Affected documents (synchronized 2026-11-19):** `docs/requirements.md` (FR-11 and
  AC-11.6 … AC-11.10, gaps section), `docs/security-guidelines.md` (startup configuration),
  `docs/coding-standards.md` (configuration), `docs/testing-strategy.md` (configuration cases),
  `docs/architecture-proposal.md` (§7, §9), `docs/ai-workflow/TASKS.md` §1, `docs/ai-workflow/PROJECT_STATE.md`, `docs/ai-workflow/ROADMAP.md`,
  `README.md`, `CHANGELOG.md`.
- **Depends on / constrains:** D17 (the development `PUBLIC_BASE_URL` default interpolates the
  resolved port), D13 (runtime), D8/NFR-08 (no test binds a port, so `0` has no use).

---

## D23 — Serve Swagger UI from the API

- **Status:** **Proposed** — [`ADR-023.md`](ADR-023.md). The user approved only the
  `swagger-ui-dist` dependency for this task; the ADR itself is not approved.
- **Decision:** Add `swagger-ui-dist@^5.35.1` as the single new runtime dependency and register
  `GET /api/docs`, `GET /api/docs/assets/*` (`express.static`), and `GET /api/openapi.yaml` before
  `GET /:code`. Resolve the spec path from the module URL, not `process.cwd()`; use a relative
  OpenAPI `servers` URL and document browser redirect-following for `GET /{code}`.
- **Justification:** `docs/openapi.yaml` already satisfies FR-12 as a file; a locally served viewer
  makes it usable without a third-party CDN. All non-redirect routes stay under `/api` (D3), so no
  reserved alias or code namespace changes (D6). `5.35.1` is the registry `latest`, has no
  restrictive `engines` field, and contains dependency-free browser assets suitable for Node 24.
- **Alternatives / trade-offs:** `swagger-ui-express` would add a second runtime package and hide
  route/asset control; a CDN page breaks offline; pre-rendered HTML loses "Try it out"; a top-level
  `/docs` would compete with short codes and widen the reserved-alias set. The transitive
  `@scarf/scarf` install-time analytics package is blocked by this environment's install-script
  policy and is not part of the runtime path.
- **Verification:** new integration tests for the HTML page, the spec, the `404` asset fallthrough,
  and unchanged `/health`, redirect, and alias behavior; plus a `dist/server.js` smoke check from a
  different working directory (evidence in `docs/ai-workflow/PROJECT_STATE.md`).
- **Affected documents:** `README.md`, `docs/api-specification.md`, `docs/openapi.yaml`,
  `CHANGELOG.md`, `docs/ai-workflow/TASKS.md`, `docs/ai-workflow/PROJECT_STATE.md`.
- **Depends on / constrains:** D3 and D6 (route order and reserved aliases), D14 (caret range plus
  lockfile), D13 (Node 24 runtime), FR-12 (API documentation). It changes no database, error code,
  or link contract.

---

## Cross-decision sequencing constraints

| Constraint | Why |
|---|---|
| D8 → any API test work | The test harness choice determines every integration test file. |
| D15 → D2/D7 implementation | The timestamp format must exist before SQL or expiry logic is written. |
| D17 → create/stats controllers | Response bodies and base-URL policy are inputs to those handlers. |
| D10 → D11 | Type-aware linting depends on the TypeScript version. |
| D13 → D12, D14 | Runtime policy fixes the driver's engine range and the `@types/node` major. |
| D7 is redirect-only | Stats must stay readable for expired rows; deletion is D9 and out of scope. |
| D20 → redirect implementation | The write path and the `HEAD` rule determine the repository and route shape. |
| D21 → error middleware | The busy-error mapping is part of the single error writer. |
| D22 → D17 development default | The resolved `PORT` is what `http://localhost:${PORT}` interpolates. |
| D23 → D3, D6, D14 | New documentation routes must stay under `/api`, precede `/:code`, avoid reserved aliases, and use a caret range plus lockfile. |
| D4 and D18 together | Only a validated `http(s)` target may ever reach the `Location` header. |

## Consistency check against the earlier nine-item checklist

`docs/architecture-proposal.md` lists nine approval items; they map one-to-one onto D1–D9 with no
contradictions. The checklist item "confirm API routes, error contract, aliases, code generation,
expiry, and click counting" spans D3–D7 and introduces no new decision. The Prompt 03 review found and
fixed one wording conflict *inside* D1 — routes and controllers were both described as validating;
correction C-1 assigns validation to the controller and leaves the layer boundaries intact. No
decision here changes the requested stack (Node.js, TypeScript, Express, SQLite, `better-sqlite3`, Zod, Vitest); D10–D14
only pin versions and configuration.

## Approval record

| Date | Scope | Result | Records |
|---|---|---|---|
| 2026-11-18 | D8–D18 and their sub-options | Approved by the user | `ADR-008.md` … `ADR-018.md` |
| 2026-11-19 | D19: the four requirement gaps; D9 reconfirmed | Approved by the user | `ADR-019.md`; reconfirmation in `ADR-009.md` |
| 2026-11-19 | D1–D7 as recommended, with the `createApp({ db, clock, config })` deps object and five generation attempts in total | Approved by the user | `ADR-001.md` … `ADR-007.md` |
| 2026-11-19 | D20, D21, and corrections C-1 … C-3 from the Prompt 03 architecture review | Approved by the user | `ADR-020.md`, `ADR-021.md`; corrections applied across the design documents |
| 2026-11-19 | D22: the `PORT` default (`3000` in every environment) and its ASCII-digit parsing rule, with leading zeros allowed as insignificant | Approved by the user | `ADR-022.md` |

On 2026-11-19 the Prompt 03 architecture review (`docs/ai-workflow/architecture-review.md`) raised **D20**,
**D21**, and corrections C-1 … C-3. The user approved both decisions and all three corrections the
same day: each decision has an ADR, and the corrections are applied across the design documents.
**D22** was approved later the same day, closing the `PORT` value that FR-11 had carried as an
unapproved proposal, so no requirement now rests on an unsourced default.

The approval covers each entry as written, including the recommendations in the final decision
clarification report: `supertest` (D8), deletion out of scope (D9), the explicit TypeScript 6
configuration (D10), ESLint 10 flat config (D11), `better-sqlite3` with typed helpers (D12),
Node.js 24 LTS (D13), caret ranges with a committed lockfile (D14), canonical UTC timestamps
(D15), native ESM (D16), the API/`PUBLIC_BASE_URL` contract with `200` + `isExpired`, exposed
`isCustom` and production fail-fast (D17), and the scheme/2048/credential rules (D18).

D23 is **not** in the approval record: the user approved only the `swagger-ui-dist` dependency and
requested a draft ADR, which is recorded as **Proposed** in `ADR-023.md` and must remain so until the
user explicitly approves it.

D2's `CHECK` constraint set is resolved in that decision itself: only `click_count >= 0` and
`is_custom IN (0,1)` are adopted, and the extra length/URL/expiry checks are declined
([`ADR-002.md`](ADR-002.md)). D1's deps-object signature and D5's five-attempts-total count were
approved as clarifications on 2026-11-19 and are recorded in `ADR-001.md` and `ADR-005.md`.
