---
title: Metis Swap API
description: Low-level swap primitive exposing granular control over swap instructions. Designed for maximum flexibility, transparency, and composability. Beneficial for fine-tuning every aspect of a swap transaction.
baseUrl: https://api.jup.ag/swap/v1
notes:
  - Metis v7 is now an independent public good at https://metis.builders. Binary access requires 10,000 staked JUP.
  - See https://dev.jup.ag/blog/metis-v7 for migration details and v7 features.
---

## Table of Contents

- [Metis Swap API](#metis-swap-api)
  - [Guidelines](#guidelines)
  - [Common Mistakes](#common-mistakes)
  - [When to Use Metis vs Ultra](#when-to-use-metis-vs-ultra)
  - [Alternative Integration Methods](#alternative-integration-methods)
  - [Endpoints](#endpoints)
  - [1. GET /quote](#1-get-quote)
    - [Query Parameters](#query-parameters)
  - [2. POST /swap](#2-post-swap)
    - [Request Body](#request-body)
  - [3. POST /swap-instructions](#3-post-swap-instructions)
    - [Request Body](#request-body-1)
    - [Response Fields](#response-fields)
  - [4. GET /program-id-to-label](#4-get-program-id-to-label)
  - [Workflows](#workflows)
    - [Quote → Swap → Send (end-to-end)](#quote--swap--send-end-to-end)
    - [Optimize for Landing](#optimize-for-landing)
    - [Build Your Own Transaction With Instructions](#build-your-own-transaction-with-instructions)
    - [Specific Workflows](#specific-workflows)
      - [Build Your Own Transaction With Flash Fill Or CPI](#build-your-own-transaction-with-flash-fill-or-cpi)
        - [CPI Workflow](#cpi-workflow)
        - [Flash Fill Workflow](#flash-fill-workflow)
    - [References](#references)
  - [Adding Integrator Fees](#adding-integrator-fees)
  - [Tips and Best Practices](#tips-and-best-practices)
    - [General](#general)
    - [Requote with Lower Max Accounts](#requote-with-lower-max-accounts)
  - [References](#references-1)

---



# Metis Swap API

Metis is a low-level swap primitive providing granular control over transactions. Designed for builders who need full authority over routing, instructions, and execution.

**Base URL**: `https://api.jup.ag/swap/v1`

**Note**: Metis v7 is now an independent public good at [metis.builders](https://metis.builders). Binary access requires 10,000 staked JUP.

## Guidelines

- ALWAYS get a quote before building a swap transaction
- ALWAYS include `quoteResponse` from `/quote` in `/swap` request
- PREFER Ultra API unless you need custom instructions, CPI, or full control
- MANAGE your own RPC for transaction broadcasting

## Common Mistakes

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

For more information, see [Ultra Swap API vs Metis Swap API](../ultra/ultra-swap-vs-metis-swap.md).

## Alternative Integration Methods

If you need to interact with the Jupiter Swap Aggregator program differently. For on-chain integrations, default to CPI or Flash Fill (workflows below):

- **Swap Instructions**: Use `/swap-instructions` to compose with instructions and build your own transaction. See [Build Your Own Transaction With Instructions](#build-your-own-transaction-with-instructions).
- **Flash Fill or CPI**: Interact with your own Solana program using the Flash Fill method or Cross Program Invocation. See [Build Your Own Transaction With Flash Fill Or CPI](#build-your-own-transaction-with-flash-fill-or-cpi).

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

See [Complete Workflows](#workflows) for full integration examples.

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

See [Complete Workflows](#workflows) for full integration examples.

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

See [Complete Workflows](#workflows) for full integration examples.

---

## 4. GET /program-id-to-label

Map program IDs to DEX labels for error handling and filtering.

```
GET /swap/v1/program-id-to-label
```

Returns a mapping of program IDs to DEX labels for error handling and filtering.

---
## Workflows

### Quote → Swap → Send (end-to-end)

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

Notes:
- `swap.swapTransaction` is base64; deserialize before signing.
- Blockhash validity is short; send quickly after signing.
- `maxRetries` and `skipPreflight` trade speed vs safety.

### Optimize for Landing

Use Metis to estimate priority fees, compute units, and slippage during `/swap`:

```typescript
const swap = await fetch('https://api.jup.ag/swap/v1/swap', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
  body: JSON.stringify({
    quoteResponse,
    userPublicKey: wallet.publicKey.toBase58(),
    dynamicComputeUnitLimit: true,
    dynamicSlippage: true,
    prioritizationFeeLamports: {
      priorityLevelWithMaxLamports: {
        maxLamports: 1_000_000,
        priorityLevel: 'veryHigh',
      },
    },
  }),
}).then(r => r.json());
```

### Build Your Own Transaction With Instructions

Use `/swap-instructions` when you want to compose custom instructions or control the transaction layout.

### Specific Workflows

1. Get a quote from `/quote`.
2. Call `/swap-instructions` with `quoteResponse`.
3. Deserialize the returned instructions and build a versioned transaction with ALTs.
4. Sign and send with your own RPC connection.

#### Build Your Own Transaction With Flash Fill Or CPI

Use these flows when integrating from an on-chain program.

##### CPI Workflow

1. Borrow SOL to open a wSOL account owned by your program.
2. CPI into Jupiter to swap user input into wSOL (or target mint).
3. Close the wSOL account and send SOL to the program.
4. Transfer SOL back to the user.

##### Flash Fill Workflow

1. Borrow SOL from the program to open a wSOL account for the borrower.
2. Swap user input to wSOL using a versioned transaction with ALTs.
3. Close the wSOL account and send SOL to the borrower.
4. Repay the borrowed SOL back to the program.

### References

- [jupiter-cpi-swap-example](https://github.com/jup-ag/jupiter-cpi-swap-example)
- [sol-swap-cpi](https://github.com/jup-ag/sol-swap-cpi)
- [sol-swap-flash-fill](https://github.com/jup-ag/sol-swap-flash-fill)

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
    feeAccount: '<your-fee-token-account>', // ATA must match output mint
  }),
}).then(r => r.json());
```

---

## Tips and Best Practices
### General
1. **`outAmount` is the best possible output**: The `outAmount` in the quote response refers to the best possible output amount based on the route at the time of the quote. This means `slippageBps` does not affect `outAmount` - it only determines the minimum acceptable output during execution.
2. **ALWAYS get a quote before building a swap transaction**
3. **PREFER Ultra API unless you need custom instructions, CPI, or full control**
4. **USE `restrictIntermediateTokens=true` (default) for route stability**
5. **MANAGE your own RPC for transaction broadcasting**
7. **Handle transaction size limits**: If you hit transaction size limits, reduce `maxAccounts` on `/quote`.
8. **Place compute budget instructions correctly**: Place `computeBudgetInstructions` before setup, swap, and cleanup instructions.


### Requote with Lower Max Accounts

In some cases where you might be limited or require strict control by adding your own instructions to the swap transaction, you might face issues with exceeding transaction size limit. Use the `maxAccounts` param in the `/quote` endpoint to reduce the total number of accounts used for a swap.

**Key Points:**
- Start with `maxAccounts=64` and incrementally reduce when requoting
- Lower max accounts may yield worse routes or no route at all
- Max raw bytes of a Solana transaction is 1232 bytes

---

## References

- [Metis Swap API Reference](https://dev.jup.ag/api-reference/swap)
- [Metis v7 Blog](https://dev.jup.ag/blog/metis-v7)
- [metis.builders](https://metis.builders)
- [Add Fees to Swap](https://dev.jup.ag/docs/swap/add-fees-to-swap)
