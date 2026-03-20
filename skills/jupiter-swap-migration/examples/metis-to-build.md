# Path 2: Metis → Swap v2 `/build`

**Effort**: Moderate — consolidates two API calls into one, with parameter and response mapping changes.

| Element | Before (Metis v1) | After (Swap v2) |
|---------|-------------------|-----------------|
| Base URL | `https://api.jup.ag/swap/v1` | `https://api.jup.ag/swap/v2` |
| Flow | `GET /quote` → `POST /swap-instructions` | `GET /build` (single call) |
| Transaction control | Full | Full (unchanged) |
| Jupiter fee | None | None |

## Parameter mapping

| Metis v1 (`/quote`) | Swap v2 (`/build`) | Notes |
|----------------------|-------------------|-------|
| `inputMint` | `inputMint` | Unchanged |
| `outputMint` | `outputMint` | Unchanged |
| `amount` | `amount` | Unchanged |
| `slippageBps` | `slippageBps` | Defaults to 50 in v2 |
| `swapMode` | — | **Removed**. V2 only supports `ExactIn` |
| `dexes` | `dexes` | Unchanged |
| `excludeDexes` | `excludeDexes` | Unchanged |
| `maxAccounts` | `maxAccounts` | Defaults to 64 |
| `platformFeeBps` | `platformFeeBps` | Unchanged |
| `userPublicKey` | `taker` | **Renamed** |
| — | `mode` | **New**. Set to `"fast"` for reduced latency |
| — | `feeAccount` | **New**. Required if `platformFeeBps > 0` |

## Response mapping

| Metis v1 | Swap v2 | Notes |
|----------|---------|-------|
| `computeBudgetInstructions` | `computeBudgetInstructions` | Same structure |
| `setupInstructions` | `setupInstructions` | Same structure |
| `swapInstruction` | `swapInstruction` | Now V2 format |
| `cleanupInstruction` | `cleanupInstruction` | Same |
| — | `otherInstructions` | **New field** |
| `addressLookupTableAddresses` | `addressesByLookupTableAddress` | **Changed**: Object mapping ALT addresses → account arrays (no separate RPC call needed) |
| — | `blockhashWithMetadata` | **New**: Blockhash included in response |

## V2 instruction differences

- **No fee events**: V2 instructions do not emit fee transfer events. If you parse fee events, switch to using token balance changes or the `/order` response fields.
- **Route plan format**: V1 uses `percent` (e.g., `100` for 100%). V2 uses `bps` (e.g., `10000` for 100%). Both fields appear in V2 for backwards compatibility; `bps` is canonical.

## Before (Metis)

```typescript
const API_KEY = process.env.JUPITER_API_KEY!;

// Call 1: Get quote
const quote = await fetch(
  "https://api.jup.ag/swap/v1/quote?" +
    new URLSearchParams({
      inputMint: "So11111111111111111111111111111111111111112",
      outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      amount: "100000000",
      slippageBps: "50",
    }),
  { headers: { "x-api-key": API_KEY } },
).then(r => r.json());

// Call 2: Get swap instructions
const instructions = await fetch(
  "https://api.jup.ag/swap/v1/swap-instructions",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: walletAddress,
    }),
  },
).then(r => r.json());

// Build transaction from instructions...
// Resolve address lookup tables via RPC...
```

## After (Swap v2)

```typescript
const API_KEY = process.env.JUPITER_API_KEY!;

// Single call: Get quote + instructions
const build = await fetch(
  "https://api.jup.ag/swap/v2/build?" +
    new URLSearchParams({
      inputMint: "So11111111111111111111111111111111111111112",
      outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      amount: "100000000",
      taker: walletAddress,  // was userPublicKey
      slippageBps: "50",
    }),
  { headers: { "x-api-key": API_KEY } },
).then(r => r.json());

// Build transaction from instructions...
// ALTs are already resolved in build.addressesByLookupTableAddress — no extra RPC call
// Blockhash is in build.blockhashWithMetadata — no extra RPC call
// For complete transaction assembly, see integrating-jupiter/examples/swap.md
```

## Benefits

- **One API call** instead of two (quote + swap-instructions)
- **ALTs pre-resolved** — `addressesByLookupTableAddress` returns account arrays directly, eliminating RPC lookups
- **Blockhash included** — `blockhashWithMetadata` eliminates another RPC call
- **Better routing** — dynamic intermediate tokens and long-tail token support
- **Built-in slippage estimation** — market-aware slippage adjustment
