---
name: jupiter-swap-migration
description: Migration guide from Jupiter Metis (v1) or Ultra to Swap API v2. Use when migrating existing Jupiter swap integrations, updating base URLs, or transitioning from quote+swap-instructions to the unified build endpoint.
license: MIT
metadata:
  author: jup-ag
  version: "1.0.0"
tags:
  - jupiter
  - swap-migration
  - metis
  - ultra
  - swap-v2
  - jup-ag
---

# Jupiter Swap Migration Guide

Migrate existing Jupiter swap integrations from **Metis (v1)** or **Ultra** to the unified **Swap API v2**.

**Target Base URL**: `https://api.jup.ag/swap/v2`
**Auth**: `x-api-key` from [portal.jup.ag](https://portal.jup.ag/) (unchanged)

## Use/Do Not Use

Use when:
- Migrating code that calls `api.jup.ag/swap/v1/quote`, `api.jup.ag/swap/v1/swap-instructions`, or `ultra-api.jup.ag`.
- Updating Jupiter swap endpoints to v2.
- Switching from Metis two-step flow to the unified `/build` or `/order` endpoint.

Do not use when:
- Building a new Jupiter integration from scratch (use `integrating-jupiter` skill instead).
- Working with non-swap Jupiter APIs (Lend, Trigger, Recurring, etc.).

**Triggers**: `migrate swap`, `ultra migration`, `metis migration`, `swap v1 to v2`, `v1 to v2`, `upgrade jupiter`, `swap-instructions deprecated`, `deprecated swap`, `old jupiter api`, `swap upgrade`, `update swap api`, `quote endpoint deprecated`, `swap stopped working`, `api changed`, `breaking change`, `swap broken`, `old method`, `old way`, `previous api`, `was using`, `endpoint not found`, `ExactOut removed`, `swapMode removed`, `userPublicKey`, `parameter rename`, `addressLookupTable`, `response format changed`

---

## Migration Paths

| Source | Target | Effort | When to choose |
|--------|--------|--------|----------------|
| Ultra → `/order` | `GET /swap/v2/order` + `POST /swap/v2/execute` | Minimal (URL change only) | Default for Ultra users |
| Metis → `/build` | `GET /swap/v2/build` | Moderate (parameter + response mapping) | Need transaction composability |
| Metis → `/order` | `GET /swap/v2/order` + `POST /swap/v2/execute` | Moderate (flow change) | Don't need tx modification, want managed execution |

## Path Details

Each path has a dedicated example with before/after code, parameter mappings, and response changes:

- [Path 1: Ultra → `/order`](./examples/ultra-to-order.md) — Minimal migration, base URL change only
- [Path 2: Metis → `/build`](./examples/metis-to-build.md) — Consolidates 2 calls into 1, parameter and response mapping
- [Path 3: Metis → `/order`](./examples/metis-to-order.md) — Flow change to managed execution with multi-router competition

---

## Post-Migration Checklist

1. **URL audit**: Search codebase for `ultra-api.jup.ag`, `/ultra/v1/`, `/swap/v1/quote`, `/swap/v1/swap-instructions` — all should be replaced
2. **Parameter rename**: `userPublicKey` → `taker` (for `/build` path)
3. **`swapMode` removal**: V2 only supports `ExactIn`. If using `ExactOut`, redesign the flow — this mode is no longer available
4. **`slippageBps` default**: V2 defaults to 50 bps if omitted. Verify your integration handles this correctly if you previously relied on a different default
5. **Response field names**: Verify your code uses `inputAmountResult`/`outputAmountResult` for the `/execute` response (the canonical v2 field names)
6. **ALT handling**: If using `/build`, switch from `addressLookupTableAddresses` (array) to `addressesByLookupTableAddress` (object) — remove RPC ALT resolution code
7. **Fee event parsing**: V2 instructions don't emit fee events — update any transaction parser that depends on them
8. **Route plan format**: If parsing route plans, use `bps` field (canonical) instead of `percent`
9. **Error codes**: Update error handling to match [Swap v2 error codes](https://dev.jup.ag/docs/swap/v2/order-and-execute.md)
10. **Test**: Run end-to-end swap on devnet/mainnet with small amount to verify

## Sunset

Remove this skill once Jupiter decommissions the v1 (`/swap/v1`) endpoints and the Ultra (`ultra-api.jup.ag`) domain. At that point all integrations will already be on v2.

## References

- [Migration guide](https://dev.jup.ag/docs/swap/v2/migration.md)
- [Order & Execute](https://dev.jup.ag/docs/swap/v2/order-and-execute.md)
- [Build](https://dev.jup.ag/docs/swap/v2/build/index.md)
- [Fees](https://dev.jup.ag/docs/swap/v2/fees.md)
- [Routing](https://dev.jup.ag/docs/swap/v2/routing.md)
- [OpenAPI spec](https://dev.jup.ag/openapi-spec/swap/v2/swap.yaml)
