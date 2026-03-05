# Executing Ultra Swaps

Focused skill for building and debugging Jupiter Ultra Swap integrations.

## What does the skill cover

- **SKILL.md** - Deep integration guide for the Ultra Swap order-sign-execute flow

| Topic | Description |
|-------|-------------|
| Order -> Sign -> Execute | Complete TypeScript flow with gotchas and timing constraints |
| Pre-Swap Verification | Token Shield checks and symbol-to-mint resolution |
| Slippage Decision Rules | Pair-type-based slippage recommendations |
| Re-quote Logic | When to re-quote vs execute immediately |
| Gasless Execution | Automatic gasless behavior and minimum thresholds |
| Error Recovery | Full error code table with retry/re-quote decision tree |
| Production Notes | Idempotency, rate limits, and observability checklist |

## When to use this skill

Use when you need to build, debug, or optimize an Ultra Swap flow — the order-sign-execute lifecycle, error recovery, slippage tuning, and re-quote logic.

## License

MIT
