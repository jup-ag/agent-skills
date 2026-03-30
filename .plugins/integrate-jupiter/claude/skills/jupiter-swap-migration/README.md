# Jupiter Swap Migration

Migration guide for upgrading existing Jupiter swap integrations to the unified Swap API v2.

## What does the skill cover

| Migration Path | Description |
|---------------|-------------|
| Ultra → `/order` | Minimal migration — base URL change only, parameters and responses identical |
| Metis → `/build` | Moderate migration — consolidates quote + swap-instructions into single `/build` call with parameter and response mapping |
| Metis → `/order` | Flow change — switch from self-managed RPC execution to Jupiter-managed execution with multi-router competition |

## Examples

Before/after code and mapping tables in `examples/`:
- `ultra-to-order.md` — Ultra base URL swap with new response fields
- `metis-to-build.md` — Parameter mapping, response mapping, V2 instruction differences
- `metis-to-order.md` — Flow change to managed execution with trade-off analysis

## Related skills

- `integrating-jupiter` — Comprehensive Jupiter API integration guide (use for new builds, not migrations)
- `jupiter-lend` — Deep SDK-level integration with `@jup-ag/lend`

## License

MIT
