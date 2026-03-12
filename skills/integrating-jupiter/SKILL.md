---
name: integrating-jupiter
description: Comprehensive guidance for integrating Jupiter APIs (Ultra Swap, Lend, Perps, Trigger, Recurring, Tokens, Price, Portfolio, Prediction Markets, Send, Studio, Lock, Routing). Use for endpoint selection, integration flows, error handling, and production hardening.
license: MIT
metadata:
  author: jup-ag
  version: "1.0.0"
tags:
  - jupiter
  - jup-ag
  - ultra-swap
  - jupiter-lend
  - jupiter-perps
  - jupiter-trigger
  - jupiter-recurring
  - jupiter-portfolio
  - jupiter-prediction
  - jupiter-send
  - jupiter-studio
  - jupiter-lock
  - jupiter-routing
  - jupiterz-rfq
  - iris
  - jupiter-price-api
  - jupiter-tokens-api
  - jupiter-portal
  - jlp
---

# Jupiter API Integration

Single skill for all Jupiter APIs, optimized for fast routing and deterministic execution.

**Base URL**: `https://api.jup.ag`
**Auth**: `x-api-key` from [portal.jup.ag](https://portal.jup.ag/) (**required for Jupiter REST endpoints**)

## Use/Do Not Use

Use when:
- The task requires choosing or calling Jupiter endpoints.
- The task involves swap, lending, perps, orders, pricing, portfolio, send, studio, lock, or routing.
- The user needs debugging help for Jupiter API calls.

Do not use when:
- The task is generic Solana setup with no Jupiter API usage.
- The task is UI-only with no API behavior decisions.

**Triggers**: `swap`, `quote`, `gasless`, `best route`, `lend`, `borrow`, `earn`, `liquidation`, `perps`, `leverage`, `long`, `short`, `position`, `limit order`, `trigger`, `price condition`, `dca`, `recurring`, `scheduled swaps`, `token metadata`, `token search`, `verification`, `shield`, `price`, `valuation`, `price feed`, `portfolio`, `positions`, `holdings`, `prediction markets`, `market odds`, `event market`, `invite transfer`, `send`, `clawback`, `create token`, `studio`, `claim fee`, `vesting`, `distribution lock`, `unlock schedule`, `dex integration`, `rfq integration`, `routing engine`

## Developer Quickstart

```typescript
import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';

const API_KEY = process.env.JUPITER_API_KEY!;  // from portal.jup.ag
if (!API_KEY) throw new Error('Missing JUPITER_API_KEY');
const BASE = 'https://api.jup.ag';
const headers = { 'x-api-key': API_KEY };

async function jupiterFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...headers, ...init?.headers },
  });
  if (res.status === 429) throw { code: 'RATE_LIMITED', retryAfter: 10 };
  if (!res.ok) {
    const raw = await res.text();
    let body: any = { message: raw || `HTTP_${res.status}` };
    try {
      body = raw ? JSON.parse(raw) : body;
    } catch {
      // keep text fallback body
    }
    throw { status: res.status, ...body };
  }
  return res.json();
}

// Sign and send any Jupiter transaction
async function signAndSend(
  txBase64: string,
  wallet: Keypair,
  connection: Connection,
  additionalSigners: Keypair[] = []
): Promise<string> {
  const tx = VersionedTransaction.deserialize(Buffer.from(txBase64, 'base64'));
  tx.sign([wallet, ...additionalSigners]);
  const sig = await connection.sendRawTransaction(tx.serialize(), {
    maxRetries: 0,
    skipPreflight: true,
  });
  return sig;
}
```

## Intent Router (first step)

| User intent | API family | First action |
|---|---|---|
| Swap/quote | [Ultra Swap](#ultra-swap) | `GET /ultra/v1/order` -> sign -> `POST /ultra/v1/execute` |
| Lend/borrow/yield | [Lend](#lend) | `POST /lend/v1/earn/deposit` or `/withdraw` |
| Leverage/perps | [Perps](#perps) | On-chain via Anchor IDL (no REST API yet) |
| Limit orders | [Trigger](#trigger-limit-orders) | `POST /trigger/v1/createOrder` -> sign -> `POST /trigger/v1/execute` |
| DCA/recurring buys | [Recurring](#recurring-dca) | `POST /recurring/v1/createOrder` -> sign -> `POST /recurring/v1/execute` |
| Token search/verification | [Tokens](#tokens) | `GET /tokens/v2/search?query={mint}` |
| Price lookup | [Price](#price) | `GET /price/v3?ids={mints}` |
| Portfolio/positions | [Portfolio](#portfolio) | `GET /portfolio/v1/positions/{address}` |
| Prediction market integration | [Prediction Markets](#prediction-markets) | `GET /prediction/v1/events` -> `POST /prediction/v1/orders` |
| Invite send/clawback | [Send](#send) | `POST /send/v1/craft-send` -> sign -> send to RPC |
| Token creation/fees | [Studio](#studio) | `POST /studio/v1/dbc-pool/create-tx` -> upload -> submit |
| Vesting/distribution | [Lock](#lock) | On-chain program `LocpQgucEQHbqNABEYvBvwoxCPsSbG91A1QaQhQQqjn` |
| DEX/RFQ integration | [Routing](#routing) | Choose DEX (AMM trait) vs RFQ (webhook) path |

## API Playbooks

Use each block as a minimal execution contract. Fetch the linked refs for full request/response shapes, TypeScript interfaces, and parameter details.

### Ultra Swap

- **Base URL**: `https://api.jup.ag/ultra/v1`
- **Triggers**: `swap`, `quote`, `gasless`, `best route`
- **Fee**: 5-10 bps (standard) or 20% of integrator fees when custom fees configured
- **Rate Limit**: 50 req/10s base, scales with 24h execute volume (see [Rate Limits](#rate-limits))
- **Endpoints**: `/order` (GET), `/execute` (POST), `/holdings/{account}` (GET), `/shield` (GET), `/search` (GET), `/routers` (GET)
- **Gotchas**: Signed payloads have ~2 min TTL. Transactions are immutable after receipt. Split order/execute in code and logging. Re-quote before execution when conditions may have changed.
- Refs: [Overview](https://dev.jup.ag/docs/ultra/index.md) | [Order](https://dev.jup.ag/docs/ultra/get-order.md) | [Execute](https://dev.jup.ag/docs/ultra/execute-order.md) | [Responses](https://dev.jup.ag/docs/ultra/response.md) | [OpenAPI](https://dev.jup.ag/openapi-spec/ultra/ultra.yaml)

---

### Lend

- **Base URL**: `https://api.jup.ag/lend/v1`
- **Triggers**: `lend`, `borrow`, `earn`, `liquidation`
- **Programs**: Earn `jup3YeL8QhtSx1e253b2FDvsMNC87fDrgQZivbrndc9`, Borrow `jupr81YtYssSyPt8jbnGuiWon5f6x9TcDEFxYe3Bdzi`
- **SDK**: `@jup-ag/lend` (TypeScript)
- **Endpoints**: `/earn/deposit` (POST), `/earn/withdraw` (POST), `/earn/mint` (POST), `/earn/redeem` (POST), `/earn/deposit-instructions` (POST), `/earn/withdraw-instructions` (POST), `/earn/tokens` (GET), `/earn/positions` (GET), `/earn/earnings` (GET)
- **Gotchas**: Recompute account state before each state-changing action. Encode risk checks (health factors, liquidation boundaries) as preconditions. All deposit/withdraw/mint/redeem return base64 unsigned `VersionedTransaction`.
- Refs: [Overview](https://dev.jup.ag/docs/lend/index.md) | [Earn](https://dev.jup.ag/docs/lend/earn.md) | [SDK](https://dev.jup.ag/docs/lend/sdk.md) | [OpenAPI](https://dev.jup.ag/openapi-spec/lend/lend.yaml)

---

### Perps

- **Status**: API is **work-in-progress**. No REST endpoints yet. Interact on-chain via Anchor IDL.
- **Triggers**: `perps`, `leverage`, `long`, `short`, `position`
- **Community SDK**: [github.com/julianfssen/jupiter-perps-anchor-idl-parsing](https://github.com/julianfssen/jupiter-perps-anchor-idl-parsing)
- **Gotchas**: Max 9 simultaneous positions: 3 long (SOL, wETH, wBTC) + 6 short (3 tokens x 2 collateral USDC/USDT). Validate margin/leverage against account model.
- Refs: [Overview](https://dev.jup.ag/docs/perps/index.md) | [Position account](https://dev.jup.ag/docs/perps/position-account.md) | [Position request](https://dev.jup.ag/docs/perps/position-request-account.md)

---

### Trigger (Limit Orders)

- **Base URL**: `https://api.jup.ag/trigger/v1`
- **Triggers**: `limit order`, `trigger`, `price condition`
- **Fee**: 0.1% (non-stable), 0.03% (stable pairs)
- **Pagination**: 10 orders per page
- **Endpoints**: `/createOrder` (POST), `/cancelOrder` (POST), `/cancelOrders` (POST, max 5 per tx), `/execute` (POST), `/getTriggerOrders` (GET)
- **Gotchas**: Frontend enforces 5 USD min; on-chain has no minimum. Program does NOT validate if rates are favorable — validate target price before create. Token-2022 disabled. Default zero slippage ("Exact" mode); set `slippageBps` for "Ultra" mode with higher fill rate.
- Refs: [Overview](https://dev.jup.ag/docs/trigger/index.md) | [Create](https://dev.jup.ag/docs/trigger/create-order.md) | [Get orders](https://dev.jup.ag/docs/trigger/get-trigger-orders.md) | [Best Practices](https://dev.jup.ag/docs/trigger-api/best-practices) | [OpenAPI](https://dev.jup.ag/openapi-spec/trigger/trigger.yaml)

---

### Recurring (DCA)

- **Base URL**: `https://api.jup.ag/recurring/v1`
- **Triggers**: `dca`, `recurring`, `scheduled swaps`
- **Fee**: 0.1% on all recurring orders
- **Constraints**: Min 100 USD total, min 2 orders, min 50 USD per order
- **Pagination**: 10 orders per page
- **Endpoints**: `/createOrder` (POST), `/cancelOrder` (POST), `/execute` (POST), `/getRecurringOrders` (GET)
- **Gotchas**: Token-2022 NOT supported. Price-based recurring orders are **deprecated** — use `params.time` only.
- Refs: [Overview](https://dev.jup.ag/docs/recurring/index.md) | [Create](https://dev.jup.ag/docs/recurring/create-order.md) | [Get orders](https://dev.jup.ag/docs/recurring/get-recurring-orders.md) | [Best Practices](https://dev.jup.ag/docs/recurring/best-practices) | [OpenAPI](https://dev.jup.ag/openapi-spec/recurring/recurring.yaml)

---

### Tokens

- **Base URL**: `https://api.jup.ag/tokens/v2`
- **Triggers**: `token metadata`, `token search`, `verification`, `shield`
- **Endpoints**: `/search?query={q}` (GET, comma-separate mints, max 100), `/tag?query={tag}` (GET, `verified` or `lst`), `/{category}/{interval}` (GET, categories: `toporganicscore`, `toptraded`, `toptrending`; intervals: `5m`, `1h`, `6h`, `24h`), `/recent` (GET)
- **Gotchas**: Use mint address as primary identity; treat symbol/name as convenience. Surface `audit.isSus` and `organicScore` in UX.
- Refs: [Overview](https://dev.jup.ag/docs/tokens/index.md) | [Token info v2](https://dev.jup.ag/docs/tokens/v2/token-information.md) | [OpenAPI](https://dev.jup.ag/openapi-spec/tokens/v2/tokens.yaml)

---

### Price

- **Base URL**: `https://api.jup.ag/price/v3`
- **Triggers**: `price`, `valuation`, `price feed`
- **Limit**: Max 50 mint IDs per request
- **Endpoints**: `/price/v3?ids={mints}` (GET, comma-separated)
- **Gotchas**: Tokens with unreliable pricing return `null` or are omitted (not an error). Fail closed on missing/low-confidence data for safety-sensitive actions. Use `confidenceLevel` field.
- Refs: [Overview](https://dev.jup.ag/docs/price/index.md) | [Price v3](https://dev.jup.ag/docs/price/v3.md) | [OpenAPI](https://dev.jup.ag/openapi-spec/price/v3/price.yaml)

---

### Portfolio

- **Base URL**: `https://api.jup.ag/portfolio/v1`
- **Status**: Beta — Jupiter platforms only
- **Triggers**: `portfolio`, `positions`, `holdings`
- **Endpoints**: `/positions/{address}` (GET), `/positions/{address}?platforms={ids}` (GET), `/platforms` (GET), `/staked-jup/{address}` (GET)
- **Gotchas**: Treat empty positions as valid state. Response is beta — normalize into stable internal schema. Element types: `multiple`, `liquidity`, `trade`, `leverage`, `borrowlend`.
- Refs: [Overview](https://dev.jup.ag/docs/portfolio/index.md) | [Jupiter positions](https://dev.jup.ag/docs/portfolio/jupiter-positions.md) | [OpenAPI](https://dev.jup.ag/openapi-spec/portfolio/portfolio.yaml)

---

### Prediction Markets

- **Base URL**: `https://api.jup.ag/prediction/v1`
- **Status**: Beta (breaking changes possible)
- **Geo-restricted**: US and South Korea IPs blocked
- **Price convention**: 1,000,000 native units = $1.00 USD
- **Triggers**: `prediction markets`, `market odds`, `event market`
- **Deposit mints**: JupUSD (`JuprjznTrTSp2UFa3ZBUFgwdAmtZCq4MQCwysN55USD`), USDC
- **Endpoints**: `/events` (GET), `/events/search` (GET), `/markets/{marketId}` (GET), `/orderbook/{marketId}` (GET), `/orders` (POST), `/orders/status/{pubkey}` (GET), `/positions` (GET), `/positions/{pubkey}` (DELETE), `/positions/{pubkey}/claim` (POST), `/history` (GET), `/leaderboards` (GET)
- **Gotchas**: Check `position.claimable` before claiming. Winners get $1/contract.
- Refs: [Overview](https://dev.jup.ag/docs/prediction/index.md) | [Events](https://dev.jup.ag/docs/prediction/events-and-markets.md) | [Positions](https://dev.jup.ag/docs/prediction/open-positions.md) | [OpenAPI](https://dev.jup.ag/openapi-spec/prediction/prediction.yaml)

---

### Send

- **Base URL**: `https://api.jup.ag/send/v1`
- **Status**: Beta
- **Triggers**: `invite transfer`, `send`, `clawback`
- **Supported tokens**: SOL, USDC, memecoins
- **Endpoints**: `/craft-send` (POST), `/craft-clawback` (POST), `/pending-invites` (GET), `/invite-history` (GET)
- **Gotchas**: **Dual-sign requirement** — sender + recipient keypair (derived from invite code). Claims only via Jupiter Mobile (no API claiming). Never expose invite codes.
- Refs: [Overview](https://dev.jup.ag/docs/send/index.md) | [Invite code](https://dev.jup.ag/docs/send/invite-code.md) | [Craft send](https://dev.jup.ag/docs/send/craft-send.md) | [OpenAPI](https://dev.jup.ag/openapi-spec/send/send.yaml)

---

### Studio

- **Base URL**: `https://api.jup.ag/studio/v1`
- **Status**: Beta
- **Triggers**: `create token`, `studio`, `claim fee`
- **Endpoints**: `/dbc-pool/create-tx` (POST), `/dbc-pool/submit` (POST, multipart/form-data), `/dbc-pool/addresses/{mint}` (GET), `/dbc/fee` (POST), `/dbc/fee/create-tx` (POST)
- **Flow**: create-tx -> upload image to presigned URL -> upload metadata to presigned URL -> sign -> submit via `/dbc-pool/submit`
- **Gotchas**: Must submit via `/dbc-pool/submit` (not externally) for token to get a Studio page on jup.ag. Error codes: `403` = not authorized for pool, `404` = proxy account not found.
- Refs: [Overview](https://dev.jup.ag/docs/studio/index.md) | [Create token](https://dev.jup.ag/docs/studio/create-token.md) | [Claim fee](https://dev.jup.ag/docs/studio/claim-fee.md) | [OpenAPI](https://dev.jup.ag/openapi-spec/studio/studio.yaml)

---

### Lock

- **Program ID**: `LocpQgucEQHbqNABEYvBvwoxCPsSbG91A1QaQhQQqjn`
- **Triggers**: `vesting`, `distribution lock`, `unlock schedule`
- **Integration**: On-chain program only (no REST API)
- **Source**: [github.com/jup-ag/jup-lock](https://github.com/jup-ag/jup-lock)
- **UI**: [lock.jup.ag](https://lock.jup.ag/)
- **Security**: Audited by OtterSec and Sec3
- **Gotchas**: No REST API. Use instruction scripts from the repo's `cli/src/bin/instructions` directory.
- Refs: [Lock overview](https://dev.jup.ag/docs/lock/index.md)

---

### Routing

- **Triggers**: `dex integration`, `rfq integration`, `routing engine`
- **Engines**: Juno (meta-aggregator), Iris (multi-hop DEX routing, powers Ultra), JupiterZ (RFQ market maker quotes)
- **DEX Integration** (into Iris): Free, no fees. Prereqs: code health, security audit, market traction. Implement `jupiter-amm-interface` crate. **Critical**: No network calls in implementation (accounts are pre-batched and cached). Ref impl: [github.com/jup-ag/rust-amm-implementation](https://github.com/jup-ag/rust-amm-implementation)
- **RFQ Integration** (JupiterZ): Market makers host webhook at `/jupiter/rfq/quote` (POST, 250ms), `/jupiter/rfq/swap` (POST), `/jupiter/rfq/tokens` (GET). Reqs: 95% fill rate, 250ms response, 55s expiry. SDK: [github.com/jup-ag/rfq-webhook-toolkit](https://github.com/jup-ag/rfq-webhook-toolkit)
- **Market Listing**: Instant routing for tokens < 30 days old. Normal routing (checked every 30 min) requires < 30% loss on $500 round-trip OR < 20% price impact comparing $1k vs $500.
- Refs: [Overview](https://dev.jup.ag/docs/routing/index.md) | [DEX integration](https://dev.jup.ag/docs/routing/dex-integration.md) | [RFQ integration](https://dev.jup.ag/docs/routing/rfq-integration.md) | [Market listing](https://dev.jup.ag/docs/routing/market-listing.md)

---

## Rate Limits

**Ultra Swap** (dynamic, volume-based):

| 24h Execute Volume | Requests per 10s window |
|--------------------|-------------------------|
| $0 | 50 |
| $10,000 | 51 |
| $100,000 | 61 |
| $1,000,000 | 165 |

Quotas recalculate every 10 minutes. Pro plan does NOT increase Ultra limits.

**Other APIs**: Managed at portal level. Check [portal rate limits](https://dev.jup.ag/portal/rate-limit.md).

**On HTTP 429**: Exponential backoff with jitter: `delay = min(baseDelay * 2^attempt + random(0, jitter), maxDelay)`. Wait for 10s sliding window refresh. Do NOT burst aggressively.

## Production Hardening

1. **Auth**: Fail fast if `x-api-key` is missing or invalid.
2. **Timeouts**: 5s for quotes, 30s for executions, plus total operation timeout.
3. **Retries**: Only transient/network/rate-limit failures with exponential backoff + jitter.
4. **Idempotency**: Ultra `/execute` accepts same `signedTransaction` + `requestId` for up to 2 min without duplicate execution.
5. **Validation**: Validate mint addresses, amount precision, and wallet ownership before calls.
6. **Safety**: Enforce slippage and max-amount guardrails from app config.
7. **Observability**: Log `requestId`, API family, endpoint, latency, status, and error code.
8. **UX resilience**: Return actionable states (`retry`, `adjust params`, `insufficient balance`, `rate limited`).
9. **Consistency**: Reconcile async states (submitted vs confirmed vs failed) before final user success.
10. **Freshness**: Re-fetch referenced docs when behavior differs from expected flow.

## Integration Best Practices

1. Start from the API-specific overview before coding endpoint calls.
2. Enforce auth as a hard precondition for every request. Ref: [Portal setup](https://dev.jup.ag/portal/setup.md)
3. Design retry logic around documented rate-limit behavior, not fixed assumptions. Ref: [Rate limits](https://dev.jup.ag/portal/rate-limit.md)
4. Map all non-success responses to typed app errors using documented response semantics. Ref: [API responses](https://dev.jup.ag/portal/responses.md)
5. For order-based products (Ultra/Trigger/Recurring), separate create/execute/retrieve phases in code and logs.
6. Treat network/service health as part of runtime behavior (degrade gracefully). Ref: [Status page](https://status.jup.ag/)

## Cross-Cutting Error Pattern

```typescript
interface JupiterResult<T> {
  ok: boolean;
  result?: T;
  error?: { code: string | number; message: string; retryable: boolean };
}

async function jupiterAction<T>(action: () => Promise<T>): Promise<JupiterResult<T>> {
  try {
    const result = await action();
    return { ok: true, result };
  } catch (error: any) {
    const code = error?.code ?? error?.status ?? 'UNKNOWN';

    // Rate limit — retry with backoff
    if (code === 429 || code === 'RATE_LIMITED') {
      return { ok: false, error: { code: 'RATE_LIMITED', message: 'Rate limited', retryable: true } };
    }

    // Ultra execute errors (negative codes)
    if (typeof code === 'number' && code < 0) {
      const retryable = [-1, -1000, -1001, -1005, -1006, -2000, -2003, -2005].includes(code);
      return { ok: false, error: { code, message: error?.error ?? 'Execute failed', retryable } };
    }

    // Program errors (positive codes like 6001 = slippage)
    if (typeof code === 'number' && code > 0) {
      return { ok: false, error: { code, message: error?.error ?? 'Program error', retryable: false } };
    }

    return { ok: false, error: { code, message: error?.message ?? 'UNKNOWN_ERROR', retryable: false } };
  }
}
```


## Complete Working Examples

Production-ready code snippets for the most common Jupiter operations. Copy-paste ready with full error handling.

### Ultra Swap: End-to-End

Complete SOL → USDC swap with order, sign, execute, and confirmation:

```typescript
import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';

const API_KEY = process.env.JUPITER_API_KEY!;
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_URL);
const wallet = Keypair.fromSecretKey(bs58.decode(process.env.WALLET_PRIVATE_KEY!));

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

async function swapSolToUsdc(amountLamports: number) {
  // 1. Get order
  const orderUrl = new URL('https://api.jup.ag/ultra/v1/order');
  orderUrl.searchParams.set('inputMint', SOL_MINT);
  orderUrl.searchParams.set('outputMint', USDC_MINT);
  orderUrl.searchParams.set('amount', amountLamports.toString());
  orderUrl.searchParams.set('taker', wallet.publicKey.toBase58());

  const orderRes = await fetch(orderUrl.toString(), {
    headers: { 'x-api-key': API_KEY },
  });

  if (!orderRes.ok) {
    const err = await orderRes.text();
    throw new Error(`Order failed (${orderRes.status}): ${err}`);
  }

  const order = await orderRes.json();

  if (order.error) {
    throw new Error(`Order error: ${order.error}`);
  }

  // 2. Sign the transaction
  const txBuf = Buffer.from(order.transaction, 'base64');
  const tx = VersionedTransaction.deserialize(txBuf);
  tx.sign([wallet]);

  const signedTx = Buffer.from(tx.serialize()).toString('base64');

  // 3. Execute
  const execRes = await fetch('https://api.jup.ag/ultra/v1/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({
      signedTransaction: signedTx,
      requestId: order.requestId,
    }),
  });

  if (!execRes.ok) {
    const err = await execRes.text();
    throw new Error(`Execute failed (${execRes.status}): ${err}`);
  }

  const result = await execRes.json();

  // 4. Confirm
  if (result.status === 'Success') {
    return {
      signature: result.signature,
      inputAmount: result.inputAmount,
      outputAmount: result.outputAmount,
      explorerUrl: `https://solscan.io/tx/${result.signature}`,
    };
  }

  throw new Error(`Swap failed: ${result.error || result.code || 'unknown'}`);
}

// Usage: swapSolToUsdc(1_000_000_000) → swaps 1 SOL
```

### Retry Helper with Exponential Backoff

Use this wrapper for any Jupiter API call to handle rate limits and transient failures:

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { maxRetries?: number; baseDelay?: number; maxDelay?: number } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000 } = opts;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const code = err?.code ?? err?.status;
      const isRetryable =
        code === 429 ||
        code === 'RATE_LIMITED' ||
        code === 503 ||
        (typeof code === 'number' && code < 0 && [-1, -1000, -1001, -1005, -1006, -2000, -2003, -2005].includes(code));

      if (!isRetryable || attempt === maxRetries) throw err;

      const jitter = Math.random() * 500;
      const delay = Math.min(baseDelay * Math.pow(2, attempt) + jitter, maxDelay);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw new Error('Retry exhausted');
}

// Usage:
// const order = await withRetry(() => fetchOrder(params));
// const result = await withRetry(() => executeSwap(signedTx, requestId));
```

### Price Lookup: Multi-Token

Fetch current prices for multiple tokens with confidence filtering:

```typescript
async function getPrices(mints: string[], confidenceLevel: 'low' | 'medium' | 'high' = 'medium') {
  const url = new URL('https://api.jup.ag/price/v3');
  url.searchParams.set('ids', mints.join(','));

  const res = await fetch(url.toString(), {
    headers: { 'x-api-key': API_KEY },
  });

  if (!res.ok) throw new Error(`Price API ${res.status}`);

  const data = await res.json();
  const prices: Record<string, { price: number; confidence: string } | null> = {};

  for (const mint of mints) {
    const entry = data.data?.[mint];
    if (!entry || !entry.price) {
      prices[mint] = null; // token not priced or unreliable
      continue;
    }

    // Filter by confidence — fail closed on low-confidence data
    const levels = ['low', 'medium', 'high'];
    const entryLevel = entry.confidenceLevel || 'low';
    if (levels.indexOf(entryLevel) < levels.indexOf(confidenceLevel)) {
      prices[mint] = null;
      continue;
    }

    prices[mint] = { price: parseFloat(entry.price), confidence: entryLevel };
  }

  return prices;
}

// Usage: getPrices([SOL_MINT, USDC_MINT, WBTC_MINT])
```

### Lend: USDC Deposit

Deposit USDC into Jupiter Lend earn pool:

```typescript
async function depositToLend(amount: number, tokenMint: string) {
  // 1. Get deposit transaction
  const res = await fetch('https://api.jup.ag/lend/v1/earn/deposit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({
      owner: wallet.publicKey.toBase58(),
      tokenMint,
      amount: amount.toString(),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Lend deposit failed (${res.status}): ${err}`);
  }

  const data = await res.json();

  // 2. Sign and send the returned transaction
  const signature = await signAndSend(data.transaction, wallet, connection);

  // 3. Confirm
  const confirmation = await connection.confirmTransaction(signature, 'confirmed');

  if (confirmation.value.err) {
    throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
  }

  return { signature, explorerUrl: `https://solscan.io/tx/${signature}` };
}

// Usage: depositToLend(1000_000_000, USDC_MINT) → deposits 1000 USDC (6 decimals)
```

### Trigger: Limit Order

Create a limit order to buy SOL when price drops:

```typescript
async function createLimitOrder(
  inputMint: string,
  outputMint: string,
  makingAmount: string,
  takingAmount: string
) {
  // 1. Create order
  const res = await fetch('https://api.jup.ag/trigger/v1/createOrder', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({
      maker: wallet.publicKey.toBase58(),
      payer: wallet.publicKey.toBase58(),
      inputMint,
      outputMint,
      makingAmount,
      takingAmount,
      expiredAt: null, // no expiry
      feeBps: 0,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Create order failed (${res.status}): ${err}`);
  }

  const data = await res.json();

  // 2. Sign and execute
  const execRes = await fetch('https://api.jup.ag/trigger/v1/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({
      signedTransaction: await signTx(data.transaction),
      requestId: data.requestId,
    }),
  });

  const result = await execRes.json();
  return result;
}

// Usage: createLimitOrder(USDC_MINT, SOL_MINT, '150000000', '1000000000')
// → Buy 1 SOL when price hits 150 USDC
```

### Ultra Swap Error Codes Reference

Common error codes returned by `/ultra/v1/execute` with recommended actions:

| Code | Meaning | Retryable | Action |
|------|---------|-----------|--------|
| `-1` | Transaction expired | ✅ | Re-quote and retry |
| `-1000` | Transaction failed (generic) | ✅ | Re-quote with adjusted params |
| `-1001` | Slippage exceeded | ✅ | Increase `slippageBps` or re-quote |
| `-1005` | Transaction not confirmed | ✅ | Wait and check status, then retry |
| `-1006` | Transaction dropped | ✅ | Re-quote and retry |
| `-2000` | Internal error | ✅ | Retry with backoff |
| `-2003` | Service unavailable | ✅ | Retry with longer backoff |
| `-2005` | Timeout | ✅ | Retry with backoff |
| `6001` | Slippage tolerance exceeded (on-chain) | ❌ | Increase slippage or reduce amount |
| `6003` | Insufficient funds | ❌ | Check wallet balance |
| `429` | Rate limited | ✅ | Exponential backoff, wait 10s window |

---

## Fresh Context Policy

Always fetch the freshest context from referenced docs/specs before executing a playbook.

1. Resolve intent with `Intent Router`.
2. Before coding, fetch the playbook's linked refs (overview + API-specific docs).
3. If needed for validation or ambiguity, fetch the OpenAPI spec.
4. Treat fetched docs as source of truth over cached memory.
5. If fetched docs conflict with this file, follow fetched docs and note the mismatch.
6. If docs cannot be fetched, state that context is stale/unverified and continue with best-known guidance.
7. Keep auth invariant: `x-api-key` is required for Jupiter REST endpoints (not on-chain-only flows like Perps/Lock).

## Operational References

- [Portal setup](https://dev.jup.ag/portal/setup.md) — API key configuration
- [Rate limits](https://dev.jup.ag/portal/rate-limit.md) — Global rate limit policy
- [Ultra rate limits](https://dev.jup.ag/docs/ultra/rate-limit.md) — Dynamic volume-based limits
- [API responses](https://dev.jup.ag/portal/responses.md) — Response format standards
- [Ultra responses](https://dev.jup.ag/docs/ultra/response.md) — Detailed error codes
- [Status page](https://status.jup.ag/) — Service health
- [Documentation sitemap](https://dev.jup.ag/llms.txt) — Full docs index
- [Tool Kits](https://dev.jup.ag/tool-kits/plugin/index.md) — Plugin, Wallet Kit, Referral Program