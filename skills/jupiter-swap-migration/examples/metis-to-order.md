# Path 3: Metis → Swap v2 `/order`

**When to choose**: You don't need transaction composability and want managed execution with better pricing.

| Element | Before (Metis v1) | After (Swap v2 `/order`) |
|---------|-------------------|--------------------------|
| Base URL | `https://api.jup.ag/swap/v1` | `https://api.jup.ag/swap/v2` |
| Flow | `GET /quote` → `POST /swap-instructions` → build tx → sign → send via RPC | `GET /order` → sign → `POST /execute` |
| Routing | Metis only | All routers (Metis, JupiterZ, Dflow, OKX) |
| Execution | Self-managed via RPC | Managed by Jupiter |
| Gasless | Not available | Automatic when eligible |
| Jupiter fee | None | Yes (variable by pair: 0-50 bps) |

## Before (Metis)

```typescript
// 1. Quote
const quote = await fetch("https://api.jup.ag/swap/v1/quote?" + new URLSearchParams({
  inputMint: SOL_MINT, outputMint: USDC_MINT, amount: "100000000", slippageBps: "50",
}), { headers: { "x-api-key": API_KEY } }).then(r => r.json());

// 2. Get instructions
const instructions = await fetch("https://api.jup.ag/swap/v1/swap-instructions", {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
  body: JSON.stringify({ quoteResponse: quote, userPublicKey: walletAddress }),
}).then(r => r.json());

// 3. Build, sign, send via RPC (complex)
```

## After (Swap v2 `/order`)

```typescript
// 1. Get assembled transaction
const order = await fetch("https://api.jup.ag/swap/v2/order?" + new URLSearchParams({
  inputMint: SOL_MINT, outputMint: USDC_MINT, amount: "100000000", taker: walletAddress,
}), { headers: { "x-api-key": API_KEY } }).then(r => r.json());

// 2. Sign
const tx = VersionedTransaction.deserialize(Buffer.from(order.transaction, "base64"));
tx.sign([wallet]);
const signedTransaction = Buffer.from(tx.serialize()).toString("base64");

// 3. Execute via Jupiter (no RPC management needed)
const result = await fetch("https://api.jup.ag/swap/v2/execute", {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
  body: JSON.stringify({ signedTransaction, requestId: order.requestId }),
}).then(r => r.json());
```

## Trade-offs

- **Gained**: RFQ pricing (5-20 bps better on major pairs), managed execution, gasless, simpler code
- **Lost**: Transaction composability (can't add custom instructions), no Jupiter fee on `/build`
