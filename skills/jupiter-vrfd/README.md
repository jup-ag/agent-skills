# Agent Skills

Skills for AI coding agents to integrate with Jupiter Token Verification.

## What does the skill cover

- **SKILL.md** - Main skill file with comprehensive guidance for the Jupiter Token Verification express flow

| Category | Description |
|----------|-------------|
| Check Eligibility | Check if a token is eligible for verification |
| Basic Verification | Submit a free verification request via `POST /basic/submit` |
| Express Verification | Paid verification (1 JUP) via `craft-txn` + `execute` payment flow |
| Token Metadata | Update token metadata (name, symbol, social links, etc.) alongside or independently of verification |
| Data Types | Verification tiers, statuses, reject categories, and Twitter handle format |
| Working Example | Copy-paste-ready TypeScript for the full express flow |

## License

MIT
