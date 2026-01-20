# Metis Swap API Responses

This file contains response examples and field descriptions for the Metis Swap API endpoints including endpoints from `../endpoints/metis-swap.md`

---

## GET /quote

### Success (200)

```json
{
  "inputMint": "So11111111111111111111111111111111111111112",
  "inAmount": "100000000",
  "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "outAmount": "21653037",
  "otherAmountThreshold": "21544772",
  "swapMode": "ExactIn",
  "slippageBps": 50,
  "platformFee": null,
  "priceImpactPct": "0.0012345",
  "routePlan": [
    {
      "swapInfo": {
        "ammKey": "HJPjoWUrhoZzkNfRpHuieeFk9WcZWjwy6PBjZ81ngndJ",
        "label": "Raydium CLMM",
        "inputMint": "So11111111111111111111111111111111111111112",
        "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        "inAmount": "100000000",
        "outAmount": "21653037",
        "feeAmount": "21000",
        "feeMint": "So11111111111111111111111111111111111111112"
      },
      "percent": 100
    }
  ],
  "contextSlot": 123456789,
  "timeTaken": 0.045
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `inputMint` | string | Input token mint address |
| `inAmount` | string | Input amount in native units |
| `outputMint` | string | Output token mint address |
| `outAmount` | string | Expected output amount in native units |
| `otherAmountThreshold` | string | Min output (ExactIn) or max input (ExactOut) after slippage |
| `swapMode` | string | `ExactIn` or `ExactOut` |
| `slippageBps` | number | Slippage tolerance in basis points |
| `platformFee` | object \| null | Platform fee details if set |
| `priceImpactPct` | string | Price impact as percentage string |
| `routePlan` | array | Array of route steps |
| `routePlan[].swapInfo.ammKey` | string | AMM/pool address |
| `routePlan[].swapInfo.label` | string | DEX label (e.g., "Raydium CLMM") |
| `routePlan[].swapInfo.inputMint` | string | Input mint for this step |
| `routePlan[].swapInfo.outputMint` | string | Output mint for this step |
| `routePlan[].swapInfo.inAmount` | string | Input amount for this step |
| `routePlan[].swapInfo.outAmount` | string | Output amount for this step |
| `routePlan[].swapInfo.feeAmount` | string | Fee amount for this step |
| `routePlan[].swapInfo.feeMint` | string | Fee token mint |
| `routePlan[].percent` | number | Percentage of total swap (0-100) |
| `contextSlot` | number | Slot when quote was generated |
| `timeTaken` | number | Time to generate quote in seconds |

### Failed (400)

```json
{
  "error": "Could not find any routes for the given input and output mints"
}
```

---

## POST /swap

### Success (200)

```json
{
  "swapTransaction": "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQAHDf...",
  "lastValidBlockHeight": 268435456,
  "prioritizationFeeLamports": 52000,
  "computeUnitLimit": 200000,
  "prioritizationType": {
    "computeBudget": {
      "microLamports": 260000,
      "estimatedMicroLamports": 260000
    }
  },
  "dynamicSlippageReport": null,
  "simulationError": null
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `swapTransaction` | string | Base64-encoded serialized transaction |
| `lastValidBlockHeight` | number | Block height until transaction is valid |
| `prioritizationFeeLamports` | number | Priority fee in lamports |
| `computeUnitLimit` | number | Compute unit limit for transaction |
| `prioritizationType` | object | Priority fee calculation details |
| `prioritizationType.computeBudget.microLamports` | number | Micro-lamports per compute unit |
| `prioritizationType.computeBudget.estimatedMicroLamports` | number | Estimated micro-lamports |
| `dynamicSlippageReport` | object \| null | Dynamic slippage info if enabled |
| `simulationError` | string \| null | Simulation error if any |

### Failed (400)

```json
{
  "error": "Invalid quote response"
}
```

### Failed - Simulation Error

```json
{
  "swapTransaction": null,
  "simulationError": "Transaction simulation failed: Error processing Instruction 3: custom program error: 0x1"
}
```

---

## POST /swap-instructions

### Success (200)

```json
{
  "tokenLedgerInstruction": null,
  "computeBudgetInstructions": [
    {
      "programId": "ComputeBudget111111111111111111111111111111",
      "accounts": [],
      "data": "AsBcAA=="
    },
    {
      "programId": "ComputeBudget111111111111111111111111111111",
      "accounts": [],
      "data": "AwDh9QUAAAAA"
    }
  ],
  "setupInstructions": [
    {
      "programId": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
      "accounts": [
        { "pubkey": "...", "isSigner": true, "isWritable": true },
        { "pubkey": "...", "isSigner": false, "isWritable": true }
      ],
      "data": ""
    }
  ],
  "swapInstruction": {
    "programId": "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
    "accounts": [
      { "pubkey": "...", "isSigner": false, "isWritable": false }
    ],
    "data": "..."
  },
  "cleanupInstruction": {
    "programId": "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
    "accounts": [],
    "data": "..."
  },
  "otherInstructions": [],
  "addressLookupTableAddresses": [
    "GxS6FiQ9mzd6Gbi8DMgPfHVzfXJdbgWpqLKMHQhGMEBM"
  ],
  "prioritizationFeeLamports": 52000,
  "computeUnitLimit": 200000,
  "prioritizationType": {
    "computeBudget": {
      "microLamports": 260000,
      "estimatedMicroLamports": 260000
    }
  },
  "dynamicSlippageReport": null,
  "simulationError": null
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `tokenLedgerInstruction` | object \| null | Token ledger instruction if needed |
| `computeBudgetInstructions` | array | Compute budget instructions |
| `setupInstructions` | array | Setup instructions (create ATAs, etc.) |
| `swapInstruction` | object | Main swap instruction |
| `cleanupInstruction` | object \| null | Cleanup instruction (unwrap SOL, etc.) |
| `otherInstructions` | array | Additional instructions |
| `addressLookupTableAddresses` | array | ALT addresses for versioned transactions |
| `prioritizationFeeLamports` | number | Priority fee in lamports |
| `computeUnitLimit` | number | Compute unit limit |
| `prioritizationType` | object | Priority fee calculation details |
| `dynamicSlippageReport` | object \| null | Dynamic slippage info if enabled |
| `simulationError` | string \| null | Simulation error if any |

### Instruction Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `programId` | string | Program ID for the instruction |
| `accounts` | array | Array of account metas |
| `accounts[].pubkey` | string | Account public key |
| `accounts[].isSigner` | boolean | Whether account is a signer |
| `accounts[].isWritable` | boolean | Whether account is writable |
| `data` | string | Base64-encoded instruction data |

---

## GET /program-id-to-label

### Success (200)

```json
{
  "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4": "Jupiter v6",
  "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc": "Orca Whirlpool",
  "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK": "Raydium CLMM",
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8": "Raydium",
  "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo": "Meteora DLMM",
  "Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB": "Meteora",
  "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP": "Orca v2",
  "srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX": "Openbook",
  "PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY": "Phoenix"
}
```

### Response Fields

Returns an object where:
- **Key**: Program ID (string)
- **Value**: DEX/AMM label (string)

Use this to:
- Map error program IDs to human-readable DEX names
- Build `dexes` or `excludeDexes` parameters for `/quote`

---

## Common Errors

Errors from the Metis Swap API, Jupiter Swap Program, DEXes, System, or Token programs.

---

### Jupiter Swap Program Errors

| Code | Error | Debug |
|------|-------|-------|
| 6001 | SlippageToleranceExceeded | Try higher fixed slippage or use `dynamicSlippage` |
| 6008 | NotEnoughAccountKeys | Likely modified swap transaction causing missing account keys |
| 6014 | IncorrectTokenProgramID | Attempted platform fees on Token2022 token (also 0x177e) |
| 6017 | ExactOutAmountNotMatched | Similar to slippage, output amount mismatch |
| 6024 | InsufficientFunds | Insufficient funds for swap amount, tx fees, or rent |
| 6025 | InvalidTokenAccount | Token account invalid, uninitialized, or unexpected |

Full IDL: [Jupiter V6 on Solscan](https://solscan.io/account/JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4#anchorProgramIdl)

### Solana Program Errors

| Program | Error Reference |
|---------|-----------------|
| Token Program | [token/error.rs](https://github.com/solana-program/token/blob/main/program/src/error.rs) |
| Token2022 Program | [token-2022/error.rs](https://github.com/solana-program/token-2022/blob/main/program/src/error.rs) |
| Associated Token Account | [ata/error.rs](https://github.com/solana-program/associated-token-account/blob/main/program/src/error.rs) |
| Other Solana Programs | [github.com/solana-program](https://github.com/solana-program) |

### DEX Program Errors

DEXes in routing may return errors. Check their IDLs on explorers, or reference common errors below.

| Error | Description |
|-------|-------------|
| Tick array or bitmap extension error | Similar to slippage—price/market moved out of range |

---

### Routing Errors

| Error | Description | Debug |
|-------|-------------|-------|
| `NO_ROUTES_FOUND` | No routes found for the swap | Check jup.ag if routable, check token liquidity |
| `COULD_NOT_FIND_ANY_ROUTE` | Unable to find any valid route | Check jup.ag if routable, check token liquidity |
| `ROUTE_PLAN_DOES_NOT_CONSUME_ALL_THE_AMOUNT` | Route cannot process entire input | Try reducing input amount |
| `MARKET_NOT_FOUND` | Market address not found | Verify market exists and is active |
| `TOKEN_NOT_TRADABLE` | Token mint not available for trading | Check jup.ag, check token liquidity |
| `NOT_SUPPORTED` | Generic unsupported operation | Check specific error message |
| `CIRCULAR_ARBITRAGE_IS_DISABLED` | Attempted to swap token for itself | Input and output must be different |
| `CANNOT_COMPUTE_OTHER_AMOUNT_THRESHOLD` | Failed to calculate min output | Verify input amount and slippage params |

---

### Swap Transaction Composing Errors

| Error | Description | Debug |
|-------|-------------|-------|
| `MAX_ACCOUNT_GREATER_THAN_MAX` | Accounts exceed maximum allowed | Reduce `maxAccounts` parameter |
| `INVALID_COMPUTE_UNIT_PRICE_AND_PRIORITIZATION_FEE` | Both compute unit price and prioritization fee specified | Use one or the other, not both |
| `FAILED_TO_GET_SWAP_AND_ACCOUNT_METAS` | Failed to generate swap transaction | Check error message for details |

---

## Best Practices

| Scenario | Recommended Action |
|----------|-------------------|
| Quote expired | Re-fetch quote before building swap |
| Slippage exceeded | Increase `slippageBps` or retry with fresh quote |
| Simulation error | Check account balances, retry with lower `maxAccounts` |
| Route not found | Try different token pair or check token liquidity |
| Transaction failed to land | Increase priority fee, retry with fresh quote |
