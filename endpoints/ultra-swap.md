# Ultra Swap API

## Overview

Ultra Swap is Jupiter's flagship swap API for building trading applications on Solana.

**Base URL**: `https://api.jup.ag/ultra/v1`

### Guidelines
   - ALWAYS include the `x-api-key` header
   - ALWAYS use `requestId` from /order response in /execute
   - NEVER skip error handling for both endpoints
   - PREFER Ultra over Metis unless custom instructions are needed
   - A user can use the transaction from `/order` response directly but that will take longer to land and will not be gasless
   
### Common Mistakes
- Forgetting to deserialize as VersionedTransaction (not Transaction)
- Using wrong amount units (should be lamports/base units, not decimals)
- Not awaiting the response.json() call
---

## Endpoints

### 1. GET /order

Request a base64-encoded unsigned swap transaction.

```
GET /ultra/v1/order
```

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `inputMint` | string | Yes | Input token mint address |
| `outputMint` | string | Yes | Output token mint address |
| `amount` | string | Yes | Amount in smallest unit (lamports/base units) |
| `taker` | string | Yes | User's wallet address |

### 2. POST /execute

Execute the signed transaction and get execution status.

```
POST /ultra/v1/execute
```

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `signedTransaction` | string | Yes | Base64-encoded signed transaction |
| `requestId` | string | Yes | Request ID from `/order` response |

### 3. GET /holdings

Request token balances of an account.

```
GET /ultra/v1/holdings
```

### 4. GET /shield

Request token information and security warnings.

```
GET /ultra/v1/shield
```

### 5. GET /search

Search tokens by symbol, name, or mint address.

```
GET /ultra/v1/search
```

### 6. GET /routers

Get available routers in the Juno routing engine.

```
GET /ultra/v1/routers
```

---

## Naive Implementation

```typescript
import { Keypair, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";

const API_URL = "https://api.jup.ag/ultra/v1";

interface OrderResponse {
  requestId: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  transaction: string; // base64 encoded
}

interface ExecuteResponse {
  status: "Success" | "Failed";
  signature?: string;
  error?: string;
  inputAmountResult?: string;
  outputAmountResult?: string;
}

async function swap(
  inputMint: string,
  outputMint: string,
  amount: string,
  wallet: Keypair
): Promise<ExecuteResponse> {
  // 1. Get order (unsigned transaction)
  const orderParams = new URLSearchParams({
    inputMint,
    outputMint,
    amount,
    taker: wallet.publicKey.toBase58(),
  });

  const orderResponse = await fetch(`${API_URL}/order?${orderParams}`, {
    headers: { "x-api-key": process.env.JUPITER_API_KEY! },
  });

  if (!orderResponse.ok) {
    throw new Error(`Order failed: ${await orderResponse.text()}`);
  }

  const order: OrderResponse = await orderResponse.json();

  // 2. Deserialize and sign transaction
  const transactionBuf = Buffer.from(order.transaction, "base64");
  const transaction = VersionedTransaction.deserialize(transactionBuf);
  transaction.sign([wallet]);

  // 3. Execute signed transaction
  const signedTransaction = Buffer.from(transaction.serialize()).toString("base64");

  const executeResponse = await fetch(`${API_URL}/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.JUPITER_API_KEY!,
    },
    body: JSON.stringify({
      signedTransaction,
      requestId: order.requestId,
    }),
  });

  if (!executeResponse.ok) {
    throw new Error(`Execute failed: ${await executeResponse.text()}`);
  }

  return executeResponse.json();
}

// Usage: Swap 1 SOL to USDC
const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const ONE_SOL = "1000000000"; // 1 SOL in lamports

const wallet = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY!));
const result = await swap(SOL_MINT, USDC_MINT, ONE_SOL, wallet);

console.log(result.status === "Success" 
  ? `Swapped! Signature: ${result.signature}`
  : `Failed: ${result.error}`
);
```

---

## When to Use Ultra vs Metis

**Use Ultra Swap** (recommended) for:
- Most trading applications
- When you want Jupiter to handle RPC, fees, slippage, and broadcasting

**Use Metis Swap** when you need:
- Custom instructions or CPI calls
- Specific broadcasting strategies (priority fee, Jito, etc.)
- DEX/AMM routing control
- Account limit modifications

---

## References

- [Ultra Swap API Reference](https://dev.jup.ag/api-reference/ultra)
- [Ultra V3 Blog](https://dev.jup.ag/blog/ultra-v3)
- [Add Fees to Ultra Swap](https://dev.jup.ag/docs/ultra/add-fees-to-ultra)