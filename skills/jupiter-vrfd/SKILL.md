---
name: jupiter-vrfd
description: Use when a user mentions Jupiter token verification, VRFD eligibility, paying 1000 JUP to verify a token, submitting a verification request, or updating on-chain token metadata via the Jupiter express verification flow.
license: MIT
metadata:
  author: jupiter
  version: "1.0.0"
tags:
  - jupiter
  - jup-ag
  - jupiter-vrfd
  - token-verification
  - verified
  - solana
---

# Jupiter Token Verification

This skill routes agents through the public Jupiter token-verification flow for a Solana token mint.

- **Base URL**: `https://api.jup.ag`
- **Auth**: `x-api-key` from [portal.jup.ag](https://portal.jup.ag/) (required)
- **Cost**: 1000 JUP
- **Public routes covered**:
  - `GET /tokens/v2/verify/express/check-eligibility`
  - `GET /tokens/v2/verify/express/craft-txn`
  - `POST /tokens/v2/verify/express/execute`

## Use / Do Not Use

**Use when:**

- checking whether a token is eligible for submission
- crafting and signing the submission payment transaction
- executing the submission flow
- optionally updating token metadata as part of the submission
- submitting a metadata-only paid update when eligibility allows metadata but not verification

**Do not use when:**

- the agent would need private or internal routes
- the agent needs to fetch or merge existing metadata from non-public endpoints
- the user wants swaps, trading, or unrelated Jupiter flows

## Triggers

`verify token`, `submit verification`, `check eligibility`, `craft payment transaction`, `execute payment`, `pay for verification`, `update token metadata`, `metadata-only submission`

## Intent Router

| User intent               | Endpoint                                                   | Method |
| ------------------------- | ---------------------------------------------------------- | ------ |
| Check eligibility         | `/tokens/v2/verify/express/check-eligibility?tokenId=...`  | `GET`  |
| Craft payment transaction | `/tokens/v2/verify/express/craft-txn?senderAddress=...`    | `GET`  |
| Sign and execute payment  | `/tokens/v2/verify/express/execute`                        | `POST` |

## References

Load these on demand:

- **[API Reference](references/api-reference.md)** for the exact request and response shapes, accepted input formats, normalization rules, submission-mode field requirements, and token metadata fields. This is the source of truth for request construction.
- **[Payment Execution](references/payment-execution.md)** when the user wants to execute a request and has confirmed the paying wallet details

## Agent Operating Rules

- Reuse as much as possible from the user's first message. Ask only for missing required fields.
- Never ask the user to paste a raw private key or seed phrase into chat.
- Never print secret values. Only mention non-sensitive file paths, key names, and derived public addresses.
- Do not claim a request was submitted unless you have a real API response or the user explicitly ran the local script themselves.
- If the current agent runtime cannot reach the network, install dependencies, or access local signer files, stop before execution and hand the user the exact local steps instead of fabricating progress.

## Execution Notes

For execute requests in constrained agent environments:

- outbound HTTP and package installation may require approval or user permission
- prefer plain ESM Node execution with `submit-verification.mjs`, because it works in more restricted environments than `tsx`
- equivalent shell and package-manager commands are fine; do not block on a specific CLI if the environment already has an equivalent way to run the same steps

## Rate Limits And Retries

- The Jupiter API enforces rate limits per API key. On HTTP 429, back off exponentially with jitter before retrying.
- `craft-txn` and `execute` are **not idempotent** — do not blindly retry execute after an ambiguous failure. Check the transaction signature on-chain first.
- Only retry on transient errors (network failures, 429, 5xx). Do not retry on 400/403.

---

## Agent Conversation Flow

Extract as much as possible from the user's first message. Skip questions whose answers are already present.

## Step 0. Extract Upfront Parameters

Look for:

- intent: explicit eligibility-only check or submission help
- submission mode if the user already made it clear
- token mint
- paying wallet address
- wallet keypair source (file path or env var name)
- token metadata fields to update
- token Twitter handle or URL
- requester Twitter handle or URL
- description
- confirmation that the paying wallet holds at least 1000 JUP plus a small amount of SOL for fees

## Step 1. Route the Request

If the user explicitly asks only to check eligibility, do that and stop after the eligibility response.

Otherwise, proceed into execute help. If the user says `verify`, `submit`, `apply`, or similar, treat it as a paid execute request and determine after eligibility whether it is verification-only, verification plus metadata, or metadata-only.

## Step 2. Collect Token Mint

`tokenId` is always required. Validate that it is a Solana public key.

## Step 3. Check Eligibility

Call:

```http
GET {BASE_URL}/tokens/v2/verify/express/check-eligibility?tokenId={tokenId}
x-api-key: {API_KEY}
```

Interpret the result:

- `canVerify: true` means the token can enter the submission flow
- `canVerify: false` and `canMetadata: false` means the user cannot use the public paid flow; explain `verificationError` and `metadataError`
- `canVerify: false` and `canMetadata: true` means verification is blocked, but a metadata-only execute request may still be possible
- `canMetadata: true` means the execute endpoint can also accept a `tokenMetadata` update
- `canMetadata: false` means metadata cannot be updated in this submission

For an eligibility-only request, report the result and stop here.

## Step 3a. Choose Submission Mode

- If `canVerify: true`, default to verification submission.
- If `canVerify: true` and `canMetadata: true`, ask whether they also want to update token metadata in the same paid request.
- If `canVerify: false` and `canMetadata: true`, explain that verification is unavailable but a metadata-only paid request may still be possible. Ask whether they want metadata-only submission.
- If `canVerify: false` and `canMetadata: false`, stop after explaining the returned errors.

## Step 3b. Load The Canonical Request Contract

- Load [API Reference](references/api-reference.md) before collecting execute inputs.
- Use the API reference as the source of truth for:
  - which fields are required for the chosen submission mode
  - accepted user input forms for `twitterHandle` and `senderTwitterHandle`
  - how to normalize those fields before execute
  - which `tokenMetadata` fields are available
- Collect only the missing required fields and only the metadata fields the user wants to change.

## Step 4. Collect Wallet

Only for execute requests.

Ask the user for their wallet keypair source. Supported formats:

- **Keypair JSON file** — file path to a Solana keypair JSON array (e.g. `~/.config/solana/id.json`)
- **Environment variable** — env var name containing a base58 private key (e.g. `PRIVATE_KEY` in `.env`)

Security rules:

- Never accept a raw private key or seed phrase pasted in chat.
- Never read secret values into agent context.
- Only record file paths and env var names. The signing key is loaded and used only inside the local execution script.
- The wallet address is derived inside the script to verify it matches the expected `walletAddress`.

If the current agent cannot safely access a local keypair, stop here and hand the user the local execution steps from [Payment Execution](references/payment-execution.md).

## Step 5. Confirm Before Executing

Batch-collect all missing required fields from the API reference, including confirmation that the paying wallet holds at least 1000 JUP plus a small amount of SOL for fees.

Summarize:

- submission mode
- token mint
- wallet address
- token Twitter URL if applicable
- requester Twitter URL if present
- description if applicable
- metadata fields to update, if any
- cost: 1000 JUP

Require an explicit final confirmation that:

- the listed wallet will pay 1000 JUP
- that wallet has enough SOL for network fees
- the chosen submission mode is correct
- the user wants you to proceed with the submission now

## Step 6. Submit And Report

Load [Payment Execution](references/payment-execution.md) and follow the local signing flow:

1. prepare the request fields using the canonical rules in [API Reference](references/api-reference.md)
2. craft the unsigned transaction with `GET /tokens/v2/verify/express/craft-txn`
3. **verify the transaction contents before signing** (see checklist below)
4. sign locally
5. submit via `POST /tokens/v2/verify/express/execute`

### Transaction Verification Checklist

Before signing the deserialized transaction, verify:

- `receiverAddress` matches the expected VRFD treasury address
- `mint` is `JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN` (JUP token)
- `amount` is `1000000000` (1000 JUP with 6 decimals)
- `expireAt` is in the future — if expired, re-craft a new transaction

If any check fails, **do not sign**. Report the mismatch to the user.

### Transaction Expiry

The `craft-txn` response includes an `expireAt` timestamp. If the user takes too long to confirm or the script runs after expiry, the transaction will be rejected. In that case, call `craft-txn` again to get a fresh transaction and restart from step 3.

Report the returned transaction signature and whether `verificationCreated` / `metadataCreated` were set.

If the current agent cannot run the local signing flow safely, stop and hand the user the exact local script from [Payment Execution](references/payment-execution.md) instead of claiming the request was submitted.

---

## Resources

- **JUP Token Mint**: `JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN`
- **Jupiter Docs**: [dev.jup.ag](https://dev.jup.ag)
- **Jupiter Verified**: [verified.jup.ag](https://verified.jup.ag)
