---
title: Ultra Swap API vs Metis Swap API
description: Comparison guide for choosing between Ultra Swap API and Metis Swap API.
---

# Ultra Swap API vs Metis Swap API

## Overview

Jupiter provides two swap APIs:

| API | Description | Recommended For |
|-----|-------------|-----------------|
| **Ultra** | High-level, managed swap solution | Most applications |
| **Metis** | Low-level, instruction-level primitive | Advanced builders |

## Quick Decision

**Use Ultra if**:
- You want Jupiter to handle everything
- You're building a trading app, wallet, or DeFi frontend
- You need gasless support
- You want MEV protection without complexity

**Use Metis if**:
- You need CPI (Cross Program Invocation)
- You're composing custom transactions
- You need full control over DEX routing
- You manage your own RPC infrastructure

### Common Confusion: Ultra vs Metis

**Ultra API:**
- Jupiter charges 5-10 bps (basis points) on swaps
- Jupiter takes 20% of any integrator fees you add
- Handles transaction landing, priority fees, and RPC automatically
- Best for: Simple integrations, users who want reliability over control

**Metis API:**
- Zero protocol fees by default
- You keep 100% of any `platformFeeBps` you set
- You must manage your own RPC, priority fees, slippage, and transaction broadcasting
- Best for: Advanced users who want full control and to minimize fees

## Feature Comparison

| Feature | Ultra | Metis |
|---------|-------|-------|
| **RPC Required** | No (RPC-less) | Yes |
| **Transaction Building** | Automatic | Manual |
| **Transaction Sending** | Via `/execute` | Your responsibility |
| **MEV Protection** | Yes (Jupiter Beam) | No |
| **Gasless Support** | Automatic | No |
| **Slippage Optimization** | RTSE (automatic) | Manual |
| **Priority Fees** | Auto-optimized | Manual |
| **CPI Support** | No | Yes |
| **Custom Instructions** | No | Yes |
| **DEX Filtering** | No | Yes |
| **Platform Fee** | 0.03-0.1% | None |

## Architecture Differences

### Ultra Flow

```
Your App → /order → Sign → /execute → Done
```

Jupiter handles:
- Route optimization
- Transaction building
- Priority fee calculation
- Transaction broadcasting
- Confirmation polling
- Error handling

### Metis Flow

```
Your App → /quote → /swap → Sign → Your RPC → Confirm
```

You handle:
- Route selection (optional filtering)
- Priority fee decisions
- RPC connection
- Transaction broadcasting
- Confirmation logic
- Error recovery

## Code Comparison

### Ultra Swap

```typescript
import { VersionedTransaction } from '@solana/web3.js';

// 1. Get order (quote + unsigned tx)
const order = await fetch(
  `https://api.jup.ag/ultra/v1/order?inputMint=${SOL}&outputMint=${USDC}&amount=${amount}&taker=${wallet.publicKey}`,
  { headers: { 'x-api-key': API_KEY } }
).then(r => r.json());

// 2. Sign
const tx = VersionedTransaction.deserialize(Buffer.from(order.transaction, 'base64'));
tx.sign([wallet]);

// 3. Execute (Jupiter handles broadcasting + confirmation)
const result = await fetch('https://api.jup.ag/ultra/v1/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
  body: JSON.stringify({
    signedTransaction: Buffer.from(tx.serialize()).toString('base64'),
    requestId: order.requestId,
  }),
}).then(r => r.json());

console.log(result.signature);
```

### Metis Swap

```typescript
import { Connection, VersionedTransaction } from '@solana/web3.js';

const connection = new Connection('https://api.mainnet-beta.solana.com');

// 1. Get quote
const quote = await fetch(
  `https://api.jup.ag/swap/v1/quote?inputMint=${SOL}&outputMint=${USDC}&amount=${amount}&slippageBps=50`,
  { headers: { 'x-api-key': API_KEY } }
).then(r => r.json());

// 2. Build swap transaction
const swap = await fetch('https://api.jup.ag/swap/v1/swap', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
  body: JSON.stringify({
    userPublicKey: wallet.publicKey.toBase58(),
    quoteResponse: quote,
    prioritizationFeeLamports: 'auto',
  }),
}).then(r => r.json());

// 3. Sign
const tx = VersionedTransaction.deserialize(Buffer.from(swap.swapTransaction, 'base64'));
tx.sign([wallet]);

// 4. Send (you manage RPC)
const signature = await connection.sendRawTransaction(tx.serialize(), {
  skipPreflight: true,
  maxRetries: 2,
});

// 5. Confirm (you manage confirmation)
await connection.confirmTransaction({
  signature,
  blockhash: tx.message.recentBlockhash,
  lastValidBlockHeight: swap.lastValidBlockHeight,
});

console.log(signature);
```

## When Ultra Falls Short

Use Metis when you need:

### 1. CPI Integration

```typescript
// Metis returns instructions you can compose
const { swapInstruction } = await fetch('https://api.jup.ag/swap/v1/swap-instructions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
  body: JSON.stringify({ userPublicKey, quoteResponse }),
}).then(r => r.json());

// Use in your program
const myInstruction = createMyProgramInstruction(...);
const tx = new Transaction().add(myInstruction, swapInstruction);
```

### 2. DEX Filtering

```typescript
// Only use specific DEXes
const quote = await fetch(
  `https://api.jup.ag/swap/v1/quote?...&dexes=Raydium,Orca`,
  { headers: { 'x-api-key': API_KEY } }
).then(r => r.json());

// Exclude specific DEXes
const quote = await fetch(
  `https://api.jup.ag/swap/v1/quote?...&excludeDexes=Phoenix`,
  { headers: { 'x-api-key': API_KEY } }
).then(r => r.json());
```

### 3. Custom Transaction Composition

```typescript
const { setupInstructions, swapInstruction, cleanupInstruction } = 
  await getSwapInstructions(quote);

// Add your own instructions
const tx = new Transaction()
  .add(...setupInstructions)
  .add(myCustomInstruction)
  .add(swapInstruction)
  .add(cleanupInstruction);
```

## Migration Path

### Ultra → Metis

If you need more control:
1. Replace `/order` with `/quote` + `/swap`
2. Set up RPC connection
3. Implement transaction sending
4. Add confirmation logic

### Metis → Ultra

If you want simplicity:
1. Remove RPC management code
2. Replace `/quote` + `/swap` with `/order`
3. Replace manual sending with `/execute`
4. Remove confirmation logic

## Summary

| Scenario | Recommendation |
|----------|----------------|
| Building a swap UI | Ultra |
| Wallet integration | Ultra |
| Trading bot (simple) | Ultra |
| Trading bot (advanced) | Metis |
| On-chain program | Metis |
| Custom DEX routing | Metis |
| Maximum simplicity | Ultra |
| Maximum control | Metis |

## References

- [Ultra Swap API](./endpoints/ultra-swap-order.md)
- [Metis Swap API](./endpoints/metis-swap.md)
- [Metis v7 Migration](https://dev.jup.ag/blog/metis-v7)
