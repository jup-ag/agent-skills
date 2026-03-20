# Path 1: Ultra → Swap v2 `/order`

**Effort**: Minimal — only the base URL changes. Parameters and response format are identical.

| Element | Before | After |
|---------|--------|-------|
| Base URL | `https://ultra-api.jup.ag` | `https://api.jup.ag/swap/v2` |
| Order endpoint | `GET /order` | `GET /order` (unchanged) |
| Execute endpoint | `POST /execute` | `POST /execute` (unchanged) |

## Before

```typescript
const BASE_URL = "https://ultra-api.jup.ag";

const order = await fetch(`${BASE_URL}/order?` + new URLSearchParams({
  inputMint: SOL_MINT,
  outputMint: USDC_MINT,
  amount: "100000000",
  taker: walletAddress,
}), { headers: { "x-api-key": API_KEY } }).then(r => r.json());

// ... sign transaction ...

const result = await fetch(`${BASE_URL}/execute`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
  body: JSON.stringify({ signedTransaction, requestId: order.requestId }),
}).then(r => r.json());
```

## After

```typescript
const BASE_URL = "https://api.jup.ag/swap/v2";  // ← only change

const order = await fetch(`${BASE_URL}/order?` + new URLSearchParams({
  inputMint: SOL_MINT,
  outputMint: USDC_MINT,
  amount: "100000000",
  taker: walletAddress,
}), { headers: { "x-api-key": API_KEY } }).then(r => r.json());

// ... sign transaction ...

const result = await fetch(`${BASE_URL}/execute`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
  body: JSON.stringify({ signedTransaction, requestId: order.requestId }),
}).then(r => r.json());
```

## New response fields

The v2 `/order` response now also includes:
- `router` — which router won: `"iris"`, `"jupiterz"`, `"dflow"`, or `"okx"`
- `mode` — `"ultra"` (all routers competed) or `"manual"` (optional params restricted routing)
- `feeBps` — fee basis points applied
- `feeMint` — mint of the fee token

The v2 `/execute` response uses `inputAmountResult` and `outputAmountResult` as confirmed in the official docs. If your Ultra code used different field names (e.g. `inputAmount`/`outputAmount`), update them. Verify against your live responses if you see unexpected nulls.
