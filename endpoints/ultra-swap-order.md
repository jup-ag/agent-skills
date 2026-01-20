---
title: Ultra Swap Order API
description: Jupiter's flagship trading solution. Handles all trading optimizations, requires no RPC, and provides gasless support. Recommended for most use cases.
notes:
  - Base URL: https://api.jup.ag/ultra/v1
  - See `./../responses/ultra-swap-order.md` for response examples.
---

# Ultra Swap Order API

## Base URL

```
https://api.jup.ag/ultra/v1
```

## Guidelines
   - ALWAYS use `requestId` from /order response in /execute
   - NEVER skip error handling for both endpoints
   - PREFER Ultra over Metis unless custom instructions are needed
   - A user can use the transaction from `/order` response directly but that will take longer to land and will not be gasless
   
## Common Mistakes
- Forgetting to deserialize as VersionedTransaction (not Transaction)
- Using wrong amount units (should be native units, before decimals)

## Ultra vs Metis: When to Use

| Use Case | Recommended API |
|----------|-----------------|
| Simple swaps, new developers | **Ultra** |
| Need managed tx landing | **Ultra** |
| Most trading applications | **Ultra** |
| Jupiter handles RPC, fees, slippage, broadcasting | **Ultra** |
| Custom tx composition | **Metis** |
| CPI integration | **Metis** |
| Custom instructions or CPI calls | **Metis** |
| Specific broadcasting strategies (priority fee, Jito, etc.) | **Metis** |
| DEX/AMM routing control | **Metis** |
| Account limit modifications | **Metis** |
| Maximum control | **Metis** |

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/order` | Get swap quote + unsigned transaction |
| POST | `/execute` | Execute signed transaction |


---


## 1. GET /order

Request a base64-encoded unsigned transaction and swap quote.

```
GET /ultra/v1/order
```

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `inputMint` | string | Yes | Input token mint address |
| `outputMint` | string | Yes | Output token mint address |
| `amount` | string | Yes | Amount in native units (before decimals) |
| `taker` | string | Yes* | User's wallet address (*without taker, no tx returned) |
| `referralAccount` | string | No | For integrator fees (parameter to pay for networks fees and rent on behalf of your users). See [integrator payer](./ultra-swap-integrator-payer.md) for more details |
| `closeAuthority` | string | No | Public key of the account that will be the close authority of the token accounts created during the swap |
| `referralFee` | number | No | Fee in basis points collected from the swap |

### Example

```typescript
const orderResponse = await fetch(
  'https://api.jup.ag/ultra/v1/order' +
  '?inputMint=So11111111111111111111111111111111111111112' +
  '&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' +
  '&amount=100000000' +
  '&taker=' + walletAddress,
  { headers: { 'x-api-key': API_KEY } }
).then(r => r.json());
```

## 2. POST /execute

Execute the signed transaction and get execution status.

```
POST /ultra/v1/execute
```

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `signedTransaction` | string | Yes | Base64-encoded signed transaction |
| `requestId` | string | Yes | Request ID from `/order` response |



### Example

```typescript
import { VersionedTransaction } from '@solana/web3.js';

// Sign the transaction
const tx = VersionedTransaction.deserialize(
  Buffer.from(orderResponse.transaction, 'base64')
);
tx.sign([wallet]);
const signedTx = Buffer.from(tx.serialize()).toString('base64');

// Execute
const result = await fetch('https://api.jup.ag/ultra/v1/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  },
  body: JSON.stringify({
    signedTransaction: signedTx,
    requestId: orderResponse.requestId,
  }),
}).then(r => r.json());
```

---

## Complete Flow: Get Order → Sign → Execute

```typescript
import { Keypair, VersionedTransaction } from '@solana/web3.js';

async function ultraSwap(inputMint: string, outputMint: string, amount: string) {
  // Step 1. Get order
  const order = await fetch(
    `https://api.jup.ag/ultra/v1/order?` +
    `inputMint=${inputMint}&outputMint=${outputMint}` +
    `&amount=${amount}&taker=${wallet.publicKey}`,
    { headers: { 'x-api-key': API_KEY } }
  ).then(r => r.json());

  // Step 2. Sign
  const tx = VersionedTransaction.deserialize(
    Buffer.from(order.transaction, 'base64')
  );
  tx.sign([wallet]);
  const signed = Buffer.from(tx.serialize()).toString('base64');

  // Step 3. Execute
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

**Polling**: Re-submit same `signedTransaction` + `requestId` for up to 2 minutes to poll status.

---

## Fees

| Pair Type | Fee |
|-----------|-----|
| Non-stable | 0.1% |
| Stable (USDC/USDT) | 0.03% |

Integrator fees are additional (via referral program).

---

## Rate Limits

Ultra uses **dynamic rate limiting** based on 24h swap volume:

```
Quota = Base + (24h Volume × Multiplier)
```

- No Pro plan required
- Volume resets on rolling 24h window
- Scales automatically with usage

---

## Tips and Best Practices

1. **Always use `/execute`** - Jupiter handles tx landing optimization
2. **Check `/shield`** before displaying unknown tokens to users
3. **Poll `/execute`** with same params if status unclear
4. Use gasless support for non-SOL swaps (Jupiter pays fees)
5. **Understand error codes** - Provide better UX by handling errors appropriately


## References
- [Response Examples](/responses/ultra-swap-order.md)
- [Ultra Swap API Reference](https://dev.jup.ag/api-reference/ultra)
- [Ultra V3 Blog](https://dev.jup.ag/blog/ultra-v3)
- [Add Fees to Ultra Swap](https://dev.jup.ag/docs/ultra/add-fees-to-ultra)