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

- **Base URL**: `http://localhost:8789`
- **Auth**: None required
- **Payment currency**: JUP (0.1 JUP per premium verification)
- **Agent behavior**: Guide users step by step — collect parameters one at a time, validate each input, and confirm before submitting. See [Agent Conversation Flow](#agent-conversation-flow).

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

# Agent Conversation Flow

When a user triggers this skill, guide them through parameter collection step by step. Do NOT ask for all parameters at once — collect them incrementally, validate each input, and confirm before making API calls.

## Step-by-Step Parameter Collection

### 1. Determine Intent

Ask the user what they want to do:

> What would you like to do?
>
> 1. **Check** if a token is already verified
> 2. **Submit** a token for verification

If the user's message already makes their intent clear, skip this question.

### 2. Collect Token Mint Address (always required)

Ask:

> What is the **Solana token mint address** you'd like to verify?

**Validate before proceeding:**

- Must be a valid base58 string
- Typically 32–44 characters
- If invalid, say: _"That doesn't look like a valid Solana mint address. It should be a base58 string like `So11111111111111111111111111111111111111112`. Please try again."_

### 3. Check Existing Status (automatic)

After receiving the token mint, **always** call `GET /verifications/token/:tokenId` automatically and report the result:

- If `status` is `"verified"` → Tell the user the token is already verified. Done.
- If `status` is `"pending"` → Tell the user a verification is already pending. Done.
- If `status` is `"rejected"` → Tell the user it was rejected, show `rejectCategory` and `rejectReason`, and ask if they want to resubmit.
- If `data` is `null` → Tell the user no verification exists yet, and proceed to collect submission details.

If the user only wanted to **check** status, stop here.

### 4. Choose Verification Tier

Ask:

> Would you like **basic** (free) or **premium** (0.1 JUP) verification?
>
> - **Basic** — free, standard review process
> - **Premium** — costs 0.1 JUP, paid from your wallet

Default to `basic` if the user is unsure.

### 5. Collect Remaining Parameters (one at a time)

Collect these in order. For each, show what it is and why it matters:

**a) Token's Twitter/X URL** (optional but recommended)

> What is the **token project's Twitter/X URL**?
> Example: `https://x.com/jupiterexchange` > _(Type "skip" to leave blank)_

Validate: must be a full URL starting with `https://x.com/` or `https://twitter.com/` followed by a valid username (1–15 chars, alphanumeric + underscore). If the user provides a bare handle like `@handle`, auto-convert it to `https://x.com/handle` and confirm with the user.

**b) Requester's Twitter/X URL** (optional)

> What is **your** Twitter/X URL? This identifies who submitted the request.
> Example: `https://x.com/your_handle` > _(Type "skip" to leave blank)_

Same validation as above.

**c) Description** (optional but recommended)

> Please provide a **short description** of the token.
> Example: _"Community governance token for XYZ protocol"_ > _(Type "skip" to leave blank)_

**d) Wallet Address** (required for premium, optional for basic)

If **premium** was selected:

> What is your **Solana wallet address**? This wallet will pay 0.1 JUP and must sign the transaction.

If **basic** was selected:

> What is your **Solana wallet address**? _(optional — type "skip" to leave blank)_

Validate: same base58 format as token mint.

### 6. Confirm Before Submitting

Present a summary of all collected parameters and ask for confirmation:

> Here's a summary of your verification request:
>
> | Field             | Value                       |
> | ----------------- | --------------------------- |
> | **Token Mint**    | `{tokenId}`                 |
> | **Tier**          | {basic/premium}             |
> | **Token Twitter** | {url or _not provided_}     |
> | **Your Twitter**  | {url or _not provided_}     |
> | **Description**   | {text or _not provided_}    |
> | **Wallet**        | {address or _not provided_} |
>
> Does this look correct? (yes/no)

If the user says no, ask which field to change.

### 7. Submit and Report

- For **basic**: call `POST /verifications` and report the result.
- For **premium**: proceed to the payment flow (Steps 3–4 in the Express Verification Flow below). Guide the user through signing.

---

# Express Verification Flow

The express flow has 4 steps: check status, submit request, craft payment transaction, sign and execute.

## Step 1 — Check Existing Status

Always check first to avoid duplicate submissions.

**`GET /verifications/token/:tokenId`**

```
GET http://localhost:8789/verifications/token/{tokenId}
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
POST http://localhost:8789/verifications
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
GET http://localhost:8789/payments/transfer/craft-txn?senderAddress={walletAddress}
```

| Param           | Type   | Required | Notes                        |
| --------------- | ------ | -------- | ---------------------------- |
| `senderAddress` | string | **Yes**  | Wallet that will pay 0.1 JUP |

**Response:**

```json
{
  "receiverAddress": "VRFD...",
  "mint": "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  "amount": "100000",
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
POST http://localhost:8789/payments/transfer/execute
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

| Tier      | Cost    | Description                                                           |
| --------- | ------- | --------------------------------------------------------------------- |
| `basic`   | Free    | Standard verification — submit via `POST /verifications`              |
| `premium` | 0.1 JUP | Paid verification — requires payment via `craft-txn` + `execute` flow |

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

# Input Auto-Correction

When collecting user input, handle these common mistakes gracefully instead of rejecting outright:

| User provides                           | Auto-correct to                 | Confirm with user?                                                               |
| --------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------- |
| `@jupiterexchange`                      | `https://x.com/jupiterexchange` | Yes — _"I'll format that as `https://x.com/jupiterexchange` — is that correct?"_ |
| `jupiterexchange` (bare handle)         | `https://x.com/jupiterexchange` | Yes                                                                              |
| `twitter.com/handle` (no https)         | `https://twitter.com/handle`    | Yes                                                                              |
| `x.com/handle` (no https)               | `https://x.com/handle`          | Yes                                                                              |
| Token mint with leading/trailing spaces | Trimmed string                  | No                                                                               |

---

# Gotchas

1. **Twitter handles must be full URLs** — `https://x.com/handle` or `https://twitter.com/handle`. Bare handles like `@handle` are rejected by the API.
2. **`craft-txn` returns an unsigned transaction** — the user MUST sign it with their wallet before calling `execute`. Do not submit unsigned transactions.
3. **The execute endpoint co-signs server-side** — do NOT broadcast the transaction to the Solana RPC yourself. The server adds its own signature and submits it.
4. **Payment is 0.1 JUP tokens** (100,000 base units with 6 decimals) — confirm the user has enough JUP balance before starting the payment flow.
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
import { Keypair, Transaction } from "@solana/web3.js";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:8789";
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
- **Jupiter Verified**: [verified.jup.ag](https://verified.jup.ag)
