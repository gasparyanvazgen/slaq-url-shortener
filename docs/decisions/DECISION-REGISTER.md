# Slaq Decision Register

> Single source of truth for technical decisions. One entry per decision; no duplicates.
> An ADR under `docs/decisions/ADR-NNN.md` is created only when the user approves the
> corresponding `D-NNN`, and reuses the same number.

- **Register updated:** 2026-11-18 (approval synchronization)
- **Decisions:** D1–D18
- **Approved by the user:** **D8–D18** on 2026-11-18 — recorded as `ADR-008` … `ADR-018`
- **Pending User Approval:** **D1–D7**
- **Decision owner:** User (`AGENTS.md` §3)

## Status vocabulary

| Status | Meaning |
|---|---|
| **Proposed** | An idea captured without enough verified detail to act on. |
| **Pending User Approval** | Fully specified and technically verified; waiting for the user's explicit yes/no/amendment. |
| **Approved** | Explicitly approved by the user. Recorded as an ADR. May be implemented. |
| **Rejected** | Explicitly declined by the user. Kept for traceability. |
| **Superseded** | Replaced by a later decision; the replacement is named. |

D8–D18 are **Approved** by the user on 2026-11-18 and each has an ADR. D1–D7 remain **Pending User
Approval**: nothing in this register, and no AI recommendation, approves them. No entry is
**Rejected** or **Superseded**.

## Status summary

| ID | Decision | Status |
|---|---|---|
| D1 | Layered architecture and feature-module layout | Pending User Approval |
| D2 | `links` table schema and schema bootstrap | Pending User Approval |
| D3 | API routes and error envelope | Pending User Approval |
| D4 | Redirect status `302` | Pending User Approval |
| D5 | Short-code generation (7-char Base62, 5 retries) | Pending User Approval |
| D6 | Alias rules and reserved names | Pending User Approval |
| D7 | Expiration behavior (`410`, lazy, rows retained) | Pending User Approval |
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

D1–D9 come from the nine-item approval checklist in `docs/architecture-proposal.md`.
D10–D18 are the toolchain and contract findings verified in `docs/research-findings.md`.

---

## D1 — Layered architecture and feature-module layout

- **Status:** Pending User Approval
- **Proposed decision:** Adopt routes → controllers → services → repository inside a single
  feature module `src/modules/links/`, with `createApp(deps)` and `createLinkService(repo)`
  factories. Controllers never run SQL; services never touch `req`/`res`; SQL lives only in
  repositories.
- **Justification:** Four small layers are enough to separate HTTP, rules, and persistence while
  remaining readable in a five-hour MVP. Factories make the service testable without a port.
- **Alternatives / trade-offs:** A single `app.ts` with inline handlers is faster to write but
  mixes concerns and weakens tests. Global `controllers/`+`services/` folders add navigation cost
  for one feature.
- **Verification:** Structural review only; nothing to install. Matches `AGENTS.md` §4.
- **Affected documents:** `docs/architecture-proposal.md` §1–2, `ROADMAP.md` Phase 3–4,
  `docs/testing-strategy.md`, `TASKS.md`.
- **Depends on / constrains:** Nothing. Constrains D10 (path aliases are unnecessary), D16
  (import extensions).

## D2 — `links` table schema and schema bootstrap

- **Status:** Pending User Approval — includes the `CHECK` constraint set. The refined set in the
  final decision clarification report has **not** been approved and is not in force.
- **Proposed decision:** One table:

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

  Generated codes and custom aliases share one namespace through `UNIQUE(code)`. Schema is
  created idempotently at startup; **no** migration framework in the MVP. Recommended addition:
  `CHECK (click_count >= 0)` and `CHECK (is_custom IN (0,1))`. `expires_at` is **not** indexed
  (lazy expiry, no range queries).
- **Justification:** `UNIQUE(code)` is the only integrity rule that must survive concurrency;
  the rest are cheap guards. A migration framework is unjustified for an unshipped schema.
- **Alternatives / trade-offs:** Separate alias/code columns would double the lookup logic.
  `INTEGER` epoch timestamps would compare quickly but lose readability; canonical ISO text is
  readable and lexicographically ordered. A migration tool adds a dependency and process for no
  current benefit.
- **Verification:** SQLite `UNIQUE`/`CHECK` semantics; `better-sqlite3` executes DDL via `exec`.
  Not yet executed — no database exists.
- **Affected documents:** `docs/architecture-proposal.md` §3, `docs/database-design.md`,
  `docs/testing-strategy.md`, `TASKS.md` §2.
- **Depends on / constrains:** D15 (timestamp format), D12 (driver), D13 (runtime). D7 relies on
  expired rows being retained.

## D3 — API routes and error envelope

- **Status:** Pending User Approval
- **Proposed decision:** `POST /api/links`, `GET /api/links/:code/stats`, `GET /:code`,
  `GET /health`. Body fields `url`, `alias`, `expiresAt`. Errors are always
  `{ "error": { "code", "message", "details"? } }`.
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

- **Status:** Pending User Approval
- **Proposed decision:** `GET /:code` answers `302` with a `Location` header.
- **Justification:** A temporary redirect keeps repeat visits hitting the server so clicks stay
  countable. A permanent `301` would be cached by browsers and silently stop counting.
- **Alternatives / trade-offs:** `307` preserves the method, which is wrong for a browser
  navigation and offers no benefit here. `301` improves latency at the cost of analytics
  correctness.
- **Verification:** Express `res.redirect(302, url)` semantics; no runtime check yet.
- **Affected documents:** `docs/api-specification.md`, `docs/architecture-proposal.md` §5.2,
  `docs/requirements.md` FR-03/FR-04, `TASKS.md` §4.
- **Depends on / constrains:** D7 (expired links must not redirect), D18 (only validated targets
  are ever placed in `Location`).

## D5 — Short-code generation

- **Status:** Pending User Approval
- **Proposed decision:** Random 7-character Base62 codes from a 62-symbol alphabet, generated
  with `crypto.randomInt` (never `Math.random`), retrying on collision up to five times, then
  failing with `INTERNAL_ERROR`.
- **Justification:** 62⁷ ≈ 3.5 × 10¹² codes makes collisions negligible at MVP scale, and
  `randomInt` is unbiased and cryptographically strong. Five retries absorbs the residual case
  without a loop that can spin forever.
- **Alternatives / trade-offs:** Sequential IDs leak volume and enable enumeration. Hash-derived
  codes need truncation and still collide. Longer codes hurt usability; shorter ones raise retry
  pressure.
- **Verification:** `node:crypto.randomInt(max)` is uniform over `[0, max)`; no code exists yet.
- **Affected documents:** `docs/architecture-proposal.md` §5.1, `docs/testing-strategy.md`
  (generator + collision cases), `TASKS.md` §3.
- **Depends on / constrains:** D6 (aliases share the namespace), D2 (`UNIQUE(code)` is the real
  guarantee).

## D6 — Alias rules and reserved names

- **Status:** Pending User Approval
- **Proposed decision:** Aliases are 3–32 characters, `[A-Za-z0-9_-]`, **case-sensitive**, and
  must not equal a reserved name. Reserved: `api`, `health`. Alias length/charset failures return
  `400 VALIDATION_ERROR`; a reserved name returns `400 RESERVED_ALIAS`; an existing alias returns
  `409 ALIAS_TAKEN`.
- **Justification:** The charset is URL-safe without encoding, and case sensitivity matches the
  case-sensitive `UNIQUE` index, avoiding a mismatch between validation and storage. Reserving
  `api`/`health` prevents alias shadowing of real routes.
- **Alternatives / trade-offs:** Case-insensitive aliases would need `COLLATE NOCASE` and a
  documented canonical form. Allowing dots or slashes creates routing ambiguity. A longer
  reserved list is safer if new top-level routes are added later.
- **Verification:** Regex and length rules are pure functions; `UNIQUE` is the storage guarantee.
- **Affected documents:** `docs/architecture-proposal.md` §5.4, `docs/requirements.md`
  (open question resolved as a proposal), `docs/api-specification.md`, `TASKS.md` §5.
- **Depends on / constrains:** D3 (route names), D5 (shared namespace), D17 (error codes).

## D7 — Expiration behavior

- **Status:** Pending User Approval
- **Proposed decision:** Expiration is evaluated lazily on redirect and on stats. An expired code
  returns `410 LINK_EXPIRED` on redirect and does **not** increment the click count. Expired rows
  are retained so statistics remain available. `expiresAt` must be in the future at creation.
- **Justification:** Lazy evaluation needs no scheduler, background job, or extra dependency, and
  retention keeps the click history of a campaign readable after it ends.
- **Alternatives / trade-offs:** A cleanup job deletes rows and breaks stats history. A `404` for
  expired links hides the reason and is indistinguishable from a typo. Returning `410` is
  explicit but reveals that a code once existed — acceptable for this product.
- **Verification:** Boundary semantics fixed by D15; no runtime check yet.
- **Affected documents:** `docs/architecture-proposal.md` §5.3, `docs/requirements.md` FR-05,
  `docs/api-specification.md`, `docs/testing-strategy.md`, `TASKS.md` §6–7.
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
- **Affected documents:** `PROJECT.md` (dependency note), `docs/architecture-proposal.md` §6,
  `docs/testing-strategy.md`, `TASKS.md` Gate 0.
- **Depends on / constrains:** D1 (`createApp` must be importable without listening), D14
  (lockfile records the resolution).

## D9 — Deletion in the MVP

- **Status:** **Approved** 2026-11-18 — [`ADR-009.md`](ADR-009.md). Deletion stays out of scope.
- **Decision:** **Out of scope** for the MVP. No `DELETE` endpoint and no `deleted_at`
  column.
- **Justification:** Nothing in the ten MVP capabilities requires deletion, and it introduces
  authorization questions (anyone could delete any link) that the project explicitly excludes.
- **Alternatives / trade-offs:** Adding `DELETE /api/links/:code` costs an endpoint, a test file,
  and an unauthenticated destructive capability. Soft delete complicates every read path.
- **Verification:** Scope review against `PROJECT.md` non-goals; no code involved.
- **Affected documents:** `docs/requirements.md` FR-09, `PROJECT.md`, `docs/api-specification.md`,
  `TASKS.md`.
- **Depends on / constrains:** Nothing.

## D10 — TypeScript 6.0.3 and tsconfig layout

- **Status:** **Approved** 2026-11-18 — [`ADR-010.md`](ADR-010.md).
- **Decision:** `typescript@^6.0.3` (not 7.0.2), with a no-emit `tsconfig.json` for
  typecheck/editor and a `tsconfig.build.json` that emits `dist/`, as specified in
  `docs/research-findings.md` §3.
- **Justification:** `typescript-eslint@8.73.0` peers `typescript >=4.8.4 <6.1.0`; 7.0.2 also has
  no programmatic API for type-aware linting. Splitting build config keeps tests out of `dist/`.
- **Alternatives / trade-offs:** TS 7 would require dropping type-aware linting. A single
  emitting config would ship tests in `dist/` or force `exclude` gymnastics. `ts-node` is
  unnecessary given `tsx`.
- **Verification:** Registry peer range and TS 6.0 release notes verified 2026-11-18; the config
  itself is unproven until scaffolding.
- **Affected documents:** `PROJECT.md`, `docs/coding-standards.md`, `TASKS.md` §1,
  `docs/research-findings.md`.
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
- **Affected documents:** `PROJECT.md`, `docs/coding-standards.md`, `TASKS.md` §1, `AGENTS.md`
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
- **Affected documents:** `PROJECT.md`, `docs/database-design.md`, `docs/coding-standards.md`,
  `TASKS.md` §2.
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
- **Affected documents:** `PROJECT.md`, `PROJECT_STATE.md` (blocker), `README.md`, `TASKS.md` §1,
  `docs/research-findings.md` §1/§6.
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
- **Affected documents:** `PROJECT.md`, `README.md` (setup), `TASKS.md` §1,
  `docs/research-findings.md` §2.
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
- **Affected documents:** `docs/coding-standards.md`, `docs/research-findings.md` §7,
  `TASKS.md` §1, `PROJECT_STATE.md`.
- **Depends on / constrains:** D10 (`nodenext`), D12 (`export =` default import), D11 (ESM
  `eslint.config.js`).

## D17 — API response contracts, `PUBLIC_BASE_URL`, Host-header safety

- **Status:** **Approved** 2026-11-18 — [`ADR-017.md`](ADR-017.md). All three sub-options are
  resolved below.
- **Decision:** Adopt the create/statistics bodies, error codes, and security rules in
  `docs/research-findings.md` §9–10 and `docs/api-specification.md`. `shortUrl` is built only
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
  `docs/requirements.md` FR-06, `docs/testing-strategy.md`, `TASKS.md` §7.
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
  `docs/security-guidelines.md`, `docs/api-specification.md`, `TASKS.md` §3.
- **Depends on / constrains:** D3 (validation errors), D17 (error codes).

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
| D4 and D18 together | Only a validated `http(s)` target may ever reach the `Location` header. |

## Consistency check against the earlier nine-item checklist

`docs/architecture-proposal.md` lists nine approval items; they map one-to-one onto D1–D9 with no
contradictions. The checklist item "confirm API routes, error contract, aliases, code generation,
expiry, and click counting" spans D3–D7 and introduces no new decision. No decision here changes
the requested stack (Node.js, TypeScript, Express, SQLite, `better-sqlite3`, Zod, Vitest); D10–D14
only pin versions and configuration.

## Approval record

| Date | Scope | Result | Records |
|---|---|---|---|
| 2026-11-18 | D8–D18 and their sub-options | Approved by the user | `ADR-008.md` … `ADR-018.md` |
| — | D1–D7 | Still **Pending User Approval** | no ADR yet |

The approval covers each entry as written, including the recommendations in the final decision
clarification report: `supertest` (D8), deletion out of scope (D9), the explicit TypeScript 6
configuration (D10), ESLint 10 flat config (D11), `better-sqlite3` with typed helpers (D12),
Node.js 24 LTS (D13), caret ranges with a committed lockfile (D14), canonical UTC timestamps
(D15), native ESM (D16), the API/`PUBLIC_BASE_URL` contract with `200` + `isExpired`, exposed
`isCustom` and production fail-fast (D17), and the scheme/2048/credential rules (D18).

D2's refined `CHECK` constraint set was evaluated in the same clarification report but belongs to
D2, which is outside the approved range. It remains **Pending User Approval** together with D1–D7.
