---
name: jupiter-vrfd
description: Use when a user mentions Jupiter token verification, VRFD eligibility, paying 1000 JUP to verify a token, submitting a verification request, or updating metadata via the Jupiter express verification flow.
license: MIT
metadata:
  author: jup-ag
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

**Base URL**: `https://api.jup.ag`
**Auth**: `x-api-key` from [portal.jup.ag](https://portal.jup.ag/) (required)
**Cost**: 1000 JUP

## Use/Do Not Use

Use when:
- checking whether a token is eligible for submission
- crafting and signing the submission payment transaction
- executing the submission flow
- optionally updating token metadata as part of the submission
- submitting a metadata-only paid update when eligibility allows metadata but not verification

Do not use when:
- the agent would need private or internal routes
- the agent needs to fetch or merge existing metadata from non-public endpoints
- the user wants swaps, trading, or unrelated Jupiter flows

**Triggers**: `verify token`, `submit verification`, `check eligibility`, `craft payment transaction`, `execute payment`, `pay for verification`, `update token metadata`, `metadata-only submission`

## Intent Router

| User intent               | Endpoint                                                  | Method |
| ------------------------- | --------------------------------------------------------- | ------ |
| Check eligibility         | `/tokens/v2/verify/express/check-eligibility?tokenId=...` | `GET`  |
| Craft payment transaction | `/tokens/v2/verify/express/craft-txn?senderAddress=...`   | `GET`  |
| Sign and execute payment  | `/tokens/v2/verify/express/execute`                       | `POST` |

## Examples

Load these on demand:

- **[API Reference](./references/api-reference.md)** for the exact request and response shapes, accepted input formats, normalization rules, submission-mode field requirements, and token metadata fields. This is the source of truth for request construction.
- **[Verify](./examples/verify.md)** when the user wants to execute a request and has confirmed the paying wallet details

## Agent Operating Rules

- Reuse as much as possible from the user's first message. Ask only for missing required fields.
- Never ask the user to paste a raw private key or seed phrase into chat.
- Never print secret values. Only mention non-sensitive file paths, key names, and derived public addresses.
- Do not claim a request was submitted unless you have a real API response or the user explicitly ran the local script themselves.
- If the current agent runtime cannot reach the network, install dependencies, or access local signer files, stop before execution and hand the user the exact local steps instead of fabricating progress.

## Execution Notes

For execute requests in constrained agent environments:

- outbound HTTP and package installation may require approval or user permission
- prefer plain ESM Node execution (`.mjs`), because it works in more restricted environments than `tsx`
- equivalent shell and package-manager commands are fine; do not block on a specific CLI if the environment already has an equivalent way to run the same steps

## Resources

- **JUP Token Mint**: `JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN`
- **Jupiter Docs**: [dev.jup.ag](https://dev.jup.ag)
- **Jupiter Verified**: [verified.jup.ag](https://verified.jup.ag)
