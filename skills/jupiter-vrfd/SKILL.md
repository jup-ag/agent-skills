---
name: jupiter-vrfd
description: Guide agents through the Jupiter Token Verification express flow — submit verification requests, pay with JUP tokens, update token metadata, and check verification status.
license: MIT
metadata:
  author: jupiter
  version: "1.0.0"
tags:
  - jupiter-vrfd
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
- **Naming**: "Express" and "premium" refer to the same paid tier. User-facing name is **express**; the API uses `"premium"` as the `verificationTier` value.
- **Agent behavior**: Guide users efficiently — extract parameters from context, auto-resolve safe environment values where possible, batch-collect remaining inputs, and confirm before submitting. See [Agent Conversation Flow](#agent-conversation-flow).
- **Metadata merge rule** (applies to all requests with `tokenMetadata`): Fetch existing data via `GET /tokenMetadata/getFromRpcAndSearch/{tokenId}`, merge user's updates on top, and send the full merged object. Preserve exact strings for untouched fields. Do not send empty strings or `null` for fields the user did not ask to clear. Omit fields absent in both fetched data and user input.

## Use / Do Not Use

**Use when:**

- Submitting a token for verification (basic or express)
- Paying for express verification with JUP tokens
- Checking the verification status of a token
- Updating token metadata (name, symbol, social links, etc.) alongside verification

**Do not use when:**

- Performing internal or admin operations — this skill only covers the public verification flow
- Swapping, lending, or trading — use `integrating-jupiter` skill instead

## Triggers

`verify token`, `token verification`, `submit verification`, `verification status`, `check verification`, `verification payment`, `pay for verification`, `express verification`, `basic verification`, `update token metadata`, `token metadata`, `update token info`

## Intent Router

| User intent                       | Endpoint                                        | Method | Auth    |
| --------------------------------- | ----------------------------------------------- | ------ | ------- |
| Check express eligibility         | `/combined/express/check-eligibility?tokenId=…` | `GET`  | None    |
| Check basic eligibility           | `/combined/basic/check-eligibility?tokenId=…`   | `GET`  | None    |
| Fetch existing token data         | `/tokenMetadata/getFromRpcAndSearch/{tokenId}`  | `GET`  | None    |
| Submit basic verification         | `/basic/submit`                                 | `POST` | API key |
| Craft express payment transaction | `/payments/express/craft-txn?senderAddress=…`   | `GET`  | API key |
| Sign and execute express payment  | `/payments/express/execute`                     | `POST` | API key |

## References

Load these on demand when you need implementation details:

- **[API Reference](references/api-reference.md)** — Endpoint details, request/response schemas, data types, eligibility rules, API key generation and management, tokenMetadata schema. Load when making API calls or validating parameters.
- **[Payment Execution](references/payment-execution.md)** — Express payment flow (steps 7a–7e), template script, config.json, error handling. Load when the user confirms an express verification.

---

# Agent Conversation Flow

Extract as much as possible from the user's initial message, auto-resolve safe environment values (API key presence and private key source location, but not wallet address), then batch-collect remaining required fields in as few prompts as possible. Validate all inputs and confirm before making API calls.

## Step 0. Extract Upfront Parameters

Before asking questions, scan the user's message for: intent ("verify", "check status", "update metadata"), tier ("express"/"paid" → express, "basic"/"free" → basic), token mint (base58, 32–44 chars), token Twitter URL or handle, requester Twitter, description, wallet address.

Track what's known. For all subsequent steps, **skip any question whose answer was already extracted or auto-resolved.** If enough info is provided upfront, jump directly to eligibility or confirmation.

## Step 1. Determine Intent

If not clear from context, ask whether they want to: (1) check eligibility, (2) submit verification, or (3) update metadata.

For **update metadata** intent: proceed to Step 2 → 3 → 4 (eligibility endpoint must match the tier from Step 2).

## Step 2. Choose Verification Tier

Auto-select if the user's message indicates a preference (e.g., "express verification" → express, "basic verification" → basic). Otherwise ask: **basic** (free) or **express** (1 JUP). Default to express if unsure.

## Step 3. Collect Token Mint Address

Always required. Validate: must be a valid base58 string, typically 32–44 characters. If invalid, explain the expected format and ask again.

## Step 4. Check Token Eligibility

Check eligibility for **only** the tier selected in Step 2 — do NOT call both endpoints:

- **Basic**: `GET /combined/basic/check-eligibility?tokenId={tokenId}`
- **Express**: `GET /combined/express/check-eligibility?tokenId={tokenId}`

Handle the result:

**A) Already verified** (`canVerify: false`, error indicates existing non-rejected verification): Tell the user. If `canMetadata: true`, offer metadata update — the tier from Step 2 still applies (express metadata-only goes through payment flow, basic uses `POST /basic/submit`). If `canMetadata: false`, done.

**B) Can be verified** (`canVerify: true`): Report eligibility. If `canMetadata: true`, ask if they also want to update metadata. If `canMetadata: false`, note that metadata updates are unavailable. Continue to Step 5.

**C) Cannot be verified** (other error): Explain why in plain language. If `canMetadata: true`, offer metadata-only update. Otherwise stop.

**For check-only intent**: Report eligibility status and stop — do not proceed to submission.

## Step 5. Auto-Resolve Environment Values

Do this silently after the eligibility check — no user interaction needed unless values are missing.

**a) API Key:** Check that `.env` / `.env.local` contains `JUPITER_VRFD_API_KEY`, `JUP_VRFD_API_KEY`, or `VRFD_API_KEY`. Only check that the variable **exists** — do NOT read its value. Note the file path and variable name silently. If not found, address in Step 6. See [API Reference — Managing Keys](references/api-reference.md#managing-keys).

**b) Private Key Source (express only):**

1. Check `.env` / `.env.local` for `PRIVATE_KEY` or `SOLANA_PRIVATE_KEY` — only check existence, do NOT read the value
2. If not found, check for `~/.config/solana/id.json`
3. Note the file path and variable name for [Payment Execution — Step 7a](references/payment-execution.md#7a-locate-private-key-source)

If found, inform the user (e.g., _"Found `PRIVATE_KEY` in your .env — the payment script will use it directly after verifying it matches your wallet address"_). Wallet address still needs collecting in Step 6 unless already provided.

> **SECURITY:** Never read contents of `.env` or keypair files. Never derive wallet address from a private key. The user provides `walletAddress` separately; the payment script verifies it matches the signing key.

For **basic** submissions, skip private key checks.

## Step 6. Batch-Collect Remaining Parameters

Collect all missing fields in a **single prompt**. Skip fields already extracted (Step 0) or auto-resolved (Step 5).

**If API key was not found in Step 5a**: Direct the user to `https://vrfd-auth-api-dev.jup.ag/api/keys/new` (handles login + key generation). Warn: key shown once, cannot be retrieved. Creating a new key revokes any existing key. Store in `.env` as `JUPITER_VRFD_API_KEY=<key>`, ensure `.env` is in `.gitignore`.

**Field requirements:**

| Field                 | Express  | Basic    | Notes                                                              |
| --------------------- | -------- | -------- | ------------------------------------------------------------------ |
| Token Twitter URL     | Required | Optional | `https://x.com/…` or `https://twitter.com/…`                       |
| Requester Twitter URL | Optional | Optional | Omit if skipped — do not send empty string                         |
| Description           | Required | Optional | Short description of the token                                     |
| Wallet address        | Required | Required | Valid Solana public key; for express, payment script must verify match |

**Validation:** Twitter URLs must start with `https://x.com/` or `https://twitter.com/` + valid username (1–15 chars, alphanumeric + underscore). Auto-convert bare handles (e.g., `@handle` → `https://x.com/handle`) with user confirmation. Validate wallet with `new PublicKey(address)` from `@solana/web3.js`. Omit skipped optional fields entirely — do not send empty strings.

## Step 6a. Collect Metadata Fields (when metadata is included)

Runs when the user opted into metadata at Step 4, or in a metadata-only flow (`canVerify: false, canMetadata: true`).

#### 6a-i. Fetch existing token data

```http
GET {BASE_URL}/tokenMetadata/getFromRpcAndSearch/{tokenId}
```

Unauthenticated. See [API Reference — Get Existing Token Data](references/api-reference.md#get-existing-token-data) for the response schema and field mapping. Use `search[0]` as primary source, `description.description` for `tokenDescription`, and `rpc` for fields not in `search` (twitterCommunity, discord, instagram, tiktok).

#### 6a-ii. Collect user updates

Present available metadata fields in groups:
- **Identity:** name, symbol, icon, tokenDescription
- **Links:** website, twitter, twitterCommunity, telegram, discord, instagram, tiktok, otherUrl
- **Supply & Market:** circulatingSupply, circulatingSupplyUrl, coingeckoCoinId

Ask which fields to update, then collect new values only for those fields.

#### 6a-iii. Build tokenMetadata

Start from fetched data (6a-i), add `tokenId` (from Step 3), apply user changes (6a-ii). Follow the **metadata merge rule** from the top of this document. See [API Reference — tokenMetadata Object](references/api-reference.md#tokenmetadata-object) for the full schema.

**Auto-set rules:** When user provides `circulatingSupply` → set `useCirculatingSupply: true`. Same for `coingeckoCoinId` → `useCoingeckoCoinId: true`, `circulatingSupplyUrl` → `useCirculatingSupplyUrl: true`.

> **Express metadata-only exception:** `POST /payments/express/execute` requires `twitterHandle` and `description` as strings even for metadata-only requests. Send `twitterHandle: ""` and `description: ""` to satisfy the schema — do not ask the user. This applies **only** to express metadata-only; for normal express verification, these fields are required from the user.

## Step 7. Confirm Before Submitting

Present a summary table with: token mint, tier, token Twitter, requester Twitter, description, wallet, cost (1 JUP for express / Free for basic). If metadata fields were collected in Step 6a, include them. For **express**, add a balance warning: _"Make sure your wallet has at least 1 JUP before proceeding."_

For **metadata-only** flow, adjust the heading to "metadata update request" and omit verification-only fields (tier, token twitter, requester twitter, description).

Ask for confirmation. If the user says no, ask which field to change.

## Step 8. Submit and Report

| Flow | Action |
| ---- | ------ |
| **Basic** | `POST /basic/submit` with `submitVerification: true` and collected params. Include merged `tokenMetadata` if metadata was collected. Report `verificationCreated` / `metadataCreated`. |
| **Express** | Load [Payment Execution](references/payment-execution.md), follow steps 7a–7e. Include merged `tokenMetadata` if metadata was collected. |
| **Basic metadata-only** | `POST /basic/submit` with `submitVerification: false` and merged `tokenMetadata` only. Report `metadataCreated`. |
| **Express metadata-only** | Load [Payment Execution](references/payment-execution.md), follow steps 7a–7e. Payment still applies (1 JUP). Send `twitterHandle: ""` and `description: ""` per the exception in Step 6a-iii. Report `metadataCreated`. |

See [API Reference](references/api-reference.md) for request/response details.

---

# Input Auto-Correction

| User provides                           | Auto-correct to                 | Confirm? |
| --------------------------------------- | ------------------------------- | -------- |
| `@handle` or bare handle                | `https://x.com/{handle}`       | Yes      |
| `twitter.com/handle` or `x.com/handle`  | Add `https://` prefix           | Yes      |
| Token mint with leading/trailing spaces | Trimmed string                  | No       |

---

# Resources

- **JUP Token Mint**: `JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN`
- **Jupiter Docs**: [dev.jup.ag](https://dev.jup.ag)
- **Jupiter Verified**: [verified.jup.ag](https://verified.jup.ag)
