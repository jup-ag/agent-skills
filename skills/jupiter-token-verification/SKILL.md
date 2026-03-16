---
name: jupiter-token-verification
description: Guide agents through the Jupiter Token Verification express flow — submit verification requests, pay with JUP tokens, and check verification status.
license: MIT
metadata:
  author: jupiter
  version: "1.0.0"
tags:
  - jupiter-token-verification
  - jup-ag
  - token-verification
  - vrfd
  - verified
  - solana
  - verification
---

# Jupiter Token Verification

Submit and pay for token verification on Jupiter via a simple REST API.

- **Base URL**: `https://token-verify-api.jup.ag`
- **Auth**: None required
- **Payment currency**: JUP (1000 JUP per premium verification)

## Use / Do Not Use

**Use when:**

- Submitting a token for verification (basic or premium)
- Paying for premium verification with JUP tokens
- Checking the verification status of a token

**Do not use when:**

- Performing admin operations (verify, reject, unverify) — these require admin auth
- Swapping, lending, or trading — use `integrating-jupiter` skill instead
- Updating token metadata — that is a separate token metadata flow

## Triggers

`verify token`, `token verification`, `submit verification`, `verification status`, `check verification`, `verification payment`, `pay for verification`, `express verification`, `basic verification`, `premium verification`

## Intent Router

| User intent                          | Endpoint                                         | Method |
| ------------------------------------ | ------------------------------------------------ | ------ |
| Check if a token is already verified | `/verifications/token/:tokenId`                  | `GET`  |
| Submit token for verification        | `/verifications`                                 | `POST` |
| Craft payment transaction (premium)  | `/payments/transfer/craft-txn?senderAddress=...` | `GET`  |
| Sign and execute payment (premium)   | `/payments/transfer/execute`                     | `POST` |

---

# Express Verification Flow

The express flow has 4 steps: check status, submit request, craft payment transaction, sign and execute.

## Step 1 — Check Existing Status

Always check first to avoid duplicate submissions.

**`GET /verifications/token/:tokenId`**

```
GET https://token-verify-api.jup.ag/verifications/token/{tokenId}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 123,
    "tokenId": "So11111111111111111111111111111111111111112",
    "walletAddress": "8xDr...",
    "twitterHandle": "jupiterexchange",
    "senderTwitterHandle": "sender_handle",
    "verifiedAt": "2025-01-15T10:30:00Z",
    "verificationTier": "premium",
    "status": "verified",
    "smartFollowers": 1500,
    "evaluationCount": 2,
    "lastEvaluationAt": "2025-01-15T10:30:00Z",
    "createdAt": "2025-01-10T08:00:00Z",
    "updatedAt": "2025-01-15T10:30:00Z",
    "description": "Official wrapped SOL token",
    "rejectCategory": null,
    "rejectReason": null
  }
}
```

If `data` is `null`, no verification exists yet. If `status` is `"verified"`, the token is already verified — do not resubmit.

---

## Step 2 — Submit Verification Request

**`POST /verifications`**

```
POST https://token-verify-api.jup.ag/verifications
Content-Type: application/json
```

**Request body:**

```json
{
  "tokenId": "So11111111111111111111111111111111111111112",
  "walletAddress": "8xDr...",
  "twitterHandle": "https://x.com/jupiterexchange",
  "senderTwitterHandle": "https://x.com/sender_handle",
  "verificationTier": "basic",
  "description": "Official wrapped SOL token"
}
```

| Field                 | Type   | Required | Notes                                                              |
| --------------------- | ------ | -------- | ------------------------------------------------------------------ |
| `tokenId`             | string | **Yes**  | Solana token mint address                                          |
| `walletAddress`       | string | No       | Requester's wallet address (valid Solana address)                  |
| `twitterHandle`       | string | No       | Token's Twitter — must be a valid `x.com` or `twitter.com` URL     |
| `senderTwitterHandle` | string | No       | Requester's Twitter — must be a valid `x.com` or `twitter.com` URL |
| `verificationTier`    | string | No       | `"basic"` (default) or `"premium"`                                 |
| `description`         | string | No       | Description of the token                                           |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 456,
    "tokenId": "So11111111111111111111111111111111111111112",
    "status": "pending",
    "verificationTier": "basic",
    "createdAt": "2025-06-01T12:00:00Z",
    "updatedAt": "2025-06-01T12:00:00Z"
  }
}
```

> For **basic** verification, you're done here. Steps 3–4 are only needed for **premium** verification (paid with JUP).

---

## Step 3 — Craft Payment Transaction (Premium Only)

**`GET /payments/transfer/craft-txn`**

```
GET https://token-verify-api.jup.ag/payments/transfer/craft-txn?senderAddress={walletAddress}
```

| Param           | Type   | Required | Notes                         |
| --------------- | ------ | -------- | ----------------------------- |
| `senderAddress` | string | **Yes**  | Wallet that will pay 1000 JUP |

**Response:**

```json
{
  "receiverAddress": "VRFD...",
  "mint": "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  "amount": "1000000000",
  "tokenDecimals": 6,
  "feeLamports": 5000,
  "feeMint": "So11111111111111111111111111111111111111112",
  "feeTokenDecimals": 9,
  "feeAmount": 5000,
  "transaction": "<base64-encoded-unsigned-transaction>",
  "requestId": "req_abc123",
  "totalTime": "150ms",
  "expireAt": "2025-06-01T12:05:00Z",
  "code": 0,
  "gasless": false
}
```

The `transaction` field is a **base64-encoded unsigned transaction**. The user must sign it before proceeding to Step 4.

---

## Step 4 — Sign and Execute Payment (Premium Only)

The user signs the transaction from Step 3 client-side, then submits it to the execute endpoint. The server co-signs with its verification wallet before broadcasting.

**`POST /payments/transfer/execute`**

```
POST https://token-verify-api.jup.ag/payments/transfer/execute
Content-Type: application/json
```

**Request body:**

```json
{
  "transaction": "<base64-signed-transaction>",
  "requestId": "req_abc123",
  "senderAddress": "8xDr...",
  "tokenId": "So11111111111111111111111111111111111111112",
  "twitterHandle": "https://x.com/jupiterexchange",
  "senderTwitterHandle": "https://x.com/sender_handle",
  "description": "Official wrapped SOL token"
}
```

| Field                 | Type   | Required | Notes                                      |
| --------------------- | ------ | -------- | ------------------------------------------ |
| `transaction`         | string | **Yes**  | Base64 user-signed transaction from Step 3 |
| `requestId`           | string | **Yes**  | From Step 3 `craft-txn` response           |
| `senderAddress`       | string | **Yes**  | Wallet that signed the transaction         |
| `tokenId`             | string | **Yes**  | Token mint being verified                  |
| `twitterHandle`       | string | **Yes**  | Token's Twitter URL                        |
| `senderTwitterHandle` | string | No       | Requester's Twitter URL                    |
| `description`         | string | **Yes**  | Description of the token                   |

**Response:**

```json
{
  "status": "Success",
  "signature": "5tG8...",
  "totalTime": 2500
}
```

On success, the server automatically creates a **premium** verification request for the token.

---

# Data Types

### Verification Tiers

| Tier      | Cost     | Description                                                           |
| --------- | -------- | --------------------------------------------------------------------- |
| `basic`   | Free     | Standard verification — submit via `POST /verifications`              |
| `premium` | 1000 JUP | Paid verification — requires payment via `craft-txn` + `execute` flow |

### Verification Statuses

| Status     | Meaning                                            |
| ---------- | -------------------------------------------------- |
| `pending`  | Awaiting review                                    |
| `verified` | Approved                                           |
| `rejected` | Denied (check `rejectCategory` and `rejectReason`) |

### Reject Categories

`below_thresholds`, `insufficient_trading_activity`, `ticker_conflict`, `duplicate_token`, `others`, `NA`

### Twitter Handle Format

Twitter handles must be full URLs from `x.com` or `twitter.com`:

- `https://x.com/jupiterexchange` — valid
- `https://twitter.com/jupiterexchange` — valid
- `@jupiterexchange` — **invalid** (will be rejected)
- `jupiterexchange` — **invalid** (will be rejected)

Usernames must match `^[a-zA-Z0-9_]{1,15}$` (1–15 characters, alphanumeric + underscore).

---

# Gotchas

1. **Twitter handles must be full URLs** — `https://x.com/handle` or `https://twitter.com/handle`. Bare handles like `@handle` are rejected by the API.
2. **`craft-txn` returns an unsigned transaction** — the user MUST sign it with their wallet before calling `execute`. Do not submit unsigned transactions.
3. **The execute endpoint co-signs server-side** — do NOT broadcast the transaction to the Solana RPC yourself. The server adds its own signature and submits it.
4. **Payment is 1000 JUP tokens** (1,000,000,000 base units with 6 decimals) — confirm the user has enough JUP balance before starting the payment flow.
5. **Check existing verification before submitting** — call `GET /verifications/token/:tokenId` first. Submitting a duplicate returns `409 Conflict`.
6. **Already-verified tokens cannot be resubmitted** — if the token is already verified on the data API, `POST /verifications` returns `400 Bad Request`.
7. **Token must exist** — the token must be indexed by Jupiter's data API. Unknown tokens return `400 Bad Request`.
8. **Admin endpoints are off-limits** — `POST /verifications/verify`, `POST /verifications/unverify`, and `POST /verifications/mass-unverify` all require admin authentication. Do not attempt to call them.
9. **Basic verification = done at Step 2** — only premium verification requires the payment flow (Steps 3–4).
10. **Premium upgrades via execute** — when you pay via the `execute` endpoint, the server automatically creates (or upgrades) the verification to premium tier. You do not need to call `POST /verifications` separately for premium.

---

# Complete Working Example

> Copy-paste-ready TypeScript showing the full premium express flow. Install: `npm install @solana/web3.js`

```typescript
import { Connection, Keypair, Transaction } from "@solana/web3.js";
import fs from "fs";
import path from "path";

const BASE_URL = "https://token-verify-api.jup.ag";
const RPC_URL = "https://api.mainnet-beta.solana.com";
const KEYPAIR_PATH = "/path/to/your/keypair.json";

// Token details
const TOKEN_ID = "YourTokenMintAddress111111111111111111111111";
const TWITTER_HANDLE = "https://x.com/your_token";
const SENDER_TWITTER = "https://x.com/your_wallet";
const DESCRIPTION = "My awesome Solana token";

function loadKeypair(keypairPath: string): Keypair {
  const fullPath = path.resolve(keypairPath);
  const secret = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  return Keypair.fromSecretKey(new Uint8Array(secret));
}

async function main() {
  const wallet = loadKeypair(KEYPAIR_PATH);
  const senderAddress = wallet.publicKey.toBase58();

  // ── Step 1: Check existing verification status ──
  const statusRes = await fetch(`${BASE_URL}/verifications/token/${TOKEN_ID}`);
  const statusData = await statusRes.json();

  if (statusData.data?.status === "verified") {
    console.log("Token is already verified.");
    return;
  }

  if (statusData.data?.status === "pending") {
    console.log("Verification already pending — skipping resubmission.");
    return;
  }

  // ── Step 3: Craft payment transaction ──
  // (Step 2 — POST /verifications — is not needed for premium; execute auto-creates it)
  const craftRes = await fetch(
    `${BASE_URL}/payments/transfer/craft-txn?senderAddress=${senderAddress}`
  );

  if (!craftRes.ok) {
    throw new Error(`Failed to craft transaction: ${craftRes.statusText}`);
  }

  const craftData = await craftRes.json();
  const { transaction: unsignedTxBase64, requestId } = craftData;

  console.log(`Payment: ${craftData.amount} base units of JUP`);
  console.log(`Request ID: ${requestId}`);

  // ── Step 3: Sign the transaction ──
  const txBuffer = Buffer.from(unsignedTxBase64, "base64");
  const transaction = Transaction.from(txBuffer);
  transaction.partialSign(wallet);

  const signedTxBase64 = Buffer.from(transaction.serialize()).toString(
    "base64"
  );

  // ── Step 4: Execute payment (server co-signs and broadcasts) ──
  const executeRes = await fetch(`${BASE_URL}/payments/transfer/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transaction: signedTxBase64,
      requestId,
      senderAddress,
      tokenId: TOKEN_ID,
      twitterHandle: TWITTER_HANDLE,
      senderTwitterHandle: SENDER_TWITTER,
      description: DESCRIPTION,
    }),
  });

  const executeData = await executeRes.json();

  if (executeData.status === "Success") {
    console.log(`Premium verification submitted!`);
    console.log(`Transaction signature: ${executeData.signature}`);
  } else {
    console.error("Execution failed:", executeData.error);
  }
}

main().catch(console.error);
```

---

# Resources

- **JUP Token Mint**: `JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN`
- **Jupiter Docs**: [dev.jup.ag](https://dev.jup.ag)
- **Jupiter Verification**: [verify.jup.ag](https://verify.jup.ag)
