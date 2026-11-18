# Coding Standards

- Enable TypeScript `strict`.
- Prefer explicit, useful types; avoid `any`.
- Keep functions focused and small.
- Use clear names that describe intent.
- Keep Express-specific objects at the HTTP boundary.
- Keep SQL in repository/database modules.
- Keep business rules in services.
- Validate untrusted request input with Zod.
- Use parameterized SQL statements.
- Use UTC timestamps consistently.
- Do not swallow errors.
- Avoid logging secrets or unnecessary personal data.
- Do not add abstractions without a current use case.
- Do not add dependencies without explaining the benefit and obtaining user approval.
- Format error responses consistently.
- Tests should be deterministic and isolate their database state.
- Comments should explain non-obvious reasoning, not restate code.
