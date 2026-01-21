---
name: integrating-jupiter
description: Provides guidance for integrating with Jupiter API (Ultra Swap, Metis Swap, Lend, Trigger, DCA, Token, Price, Portofolio, Send, Studio). Covers swap workflows, error handling, and recommended patterns. Use when working with Jupiter API, Solana token swaps, JUP integrations, or DeFi trading implementations.
license: MIT
metadata:
  author: jupiter
  version: "1.0.0"
---

# Jupiter API Integration

Guidance for integrating with Jupiter API with proper error handling and recommended patterns.

## When to use

- Writing new Jupiter API integrations
- Reviewing or refactoring Jupiter API code
- Debugging swap failures or API errors
- Optimizing performance or transaction landing

## Quick Start

1. Get API key from [portal.jup.ag](https://portal.jup.ag)
2. Choose API: **Ultra** (recommended) or **Metis** (advanced control)
3. See endpoint files in `endpoints/` for implementation details

For environment details, see [environment-and-infrastructure.md](./about/environment-and-infrastructure.md)

## Latency Tips

- Deploy on AWS regions close to Jupiter's API Gateway
- Avoid complex queries
- Use the most direct endpoint for your needs

---

## API Overview

| API | Description | Use Case |
|-----|-------------|----------|
| **Ultra Swap Order** | Flagship swap API with managed landing | Most applications |
| **Ultra Swap Data** | Token search, holdings, shield warnings | Token information |
| **Metis Swap** | Low-level swap primitive | CPI, custom transactions |
| **Price** | Token prices (use V3) | Pricing data |
| **Tokens** | Token metadata and search (use V2) | Token discovery |
| **Trigger** | Limit orders | Conditional trading |
| **Recurring** | DCA / recurring orders | Automated investing |
| **Portfolio** | DeFi wallet positions | Position tracking |
| **Lend** | Lending/earning operations | Yield strategies |
| **Send** | Token transfers via invite links | Social transfers |
| **Studio** | Token creation (Dynamic Bonding Curve) | Token launches |

### Legacy APIs

- **Price V2**: Deprecated, use V3
- **Tokens V1**: Deprecated, use V2

## How to use

Read endpoint files from `endpoints/` for detailed workflows and code examples:

- `endpoints/ultra-swap-order.md` - Recommended swap implementation
- `endpoints/metis-swap.md` - Advanced swap with full control
- `endpoints/ultra-swap-data.md` - Token search and holdings

For response schemas, see corresponding files in `responses/`.

Each endpoint file contains:
- Endpoint functionality and parameters
- Complete workflows with code examples
- Common mistakes and tips
- Response examples

---

## References

- [Environment and Infrastructure](./about/environment-and-infrastructure.md) - API keys, rate limits, regions
- [Fees and Pricing](./about/fees-and-pricing.md) - Platform fees, integrator fees
- [Common Errors](./about/common-errors.md) - Troubleshooting guide
- [Ultra vs Metis](./ultra/ultra-swap-vs-metis-swap.md) - API comparison