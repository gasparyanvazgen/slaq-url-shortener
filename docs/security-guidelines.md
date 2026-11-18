# Security Guidelines

This is a minimum checklist for a URL shortener, not a claim of production-grade security.
Items marked with a D-ID cite their decision: **D17 and D18 are approved** (2026-11-18). Items
resting on **D2 or D6** are still proposals.

## Input and redirect safety

- Accept only absolute `http:` and `https:` destination URLs. Reject `javascript:`, `data:`,
  `file:`, protocol-relative values, and anything unparseable. (D18)
- Reject URLs longer than 2048 characters after trimming. (D18)
- Reject embedded credentials (`https://user:pass@host/`). (D18, approved 2026-11-18)
- Never execute or fetch the destination URL while creating or redirecting. The service stores and
  returns a string; it does not make outbound requests. SSRF guidance does not apply to that
  behavior — do not claim SSRF protection.
- Avoid open-redirect behavior beyond the product's explicit purpose: the `Location` value must be
  exactly the URL stored for that code, never a query parameter or request-supplied value.
- Do not allow aliases to shadow `/api` or `/health` routes. (D6)

## Base URL and Host-header safety

- `PUBLIC_BASE_URL` is the only source of the origin used to build `shortUrl`. (D17, approved
  2026-11-18)
- **Never** derive the short URL from `Host`, `X-Forwarded-Host`, or forwarded-protocol headers.
  A header-controlled origin lets an attacker mint links pointing at their own host and enables
  cache poisoning.
- Validate at startup: trim, length ≤ 2048, absolute, `http:`/`https:` only, no credentials, no
  path, no query, no fragment; normalize with `new URL(value).origin`.
- Production: fail fast when unset or invalid. Development: default to `http://localhost:${PORT}`.
- Do not log the full `PUBLIC_BASE_URL` if it could contain credentials — it must not, by
  validation, but the rule keeps the check honest.

## Data and SQL

- Use bound parameters everywhere; never interpolate request values into SQL.
- Enforce unique short codes with `UNIQUE(code)` in SQLite, not only with a pre-check.
- Do not use SQLite date functions for application timestamps; they are second-precision and
  bypass the injected clock.
- Keep `click_count` non-negative with a `CHECK` constraint once D2 is approved; D2 is still
  pending.

## Errors and logging

- Do not expose stack traces, filesystem paths, SQL details, or secrets in HTTP errors.
- Map unexpected failures to a generic `500 INTERNAL_ERROR` and log the detail server-side only.
- Do not log full destination URLs by default; log the code and status instead. If a URL must be
  logged, treat it as sensitive.
- Never log `PUBLIC_BASE_URL` credentials, tokens, or environment dumps.

## Responses and caching

- Statistics responses carry `Cache-Control: no-store`, because click counts change per request.
- Do not add caching headers that would make an expired link's redirect cacheable.
- Set `Content-Type: application/json; charset=utf-8` on JSON responses.

## Operational limits (documented, not implemented in the MVP)

- No rate limiting, abuse detection, or authentication in the five-hour MVP. This is a known
  limitation and must be stated in the README.
- Anyone who knows a code can read its statistics; statistics expose the destination URL. This is
  accepted for a portfolio demo and must be documented.
- Review dependency advisories and the lockfile before any public release.
