# Agent Skills

Skills for AI coding agents in the Jupiter ecosystem.

## What does the skill cover

- **SKILL.md** - Main skill file with comprehensive integration guidance for all Jupiter APIs

| Category | Description |
|----------|-------------|
| Swap API v2 | Flagship swap API with managed transaction landing, gasless support, and multi-router competition — recommended for most use cases |
| Lend | Deposit and withdraw assets to earn yield via `@jup-ag/lend` SDK |
| Perps | Perpetual futures trading (on-chain Anchor program, REST API WIP) |
| Trigger | Limit orders with price conditions |
| Recurring | Dollar-cost averaging (DCA) strategies |
| Token | Token metadata, search, shield warnings, and organic scoring |
| Price | Real-time and historical pricing (v3) |
| Portfolio | DeFi wallet positions across protocols |
| Prediction Markets | Binary outcome markets with JupUSD |
| Send | Token transfers via invite links |
| Studio | Token creation with Dynamic Bonding Curves |
| Lock | Token vesting and lock (on-chain program) |
| Routing | DEX aggregation (Iris), RFQ (JupiterZ), and market listing |

## Examples

Production-ready code snippets in `examples/`:
- `swap.md` — Swap order → sign → execute → confirm
- `lend.md` — USDC deposit into Jupiter Lend
- `trigger.md` — Create and execute a limit order
- `price.md` — Multi-token price lookup with confidence filtering

## Related skills

- `jupiter-swap-migration` — Migration guide from Metis (v1) or Ultra to Swap API v2
- `jupiter-lend` — Deep SDK-level integration with `@jup-ag/lend`

## License

MIT
