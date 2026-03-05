---
name: jupiter-lending
description: >
  Guides agents through Jupiter Lend Earn integrations: deposit/withdraw
  flows via REST API, position and earnings monitoring, risk management
  (health factors, liquidation boundaries, account state refresh), and
  mint/redeem receipt token operations. Use when the task involves
  supplying assets for yield or managing Jupiter Lend positions.
license: MIT
metadata:
  author: jupiter
  version: "1.0.0"
tags:
  - jupiter
  - jupiter-lend
  - jup-ag
  - solana
  - lending
  - earn
  - yield
  - defi
  - deposit
  - withdraw
---

# Jupiter Lending

Deep integration guide for Jupiter Lend Earn: deposit/withdraw flows, position monitoring, and risk management.

## Use / Do Not Use

**Use when:**
- Depositing assets for yield or withdrawing from Earn positions
- Monitoring lending positions, earnings, or available tokens
- Managing lending risk (health factors, liquidation, debt ceiling)

**Do not use when:**
- Swapping tokens (not a lending operation)
- Working with non-lending APIs (Perps, Trigger, Recurring, etc.)

**Triggers:** `lend`, `earn`, `deposit yield`, `withdraw`, `APY`, `health factor`, `liquidation`, `lending position`, `receipt token`, `supply collateral`, `jupiter lend`, `earn deposit`, `earn withdraw`

---

## Architecture

Jupiter Lend uses a unified liquidity model where Earn depositors supply assets and Borrow users consume them. Both share the same liquidity pool.

### Program Addresses

| Program | Address | Purpose |
|---------|---------|---------|
| Earn | `jup3YeL8QhtSx1e53b2FDvsMNC87fDrgQZivbrndc9` | Deposit/withdraw yield positions |
| Borrow | `jupr81YtYssSyPt8jbnGuiWon5f6x9TcDEFxYe3Bdzi` | Borrow against collateral |
| Rewards | Program-derived | Earn reward distribution |
| Liquidity | Pool-derived | Shared liquidity between Earn and Borrow |
| Oracle | Pyth/Switchboard | Price feeds for risk calculations |

**Key invariant:** All state-changing endpoints (`deposit`, `withdraw`, `mint`, `redeem`) return an unsigned base64 `VersionedTransaction`. You must deserialize, sign, and submit it.

**Automated Debt Ceiling:** Withdrawals are rate-limited by a smoothing curve that prevents sudden liquidity drains. Large withdrawals may be partially filled.

---

## Endpoint Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/earn/deposit` | POST | Deposit assets to earn yield |
| `/earn/withdraw` | POST | Withdraw assets from position |
| `/earn/mint` | POST | Deposit and receive share receipt tokens |
| `/earn/redeem` | POST | Burn receipt tokens to withdraw |
| `/earn/deposit-instructions` | POST | Get composable deposit instructions |
| `/earn/withdraw-instructions` | POST | Get composable withdraw instructions |
| `/earn/tokens` | GET | List available Earn tokens and APY |
| `/earn/positions` | GET | Get user's current positions |
| `/earn/earnings` | GET | Get historical earnings data |

All endpoints use base URL `https://api.jup.ag/lend/v1`.

---

## Deposit / Withdraw Flow

### Deposit

```typescript
import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';

const userPubkey = wallet.publicKey.toBase58();
const mintAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC
const amount = '1000000'; // 1 USDC (6 decimals)

// Step 1: ALWAYS recompute account state before state-changing operations
// (Stale state is the #1 cause of failed lending transactions)

// Step 2: Request deposit transaction
const depositResult = await jupiterFetch<{ transaction: string }>('/lend/v1/earn/deposit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    owner: userPubkey,
    mintAddress,
    amount,
  }),
});

// Step 3: Deserialize, sign, and send
const tx = VersionedTransaction.deserialize(
  Buffer.from(depositResult.transaction, 'base64')
);
tx.sign([wallet]);
const sig = await connection.sendRawTransaction(tx.serialize(), {
  maxRetries: 0,
  skipPreflight: true,
});

// Step 4: Confirm and verify position updated
await connection.confirmTransaction(sig, 'confirmed');
const positions = await jupiterFetch<EarnPosition[]>(
  `/lend/v1/earn/positions?owner=${userPubkey}`
);
console.log('Updated positions:', positions);
```

### Withdraw

The withdraw flow follows the same pattern: POST to `/earn/withdraw` with `{ owner, mintAddress, amount }`, then sign and send. Key differences:

- **Debt ceiling:** If pool liquidity is constrained, you may receive less than requested. The transaction will succeed but with a partial amount. Always verify the actual withdrawn amount on-chain.
- **Retry for remainder:** If a partial withdrawal occurs, wait and retry for the remaining amount as liquidity becomes available.

### Mint / Redeem (Share-Based)

`/earn/mint` and `/earn/redeem` are share-based alternatives to deposit/withdraw. Mint gives you receipt tokens representing your pool share; redeem burns them. Same request pattern — use when you need transferable position tokens. The underlying flow is identical: POST -> sign -> send.

---

## Monitoring Positions & Earnings

```typescript
// Get all Earn positions for a wallet
const positions = await jupiterFetch<EarnPosition[]>(
  `/lend/v1/earn/positions?owner=${userPubkey}`
);
// Empty array is valid — user has no active positions

// Get earnings history
const earnings = await jupiterFetch<EarnEarnings>(
  `/lend/v1/earn/earnings?owner=${userPubkey}`
);

// List available tokens with current APY
const tokens = await jupiterFetch<EarnToken[]>('/lend/v1/earn/tokens');
// Use to show available deposit options and compare yields
```

**Polling guidance:** Check positions on a schedule (e.g., every 30s-60s for dashboards), not on every user interaction. APY data from `/earn/tokens` changes slowly — cache for 5-10 minutes.

Treat empty positions as valid state — the user may have fully withdrawn or never deposited.

---

## Risk Management Decision Rules

Risk management is the core value of this skill. Every state-changing operation should be guarded by these checks.

### Health Factor Checks

Before any withdraw or borrow-related action, verify the health factor won't drop below safe thresholds:

| Health Factor | Status | Action |
|--------------|--------|--------|
| > 2.0 | Healthy | Proceed normally |
| 1.5 - 2.0 | Caution | Warn user, allow action with confirmation |
| 1.0 - 1.5 | At risk | Strong warning, suggest reducing exposure |
| < 1.0 | Liquidatable | Do NOT withdraw. Advise depositing more or repaying |

### Liquidation Boundaries

- Maximum LTV can reach up to 95% depending on the asset
- Liquidation is partial — not all collateral is seized
- Liquidation penalty applies (asset-specific)
- Monitor health factor proactively, not reactively

### Safe Withdraw Pattern

```typescript
async function safeWithdraw(
  owner: string, mintAddress: string, amount: string
): Promise<string> {
  // 1. Check health factor (if user has borrow positions)
  const positions = await jupiterFetch<EarnPosition[]>(
    `/lend/v1/earn/positions?owner=${owner}`
  );
  const position = positions.find(p => p.mintAddress === mintAddress);
  if (!position) throw new Error('No position found for this mint');

  // 2. Check available liquidity (debt ceiling may limit withdrawals)
  // The API will return a transaction for the maximum withdrawable amount
  // if the requested amount exceeds available liquidity

  // 3. Submit withdrawal
  const result = await jupiterFetch<{ transaction: string }>('/lend/v1/earn/withdraw', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ owner, mintAddress, amount }),
  });

  // 4. Sign and send
  const tx = VersionedTransaction.deserialize(
    Buffer.from(result.transaction, 'base64')
  );
  tx.sign([wallet]);
  const sig = await connection.sendRawTransaction(tx.serialize(), {
    maxRetries: 0,
    skipPreflight: true,
  });

  // 5. Verify actual withdrawn amount matches expected
  await connection.confirmTransaction(sig, 'confirmed');
  return sig;
}
```

### Debt Ceiling Handling

The automated debt ceiling uses a smoothing curve to prevent sudden liquidity drains:
- Large withdrawals may be partially filled
- The actual amount withdrawn may be less than requested
- Retry the remainder after a delay (liquidity replenishes as borrowers repay)
- Never assume `withdrawnAmount === requestedAmount` under constrained liquidity

### Critical Anti-Patterns

- **Never skip account state refresh.** Stale state is the #1 cause of failed lending transactions. Always recompute before deposit/withdraw.
- **Never assume withdraw amount equals requested amount under debt ceiling.** Always verify on-chain.
- **Never ignore health factor below threshold.** A withdraw that drops health factor below 1.0 can trigger immediate liquidation.

---

## Error Handling

### HTTP Errors

| Status | Meaning | Action |
|--------|---------|--------|
| 400 | Bad request (invalid params) | Check mint address, amount, owner |
| 401 | Unauthorized | Check API key from [portal.jup.ag](https://portal.jup.ag/) |
| 429 | Rate limited | Exponential backoff + jitter |
| 500 | Server error | Retry with backoff |

### Transaction Failures

- **Simulation failure** = most likely stale account state. Recompute state and rebuild the transaction.
- **On-chain program error** = check transaction logs for Earn/Borrow program error codes. Common causes: insufficient balance, health factor violation, or debt ceiling constraint.
- **Timeout** = check on-chain status before retrying. The transaction may have landed.

---

## References

- [Lend Overview](https://dev.jup.ag/docs/lend/index.md)
- [Earn API](https://dev.jup.ag/docs/lend/earn.md)
- [Lend SDK (`@jup-ag/lend`)](https://dev.jup.ag/docs/lend/sdk.md)
- [OpenAPI Spec](https://dev.jup.ag/openapi-spec/lend/lend.yaml)
- [Documentation Sitemap](https://dev.jup.ag/llms.txt)
