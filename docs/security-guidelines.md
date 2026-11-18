# Security Guidelines

This is a minimum checklist for a URL shortener, not a claim of production-grade security.

- Accept only `http:` and `https:` destination URLs.
- Reject malformed URLs and unsupported protocols.
- Never execute or fetch the destination URL on behalf of the user during normal creation.
- Use parameterized SQL.
- Enforce unique short codes in SQLite.
- Avoid open redirect behavior beyond the product's explicit purpose: the redirect target must be the URL stored for that code.
- Do not allow custom aliases to shadow API or health routes.
- Consider rate limiting and abuse prevention as post-MVP work; clearly document the limitation.
- Do not expose stack traces, filesystem paths, SQL details, or secrets in HTTP errors.
- Set sensible input length limits.
- Do not log full destination URLs by default.
- Do not claim SSRF protection is relevant to ordinary redirecting unless the server itself fetches destination URLs.
- Review dependency advisories and lockfile before public release.
