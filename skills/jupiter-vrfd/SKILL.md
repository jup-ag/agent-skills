---
name: jupiter-vrfd
description: Use when a user wants to check Jupiter public token-verification eligibility, submit the public 1 JUP verification request, or send a paid metadata-only update for a Solana token mint.
---

# Jupiter Token Verification

This skill covers the public Jupiter token-verification flow for a Solana token mint, including optional metadata updates when the public API allows them.

- **Base URL**: `https://token-verification-dev-api.jup.ag`
- **Cost**: 1 JUP
- **Public routes covered**:
  - `GET /express/check-eligibility`
  - `GET /payments/express/craft-txn`
  - `POST /payments/express/execute`
- **Auth**: no API key required for the public submission flow

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

| User intent | Endpoint | Method | Auth |
| --- | --- | --- | --- |
| Check eligibility | `/express/check-eligibility?tokenId=...` | `GET` | None |
| Craft payment transaction | `/payments/express/craft-txn?senderAddress=...` | `GET` | None |
| Sign and execute payment | `/payments/express/execute` | `POST` | None |

## References

Load these on demand:

- **[API Reference](references/api-reference.md)** for request and response shapes for the 3 public routes
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
- prefer plain ESM Node execution with `pay.mjs`, because it works in more restricted environments than `tsx`
- equivalent shell and package-manager commands are fine; do not block on a specific CLI if the environment already has an equivalent way to run the same steps

---

# Agent Conversation Flow

Extract as much as possible from the user's first message. Skip questions whose answers are already present.

## Step 0. Extract Upfront Parameters

Look for:

- intent: explicit eligibility-only check or submission help
- submission mode if the user already made it clear
- token mint
- paying wallet address
- token metadata fields to update
- token Twitter handle or URL
- requester Twitter handle or URL
- description
- confirmation that the paying wallet holds at least 1 JUP plus a small amount of SOL for fees

## Step 1. Route the Request

If the user explicitly asks only to check eligibility, do that and stop after the eligibility response.

Otherwise, proceed into execute help. If the user says `verify`, `submit`, `apply`, or similar, treat it as a paid execute request and determine after eligibility whether it is verification-only, verification plus metadata, or metadata-only.

## Step 2. Collect Token Mint

`tokenId` is always required. Validate that it is a Solana public key.

## Step 3. Check Eligibility

Call:

```http
GET {BASE_URL}/express/check-eligibility?tokenId={tokenId}
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

## Step 3b. Collect Metadata Fields

If the chosen mode includes metadata, present the available metadata fields:

| Field | Type | Description |
| --- | --- | --- |
| `icon` | string | Token icon URL |
| `name` | string | Token name |
| `symbol` | string | Token symbol |
| `website` | string | Project website URL |
| `telegram` | string | Telegram link |
| `twitter` | string | Twitter / X URL |
| `twitterCommunity` | string | Twitter community URL |
| `discord` | string | Discord invite link |
| `instagram` | string | Instagram URL |
| `tiktok` | string | TikTok URL |
| `circulatingSupply` | string | Circulating supply value |
| `useCirculatingSupply` | boolean | Enable circulating supply display |
| `tokenDescription` | string | Token description |
| `coingeckoCoinId` | string | CoinGecko coin ID |
| `useCoingeckoCoinId` | boolean | Enable CoinGecko integration |
| `circulatingSupplyUrl` | string | URL that returns circulating supply |
| `useCirculatingSupplyUrl` | boolean | Enable supply URL |
| `otherUrl` | string | Any other relevant URL |

Collect only the fields the user wants to update. Build the `tokenMetadata` object with just those fields plus `tokenId`. Do not include fields the user did not specify.

If the chosen mode does not include metadata, continue without `tokenMetadata`.

## Step 4. Resolve Local Signer Source

Only for execute requests.

Check for a local signing source in this order:

1. `.env` / `.env.local` contains `PRIVATE_KEY` or `SOLANA_PRIVATE_KEY`
2. `~/.config/solana/id.json`
3. a user-provided keypair file path

Only confirm file paths and variable names in chat. Never print secret values. Only derive the wallet address inside the local execution script so it can verify that the signer matches `walletAddress`.

If the current agent cannot safely access a local signer source, stop here and hand the user the local execution steps from [Payment Execution](references/payment-execution.md) instead of asking for secrets in chat.

## Step 5. Batch-Collect Remaining Parameters

Collect all missing fields in one prompt, including confirmation that the paying wallet holds at least 1 JUP plus a small amount of SOL for fees.

| Field | Required | Notes |
| --- | --- | --- |
| `submissionMode` | Yes for execute requests | `verification`, `verification+metadata`, or `metadata-only` |
| `walletAddress` | Yes | Paying wallet; maps to `senderAddress` in the API body |
| `twitterHandle` | Yes for any flow that creates verification | Accept `@handle`, bare `handle`, or `https://x.com/handle`; normalize to `https://x.com/{handle}` before execute. Use `""` only for metadata-only execute. |
| `senderTwitterHandle` | No | Accept `@handle`, bare `handle`, or `https://x.com/handle`; normalize to `https://x.com/{handle}` before execute. Omit if not provided. |
| `description` | Yes for any flow that creates verification | Short token description; use `""` only for metadata-only execute |

Validation rules:

- wallet must be a valid Solana public key
- `twitterHandle` and `senderTwitterHandle` may be `@handle`, bare `handle`, or `https://x.com/handle`
- normalize handle inputs to `https://x.com/{handle}` with user confirmation before execute
- omit absent optional fields instead of sending empty strings
- for metadata-only execute requests, set `twitterHandle: ""` and `description: ""` at execute time instead of asking the user to invent values
- require the user to confirm the paying wallet currently holds at least 1 JUP plus a small amount of SOL for fees before continuing

## Step 6. Confirm Before Submitting

Summarize:

- submission mode
- token mint
- wallet address
- token Twitter URL if applicable
- requester Twitter URL if present
- description if applicable
- metadata fields to update, if any
- cost: 1 JUP

Require an explicit final confirmation that:

- the listed wallet will pay 1 JUP
- that wallet has enough SOL for network fees
- the chosen submission mode is correct
- the user wants you to proceed with the submission now

## Step 7. Submit and Report

Load [Payment Execution](references/payment-execution.md) and follow the local signing flow:

1. craft the unsigned transaction with `GET /payments/express/craft-txn`
2. verify the transaction contents before signing
3. sign locally
4. submit via `POST /payments/express/execute`, sending `twitterHandle: ""` and `description: ""` only for metadata-only execute requests

Report the returned transaction signature and whether `verificationCreated` / `metadataCreated` were set.

If the current agent cannot run the local signing flow safely, stop and hand the user the exact local script and `config.json` steps instead of claiming the request was submitted.

---

# Input Auto-Correction

| User provides | Auto-correct to | Confirm? |
| --- | --- | --- |
| `@handle` or bare handle for `twitterHandle` or `senderTwitterHandle` | `https://x.com/{handle}` | Yes |
| `x.com/handle` for `twitterHandle` or `senderTwitterHandle` | Add `https://` prefix | Yes |
| token mint with surrounding spaces | Trimmed string | No |

---

# Resources

- **JUP Token Mint**: `JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN`
- **Jupiter Docs**: [dev.jup.ag](https://dev.jup.ag)
- **Jupiter Verified**: [verified.jup.ag](https://verified.jup.ag)
