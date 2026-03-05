---
name: executing-ultra-swaps
description: >
  Guides agents through production Ultra Swap integrations: the full
  /order -> sign -> /execute flow, token verification via Shield,
  slippage and routing decision rules, re-quote logic, error recovery
  with Ultra-specific negative codes, and idempotent execution patterns.
  Use when the task requires building or debugging Ultra Swap flows
  beyond a basic quote-and-execute.
license: MIT
metadata:
  author: jupiter
  version: "1.0.0"
tags:
  - jupiter
  - ultra-swap
  - jup-ag
  - solana
  - swap
  - gasless
  - token-shield
  - transaction-landing
---

# Executing Ultra Swaps

Deep integration guide for Jupiter Ultra Swap: the `/order` -> sign -> `/execute` flow with production-grade error handling and decision rules.

## Use / Do Not Use

**Use when:**
- Building or debugging the Ultra Swap order-sign-execute flow
- Handling swap errors, re-quote logic, or gasless execution
- Making slippage, routing, or retry decisions for swaps

**Do not use when:**
- Working with non-swap APIs (Lend, Perps, Trigger, etc.)
- Only need a simple quote without execution logic

**Triggers:** `swap`, `trade`, `exchange tokens`, `convert`, `gasless`, `slippage`, `swap failed`, `re-quote`, `Shield`, `best route`, `ultra swap`, `swap error`, `transaction landing`

---

## Order -> Sign -> Execute Flow

The Ultra Swap lifecycle is three discrete steps. Never combine them — keep each step isolated in code and logs.

```typescript
import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';

// Step 1: Get order (unsigned transaction + metadata)
const order = await jupiterFetch<UltraOrder>('/ultra/v1/order?' + new URLSearchParams({
  inputMint: 'So11111111111111111111111111111111111111112',  // SOL
  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  amount: '1000000000',  // 1 SOL in lamports
  taker: wallet.publicKey.toBase58(),
}));

console.log(`Route: ${order.swapType}, outAmount: ${order.outAmount}`);

// Step 2: Deserialize and sign (DO NOT modify the transaction)
const tx = VersionedTransaction.deserialize(Buffer.from(order.transaction, 'base64'));
tx.sign([wallet]);
const signedTx = Buffer.from(tx.serialize()).toString('base64');

// Step 3: Execute via Jupiter's managed landing
const result = await jupiterFetch<UltraExecuteResult>('/ultra/v1/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    signedTransaction: signedTx,
    requestId: order.requestId,
  }),
});

// result.status: 'Success' | 'Failed'
// result.signature: on-chain tx signature (when successful)
```

**Key gotchas:**
- Signed payloads expire in ~2 minutes. Execute promptly after signing.
- Transactions are immutable after `/order` returns — do not add instructions.
- `requestId` ties order to execution. Always log it alongside the signature.
- `swapType` in the response indicates `Aggregator` (Iris DEX routing) vs `RFQ` (JupiterZ market maker). No action needed — just log for observability.

---

## Pre-Swap Verification

Before executing a swap, verify the token is legitimate and resolve symbols to mints.

```typescript
// Shield check — abort if suspicious
const shield = await jupiterFetch<ShieldResult>(
  `/ultra/v1/shield?mintAddress=${outputMint}`
);
if (shield.isSus || (shield.organicScore !== null && shield.organicScore < 50)) {
  throw new Error(`Token flagged: isSus=${shield.isSus}, organicScore=${shield.organicScore}`);
}

// Symbol -> mint resolution (when user provides symbol, not address)
const tokens = await jupiterFetch<TokenSearchResult[]>(
  `/ultra/v1/search?query=${encodeURIComponent(symbol)}`
);
const token = tokens.find(t => t.symbol.toUpperCase() === symbol.toUpperCase());
if (!token) throw new Error(`No verified token found for symbol: ${symbol}`);
const resolvedMint = token.address;
```

---

## Decision Rules

### Slippage

| Pair type | Recommended `slippageBps` | Notes |
|-----------|--------------------------|-------|
| Stablecoin pairs (USDC/USDT) | 10 | Very tight; widen if failing |
| Liquid majors (SOL/USDC) | 50 | Default starting point |
| Mid-cap tokens | 100-200 | Adjust based on recent volatility |
| Illiquid / small-cap | 300+ | Monitor fill rates, tighten over time |

When in doubt, start conservative and widen only if swaps fail with slippage errors (program error code `6001`).

### Re-quote vs Execute Immediately

| Condition | Action |
|-----------|--------|
| <10s since `/order` | Execute immediately |
| 10-30s elapsed | Execute, but monitor for expiry errors |
| >30s elapsed | Re-quote: call `/order` again, re-sign |
| Expired error code returned | Always re-quote with fresh `/order` |
| User paused / confirmed late | Re-quote before executing |

### Gasless Execution

Gasless swaps are automatic when the route uses a JupiterZ (RFQ) path or when the taker's SOL balance is insufficient for fees. Key rules:
- Minimum swap amount applies — error code `3` means amount is below the gasless threshold
- No explicit opt-in required; the system selects gasless when appropriate
- Works for both SOL-input and token-input swaps on eligible routes

---

## Error Recovery

### Ultra Execute Error Codes

| Code | Meaning | Retryable | Action |
|------|---------|-----------|--------|
| `Success` | Swap landed on-chain | No | Done. Log signature. |
| `-1` | Transaction expired / not confirmed | Yes | Re-quote, re-sign, re-execute |
| `-1000` | System busy | Yes | Backoff (2-5s), retry same payload |
| `-1001` | Transaction failed to land | Yes | Re-quote and retry (route may be stale) |
| `-1002` | Transaction simulation failed | No | Log simulation error. Adjust params. |
| `-1003` | Invalid transaction | No | Check serialization. Do not retry. |
| `-1004` | Transaction expired before processing | Yes | Re-quote with fresh order |
| `-1005` | RFQ fill rejected by market maker | Yes | Retry — may get Aggregator route |
| `-1006` | Transaction sent but unconfirmed | Yes | Check on-chain before retrying |
| `-2000` | Internal server error | Yes | Backoff + retry |
| `-2003` | Service temporarily unavailable | Yes | Backoff + retry |
| `-2005` | Execution timed out | Yes | Check on-chain status first |
| `3` | Below minimum gasless amount | No | Increase swap amount |
| `6001` | Slippage exceeded (program error) | No | Widen slippage or re-quote |

### Recovery Decision Tree

```
Execute result received
  |
  +-- status: "Success" --> Done. Log signature + requestId.
  |
  +-- retryable error (-1, -1000, -1001, -1004, -1005, -1006, -2000, -2003, -2005)
  |     |
  |     +-- Is -1006 or -2005 (unconfirmed)? --> Check on-chain status first
  |     |     +-- Confirmed on-chain? --> Done (was actually successful)
  |     |     +-- Not found on-chain? --> Re-quote + re-sign + retry
  |     |
  |     +-- Other retryable --> Exponential backoff + re-quote + re-sign + retry
  |
  +-- non-retryable (-1002, -1003, 3, 6001)
        --> Surface error to user with actionable message
```

### Critical Anti-Patterns

- **Never retry a signed transaction without checking on-chain status.** The first attempt may have landed.
- **Never re-sign without confirming the first attempt failed.** Duplicate execution is possible otherwise.
- **Never hardcode retry delays.** Use exponential backoff with jitter: `delay = min(base * 2^attempt + random(0, jitter), maxDelay)`.

---

## Production Notes

**Idempotency:** Submitting the same `signedTransaction` + `requestId` to `/execute` within 2 minutes is safe — Jupiter deduplicates. After 2 minutes, the order expires and you must re-quote.

**Rate limits:** Ultra has dynamic volume-based limits (50 req/10s base, scales with 24h execute volume). Handle 429 with exponential backoff + jitter — do not burst.

| 24h Execute Volume | Requests per 10s window |
|--------------------|-------------------------|
| $0 | 50 |
| $10,000 | 51 |
| $100,000 | 61 |
| $1,000,000 | 165 |

**Observability checklist:**
- Log `requestId`, `swapType`, `inputMint`, `outputMint`, `amount`, `outAmount`
- Log execution latency (time from `/order` to `/execute` response)
- Log status code and error code on failures
- Track re-quote frequency as a health metric

---

## References

- [Ultra Overview](https://dev.jup.ag/docs/ultra/index.md)
- [Get Order](https://dev.jup.ag/docs/ultra/get-order.md)
- [Execute Order](https://dev.jup.ag/docs/ultra/execute-order.md)
- [Response Codes](https://dev.jup.ag/docs/ultra/response.md)
- [Rate Limits](https://dev.jup.ag/docs/ultra/rate-limit.md)
- [OpenAPI Spec](https://dev.jup.ag/openapi-spec/ultra/ultra.yaml)
- [Tokens Search](https://dev.jup.ag/docs/tokens/v2/token-information.md)
