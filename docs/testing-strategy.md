# Testing Strategy

## Test layers

1. Unit tests: code generator, validation rules, and service behavior.
2. Repository tests: database persistence, uniqueness, and atomic updates.
3. API integration tests: request/response behavior, redirects, status codes, and error shape.

## Important cases

### Code generation
- Output matches the approved alphabet and length.
- Uses cryptographically secure randomness if that proposal is approved.
- Collision retry behavior is tested.

### Create
- Valid URL.
- Invalid URL.
- Unsupported protocol.
- Too-long URL.
- Custom alias success.
- Alias conflict.
- Invalid and reserved alias.
- Invalid or past expiration.

### Redirect
- Existing active code redirects to the exact destination.
- Correct redirect status and `Location` header.
- Unknown code returns 404.
- Expired code returns 410.
- Successful redirect increments count once.
- Failed redirect does not increment count.

### Statistics
- Correct count and metadata.
- Unknown code behavior.
- Expired-link behavior according to approved contract.

## Test database

Prefer an isolated SQLite `:memory:` database per test or test suite. Ensure tests do not share state unexpectedly.

## Evidence

Report the exact test command and actual result. A test that was written but not run is not a passing test.
