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

- **Base URL**: `https://token-verification-dev-api.jup.ag`
- **Auth**: None required
- **Payment currency**: JUP (1 JUP per express verification)
- **Naming**: "Express" and "premium" refer to the same paid tier. The user-facing name is **express**, but the API uses `"premium"` as the `verificationTier` value.
- **Agent behavior**: Guide users step by step — collect parameters one at a time, validate each input, and confirm before submitting. See [Agent Conversation Flow](#agent-conversation-flow).

## Use / Do Not Use

**Use when:**

- Submitting a token for verification (basic or express)
- Paying for express verification with JUP tokens
- Checking the verification status of a token

**Do not use when:**

- Performing admin operations (verify, reject, unverify) — these require admin auth
- Swapping, lending, or trading — use `integrating-jupiter` skill instead
- Updating token metadata — that is a separate token metadata flow

## Triggers

`verify token`, `token verification`, `submit verification`, `verification status`, `check verification`, `verification payment`, `pay for verification`, `express verification`, `basic verification`, `express verification`

## Intent Router

| User intent                          | Endpoint                                         | Method |
| ------------------------------------ | ------------------------------------------------ | ------ |
| Check if a token is already verified | `/verifications/token/:tokenId`                  | `GET`  |
| Submit token for verification        | `/verifications`                                 | `POST` |
| Craft payment transaction (express)  | `/payments/transfer/craft-txn?senderAddress=...` | `GET`  |
| Sign and execute payment (express)   | `/payments/transfer/execute`                     | `POST` |

## References

Load these on demand when you need implementation details:

- **[API Reference](references/api-reference.md)** — Endpoint details, request/response schemas, data types. Load when making API calls or validating parameters.
- **[Payment Execution](references/payment-execution.md)** — Express payment flow (steps 7a–7e), template script, config.json, error handling. Load when the user confirms an express verification.

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

**Auto-select when possible:** If the user's original message already indicates which tier they want, skip this question and use their choice directly:

- Phrases like `express verification`, `paid verification`, `express flow` → auto-select **express**
- Phrases like `basic verification`, `free verification` → auto-select **basic**

**Only ask if unclear:**

> Would you like **basic** (free) or **express** (1 JUP) verification?
>
> - **Basic** — free, standard review process
> - **Express** — costs 1 JUP, paid from your wallet

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

**d) Wallet Address** (basic tier only — optional)

If **basic** was selected:

> What is your **Solana wallet address**? _(optional — type "skip" to leave blank)_

Validate: same base58 format as token mint.

If **express** was selected: **skip this step**. The wallet address will be derived automatically from the user's private key during the payment execution flow.

### 6. Confirm Before Submitting

Present a summary of all collected parameters and ask for confirmation:

> Here's a summary of your verification request:
>
> | Field             | Value                       |
> | ----------------- | --------------------------- |
> | **Token Mint**    | `{tokenId}`                 |
> | **Tier**          | {basic/express}             |
> | **Token Twitter** | {url or _not provided_}     |
> | **Your Twitter**  | {url or _not provided_}     |
> | **Description**   | {text or _not provided_}    |
> | **Wallet**        | {address or _not provided_} |
>
> Does this look correct? (yes/no)

If the user says no, ask which field to change.

### 7. Submit and Report

- For **basic**: call `POST /verifications` with all collected parameters and report the result. Done. (See [API Reference](references/api-reference.md) for request/response details.)
- For **express**: load [Payment Execution](references/payment-execution.md) and follow steps 7a–7e. The agent will resolve the user's private key, write a payment script, execute it locally, and report the result.

---

# Input Auto-Correction

When collecting user input, handle these common mistakes gracefully instead of rejecting outright:

| User provides                           | Auto-correct to                 | Confirm with user?                                                               |
| --------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------- |
| `@jupiterexchange`                      | `https://x.com/jupiterexchange` | Yes — _"I'll format that as `https://x.com/jupiterexchange` — is that correct?"_ |
| `jupiterexchange` (bare handle)         | `https://x.com/jupiterexchange` | Yes                                                                              |
| `twitter.com/handle` (no https)         | `https://twitter.com/handle`    | Yes                                                                              |
| `x.com/handle` (no https)              | `https://x.com/handle`          | Yes                                                                              |
| Token mint with leading/trailing spaces | Trimmed string                  | No                                                                               |

---

# Gotchas

1. **Twitter handles must be full URLs** — `https://x.com/handle` or `https://twitter.com/handle`. Bare handles like `@handle` are rejected by the API.
2. **`craft-txn` returns an unsigned transaction** — the user MUST sign it with their wallet before calling `execute`. Do not submit unsigned transactions.
3. **The execute endpoint co-signs server-side** — do NOT broadcast the transaction to the Solana RPC yourself. The server adds its own signature and submits it.
4. **Payment is 1 JUP token** (1,000,000 base units with 6 decimals) — confirm the user has enough JUP balance before starting the payment flow.
5. **Check existing verification before submitting** — call `GET /verifications/token/:tokenId` first. Submitting a duplicate returns `409 Conflict`.
6. **Already-verified tokens cannot be resubmitted** — if the token is already verified on the data API, `POST /verifications` returns `400 Bad Request`.
7. **Token must exist** — the token must be indexed by Jupiter's data API. Unknown tokens return `400 Bad Request`.
8. **Admin endpoints are off-limits** — `POST /verifications/verify`, `POST /verifications/unverify`, and `POST /verifications/mass-unverify` all require admin authentication. Do not attempt to call them.
9. **Basic verification = done at Step 2** — only express verification requires the payment flow (Steps 3–4).
10. **Express upgrades via execute** — when you pay via the `execute` endpoint, the server automatically creates (or upgrades) the verification to express tier. You do not need to call `POST /verifications` separately for express.
11. **Private keys MUST stay local** — The payment script signs transactions client-side. The private key is NEVER sent to any API, server, or external service. Only the signed transaction is transmitted. Agents must communicate this clearly to users and include security comments in generated scripts. Recommend `.env` files (with `.gitignore`) and dedicated payment wallets. **Never accept a raw private key directly in chat** — only support `.env` files and keypair file paths.
12. **Use `VersionedTransaction`, not legacy `Transaction`** — The API returns a versioned transaction. Deserialize with `VersionedTransaction.deserialize(buffer)`, sign with `transaction.sign([keypair])`, and serialize with `Buffer.from(transaction.serialize()).toString('base64')`. Do not use legacy `Transaction.from()` or `partialSign()`.
13. **Script execution requires Node.js v18+** — The payment script uses `fetch` (built-in from Node 18) and `@solana/web3.js`. If Node.js is too old, fall back to providing the script for manual execution or suggest the user upgrade Node.js.
14. **Always verify transaction contents before signing** — Never blindly sign a server-provided transaction. Decode the instructions, verify the program is SPL Token, verify the amount matches expectations and does not exceed 1 JUP (1,000,000 base units), and verify the destination matches the expected receiver ATA. Reject if any unexpected instructions are present (compute budget instructions are allowed).
15. **Never interpolate user input into source code** — User-provided values (description, Twitter handles, etc.) must be written to a separate `config.json` file and read at runtime. Embedding user input directly in TypeScript string literals enables code injection attacks.

---

# Resources

- **JUP Token Mint**: `JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN`
- **Jupiter Docs**: [dev.jup.ag](https://dev.jup.ag)
- **Jupiter Verified**: [verified.jup.ag](https://verified.jup.ag)
