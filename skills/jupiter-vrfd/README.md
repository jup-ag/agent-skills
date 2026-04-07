# Jupiter VRFD Agent Skill

Skills for AI coding agents to work with the public Jupiter Token Verification and metadata submission flow.

## What does the skill cover

- **SKILL.md** - Main guidance for the public verification and metadata submission flow

| Category        | Description                                                                                                     |
| --------------- | --------------------------------------------------------------------------------------------------------------- |
| Eligibility     | Check eligibility via `GET /tokens/v2/verify/express/check-eligibility`                                         |
| Craft Payment   | Create the unsigned 1000 JUP payment transaction via `GET /tokens/v2/verify/express/craft-txn`                  |
| Execute Payment | Submit the signed transaction and verification or metadata request via `POST /tokens/v2/verify/express/execute` |
| Request Shape   | Document the request and response fields used by the 3 public submission routes                                 |
| Local Execution | Provide a local ESM JavaScript template, with TypeScript-compatible fallback guidance                           |

## Scope boundary

This skill intentionally excludes status lookups, metadata fetch helpers, private or internal routes, and alternate submission paths.

## License

MIT
