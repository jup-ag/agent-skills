---
name: executing-jupiter
description: >
  Executable Jupiter API skill for Solana swap, trade, and DeFi operations
  with CLI scripts for REST calls, transaction signing safety checks, and
  Ultra execution. Use when you need runnable Jupiter operations, not only
  reference docs.
allowed-tools: "Bash(pnpm *), Bash(solana *), Bash(spl-token *), Read, Grep, Glob"
argument-hint: "[swap SOL to USDC | check holdings | limit order | DCA]"
license: MIT
metadata:
  author: jupiter
  version: "1.0.0"
  primary_credential: JUP_API_KEY
  required_environment_variables:
    - JUP_API_KEY
  optional_environment_variables:
    - SOLANA_RPC_URL
  required_config_paths:
    - ~/.config/solana/id.json
  sensitive_inputs:
    - Solana wallet JSON file containing private key material
  argument_hint: "[swap SOL to USDC | check holdings | limit order | DCA]"
tags:
  - jupiter
  - jup-ag
  - ultra-swap
  - jupiter-lend
  - jupiter-trigger
  - jupiter-recurring
  - jupiter-tokens
  - jupiter-price
  - jupiter-portfolio
  - jupiter-prediction
  - jupiter-send
  - jupiter-studio
  - cli-scripts
  - solana
  - transaction-signing
  - execute
---

**Triggers**: `jupiter api`, `ultra`, `lend`, `trigger`, `recurring`, `tokens`, `price`, `portfolio`, `prediction`, `send`, `studio`, `wallet`, `holdings`, `positions`, `balance`, `assets`, `execute swap`, `sign transaction`, `fetch endpoint`, `token swap`, `swap SOL`, `swap USDC`, `limit order`, `DCA`, `dollar cost average`, `market buy`, `market sell`, `get price`, `check balance`, `token price`, `check holdings`, `buy`, `sell`, `trade`, `convert`, `exchange`, `quote`, `earn`, `deposit`, `withdraw`, `scheduled swaps`, `clawback`, `cancel order`, `my orders`, `open orders`, `SOL price`, `token info`, `transfer`, `staked JUP`, `bet`, `create token`

# Jupiter API Execution Skill

Execute Jupiter API operations through 6 utility scripts for fetching data, signing transactions, and executing swaps on Solana.

**Base URL**: `https://api.jup.ag`
**Scope**: Jupiter REST APIs

## Critical directives

| Directive | Rule |
|---|---|
| **API key** (required) | All Jupiter REST calls must include `x-api-key` via `JUP_API_KEY` or `--api-key`. |
| **API versions** (required) | ALWAYS use exact version prefix. Do NOT guess. Price: `/price/v3` (NOT v2). Tokens: `/tokens/v2` (NOT v1). Ultra/Lend/Trigger/Recurring/Portfolio/Prediction/Send/Studio: all `/v1`. |
| **RPC** (for send-transaction) | Provide `--rpc-url` or set `SOLANA_RPC_URL` before sending signed transactions. |
| **Wallet safety** | Use a dedicated low-balance wallet and never pass raw private keys via CLI flags. |

## Table of contents

- [Quick reference](#quick-reference)
- [Setup](#setup)
- [Use / Do Not Use](#use--do-not-use)
- [API Key Setup](#api-key-setup)
- [RPC setup](#rpc-setup)
- [Wallet safety](#wallet-safety)
- [Scripts](#scripts)
- [Ultra execution workflow](#ultra-execution-workflow)
- [Trigger execution workflow](#trigger-execution-workflow)
- [Recurring execution workflow](#recurring-execution-workflow)
- [Reference guides](#reference-guides)
- [Error recovery](#error-recovery)
- [Caveats](#caveats)
- [Resources](#resources)

## Quick reference

| Task | Script | Example |
|------|--------|---------|
| Call Jupiter REST endpoint| `fetch-api.ts` | `pnpm fetch-api -e /lend/v1/earn/tokens` |
| Sign a Solana transaction | `wallet-sign.ts` | `pnpm wallet-sign -t "BASE64_TX" -w ~/.config/solana/id.json` |
| Execute Ultra order | `execute-ultra.ts` | `pnpm execute-ultra -r "REQUEST_ID" -t "SIGNED_TX"` |
| Execute Trigger order | `execute-trigger.ts` | `pnpm execute-trigger -r "REQUEST_ID" -t "SIGNED_TX"` |
| Execute Recurring order | `execute-recurring.ts` | `pnpm execute-recurring -r "REQUEST_ID" -t "SIGNED_TX"` |
| Send signed transaction to RPC | `send-transaction.ts` | `pnpm send-transaction -t "SIGNED_TX" -r "https://your-rpc"` |

Wallet inventory shortcuts:
- Portfolio positions: `pnpm fetch-api -e /portfolio/v1/positions/YOUR_WALLET_ADDRESS`
- Ultra holdings: `pnpm fetch-api -e /ultra/v1/holdings/YOUR_WALLET_ADDRESS`

## Execute path specification

Default rule:
- If a flow does **not** have a dedicated execute helper script, run `fetch-api` -> `wallet-sign` -> `send-transaction`.

| API family | Execute path |
|---|---|
| Ultra (`/ultra/v1`) | `fetch-api` (`/order`) -> `wallet-sign` -> `execute-ultra` (`/execute`) |
| Trigger (`/trigger/v1`) | `fetch-api` (`/createOrder`/`cancel*`) -> `wallet-sign` -> `execute-trigger` (`/execute`) |
| Recurring (`/recurring/v1`) | `fetch-api` (`/createOrder`/`cancelOrder`) -> `wallet-sign` -> `execute-recurring` (`/execute`) |
| Lend (`/lend/v1`) | `fetch-api` -> `wallet-sign` -> `send-transaction` |
| Prediction (`/prediction/v1`) | `fetch-api` for API operations; when unsigned tx payloads are returned, use `wallet-sign` -> `send-transaction` |
| Send (`/send/v1`) | `fetch-api` (`craft-*`) -> `wallet-sign` -> `send-transaction` |
| Studio (`/studio/v1`) | `fetch-api` for JSON endpoints; submit/upload endpoints may need custom client, then signed tx via `send-transaction` when applicable |
| Portfolio / Tokens / Price | Read-only via `fetch-api` (no execute step) |

## Setup

```bash
# Run commands from this skill directory
cd /path/to/executing-jupiter
pnpm install
```

Prerequisites:
- `jq` (required for JSON extraction in the Ultra workflow commands)

## Use / Do Not Use

Use when:
- You need executable Jupiter API workflows.
- You need deterministic local signing checks before executing transactions.

Do not use when:
- You need a docs-only guide without script execution. Use `integrating-jupiter` instead.

## API Key Setup

**ALWAYS required.** All Jupiter API endpoints require an `x-api-key` header.

Get an API key from [portal.jup.ag](https://portal.jup.ag), then set:

```bash
export JUP_API_KEY=your_api_key_here
```

Or pass `--api-key` per command.

## RPC setup

`send-transaction` requires an RPC endpoint. Use one of:

```bash
# Option A: set once for your shell session
export SOLANA_RPC_URL=https://your-rpc-endpoint

# Option B: pass per command
pnpm send-transaction -t "BASE64_SIGNED_TX" --rpc-url "https://your-rpc-endpoint"
```

Use a dedicated private RPC for production workloads.

## Wallet safety

- Use a dedicated low-balance wallet for automation.
- Never pass raw private keys via CLI flags.

## Scripts

### fetch-api.ts

Fetch data from Jupiter REST endpoints.

```bash
# Ultra search
pnpm fetch-api -e /ultra/v1/search -p '{"query":"SOL"}'

# Lend tokens
pnpm fetch-api -e /lend/v1/earn/tokens

# Prediction: close position
pnpm fetch-api -e /prediction/v1/positions/YOUR_POSITION_PUBKEY -m DELETE
```

Arguments:
- `-e, --endpoint` (required): Jupiter endpoint path.
- `-p, --params`: JSON for query params (`GET`/`DELETE`) or body (`POST`).
- `-b, --body`: JSON body (`POST`).
- `-m, --method`: `GET`, `POST`, or `DELETE`.
- `-k, --api-key`: API key (or use `JUP_API_KEY`).

### wallet-sign.ts

Sign base64 unsigned transactions with wallet-file safety checks.

> **SECURITY NOTE**: The `--wallet` flag is required. This script does not accept private keys via command line arguments to prevent exposure in shell history and process listings.

```bash
pnpm wallet-sign -t "BASE64_UNSIGNED_TX" --wallet ~/.config/solana/id.json
```

**Arguments:**
- `-t, --unsigned-tx` (required): Base64-encoded unsigned transaction
- `-w, --wallet` (required): Path to Solana CLI JSON wallet file (supports ~ for home directory)

**Output:** Signed transaction (base64) to stdout.

### execute-ultra.ts

Execute signed Ultra orders.

```bash
pnpm execute-ultra -r "REQUEST_ID_FROM_ORDER" -t "BASE64_SIGNED_TX"
```

### execute-trigger.ts

Execute signed Trigger orders.

```bash
pnpm execute-trigger -r "REQUEST_ID_FROM_CREATE_ORDER" -t "BASE64_SIGNED_TX"
```

### execute-recurring.ts

Execute signed Recurring orders.

```bash
pnpm execute-recurring -r "REQUEST_ID_FROM_CREATE_ORDER" -t "BASE64_SIGNED_TX"
```

### send-transaction.ts

Send a signed transaction to Solana RPC (useful for Lend/Trigger/Recurring/Send/Studio flows that return unsigned tx payloads).

```bash
pnpm send-transaction -t "BASE64_SIGNED_TX" --rpc-url "https://your-rpc-endpoint"
```

**Arguments:**
- `-t, --signed-tx` (required): Base64-encoded signed transaction
- `-r, --rpc-url`: Required unless `SOLANA_RPC_URL` is set in the environment

**Output:** Transaction signature to stdout.

## Ultra execution workflow

The `/ultra/v1/order` response contains two fields you must extract:

```jsonc
// Shape of /ultra/v1/order response
{
  "transaction": "<base64-unsigned-tx>",  // unsigned transaction to sign
  "requestId": "<uuid>"                   // pass to execute-ultra after signing
}
```

```bash
# 1) Get order
ORDER=$(pnpm fetch-api -e /ultra/v1/order -p '{
  "inputMint": "So11111111111111111111111111111111111111112",
  "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "amount": 1000000,
  "taker": "YOUR_WALLET_ADDRESS"
}')
# ── Only proceed when ORDER contains both "transaction" and "requestId" fields ──

# 2) Sign
UNSIGNED_TX=$(echo "$ORDER" | jq -r '.transaction')
SIGNED_TX=$(pnpm wallet-sign -t "$UNSIGNED_TX" --wallet ~/.config/solana/id.json)
# ── Only proceed when SIGNED_TX is non-empty and wallet-sign exited 0 ──

# 3) Execute
REQUEST_ID=$(echo "$ORDER" | jq -r '.requestId')
pnpm execute-ultra -r "$REQUEST_ID" -t "$SIGNED_TX"
# ── Only proceed (consider success) when execute-ultra returns status "Success" ──
```

## Trigger execution workflow

Create a limit order (Trigger follows the same fetch → sign → execute pattern as Ultra):

```bash
# 1) Create order
ORDER=$(pnpm fetch-api -e /trigger/v1/createOrder -m POST -b '{
  "inputMint": "So11111111111111111111111111111111111111112",
  "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "maker": "YOUR_WALLET_ADDRESS",
  "payer": "YOUR_WALLET_ADDRESS",
  "params": { "makingAmount": "1000000", "takingAmount": "20000000" },
  "computeUnitPrice": "auto"
}')
# ── Only proceed when ORDER contains both "transaction" and "requestId" fields ──

# 2) Sign
SIGNED_TX=$(pnpm wallet-sign -t "$(echo "$ORDER" | jq -r '.transaction')" --wallet ~/.config/solana/id.json)
# ── Only proceed when SIGNED_TX is non-empty and wallet-sign exited 0 ──

# 3) Execute
pnpm execute-trigger -r "$(echo "$ORDER" | jq -r '.requestId')" -t "$SIGNED_TX"
# ── Only proceed (consider success) when execute-trigger returns status "Success" ──
```

## Recurring execution workflow

Create a DCA / recurring order (same fetch → sign → execute pattern). Use `params.time` only (price-based is deprecated):

```bash
# 1) Create order
ORDER=$(pnpm fetch-api -e /recurring/v1/createOrder -m POST -b '{
  "user": "YOUR_WALLET_ADDRESS",
  "inputMint": "So11111111111111111111111111111111111111112",
  "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "params": { "time": { "inAmount": 1000000, "numberOfOrders": 10, "interval": 86400 } }
}')
# ── Only proceed when ORDER contains both "transaction" and "requestId" fields ──

# 2) Sign
SIGNED_TX=$(pnpm wallet-sign -t "$(echo "$ORDER" | jq -r '.transaction')" --wallet ~/.config/solana/id.json)
# ── Only proceed when SIGNED_TX is non-empty and wallet-sign exited 0 ──

# 3) Execute
pnpm execute-recurring -r "$(echo "$ORDER" | jq -r '.requestId')" -t "$SIGNED_TX"
# ── Only proceed (consider success) when execute-recurring returns status "Success" ──
```

## Reference guides

Read these only when needed:
- Playbook command sequences by product flow: [references/playbooks.md](references/playbooks.md)
- API families, support level, and endpoint inventory: [references/api-families.md](references/api-families.md)

## Error recovery

Ultra signed transactions expire in approximately **2 minutes**.

### Execute fails after signing

If `execute-ultra` fails after `wallet-sign` succeeds:

1. Check `status`, `error`, and `code` from execute response.
2. Do not retry the same signed payload after ~2 minutes (it will have expired).
3. Re-fetch order, re-sign, then execute.

### Rate limiting (429)

`fetch-api` and `execute-ultra` print `Retry-After` when present. Wait that duration before retrying.

### Network/timeout errors

Scripts timeout after 30 seconds. On timeout for execute, check Solscan first before retry.

### Missing RPC configuration

`send-transaction` exits if neither `--rpc-url` nor `SOLANA_RPC_URL` is set. Configure one of them, then retry.

## Caveats
- `fetch-api` is JSON-oriented. Endpoints requiring multipart uploads (for example Studio submit) may require `curl` or custom client code.
- Verify latest behavior in Jupiter docs before production rollout.

## Resources

- [Jupiter Portal](https://portal.jup.ag)
- [Jupiter API integration skill](../integrating-jupiter/SKILL.md)
- [Jupiter Ultra Docs](https://dev.jup.ag/docs/ultra/index.md)
- [Jupiter Lend Docs](https://dev.jup.ag/docs/lend/index.md)
- [Jupiter Prediction Docs](https://dev.jup.ag/docs/prediction/index.md)
- [Jupiter API docs index](https://dev.jup.ag/llms.txt)
