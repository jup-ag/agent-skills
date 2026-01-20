---
title: Metis Swap API
description: Low-level swap primitive providing granular control over transactions. Designed for builders who need full authority over routing, instructions, and execution.
notes:
  - Metis v7 is now an independent public good at [metis.builders](https://metis.builders). Binary access requires 10,000 staked JUP.
---

# Metis Swap API

Metis is a low-level swap primitive providing granular control over transactions. Designed for builders who need full authority over routing, instructions, and execution.

**Base URL**: `https://api.jup.ag/swap/v1`

**Note**: Metis v7 is now an independent public good at [metis.builders](https://metis.builders). Binary access requires 10,000 staked JUP.

## Guidelines

- ALWAYS get a quote before building a swap transaction
- ALWAYS include `quoteResponse` from `/quote` in `/swap` request
- PREFER Ultra API unless you need custom instructions, CPI, or full control
- USE `restrictIntermediateTokens=true` (default) for route stability
- MANAGE your own RPC for transaction broadcasting

## Common Mistakes

- Forgetting to set `userPublicKey` in `/swap` request
- Not handling `lastValidBlockHeight` for transaction expiry
- Using `ExactOut` mode with unsupported AMMs
- Not initializing destination token account before swap

## When to Use Metis vs Ultra

| Use Case | Recommended API |
|----------|-----------------|
| Full transaction control | **Metis** |
| Custom on-chain programs (CPI) | **Metis** |
| Set own priority fees, slippage, DEX filters | **Metis** |
| Modify instructions or add custom logic | **Metis** |
| Managing own RPC infrastructure | **Metis** |
| Want Jupiter to handle everything | **Ultra** |
| Maximum MEV protection | **Ultra** |
| Lowest execution fees | **Ultra** |
| No complexity management | **Ultra** |

---

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/quote` | Get swap quote with route plan |
| POST | `/swap` | Build serialized swap transaction |
| POST | `/swap-instructions` | Get individual swap instructions |
| GET | `/program-id-to-label` | Map program IDs to DEX labels |

---

## 1. GET /quote

Request a quote for a token swap.

```
GET /swap/v1/quote
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `inputMint` | string | Yes | Input token mint address |
| `outputMint` | string | Yes | Output token mint address |
| `amount` | string | Yes | Amount in native units |
| `slippageBps` | number | No | Slippage tolerance in basis points (default: 50) |
| `swapMode` | string | No | `ExactIn` (default) or `ExactOut` |
| `dexes` | string | No | Comma-separated DEXes to include |
| `excludeDexes` | string | No | Comma-separated DEXes to exclude |
| `restrictIntermediateTokens` | boolean | No | Only use liquid intermediates (default: true) |
| `onlyDirectRoutes` | boolean | No | Single-hop routes only (default: false) |
| `asLegacyTransaction` | boolean | No | Use legacy transaction format |
| `platformFeeBps` | number | No | Integrator fee in basis points |
| `maxAccounts` | number | No | Max accounts in transaction (default: 64) |

### Example

```typescript
const quoteResponse = await fetch(
  'https://api.jup.ag/swap/v1/quote' +
  '?inputMint=So11111111111111111111111111111111111111112' +
  '&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' +
  '&amount=100000000' +
  '&slippageBps=50',
  { headers: { 'x-api-key': 'your-api-key' } }
).then(r => r.json());
```

---

## 2. POST /swap

Build a serialized swap transaction from a quote.

```
POST /swap/v1/swap
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userPublicKey` | string | Yes | Wallet address executing the swap |
| `quoteResponse` | object | Yes | Full quote response from `/quote` |
| `destinationTokenAccount` | string | No | Custom output token account |
| `wrapAndUnwrapSol` | boolean | No | Auto wrap/unwrap SOL (default: true) |
| `useSharedAccounts` | boolean | No | Use shared accounts for efficiency |
| `feeAccount` | string | No | Token account to receive integrator fees |
| `prioritizationFeeLamports` | number/object | No | Priority fee settings |
| `asLegacyTransaction` | boolean | No | Use legacy transaction format |
| `dynamicComputeUnitLimit` | boolean | No | Simulate to get exact compute units |
| `skipUserAccountsRpcCalls` | boolean | No | Skip RPC calls for user accounts |

### Example

```typescript
const swapResponse = await fetch('https://api.jup.ag/swap/v1/swap', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-api-key',
  },
  body: JSON.stringify({
    userPublicKey: wallet.publicKey.toBase58(),
    quoteResponse,
    wrapAndUnwrapSol: true,
    prioritizationFeeLamports: 'auto',
  }),
}).then(r => r.json());
```

---

## 3. POST /swap-instructions

Get individual instructions instead of a serialized transaction.

```
POST /swap/v1/swap-instructions
```

### Request Body

Same as `/swap` endpoint.

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `computeBudgetInstructions` | array | Compute budget instructions |
| `setupInstructions` | array | Setup instructions (create ATAs, etc.) |
| `swapInstruction` | object | Main swap instruction |
| `cleanupInstruction` | object | Cleanup instruction (unwrap SOL, etc.) |
| `addressLookupTableAddresses` | array | ALT addresses for versioned transactions |

### Example

```typescript
const instructionsResponse = await fetch('https://api.jup.ag/swap/v1/swap-instructions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-api-key',
  },
  body: JSON.stringify({
    userPublicKey: wallet.publicKey.toBase58(),
    quoteResponse,
  }),
}).then(r => r.json());

// Build your own transaction with these instructions
const { computeBudgetInstructions, setupInstructions, swapInstruction, cleanupInstruction } = instructionsResponse;
```

---

## 4. GET /program-id-to-label

Map program IDs to DEX labels for error handling and filtering.

```
GET /swap/v1/program-id-to-label
```

### Example

```typescript
const programLabels = await fetch(
  'https://api.jup.ag/swap/v1/program-id-to-label',
  { headers: { 'x-api-key': 'your-api-key' } }
).then(r => r.json());

// Returns: { "programId": "DEX Label", ... }
```

---

## Complete Flow: Quote → Swap → Send

```typescript
import { Connection, VersionedTransaction } from '@solana/web3.js';

const API_KEY = process.env.JUPITER_API_KEY!;
const connection = new Connection('https://api.mainnet-beta.solana.com');

async function metisSwap(inputMint: string, outputMint: string, amount: string) {
  // Step 1. Get quote
  const quote = await fetch(
    `https://api.jup.ag/swap/v1/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50`,
    { headers: { 'x-api-key': API_KEY } }
  ).then(r => r.json());

  // Step 2. Build swap transaction
  const swap = await fetch('https://api.jup.ag/swap/v1/swap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
    body: JSON.stringify({
      userPublicKey: wallet.publicKey.toBase58(),
      quoteResponse: quote,
      wrapAndUnwrapSol: true,
      prioritizationFeeLamports: 'auto',
    }),
  }).then(r => r.json());

  // Step 3. Sign transaction
  const tx = VersionedTransaction.deserialize(
    Buffer.from(swap.swapTransaction, 'base64')
  );
  tx.sign([wallet]);

  // Step 4. Send transaction (you manage RPC)
  const signature = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: true,
    maxRetries: 2,
  });

  // Step 5. Confirm
  await connection.confirmTransaction({
    signature,
    blockhash: tx.message.recentBlockhash,
    lastValidBlockHeight: swap.lastValidBlockHeight,
  });

  return signature;
}
```

---

## Adding Integrator Fees

```typescript
// 1. Include platformFeeBps in quote
const quote = await fetch(
  'https://api.jup.ag/swap/v1/quote' +
  '?inputMint=So11111111111111111111111111111111111111112' +
  '&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' +
  '&amount=100000000' +
  '&platformFeeBps=20', // 0.2% fee
  { headers: { 'x-api-key': API_KEY } }
).then(r => r.json());

// 2. Include feeAccount in swap request
const swap = await fetch('https://api.jup.ag/swap/v1/swap', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
  body: JSON.stringify({
    userPublicKey: wallet.publicKey.toBase58(),
    quoteResponse: quote,
    feeAccount: '<your-fee-token-account>', // Must match output mint
  }),
}).then(r => r.json());
```

---

## References

- [Metis Swap API Reference](https://dev.jup.ag/api-reference/swap)
- [Metis v7 Blog](https://dev.jup.ag/blog/metis-v7)
- [metis.builders](https://metis.builders)
- [Add Fees to Swap](https://dev.jup.ag/docs/swap/add-fees-to-swap)
