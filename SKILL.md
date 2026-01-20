---
name: jup-skills
description: Comprehensive Jupiter API specification guidelines and best practices from Jupiter Engineering. This skill provides expert guidance for writing, reviewing, and refactoring Jupiter API integrations, ensuring optimal performance, proper error handling, and adherence to recommended patterns. Automatically activates when working with Jupiter API code, swap implementations, or DeFi integrations on Solana.
license: MIT
metadata:
  author: jupiter
  version: "1.0.0"
---

# Jupiter API Skill

Comprehensive Jupiter API specification guidelines and best practices for applications integrating with Jupiter's DeFi infrastructure on Solana. This guide covers 10 API categories including swaps, pricing, token data, limit orders, DCA, portfolio tracking, lending, transfers, and token creation.

## When to use

Reference these guidelines when: 
- Writing new Jupiter API integrations
- Reviewing code for Jupiter API issues
- Refactoring existing Jupiter API code
- Optimizing Jupiter API performance
- Ensuring proper error handling

**Important Migration Notice**: `lite-api.jup.ag` will be deprecated on January 31, 2026. Migrate to `api.jup.ag` with API key authentication. For more information, see [migration](./migration.md)

## Base URLs

| Api Version | URL | Auth Required |
|------|-----|---------------|
| Newest (recommended) | `https://api.jup.ag` | Yes (`x-api-key` header) |
| Lite (deprecated) | `https://lite-api.jup.ag` | No |

## Authentication

All Jupiter APIs require an API key to be passed via the `x-api-key` header (Lite does not require an API key)

### API Key Setup

1. Create account at [portal.jup.ag](https://portal.jup.ag)
2. Generate API key
3. Add to requests: `headers: { 'x-api-key': 'YOUR_API_KEY' }`

**Get the API key at**: https://portal.jup.ag

## Rate Limits

### Fixed Rate Limits

IMPORTANT: Ultra swaps are not included

| Tier | Rate Limit |  Window |
|------|------------|-------|
| **Free** | 60 requests/minute | 60 seconds |
| **Pro I** | 600 requests/minute  | 10-second |
| **Pro II** | 3000 requests/minute  | 10 seconds |
| **Pro III** | 6000 requests/minute | 10 seconds |
| **Pro IV** | 30000 requests/minute | 10 seconds |


Fixed rate limits are distributed in 3 buckets:
- Price API Bucket: dedicated for `/price/v3` endpoint 
- Studio API Bucket: dedicated for `/studio` endpoints 
- Default Bucket: Used for all other endpoints but Price, Studio and Ultra Swaps

### Dynamic Rate Limits (Ultra API only)
Ultra scales with your 24h swap volume - no Pro plan needed.
Base Quota + (Volume × Multiplier) = Your limit

## Latency
### Optimization Tips
- Server Collocation: Deploy services on the same AWS regions as Jupiter's API Gateway
- Avoid complex queries
- Use the most direct endpoint for the data you need

---

## Quick API Overview
### 1. Ultra Swap Order (`ultra-swap-order`) API - Flagship swap API - recommended for most use cases
### 2. Ultra Swap Data Endpoints (`ultra-swap-data`) API - Get data about a token and its mint information, the details about the detailed token holdings of an account or retrieve token information and associated warnings for the specified mint addresses.
### 3. Metis Swap (`metis-swap`) API - Low-level swap API for advanced control 
### 4. Price V3 (`price`) API - Token prices (V2 is deprecated)
### 5. Tokens V2 (`token`) API - Token information and search (V1 is deprecated) 
### 6. Trigger (`trigger`) API -  Limit orders
### 7. Recurring (`recurring`) API - DCA / recurring orders
### 8. Portfolio (`portfolio`) API - Defi wallet positions across protocols
### 9. Lend (`lend`) API -  Lending/earning operations
### 10. Send (`send`) API - Token transfers via invite links
### 11. Studio (`studio`) API - Token creation (Dynamic Bonding Curve)

## How to use

Read individual api endpoint files for detailed explanations and code examples.

```
endpoints/ultra-swap-order.md
endpoints/lend-deposit.md
endpoints/trigger-order.md
```

Read individual api endpoint response types for response examples and field descriptions.

```
responses/ultra-swap-order.md
responses/lend-deposit.md
responses/trigger-order.md
```

Each endpoint file contains:
- Brief explanation of the endpoint functionality
- Workflows using the endpoint
- Tips and tricks for using the endpoint
- Correct code example with explanation
- Additional context and references

---

## Quick Reference: Common Parameter Mistakes

| Parameter | Wrong | Correct |
|-----------|-------|---------|
| Amount | `"1"` (1 token) | `1000000` (1 USDC with 6 decimals) |
| Slippage | `5` (5%) | `500` (500 bps = 5%) |
| SOL mint | Custom address | `So11111111111111111111111111111111111111112` |
| API endpoint | `quote-api.jup.ag` | `api.jup.ag` |

---

## Additional References
- [Jupiter API Environment and Infrastructure](./environment-and-infrastructure.md)
- [Fees and Pricing](./fees-and-pricing.md)
- [Common Errors and Misconceptions](./common-errors.md)
- [Ultra Swap API vs Metis Swap API](./ultra-swap-vs-metis-swap.md)