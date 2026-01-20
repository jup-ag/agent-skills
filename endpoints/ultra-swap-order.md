---
title: Ultra Swap Order API
description: Jupiter's recommended by default trading solution. Handles all trading optimizations, requires no RPC, and provides gasless support. Recommended for most use cases.
baseUrl: https://api.jup.ag/ultra/v1
notes:
  - See `../responses/ultra-swap-order.md` for response examples.
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
| Custom priority fees / Jito tips | **Ultra (Manual Mode)** |
| Custom slippage control | **Ultra (Manual Mode)** |
| Custom tx composition | **Metis** |
| CPI integration | **Metis** |
| Custom instructions or CPI calls | **Metis** |
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
| `referralAccount` | string | No | For integrator fees (parameter to pay for networks fees and rent on behalf of your users). See [integrator payer](../about/ultra-swap-integrator-payer.md) for more details only if explicitly requested by the user |
| `closeAuthority` | string | No | Public key of the account that will be the close authority of the token accounts created during the swap |
| `referralFee` | number | No | Fee in basis points collected from the swap |
| `slippageBps` | number | No | Slippage tolerance in basis points (0-10000) |
| `broadcastFeeType` | string | No | `maxCap` or `exactFee` (only available in [manual mode](https://dev.jup.ag/docs/ultra/manual-mode)) |
| `priorityFeeLamports` | number | No | Priority fee in lamports (must be > 0, only available in [manual mode](https://dev.jup.ag/docs/ultra/manual-mode)) |
| `jitoTipLamports` | number | No | Jito tip in lamports (minimum 1000, only available in [manual mode](https://dev.jup.ag/docs/ultra/manual-mode)) |

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

### Manual Mode

Manual Mode gives you explicit control over slippage, priority fees, and Jito tips while still using Ultra's managed execution. Use it when you need fine-tuned control but don't want to manage your own RPC.

**When to use Manual Mode:**
- You want to set a specific slippage tolerance
- You need higher priority fees for faster inclusion
- You want to use Jito tips for MEV protection
- You're building a trading bot that needs precise fee control

**Trade-offs:**
- Using Manual Mode parameters **disables gasless support**
- You're responsible for setting appropriate fee levels

#### Manual Mode Parameters

| Parameter | Description | Constraints |
|-----------|-------------|-------------|
| `slippageBps` | Slippage tolerance | 0-10000 bps |
| `broadcastFeeType` | Fee behavior | `maxCap` (pay up to specified) or `exactFee` (pay exact amount) |
| `priorityFeeLamports` | Priority fee for RPC inclusion | Must be > 0 |
| `jitoTipLamports` | Jito tip for MEV protection | Minimum 1000 lamports |

#### Manual Mode Example

```typescript
const orderResponse = await fetch(
  'https://api.jup.ag/ultra/v1/order' +
  '?inputMint=So11111111111111111111111111111111111111112' +
  '&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' +
  '&amount=100000000' +
  '&taker=' + walletAddress +
  '&slippageBps=100' +                    // 1% slippage
  '&broadcastFeeType=maxCap' +            // Pay up to specified fees
  '&priorityFeeLamports=100000' +         // 0.0001 SOL priority fee
  '&jitoTipLamports=10000',               // 0.00001 SOL Jito tip
  { headers: { 'x-api-key': API_KEY } }
).then(r => r.json());
```

---

## 2. POST /execute

Execute the signed transaction and get execution status.

```
POST /ultra/v1/execute
```

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `signedTransaction` | string | Yes | Properly Base64-encoded signed transaction. It can NEVER be just a signature|
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

## Workflows

### Complete Flow: Get Order → Sign → Execute

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

### Manual Mode Flow: Custom Fees + Jito

```typescript
import { VersionedTransaction } from '@solana/web3.js';

async function ultraSwapManualMode(
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps: number = 100,
  priorityFeeLamports: number = 100000,
  jitoTipLamports: number = 10000
) {
  // Step 1. Get order with Manual Mode parameters
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount,
    taker: wallet.publicKey.toBase58(),
    slippageBps: slippageBps.toString(),
    broadcastFeeType: 'maxCap',
    priorityFeeLamports: priorityFeeLamports.toString(),
    jitoTipLamports: jitoTipLamports.toString(),
  });

  const order = await fetch(
    `https://api.jup.ag/ultra/v1/order?${params}`,
    { headers: { 'x-api-key': API_KEY } }
  ).then(r => r.json());

  // Check if gasless is disabled (expected with Manual Mode)
  if (!order.gasless) {
    console.log('Gasless disabled - using custom fees');
    console.log(`Priority fee: ${order.prioritizationFeeLamports} lamports`);
  }

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

### General
1. **Always use `/execute`** - Jupiter handles tx landing optimization
2. **Check `/shield`** before displaying unknown tokens to users
3. **Poll `/execute`** with same params if status unclear
4. Use gasless support for non-SOL swaps (Jupiter pays fees)
5. **Understand error codes** - Provide better UX by handling errors appropriately

### Manual Mode Tips
1. **Start with `broadcastFeeType: maxCap`** - Safer than `exactFee` since you pay up to the amount, not always the full amount
2. **Use Jito tips for time-sensitive trades** - MEV protection and faster inclusion during congestion
3. **Set reasonable slippage** - 50-100 bps for stable pairs, 100-300 bps for volatile pairs
4. **Don't use Manual Mode for gasless** - Any Manual Mode parameter disables gasless support
5. **Monitor fee response fields** - Check `prioritizationFeeLamports` and `signatureFeeLamports` in the response to verify your fees

### When to Increase Fees
| Scenario | Recommendation |
|----------|----------------|
| Normal conditions | Default (no Manual Mode) |
| Network congestion | `priorityFeeLamports: 500000` (0.0005 SOL) |
| Time-critical trade | Add `jitoTipLamports: 50000` (0.00005 SOL) |
| High-value trade | Both priority fee + Jito tip |


## References
- [Response Examples](../responses/ultra-swap-order.md)
- [Ultra Swap API Reference](https://dev.jup.ag/api-reference/ultra)
- [Manual Mode Documentation](https://dev.jup.ag/docs/ultra/manual-mode)
- [Ultra V3 Blog](https://dev.jup.ag/blog/ultra-v3)
- [Add Fees to Ultra Swap](https://dev.jup.ag/docs/ultra/add-fees-to-ultra)