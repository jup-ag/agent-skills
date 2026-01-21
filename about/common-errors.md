---
title: Common Errors and Misconceptions
description: Common errors, misconceptions, and debugging tips for Jupiter API integrations.
---

# Common Errors and Misconceptions

## Quick Troubleshooting

Use this to quickly diagnose common issues:

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| 401/403 response | Missing or invalid API key | Add `x-api-key` header |
| 429 response | Rate limited | Implement exponential backoff |
| "Could not find any routes" | No liquidity | Check token mints on jup.ag |
| Transaction won't deserialize | Using legacy `Transaction` | Use `VersionedTransaction` |
| Swap fails with code 6001 | Slippage exceeded | Increase slippage or retry |
| Code -1005 or -2003 | Quote expired | Get fresh quote, execute faster |
| "Insufficient funds" | Balance too low | Check balance covers amount + fees + rent |
| Transaction too large | Too many accounts | Set `maxAccounts=40` (Metis only) |

For complete error code references, see:
- [Ultra Response Codes](../responses/ultra-swap-order.md) - Execute error codes (-1 to -5), Aggregator codes (-1000s), RFQ codes (-2000s)
- [Metis Response Codes](../responses/metis-swap.md) - Routing errors, program errors, swap transaction errors

---

## Common Misconceptions

### 1. "Higher slippage = better success rate"

**Wrong**: Setting very high slippage (e.g., 500 bps) always helps.

**Correct**: High slippage exposes you to worse execution. Ultra's RTSE (Real Time Slippage Estimator) automatically optimizes slippage. For Metis, start with 50 bps and increase only if needed.

### 2. "I need to manage my own RPC for Ultra"

**Wrong**: Ultra requires RPC setup like Metis.

**Correct**: Ultra is RPC-less. Jupiter handles transaction broadcasting, confirmation, and error handling via the `/execute` endpoint.

### 3. "Gasless means free"

**Wrong**: Gasless swaps have no cost.

**Correct**: Gasless means Jupiter pays the network fees, not that there are no fees. Platform fees (0.03-0.1%) still apply.

### 4. "Quote prices are guaranteed"

**Wrong**: The quoted `outAmount` is what I'll receive.

**Correct**: Quotes are estimates. Actual execution depends on market conditions. Check `otherAmountThreshold` for minimum guaranteed output.

---

## API Errors

### Authentication

```typescript
// Wrong - missing API key
const response = await fetch('https://api.jup.ag/ultra/v1/order?...');

// Correct - include API key header
const response = await fetch('https://api.jup.ag/ultra/v1/order?...', {
  headers: { 'x-api-key': process.env.JUPITER_API_KEY! },
});
```

### Rate Limiting

```typescript
async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, { headers: { 'x-api-key': API_KEY } });
    
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '1');
      await new Promise(r => setTimeout(r, retryAfter * 1000 * (i + 1)));
      continue;
    }
    
    return response;
  }
  throw new Error('Max retries exceeded');
}
```

---

## Common Code Mistakes

### Using Legacy Transaction Class

Jupiter APIs return versioned transactions. Using the legacy `Transaction` class will fail.

```typescript
// Wrong - legacy Transaction class
import { Transaction } from '@solana/web3.js';
const tx = Transaction.from(Buffer.from(order.transaction, 'base64'));

// Correct - VersionedTransaction
import { VersionedTransaction } from '@solana/web3.js';
const tx = VersionedTransaction.deserialize(
  Buffer.from(order.transaction, 'base64')
);
```

### Forgetting to Sign Before Execute

```typescript
// Wrong - serializing without signing
const signedTx = Buffer.from(tx.serialize()).toString('base64');

// Correct - sign first, then serialize
tx.sign([wallet]);
const signedTx = Buffer.from(tx.serialize()).toString('base64');
```

### Using Decimal Amounts Instead of Native Units

All amounts must be in native token units (smallest denomination), not decimals.

```typescript
// Wrong - decimal amounts
const amount = '1.5'; // 1.5 SOL

// Correct - native units (lamports for SOL)
const amount = '1500000000'; // 1.5 SOL = 1.5 × 10^9 lamports

// For USDC (6 decimals)
const usdcAmount = '1500000'; // 1.5 USDC = 1.5 × 10^6
```

### Quote Expiration (Metis)

Quotes expire quickly. Fetch and use immediately.

```typescript
const quote = await getQuote(params);
// Use immediately - don't store for later
const swap = await buildSwap(quote);
```

### Transaction Too Large (Metis)

If transactions exceed size limits, reduce the account count.

```typescript
const quote = await fetch(
  `https://api.jup.ag/swap/v1/quote?...&maxAccounts=40`, // Default is 64
  { headers: { 'x-api-key': API_KEY } }
).then(r => r.json());
```

---

## Debugging Tips

### 1. Check API Status First

Before debugging, check [status.jup.ag](https://status.jup.ag) for outages.

### 2. Log Full Responses

```typescript
const response = await fetch(url, { headers });
const data = await response.json();
console.log('Status:', response.status);
console.log('Headers:', Object.fromEntries(response.headers));
console.log('Body:', JSON.stringify(data, null, 2));
```

### 3. Verify Transactions on Explorer

After getting a signature, check:
- [Solscan](https://solscan.io)
- [Solana Explorer](https://explorer.solana.com)

### 4. Test with Small Amounts

Always test integrations with small amounts first.

---

## References

- [Ultra Response Codes](../responses/ultra-swap-order.md) - Complete error code tables for Ultra API
- [Metis Response Codes](../responses/metis-swap.md) - Complete error code tables for Metis API
- [Jupiter V6 IDL](https://solscan.io/account/JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4#programIdl) - Program error definitions
