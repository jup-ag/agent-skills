---
name: jupiter-token-verification
description: Guide agents through the Jupiter Token Verification express flow — submit verification requests, pay with JUP tokens, update token metadata, and check verification status.
license: MIT
metadata:
  author: jupiter
  version: "1.0.0"
tags:
  - jupiter-token-verification
  - jup-ag
  - token-verification
  - token-metadata
  - update-metadata
  - vrfd
  - verified
  - solana
  - verification
---

# Jupiter Token Verification

Submit and pay for token verification on Jupiter via a simple REST API.

- **Base URL**: `https://token-verification-dev-api.jup.ag`
- **Auth**: API key required for submission endpoints (`x-api-key` header). Eligibility checks are unauthenticated.
- **Payment currency**: JUP (1 JUP per express verification)
- **Naming**: "Express" and "premium" refer to the same paid tier. The user-facing name is **express**, but the API uses `"premium"` as the `verificationTier` value.
- **Agent behavior**: Guide users step by step — collect parameters one at a time, validate each input, and confirm before submitting. See [Agent Conversation Flow](#agent-conversation-flow).

## Use / Do Not Use

**Use when:**

- Submitting a token for verification (basic or express)
- Paying for express verification with JUP tokens
- Checking the verification status of a token
- Updating token metadata (name, symbol, social links, etc.) alongside verification

**Do not use when:**

- Performing admin operations (verify, reject, unverify) — these require admin auth
- Swapping, lending, or trading — use `integrating-jupiter` skill instead

## Triggers

`verify token`, `token verification`, `submit verification`, `verification status`, `check verification`, `verification payment`, `pay for verification`, `express verification`, `basic verification`, `update token metadata`, `token metadata`, `update token info`

## Intent Router

| User intent                       | Endpoint                                        | Method | Auth    |
| --------------------------------- | ----------------------------------------------- | ------ | ------- |
| Check express eligibility         | `/combined/express/check-eligibility?tokenId=…` | `GET`  | None    |
| Check basic eligibility           | `/combined/basic/check-eligibility?tokenId=…`   | `GET`  | None    |
| Submit basic verification         | `/basic/submit`                                 | `POST` | API key |
| Craft express payment transaction | `/payments/express/craft-txn?senderAddress=…`   | `GET`  | API key |
| Sign and execute express payment  | `/payments/express/execute`                     | `POST` | API key |

## References

Load these on demand when you need implementation details:

- **[API Reference](references/api-reference.md)** — Endpoint details, request/response schemas, data types, eligibility rules, API key generation and management, tokenMetadata schema. Load when making API calls or validating parameters.
- **[Payment Execution](references/payment-execution.md)** — Express payment flow (steps 7a–7e), template script, config.json, error handling. Load when the user confirms an express verification.

---

# Agent Conversation Flow

When a user triggers this skill, guide them through parameter collection step by step. Do NOT ask for all parameters at once — collect them incrementally, validate each input, and confirm before making API calls.

## Step-by-Step Parameter Collection

### 1. Determine Intent

Ask the user what they want to do:

> What would you like to do?
>
> 1. **Check** if a token is eligible for verification
> 2. **Submit** a token for verification
> 3. **Update metadata** for a token (e.g., name, symbol, social links)

If the user's message already makes their intent clear, skip this question.

For **"update metadata" intent**: proceed to Step 2 (tier selection) → Step 3 (collect mint) → Step 4 (check eligibility). The eligibility endpoint must match the tier selected in Step 2.

### 2. Choose Verification Tier

Before collecting the mint address, determine which tier the user wants. This ensures only one eligibility endpoint is called later.

**Auto-select from user intent:** If the user's original message already indicates which tier they want, use their choice directly:

- Phrases like `express verification`, `paid verification`, `express flow` → auto-select **express**
- Phrases like `basic verification`, `free verification` → auto-select **basic**

**Otherwise, ask:**

> Would you like **basic** (free) or **express** (1 JUP) verification?
>
> - **Basic** — free, standard review process
> - **Express** — costs 1 JUP, paid from your wallet

Default to `express` if the user is unsure, approvals are faster.

### 3. Collect Token Mint Address (always required)

Ask:

> What is the **Solana token mint address** you'd like to verify?

**Validate before proceeding:**

- Must be a valid base58 string
- Typically 32–44 characters
- If invalid, say: _"That doesn't look like a valid Solana mint address. It should be a base58 string like `So11111111111111111111111111111111111111112`. Please try again."_

### 4. Check Token Eligibility (single tier)

After collecting the mint, check eligibility for **only** the tier selected in Step 2 — do NOT call both endpoints:

- **Basic**: `GET /combined/basic/check-eligibility?tokenId={tokenId}`
- **Express**: `GET /combined/express/check-eligibility?tokenId={tokenId}`

Use the result to determine which flow to follow:

**A) Token is already verified** — endpoint returns `canVerify: false` and the `verificationError` message indicates an existing (non-rejected) verification:

> This token is **already verified** on Jupiter.

| `canMetadata` | Action                                                                                                                                                                                                                                                          |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `true`        | Offer metadata update: _"Would you like to **update the token metadata** (name, symbol, social links, etc.)?"_ If yes → proceed to Step 5 (API key) → Step 6a (metadata collection) → Step 7 (confirm) → Step 8 with `submitVerification: false`. If no → done. |
| `false`       | Report: _"Metadata updates are also not available at this time ({metadataError})."_ Done.                                                                                                                                                                       |

**B) Token can be verified** — endpoint returned `canVerify: true`:

Proceed to **Step 4a** (Check Metadata Availability), then continue to Step 5.

**C) Token cannot be verified** — `canVerify: false` with an error other than existing verification (e.g., token not found, not eligible for this tier):

Report the `verificationError`. If `canMetadata: true`, offer a metadata-only update. Otherwise stop.

**For "check-only" intent** (user just wants to know status): report whether the token is eligible for the selected tier, whether metadata updates are available, and any errors. Done — do not proceed to submission.

### 4a. Check Metadata Availability

After confirming the token can be verified, check the `canMetadata` result from the eligibility response retrieved in Step 4:

| `canMetadata` | Action                                                                                                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `true`        | Ask: _"Would you also like to **update token metadata** (name, symbol, social links, etc.)?"_ If yes → metadata fields will be collected in Step 6a. If no → skip Step 6a. |
| `false`       | Inform: _"Metadata updates are not available for this token ({metadataError})."_ Skip Step 6a.                                                                             |

### 5. Resolve API Key

Before any authenticated call (`POST /basic/submit`, `GET /payments/express/craft-txn`, `POST /payments/express/execute`), resolve the API key:

1. Check `.env` / `.env.local` for `JUPITER_API_KEY` or `JUP_API_KEY`
2. If not found, guide the user through generating a new API key:
   - Direct them to open `https://vrfd-auth-api-dev.jup.ag/api/keys/new` in their browser — this handles login and key generation in one flow
   - **Important:** The key is shown **once** and cannot be retrieved again (only the prefix `vrfd_ak_xxxx...` is stored for display). Tell the user to copy it immediately.
   - Creating a new key automatically **revokes** any existing active key for their account
3. Once the user has their key, ask them to store it in `.env` as `JUPITER_API_KEY=<key>` and ensure `.env` is in `.gitignore`

The key is passed via the `x-api-key` header. Rate limit: 2 requests/day per key.

For full API key management details (listing keys, revoking keys), see [API Reference — Managing Keys](references/api-reference.md#managing-keys).

### 6. Collect Remaining Parameters (one at a time)

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

**d) Wallet Address** (required for basic tier and metadata-only flows)

A wallet address is needed for `POST /basic/submit` (basic verification and metadata-only updates). For **express verification with payment**, the wallet is derived during the payment execution flow (Step 8) — skip this step in that case.

**When this step applies:** basic tier, OR any metadata-only flow (regardless of tier — e.g., express tier where token is already verified and only metadata is being updated).

Resolve the wallet address automatically before asking the user:

1. Check `.env` / `.env.local` for `PRIVATE_KEY` or `SOLANA_PRIVATE_KEY`
2. Check for a Solana keypair file at `~/.config/solana/id.json`
3. If a private key is found, derive the wallet address using `Keypair.fromSecretKey` and confirm with the user: _"I found a private key in your environment and derived the wallet address `{address}`. Should I use this?"_
4. If no private key is found, ask directly:

> What is your **Solana wallet address**?

Validate: same base58 format as token mint.

### 6a. Collect Metadata Fields (when metadata is included)

Runs when the user opted in at Step 4a **or** in a metadata-only flow (`canVerify: false, canMetadata: true`).

Present the available fields:

> Here are the metadata fields you can update:
>
> **Identity:** name, symbol, icon, tokenDescription
> **Links:** website, twitter, twitterCommunity, telegram, discord, instagram, tiktok, otherUrl
> **Supply & Market Data:** circulatingSupply, circulatingSupplyUrl, coingeckoCoinId
>
> Which fields would you like to update?

Ask which fields they want to update, then collect values one at a time.

**Field collection rules:**

- `tokenId` is auto-filled from the token mint collected in Step 2 — do not ask for it
- When the user provides a value for `circulatingSupply`, auto-set `useCirculatingSupply: true`
- When the user provides a value for `coingeckoCoinId`, auto-set `useCoingeckoCoinId: true`
- When the user provides a value for `circulatingSupplyUrl`, auto-set `useCirculatingSupplyUrl: true`
- URL fields (website, twitter, discord, etc.) should be validated as proper URLs
- See [API Reference — tokenMetadata Object](references/api-reference.md#tokenmetadata-object) for the full schema

For **metadata-only** flow (when `canVerify: false, canMetadata: true`): this step is the primary collection step — verification params from Step 6 are skipped.

### 7. Confirm Before Submitting

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

If metadata fields were collected in Step 6a, add them to the summary:

> | **Metadata** | |
> | **— Name** | {value or _not provided_} |
> | **— Symbol** | {value or _not provided_} |
> | _(etc. for each collected field)_ | |

For **metadata-only** flow, adjust the heading: _"Here's a summary of your metadata update request:"_ and omit verification-only fields (tier, token twitter, your twitter, description).

> Does this look correct? (yes/no)

If the user says no, ask which field to change.

### 8. Submit and Report

- For **basic**: call `POST /basic/submit` with `submitVerification: true` and all collected parameters. Include `tokenMetadata` in the request body when metadata fields were collected in Step 6a. Report the result — response includes `verificationCreated` and `metadataCreated` booleans. Done. (See [API Reference](references/api-reference.md) for request/response details.)
- For **express**: load [Payment Execution](references/payment-execution.md) and follow steps 7a–7e. The agent will resolve the user's private key, write a payment script, execute it locally, and report the result. When metadata fields were collected, they are included in the execute request body as `tokenMetadata`.
- For **metadata-only** (when `canVerify: false, canMetadata: true`): call `POST /basic/submit` with `submitVerification: false` and include `tokenMetadata` with the collected fields. Do not include verification parameters. Report `metadataCreated` result.

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
4. **Payment is 1 JUP token** (1,000,000 base units with 6 decimals) — confirm the user has enough JUP balance before starting the payment flow.
5. **Check eligibility before submitting** — call `GET /combined/express/check-eligibility?tokenId=…` or `GET /combined/basic/check-eligibility?tokenId=…` first. Submitting a duplicate returns an error.
6. **Already-verified tokens cannot be resubmitted** — if the token is already verified, the eligibility endpoint returns `canVerify: false` with `verificationError`.
7. **Token must exist** — the token must be indexed by Jupiter's data API. Unknown tokens return an error.
8. **Admin endpoints are off-limits** — `POST /verifications/verify`, `POST /verifications/unverify`, and `POST /verifications/mass-unverify` all require admin authentication. Do not attempt to call them.
9. **Basic verification = done at Step 8** — only express verification requires the payment flow (steps 7a–7e).
10. **Express upgrades via execute** — when you pay via the `execute` endpoint, the server automatically creates (or upgrades) the verification to express tier. Response includes `verificationCreated` and `metadataCreated` booleans. You do not need to call `POST /basic/submit` separately for express.
11. **Private keys MUST stay local** — The payment script signs transactions client-side. The private key is NEVER sent to any API, server, or external service. Only the signed transaction is transmitted. Agents must communicate this clearly to users and include security comments in generated scripts. Recommend `.env` files (with `.gitignore`) and dedicated payment wallets. **Never accept a raw private key directly in chat** — only support `.env` files and keypair file paths.
12. **Use `VersionedTransaction`, not legacy `Transaction`** — The API returns a versioned transaction. Deserialize with `VersionedTransaction.deserialize(buffer)`, sign with `transaction.sign([keypair])`, and serialize with `Buffer.from(transaction.serialize()).toString('base64')`. Do not use legacy `Transaction.from()` or `partialSign()`.
13. **Script execution requires Node.js v18+** — The payment script uses `fetch` (built-in from Node 18) and `@solana/web3.js`. If Node.js is too old, fall back to providing the script for manual execution or suggest the user upgrade Node.js.
14. **Always verify transaction contents before signing** — Never blindly sign a server-provided transaction. Decode the instructions, verify the program is SPL Token, verify the amount matches expectations and does not exceed 1 JUP (1,000,000 base units), and verify the destination matches the expected receiver ATA. Reject if any unexpected instructions are present (compute budget instructions are allowed).
15. **Never interpolate user input into source code** — User-provided values (description, Twitter handles, etc.) must be written to a separate `config.json` file and read at runtime. Embedding user input directly in TypeScript string literals enables code injection attacks.
16. **API key required for submission endpoints** — `POST /basic/submit`, `GET /payments/express/craft-txn`, and `POST /payments/express/execute` all require an `x-api-key` header. Eligibility check endpoints are unauthenticated.
17. **Rate limit: 2 requests/day per API key** — The submission endpoints are rate-limited to 2 requests per day per API key. Warn users before submitting.
18. **Metadata can be submitted with or without verification** — The combined endpoints support optional `tokenMetadata` for setting token metadata alongside verification. When `canVerify: false` but `canMetadata: true`, submit with `submitVerification: false` and only `tokenMetadata` to perform a metadata-only update. At least one of `submitVerification: true` or `tokenMetadata` must be provided.

---

# Resources

- **JUP Token Mint**: `JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN`
- **Jupiter Docs**: [dev.jup.ag](https://dev.jup.ag)
- **Jupiter Verified**: [verified.jup.ag](https://verified.jup.ag)
