---
name: jupiter-vrfd
description: Use when checking Jupiter express verification eligibility or running the public express verification payment flow.
---

# Jupiter Token Verification

This skill covers only the public express verification flow.

- **Base URL**: `https://token-verification-dev-api.jup.ag`
- **Cost**: 1 JUP
- **Naming**: user-facing tier is **express**; the API stores it as `"premium"`
- **Public routes covered**:
  - `GET /express/check-eligibility`
  - `GET /payments/express/craft-txn`
  - `POST /payments/express/execute`
- **Auth**: no API key required for the public express flow

## Use / Do Not Use

**Use when:**

- checking whether a token is eligible for express verification
- crafting and signing the 1 JUP express payment transaction
- executing the public express verification flow
- optionally passing a `tokenMetadata` object that the user already has

**Do not use when:**

- basic verification is needed
- the agent would need private or internal routes
- the agent needs to fetch or merge existing metadata from non-public endpoints
- the user wants swaps, trading, or unrelated Jupiter flows

## Triggers

`verify token`, `express verification`, `check express eligibility`, `craft express transaction`, `execute express payment`, `pay for verification`

## Intent Router

| User intent | Endpoint | Method | Auth |
| --- | --- | --- | --- |
| Check express eligibility | `/express/check-eligibility?tokenId=...` | `GET` | None |
| Craft express payment transaction | `/payments/express/craft-txn?senderAddress=...` | `GET` | None |
| Sign and execute express payment | `/payments/express/execute` | `POST` | None |

## References

Load these on demand:

- **[API Reference](references/api-reference.md)** for request and response shapes for the 3 public routes
- **[Payment Execution](references/payment-execution.md)** when the user confirms the express payment flow

---

# Agent Conversation Flow

Extract as much as possible from the user's first message. Skip questions whose answers are already present.

## Step 0. Extract Upfront Parameters

Look for:

- intent: eligibility check or full express submission
- token mint
- wallet address
- token Twitter URL or handle
- requester Twitter URL or handle
- description
- optional `tokenMetadata` object

## Step 1. Determine Intent

If unclear, ask whether the user wants:

1. an express eligibility check, or
2. the full express payment flow

Default to the eligibility check if the message is ambiguous.

## Step 2. Collect Token Mint

`tokenId` is always required. Validate that it is a Solana public key.

## Step 3. Check Express Eligibility

Call:

```http
GET {BASE_URL}/express/check-eligibility?tokenId={tokenId}
```

Interpret the result:

- `canVerify: true` means the token can enter the express verification flow
- `canVerify: false` means the user cannot submit express verification; explain `verificationError`
- `canMetadata: true` only means the execute endpoint can accept `tokenMetadata` if the caller already has a complete payload
- `canMetadata: false` means metadata cannot be submitted in the same execute call

For an eligibility-only request, report the result and stop here.

## Step 4. Resolve Local Signer Source

Only for the full express payment flow.

Check for a local signing source in this order:

1. `.env` / `.env.local` contains `PRIVATE_KEY` or `SOLANA_PRIVATE_KEY`
2. `~/.config/solana/id.json`

Only confirm file paths and variable names. Never read secret values. Never derive the wallet address from the private key inside the agent.

## Step 5. Batch-Collect Remaining Parameters

Collect all missing fields in one prompt.

| Field | Required | Notes |
| --- | --- | --- |
| `walletAddress` | Yes | Maps to `senderAddress` in the API body |
| `twitterHandle` | Yes for normal express verification | Full `x.com` or `twitter.com` URL |
| `senderTwitterHandle` | No | Omit if not provided |
| `description` | Yes for normal express verification | Short token description |
| `tokenMetadata` | No | Only accept it if the user already has the object they want to send |

Validation rules:

- wallet must be a valid Solana public key
- Twitter URLs must be `https://x.com/...` or `https://twitter.com/...`
- bare handles may be normalized to `https://x.com/{handle}` with user confirmation
- omit absent optional fields instead of sending empty strings

If the user wants a metadata-only execute call, this skill can support it only when they already provide the full `tokenMetadata` object. Do not fetch or reconstruct metadata through private routes.

## Step 6. Confirm Before Submitting

Summarize:

- token mint
- wallet address
- token Twitter URL
- requester Twitter URL if present
- description
- whether `tokenMetadata` will be sent
- cost: 1 JUP

Warn the user to keep at least 1 JUP plus a small amount of SOL for fees in the paying wallet.

## Step 7. Submit and Report

Load [Payment Execution](references/payment-execution.md) and follow the local signing flow:

1. craft the unsigned transaction with `GET /payments/express/craft-txn`
2. verify the transaction contents before signing
3. sign locally
4. submit via `POST /payments/express/execute`

Report the returned transaction signature and whether `verificationCreated` / `metadataCreated` were set.

---

# Input Auto-Correction

| User provides | Auto-correct to | Confirm? |
| --- | --- | --- |
| `@handle` or bare handle | `https://x.com/{handle}` | Yes |
| `twitter.com/handle` or `x.com/handle` | Add `https://` prefix | Yes |
| token mint with surrounding spaces | Trimmed string | No |

---

# Resources

- **JUP Token Mint**: `JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN`
- **Jupiter Docs**: [dev.jup.ag](https://dev.jup.ag)
- **Jupiter Verified**: [verified.jup.ag](https://verified.jup.ag)
