---
name: integrating-jupiter
description: Comprehensive Jupiter API specification guidelines and best practices from Jupiter Engineering. This skill provides expert guidance for writing, reviewing, and refactoring Jupiter API and SDK integrations (Ultra API, Jupiter Lend SDK, Jupiter Lend, etc) with proper error handling, and adherence to recommended patterns. Automatically activates when working with Jupiter API code, swap implementations
license: MIT
metadata:
  author: jupiter
  version: "1.0.0"
---

# Jupiter API Integration

Comprehensive Jupiter API specification guidelines and best practices from Jupiter Engineering. This skill provides expert guidance for writing, reviewing, and refactoring Jupiter API and SDK integrations (Ultra API, Jupiter Lend SDK, Jupiter Lend, etc) with proper error handling, and adherence to recommended patterns. Automatically activates when working with Jupiter API code, swap implementations

## When to use

Reference these guidelines when: 
- Writing new Jupiter API integrations
- Reviewing code for Jupiter API issues
- Refactoring existing Jupiter API code
- Optimizing Jupiter API performance
- Ensuring proper error handling

**Important Migration Notice**: `lite-api.jup.ag` will be deprecated on January 31, 2026. Migrate to `api.jup.ag` with API key authentication. For more information, see [migration](./about/migration.md)

For environment and infrastructure details, see [Jupiter API Environment and Infrastructure](./about/environment-and-infrastructure.md)

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

Read individual api endpoint files from `endpoints/` for detailed explanations and code examples.

```
endpoints/ultra-swap-order.md
endpoints/lend-deposit.md
endpoints/trigger-order.md
```

For response examples and field descriptions, refer to the corresponding files in `responses/`.

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

## Additional References
- [Jupiter API Environment and Infrastructure](./about/environment-and-infrastructure.md)
- [Fees and Pricing](./about/fees-and-pricing.md)
- [Common Errors and Misconceptions](./about/common-errors.md)
- [Ultra Swap API vs Metis Swap API](./about/ultra-swap-vs-metis-swap.md)