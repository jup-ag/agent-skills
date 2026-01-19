---
name: jup-skills
description: Comprehensive Jupiter API specification guidelines and best practices from Jupiter Engineering. This skill provides expert guidance for writing, reviewing, and refactoring Jupiter API integrations, ensuring optimal performance, proper error handling, and adherence to recommended patterns. Automatically activates when working with Jupiter API code, swap implementations, or DeFi integrations on Solana.
license: MIT
metadata:
  author: jupiter
  version: "1.0.0"
---

# Jupiter API best practices

Comprehensive Jupiter API specification guidelines and best practices for applications integrating with Jupiter's DeFi infrastructure on Solana. This guide covers 10 API categories including swaps, pricing, token data, limit orders, DCA, portfolio tracking, lending, transfers, and token creation.

## When to Apply

Reference these guidelines when: 
- Writing new Jupiter API integrations
- Reviewing code for Jupiter API issues
- Refactoring existing Jupiter API code
- Optimizing Jupiter API performance
- Ensuring proper error handling


## Prerequisites
### Authentication

All Jupiter APIs require an API key passed via the `x-api-key` header.

```
x-api-key: YOUR_API_KEY
```

**Get the API key at**: https://portal.jup.ag

### Rate Limits

| Tier | Rate Limit | Notes |
|------|------------|-------|
| **Free** | 60 requests/minute | 60-second sliding window |
| **Pro** | 100-5000 requests/10 seconds | Based on tier purchased |
| **Ultra** | Dynamic | Scales with executed swap volume |

---

## Quick API Overview
### 1. Ultra Swap API - Flagship swap API - recommended for most use cases
### 2. Metis Swap API - Low-level swap API for advanced control 
### 3. Price V3 API - Token prices (V2 is deprecated)
### 4. Tokens V2 API - Token information and search (V1 is deprecated) 
### 5. Trigger (Limit Order)API -  Limit orders
### 6. Recurring (DCA Order) API - DCA / recurring orders
### 7. Portfolio API - Defi wallet positions across protocols
### 8. Lend API -  Lending/earning operations
### 9. Send API - Token transfers via invite links
### 10. Studio API - Token creation (Dynamic Bonding Curve)

## How to use
Read invidual api endpoint files for detailed explanations and code examples.

```
endpoint/ultra-swap-order.md
endpoint/lend-deposit.md
endpoint/trigger-order.md
```

Each endpoint file contains:
- Brief explanation of the endpoint functionality
- Tips and tricks for using the endpoint
- Correct code example with explanation
- Additional context and references

## Additional Features
- Jupiter Lock 
- Jupiter Routing Engines