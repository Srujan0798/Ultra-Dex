# Ultra-Dex Security Rules

## Authentication & Secrets

- Never commit secrets or tokens.
- Use environment variables for credentials.
- Validate all user input before use.

## File System Safety

- No `rm -rf` or destructive commands without explicit user confirmation.
- Restrict file access to workspace and temp directories.

## Network Safety

- Use HTTPS for all outbound requests.
- Validate webhook signatures (Stripe, GitHub, etc).
- Implement rate limiting for external APIs.

## Dependency Hygiene

- Avoid untrusted packages.
- Pin critical dependencies where possible.
- Audit vulnerabilities regularly.

## Logging & PII

- Do not log sensitive user data.
- Redact tokens and credentials in error logs.
