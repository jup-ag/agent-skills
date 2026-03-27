# Agent Skills

Skills for AI coding agents to work with the public Jupiter Token Verification express flow.

## What this skill covers

- **SKILL.md** - Main guidance for the public express verification flow

| Category | Description |
|----------|-------------|
| Express Eligibility | Check express eligibility via `GET /express/check-eligibility` |
| Craft Payment | Create the unsigned 1 JUP payment transaction via `GET /payments/express/craft-txn` |
| Execute Payment | Submit the signed transaction and verification request via `POST /payments/express/execute` |
| Request Shape | Document the request and response fields used by the 3 public express routes |
| Local Execution | Provide a local TypeScript template for signing and submitting the express transaction |

## Scope boundary

This skill intentionally excludes basic verification, status lookups, metadata fetch helpers, and private or internal routes.

## License

MIT
