---
title: Ultra Swap Data API
description: Jupiter API Data Endpoints providing information on wallet holdings, token information and metadata and associated warnings for specified mint addresses.
baseUrl: https://api.jup.ag/ultra/v1
notes:
  - See `../responses/ultra-swap-data.md` for response examples.
---

## Table of Contents

- [Ultra Swap Data API](#ultra-swap-data-api)
  - [Endpoints](#endpoints)
  - [1. GET /search](#1-get-search)
  - [2. GET /shield](#2-get-shield)
  - [3. GET /holdings/{address}](#3-get-holdingsaddress)
  - [4. GET /routers](#4-get-routers)
  - [Workflows](#workflows)
    - [Complete Flow: Validate Token Before Swap](#complete-flow-validate-token-before-swap)
    - [Complete Flow: Check Available Routers](#complete-flow-check-available-routers)
  - [Tips and Best Practices](#tips-and-best-practices)
    - [General](#general)
  - [References](#references)

---


# Ultra Swap Data API

Jupiter API Data Endpoints providing information on wallet holdings, token information and metadata and associated warnings for specified mint addresses.

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/search` | Search for a token by symbol, name, or mint address |
| GET | `/shield` | Retrieve token information and associated warnings for the specified mint addresses |
| GET | `/holdings` | Get the detailed token holdings of an account |
| GET | `/mint` | Get token mint information |
| GET | `/fees` | Get fee info for a token pair |


---


## 1. GET /search

Returns useful mint information for search results by token symbol, name or mint address.
```
GET /ultra/v1/search
```

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Token symbol, name or mint address for query by . Acepts up to 100 tokens in a single request using a comma separated list.|

See [Complete Workflows](#workflows) for full integration examples.

## 2. GET /shield

Returns token warnings for specified mint addresses to help identify potentially malicious tokens before transacting.

```
GET /ultra/v1/shield
```

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `mints` | string | Yes | Mint addresses to get warnings for.

See [Complete Workflows](#workflows) for full integration examples.

## 3. GET /holdings/{address}

Request for token balances of an account including token account information.

```
GET /ultra/v1/holdings/{address}
```

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `address` | string | Yes | Solana wallet address to get holdings for. |

See [Complete Workflows](#workflows) for full integration examples.

## 4. GET /routers

Request for the list of routers available in the routing engine of Ultra, which is Juno (Jupiter's liquidity engine).

```
GET /ultra/v1/routers
```

**Query Parameters**: None

See [Complete Workflows](#workflows) for full integration examples.

---

## Workflows
### Complete Flow: Validate Token Before Swap

```typescript
import { Keypair, VersionedTransaction } from '@solana/web3.js';

async function safeSwap(mint: string, outputMint: string, wallet: Keypair, amount: string) {
  // Step 1: Check token warnings
  const shield = await fetch(
    `https://api.jup.ag/ultra/v1/shield?mints=${mint}`,
    { headers: { 'x-api-key': API_KEY } }
  ).then(r => r.json());

  const warnings = shield.warnings[mint];
  if (warnings.some(w => w.severity === 'critical')) {
    throw new Error('Token has critical warnings');
  }

  // Step 2: Check wallet has sufficient balance
  const holdings = await fetch(
    `https://api.jup.ag/ultra/v1/holdings/${wallet.publicKey}`,
    { headers: { 'x-api-key': API_KEY } }
  ).then(r => r.json());

  if (holdings.tokens.find(t => t.mint === mint)?.amount < amount) {
    throw new Error('Insufficient balance');
  }

  // Step 3: Get order
  const order = await fetch(
    `https://api.jup.ag/ultra/v1/order?` +
    `inputMint=${mint}&outputMint=${outputMint}` +
    `&amount=${amount}&taker=${wallet.publicKey}`,
    { headers: { 'x-api-key': API_KEY } }
  ).then(r => r.json());

  // Step 4: Sign
  const tx = VersionedTransaction.deserialize(
    Buffer.from(order.transaction, 'base64')
  );
  tx.sign([wallet]);
  const signed = Buffer.from(tx.serialize()).toString('base64');

  // Step 5: Execute
  const result = await fetch('https://api.jup.ag/ultra/v1/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
    body: JSON.stringify({
      signedTransaction: signed,
      requestId: order.requestId,
    }),
  }).then(r => r.json());

  return result;
}
```

### Complete Flow: Check Available Routers

```typescript
async function displayAvailableRouters() {
  // Step 1: Get list of available routers
  const routers = await fetch(
    'https://api.jup.ag/ultra/v1/routers',
    { headers: { 'x-api-key': API_KEY } }
  ).then(r => r.json());

  console.log('Available routers:', routers);
  
  // Example response structure:
  // {
  //   "routers": [
  //     {
  //       "id": "iris",
  //       "name": "Iris",
  //       "description": "Jupiter's aggregator routing engine"
  //     },
  //     {
  //       "id": "jupiterz",
  //       "name": "JupiterZ",
  //       "description": "RFQ-based routing"
  //     },
  //     {
  //       "id": "dflow",
  //       "name": "DFlow",
  //       "description": "Order flow auction routing"
  //     }
  //   ]
  // }
  
  return routers;
}

// Use case: Display routing options to users
async function getSwapWithRouterInfo(inputMint: string, outputMint: string, amount: string) {
  // Step 1: Check available routers
  const availableRouters = await fetch(
    'https://api.jup.ag/ultra/v1/routers',
    { headers: { 'x-api-key': API_KEY } }
  ).then(r => r.json());
  
  console.log(`Available routing engines: ${availableRouters.routers.map(r => r.name).join(', ')}`);
  
  // Step 2: Get order (Ultra automatically selects best router)
  const order = await fetch(
    `https://api.jup.ag/ultra/v1/order?` +
    `inputMint=${inputMint}&outputMint=${outputMint}` +
    `&amount=${amount}&taker=${walletAddress}`,
    { headers: { 'x-api-key': API_KEY } }
  ).then(r => r.json());
  
  // Step 3: Check which router was used
  console.log(`Router used for this swap: ${order.router}`);
  console.log(`Swap type: ${order.swapType}`);
  
  // Router will be one of: "iris", "jupiterz", "dflow", or "okx"
  // swapType will be: "aggregator" or "rfq"
  
  return order;
}
```

---

## Tips and Best Practices
### General
1. **Check `/shield`** before displaying unknown tokens to users: Critical warning on token -> Block swap, show warning to user.
2. **Use `/holdings`** to get wallet balances before initiating swaps
3. **For large wallets**: Wallets with thousands of token holdings may have slower response times - response time varies depending on the number of token holdings
4. **For SOL-only queries**: Use `/holdings/{address}/native` to get just the native SOL balance for faster responses
5. **Token not found in search**: May be too new or low-liquidity, check `/shield` for warnings
 **Note**: The top level response outside of `tokens` in the `holdings` response is the native SOL balance.

## References
- [Response Examples](../responses/ultra-swap-data.md)
- [Ultra Swap API Reference](https://dev.jup.ag/api-reference/ultra)
- [Routing Documentation](https://dev.jup.ag/docs/routing)