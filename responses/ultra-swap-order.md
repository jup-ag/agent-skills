# Ultra Swap Order API Responses

This file contains response examples and field descriptions for the Ultra Swap Order API endpoints including endpoints from `./../endpoints/ultra-swap-order.md`

---


## GET /order

### Success - Aggregator (Iris)

```json
{
  "mode": "ultra",
  "inAmount": "100000000",
  "outAmount": "461208958",
  "otherAmountThreshold": "460024271",
  "swapMode": "ExactIn",
  "slippageBps": 26,
  "priceImpactPct": "-0.0001311599520149334",
  "routePlan": [
    {
      "swapInfo": {
        "ammKey": "HTvjzsfX3yU6BUodCjZ5vZkUrAxMDTrBs3CJaq43ashR",
        "label": "MeteoraDLMM",
        "inputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        "outputMint": "So11111111111111111111111111111111111111112",
        "inAmount": "52000000",
        "outAmount": "239879552",
        "feeAmount": "0",
        "feeMint": "11111111111111111111111111111111"
      },
      "percent": 52,
      "bps": 5200
    }
  ],
  "feeMint": "So11111111111111111111111111111111111111112",
  "feeBps": 2,
  "taker": "taker-address",
  "gasless": false,
  "signatureFeeLamports": 5000,
  "transaction": "AQAAAAAAAAAA...",
  "prioritizationFeeLamports": 696237,
  "rentFeeLamports": 0,
  "inputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "outputMint": "So11111111111111111111111111111111111111112",
  "swapType": "aggregator",
  "router": "iris",
  "requestId": "019974a8-5fbb-7395-9355-9ebf8f844884",
  "inUsdValue": 99.96761068334662,
  "outUsdValue": 99.95449893632635,
  "priceImpact": -0.013115995201493341,
  "swapUsdValue": 99.96761068334662,
  "totalTime": 359
}
```

### Success - RFQ (JupiterZ)

```json
{
  "mode": "ultra",
  "inputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "outputMint": "So11111111111111111111111111111111111111112",
  "inAmount": "100000000",
  "outAmount": "460250418",
  "otherAmountThreshold": "460250418",
  "swapMode": "ExactIn",
  "slippageBps": 0,
  "priceImpactPct": "-0.00018881197024002837",
  "routePlan": [
    {
      "swapInfo": {
        "ammKey": "CDg3bPoM21fSXEzrXWHWyJR33JHX6xaYboq5p7s4uo48",
        "label": "JupiterZ",
        "inputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        "outputMint": "So11111111111111111111111111111111111111112",
        "inAmount": "100000000",
        "outAmount": "460250418",
        "feeAmount": "0",
        "feeMint": "11111111111111111111111111111111"
      },
      "percent": 100,
      "bps": 10000
    }
  ],
  "feeBps": 2,
  "transaction": "AgAAAAAAAAAA...",
  "gasless": true,
  "signatureFeeLamports": 0,
  "prioritizationFeeLamports": 0,
  "rentFeeLamports": 0,
  "requestId": "ff63982b-9140-9b0e-e525-44f7246a79b2",
  "swapType": "rfq",
  "router": "jupiterz",
  "quoteId": "5852f88e-525b-5400-ab97-abe5e409ebfd",
  "maker": "CDg3bPoM21fSXEzrXWHWyJR33JHX6xaYboq5p7s4uo48",
  "taker": "taker-address",
  "expireAt": "1758598698",
  "platformFee": {
    "amount": "92050",
    "feeBps": 2
  },
  "inUsdValue": 99.97072758461792,
  "outUsdValue": 99.95185191457634,
  "priceImpact": -0.018881197024002837,
  "swapUsdValue": 99.97072758461792,
  "totalTime": 489
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `mode` | string | API mode (e.g., "ultra") |
| `inputMint` | string | Input token mint address |
| `outputMint` | string | Output token mint address |
| `inAmount` | string | Input amount in native units |
| `outAmount` | string | Output amount in native units |
| `inUsdValue` | number | Input amount in USD |
| `outUsdValue` | number | Output amount in USD |
| `priceImpact` | number | Price impact as a decimal |
| `swapUsdValue` | number | Swap value in USD |
| `otherAmountThreshold` | string | Minimum output amount (slippage adjusted) |
| `swapMode` | string | Swap mode (e.g., "ExactIn") |
| `slippageBps` | number | Slippage in basis points |
| `priceImpactPct` | string | Price impact percentage (deprecated, use `priceImpact`) |
| `routePlan` | array | Array of route steps with swap info |
| `routePlan[].swapInfo.ammKey` | string | AMM/pool address |
| `routePlan[].swapInfo.label` | string | DEX/router label |
| `routePlan[].swapInfo.inputMint` | string | Input mint for this step |
| `routePlan[].swapInfo.outputMint` | string | Output mint for this step |
| `routePlan[].swapInfo.inAmount` | string | Input amount for this step |
| `routePlan[].swapInfo.outAmount` | string | Output amount for this step |
| `routePlan[].percent` | number | Percentage of total swap (0-100) |
| `routePlan[].bps` | number | Basis points of total swap |
| `feeBps` | number | Total fee in basis points (Ultra default or integrator fee) |
| `platformFee` | object | Platform fee details (excludes gas fees) |
| `platformFee.amount` | string | Fee amount in native units |
| `platformFee.feeBps` | number | Fee in basis points |
| `signatureFeeLamports` | number | Lamports for base network fee |
| `signatureFeePayer` | string \| null | Account covering signature fee (taker, maker, or payer) |
| `prioritizationFeeLamports` | number | Lamports for priority fees (includes Jito tips if any) |
| `prioritizationFeePayer` | string \| null | Account covering prioritization fee |
| `rentFeeLamports` | number | Estimated lamports for account rent |
| `rentFeePayer` | string \| null | Account covering rent fee (taker or payer) |
| `transaction` | string \| null | Base64-encoded unsigned transaction (null if no taker) |
| `gasless` | boolean | Whether swap is gasless (Jupiter pays fees) |
| `requestId` | string | Required for `/execute` endpoint |
| `swapType` | string | Deprecated, use `router` instead |
| `router` | string | Router used: "iris", "jupiterz", "dflow", or "okx" |
| `quoteId` | string | Quote identifier |
| `maker` | string | Market maker address (for RFQ swaps) |
| `taker` | string \| null | Taker wallet address |
| `expireAt` | string | Quote expiration timestamp |
| `totalTime` | number | Total response time in milliseconds |
| `errorCode` | number | Error code if transaction is empty (1, 2, or 3) |
| `errorMessage` | string | Human-readable error message |


### Failed (400)

```json
{
  "error": "Failed to get quotes"
}
```

### Order Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 1 | Insufficient funds | Not enough swap amount |
| 2 | Top up `${solAmount}` SOL for gas | Insufficient SOL for gas |
| 3 | Minimum `${swapAmount}` for gasless | Trade size too small for gasless |

---

## POST /execute

### Success

```json
{
  "status": "Success",
  "signature": "transaction-signature",
  "slot": "323598314",
  "code": 0,
  "inputAmountResult": "9995000",
  "outputAmountResult": "1274698",
  "swapEvents": [
    {
      "inputMint": "So11111111111111111111111111111111111111112",
      "inputAmount": "9995000",
      "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "outputAmount": "1274698"
    }
  ]
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Execution status: "Success" or "Failed" |
| `signature` | string | Transaction signature |
| `slot` | string | Slot number when transaction was processed |
| `code` | number | Status code (0 for success, negative for errors) |
| `error` | string | Error message if failed |
| `totalInputAmount` | string | Total input amount across all swap events |
| `totalOutputAmount` | string | Total output amount across all swap events |
| `inputAmountResult` | string | Actual input amount swapped |
| `outputAmountResult` | string | Actual output amount received |
| `swapEvents` | array | Array of individual swap events |
| `swapEvents[].inputMint` | string | Input token mint address |
| `swapEvents[].inputAmount` | string | Input amount for this swap event |
| `swapEvents[].outputMint` | string | Output token mint address |
| `swapEvents[].outputAmount` | string | Output amount for this swap event |


### Failed - Ultra Endpoint

```json
{
  "code": -1,
  "error": "Order not found, it might have expired"
}
```

### Failed - Aggregator Swap Type

```json
{
  "status": "Failed",
  "slot": "0",
  "signature": "transaction-signature",
  "code": -1005,
  "error": "Transaction expired"
}
```

### Failed - RFQ Swap Type

```json
{
  "status": "Failed",
  "slot": "0",
  "code": -2005,
  "error": "Internal error"
}
```

### Failed - Program Error (with partial swap events)

```json
{
  "status": "Failed",
  "signature": "transaction-signature",
  "slot": "368661931",
  "code": 6001,
  "error": "Slippage tolerance exceeded",
  "totalInputAmount": "1000000",
  "totalOutputAmount": "4647512",
  "inputAmountResult": "1000000",
  "outputAmountResult": "4648441",
  "swapEvents": [
    {
      "inputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "inputAmount": "50000",
      "outputMint": "So11111111111111111111111111111111111111112",
      "outputAmount": "232423"
    },
    {
      "inputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "inputAmount": "950000",
      "outputMint": "So11111111111111111111111111111111111111112",
      "outputAmount": "4416018"
    }
  ]
}
```

---

## Execute Error Codes

### Ultra Endpoint Codes

| Code | Description | Debug |
|------|-------------|-------|
| 0 | Success | - |
| -1 | Missing cached order | `requestId` expired or not found |
| -2 | Invalid signed transaction | Failed to sign correctly |
| -3 | Invalid message bytes | `transaction` field was modified |
| -4 | Missing request id | `requestId` not in request |
| -5 | Missing signed transaction | `signedTransaction` not in request |

### Aggregator Swap Type Codes

| Code | Description | Debug |
|------|-------------|-------|
| -1000 | Failed to land | Transaction didn't land on network |
| -1001 | Unknown error | Retry, contact Discord if persists |
| -1002 | Invalid transaction | Retry, contact Discord if persists |
| -1003 | Transaction not fully signed | Failed to sign correctly |
| -1004 | Invalid block height | Block height invalid |
| -1005 | Expired | Transaction expired |
| -1006 | Timed out | Transaction timed out |
| -1007 | Gasless unsupported wallet | Wallet not supported for gasless |

### RFQ Swap Type Codes

| Code | Description | Debug |
|------|-------------|-------|
| -2000 | Failed to land | Retry, contact Discord if persists |
| -2001 | Unknown error | Retry, contact Discord if persists |
| -2002 | Invalid payload | Retry, contact Discord if persists |
| -2003 | Quote expired | User/provider didn't respond in time |
| -2004 | Swap rejected | User or provider rejected swap |
| -2005 | Internal error | Retry, contact Discord if persists |

### Program Error Codes

Jupiter V6 Aggregator program errors are parsed with descriptions. Other DEX errors show as `custom program error: #<code>`.

Full list: [Jupiter V6 IDL on Solscan](https://solscan.io/account/JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4#programIdl)

---

## Best Practices

| Error | Recommended Action |
|-------|-------------------|
| Slippage exceeded | Show current tolerance vs incurred slippage |
| Insufficient funds | Disable swap but show quote |
| Non-Jupiter program errors | Allow retry with new route, optionally exclude specific DEX |