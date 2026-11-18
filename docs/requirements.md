# Requirements

## Functional requirements

| ID | Requirement | Acceptance criteria |
|---|---|---|
| FR-01 | Create short link | Valid HTTP(S) URL returns a unique short code and short URL. |
| FR-02 | Custom alias | Optional valid alias can be reserved if not already used. |
| FR-03 | Redirect | Visiting `/:code` redirects to the original URL. |
| FR-04 | Click tracking | Successful redirects increment the total click count once. |
| FR-05 | Expiration | An expired link does not redirect and returns the documented expired-link response. |
| FR-06 | Statistics | API returns link metadata and total click count. |
| FR-07 | Validation | Invalid body, URL, alias, or expiration receives a 4xx response. |
| FR-08 | Consistent errors | Errors use one documented JSON shape. |
| FR-09 | Delete | Not in the initial agreed scope unless explicitly added; initial architecture proposal omitted it. |
| FR-10 | API documentation | Endpoints, payloads, responses, and error cases are documented. |

## Non-functional requirements

- Strict TypeScript.
- Small, understandable codebase.
- SQL uses parameters.
- Unique short codes are enforced by the database.
- Core service behavior is testable without opening a network port.
- Tests can use an isolated in-memory SQLite database.
- No secrets are committed.
- Errors do not expose internal stack traces in client responses.

## Open questions

- Whether deletion belongs in the MVP. The initial project brief listed deletion in an earlier discussion, but the latest Slaq architecture proposal does not include a delete endpoint. Ask the user rather than silently adding it.
- Whether statistics should be available for expired links.
- Whether custom aliases are case-sensitive.
- Exact short-code alphabet and length.
- Exact maximum destination URL length.
