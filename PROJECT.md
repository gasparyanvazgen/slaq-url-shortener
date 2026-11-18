# Project Brief — Slaq

## Summary

Slaq is a backend-focused URL shortening service built with Node.js and TypeScript. It accepts a long HTTP(S) URL, creates a short code, stores the mapping, and redirects visitors to the original destination.

## Goals

- Demonstrate practical backend engineering skills in a portfolio project.
- Build a small but complete REST API.
- Demonstrate input validation, data integrity, HTTP behavior, testing, and documentation.
- Keep the initial implementation small enough for an approximately five-hour focused build.

## Requested stack

| Area | Technology |
|---|---|
| Runtime | Node.js |
| Language | TypeScript |
| HTTP framework | Express.js |
| Database | SQLite |
| SQLite driver | better-sqlite3 |
| Validation | Zod |
| Tests | Vitest |

Do not add a dependency without explaining its purpose and asking for approval. The architecture proposal suggests `supertest` for API integration tests; this remains a dependency decision requiring approval.

## MVP capabilities

1. Create a short URL using an automatically generated code.
2. Support optional custom aliases.
3. Redirect from `/:code` to the stored destination.
4. Track total clicks.
5. Support optional expiration.
6. Expose basic URL statistics.
7. Validate request data.
8. Return consistent errors.
9. Include automated tests.
10. Document the REST API.

## Explicit initial non-goals

Unless the user changes scope, do not include:
- User accounts or authentication.
- A frontend or dashboard.
- Multi-tenant organization features.
- Per-click analytics history, geolocation, referrers, or time-series charts.
- QR code generation.
- Background job infrastructure.
- Redis, queues, microservices, or cloud infrastructure.
- Production deployment and custom domains.
- Advanced rate limiting or abuse detection in the five-hour MVP.

## Product and engineering principles

- Correctness over feature count.
- Simple, understandable architecture.
- Database constraints enforce data integrity.
- Tests cover important success and failure paths.
- The README clearly states limitations and future improvements.
- A portfolio reviewer should be able to install, run, test, and understand the service.

## Timebox

Target approximately five hours for the first MVP. The timebox is a prioritization constraint, not a reason to skip correctness or claim unverified behavior. If time is running out, defer optional work and report remaining gaps.
