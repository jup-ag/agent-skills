---
title: Common Errors and Misconceptions
description: Common errors, misconceptions, and debugging tips for Jupiter API integrations.
---

# Common Errors and Misconceptions

## Common Misconceptions

### 1. "Metis is Jupiter"

**Wrong**: Metis quotes are often labeled as "Jupiter quotes."

**Correct**: Jupiter runs on Ultra's execution engine with multi-router aggregation, RFQ system, and MEV protection. Metis is a separate, low-level swap primitive now at [metis.builders](https://metis.builders).

### 2. "Higher slippage = better success rate"

**Wrong**: Setting very high slippage (e.g., 500 bps) always helps.

**Correct**: High slippage exposes you to worse execution. Ultra's RTSE (Real Time Slippage Estimator) automatically optimizes slippage. For Metis, start with 50 bps and increase only if needed.

### 3. "I need to manage my own RPC for Ultra"

**Wrong**: Ultra requires RPC setup like Metis.

**Correct**: Ultra is RPC-less. Jupiter handles transaction broadcasting, confirmation, and error handling via the `/execute` endpoint.

### 4. "Gasless means free"

**Wrong**: Gasless swaps have no cost.

**Correct**: Gasless means Jupiter pays the network fees, not that there are no fees. Platform fees (0.03-0.1%) still apply.

### 5. "Quote prices are guaranteed"

**Wrong**: The quoted `outAmount` is what I'll receive.

**Correct**: Quotes are estimates. Actual execution depends on market conditions. Check `otherAmountThreshold` for minimum guaranteed output.

## API Errors

### Authentication Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Missing or invalid API key | Add `x-api-key` header |
| 403 Forbidden | API key lacks permissions | Check key permissions in portal |

```typescript
// Wrong
const response = await fetch('https://api.jup.ag/ultra/v1/order?...');

// Correct
const response = await fetch('https://api.jup.ag/ultra/v1/order?...', {
  headers: { 'x-api-key': process.env.JUPITER_API_KEY! },
});
```

### Rate Limit Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 429 Too Many Requests | Rate limit exceeded | Implement exponential backoff |

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

### Quote Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Could not find any routes" | No liquidity path exists | Check token mints, try different pair |
| "Amount too small" | Below minimum trade size | Increase amount |
| "Invalid mint address" | Malformed mint | Verify mint address format |

### Transaction Errors

| Code | Error | Cause | Solution |
|------|-------|-------|----------|
| 6001 | Slippage tolerance exceeded | Price moved too much | Increase slippage or retry |
| 6008 | NotEnoughAccountKeys | Modified swap transaction | Don't modify transaction, missing account keys |
| 6014 | IncorrectTokenProgramID | Token2022 platform fee attempt | Platform fees not supported on Token2022 tokens |
| 6017 | ExactOutAmountNotMatched | Output amount mismatch | Similar to slippage, increase tolerance |
| 6024 | InsufficientFunds | Not enough balance | Check balance for swap amount, tx fees, and rent |
| 6025 | InvalidTokenAccount | Bad token account | Token account uninitialized or unexpected |
| -1000 | Failed to land | Transaction failed to land on the network | Increase priority fee, retry |
| -1001 | Unknown error | Unknown error occurred | Try again, if persists reach out in Discord |
| -1002 | Invalid transaction | Transaction is invalid | Try again, if persists reach out in Discord |
| -1003 | Transaction not fully signed | Failed to sign the transaction correctly | Check signing process |
| -1004 | Invalid block height | The block height is invalid | Get fresh quote, retry |
| -1005 | Expired | The submitted transaction has expired | Get fresh quote, retry quickly |
| -1006 | Timed out | The submitted transaction has timed out | Retry with fresh quote |
| -1007 | Gasless unsupported wallet | The wallet is not supported for gasless | Use a supported wallet or disable gasless |
| -2000 | Failed to land | Transaction failed to land | Please try again, if it persists please reach out in Discord |
| -2001 | Unknown error | Unknown error occurred | Please try again, if it persists please reach out in Discord |
| -2002 | Invalid payload | Payload is invalid | Please try again, if it persists please reach out in Discord |
| -2003 | Quote expired | User did not respond in time or RFQ provider did not execute in time | Retry with fresh quote |
| -2004 | Swap rejected | User or RFQ provider rejected the swap | Check rejection reason, retry if appropriate |
| -2005 | Internal error | Internal error occurred | Please try again, if it persists please reach out in Discord |

## Solana Transaction Errors

### Deserialization Errors

```typescript
// Wrong - Using Transaction instead of VersionedTransaction
import { Transaction } from '@solana/web3.js';
const tx = Transaction.from(Buffer.from(order.transaction, 'base64'));

// Correct - Ultra returns VersionedTransaction
import { VersionedTransaction } from '@solana/web3.js';
const tx = VersionedTransaction.deserialize(
  Buffer.from(order.transaction, 'base64')
);
```

### Signing Errors

```typescript
// Wrong - Not signing before execute
const signedTx = Buffer.from(tx.serialize()).toString('base64');

// Correct - Sign with wallet
tx.sign([wallet]);
const signedTx = Buffer.from(tx.serialize()).toString('base64');
```

### Amount Unit Errors

```typescript
// Wrong - Using decimal amounts
const amount = '1.5'; // 1.5 SOL

// Correct - Using native units (lamports)
const amount = '1500000000'; // 1.5 SOL in lamports (9 decimals)

// For USDC (6 decimals)
const usdcAmount = '1500000'; // 1.5 USDC
```

## Ultra-Specific Errors

### Execute Errors

| Code | Description | Solution |
|------|-------------|----------|
| -1 | Missing cached order | `requestId` expired, get new quote |
| -2 | Invalid signed transaction | Check signing process |
| -3 | Invalid message bytes | Don't modify transaction |
| -4 | Missing request id | Include `requestId` from order |
| -5 | Missing signed transaction | Include `signedTransaction` |

### Order Errors

| Code | Message | Solution |
|------|---------|----------|
| 1 | Insufficient funds | User needs more tokens |
| 2 | Top up SOL for gas | User needs SOL for fees |
| 3 | Minimum for gasless | Increase trade size or disable gasless |

## Metis-Specific Errors

### Quote Not Found

```typescript
// Error: Quote expired or not found
// Solution: Always use fresh quote for swap

const quote = await getQuote(params);
// Use immediately - quotes expire quickly
const swap = await buildSwap(quote);
```

### Transaction Too Large

```typescript
// Error: Transaction too large
// Solution: Reduce maxAccounts

const quote = await fetch(
  `https://api.jup.ag/swap/v1/quote?...&maxAccounts=40`, // Lower from default 64
  { headers: { 'x-api-key': API_KEY } }
).then(r => r.json());
```

## Debugging Tips

### 1. Check API Status

Before debugging, check [status.jup.ag](https://status.jup.ag) for outages.

### 2. Log Full Responses

```typescript
const response = await fetch(url, { headers });
const data = await response.json();
console.log('Status:', response.status);
console.log('Headers:', Object.fromEntries(response.headers));
console.log('Body:', JSON.stringify(data, null, 2));
```

### 3. Verify Transaction on Explorer

After getting a signature, check:
- [Solscan](https://solscan.io)
- [Solana Explorer](https://explorer.solana.com)

### 4. Test with Small Amounts

Always test integrations with small amounts first.

## References

- [Ultra Response Codes](./responses/ultra-swap-order.md)
- [Metis Response Codes](./responses/metis-swap.md)
- [Jupiter V6 IDL](https://solscan.io/account/JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4#programIdl)
