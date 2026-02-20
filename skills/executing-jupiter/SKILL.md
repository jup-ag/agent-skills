---
name: executing-jupiter
description: >
  Use when you need to execute Jupiter API operations on Solana through
  CLI scripts — swaps, limit orders, DCA, lending, prediction markets,
  token sends, or studio token creation. Use when you have a JUP_API_KEY
  and a local Solana wallet and need to sign and submit transactions.
---

# Jupiter API Execution

Execute Jupiter API operations through CLI scripts for fetching data, signing transactions, and executing swaps on Solana.
This guide is written for operators/traders first, not just developers.

**Base URL**: `https://api.jup.ag`

## Table of contents

- [Use / Do Not Use](#use--do-not-use)
- [Skill routing rule](#skill-routing-rule)
- [Domain glossary](#domain-glossary)
- [Amounts and decimals](#amounts-and-decimals)
- [Critical directives](#critical-directives)
- [Quick reference](#quick-reference)
- [Execute path specification](#execute-path-specification)
- [Setup](#setup)
- [Execution workflow](#execution-workflow)
- [Key execution caveats](#key-execution-caveats)
- [Fee estimation](#fee-estimation)
- [Error recovery](#error-recovery)
- [Common mistakes](#common-mistakes)
- [Reference guides](#reference-guides)

## Use / Do Not Use

Use when:
- You want to place/cancel orders or send transactions now.
- You need executable Jupiter workflows with signing and submission steps.

Do not use when:
- You only want design guidance and no live execution. Use `integrating-jupiter`.

**Triggers**: `swap SOL`, `execute swap`, `limit order`, `DCA order`, `recurring buy`, `lend deposit`, `lend withdraw`, `prediction market order`, `send tokens`, `create token`, `studio token`, `sign transaction`, `wallet sign`, `send transaction`, `Ultra order`, `Trigger order`, `Recurring order`

> Note: Read-only operations (`check holdings`, `portfolio positions`, `token price`) can be handled by either this skill or `integrating-jupiter`. Use this skill only when the user also needs to execute transactions in the same session.

## Skill routing rule

- If the user asks to `sign`, `execute`, `submit`, or `send transaction`, use this skill.
- If the user asks only for endpoint selection, integration design, or response-shape guidance, route to `integrating-jupiter`.
- For overlapping intents (`limit order`, `send`, `portfolio`, `price`): use this skill only when live execution is requested.

## Domain glossary

- `requestId`: trade/order identifier returned by Jupiter order endpoints; passed to execute scripts.
- `lamports`: smallest SOL unit. 1 SOL = 1,000,000,000 lamports. amount=1000000 → 0.001 SOL.
- `slippageBps`: max acceptable price deviation in basis points (1 bps = 0.01%). Set in Trigger orders for higher fill rate.
- `ATA (Associated Token Account)`: auto-created account for holding a specific token. First swap into a new token may charge ~0.002 SOL rent.
- `mint address`: unique Solana address identifying a specific token (e.g., `So11111...112` = wrapped SOL).

## Amounts and decimals

All Jupiter API amounts are in **raw token units** (not human-readable). To convert:

    raw_amount = human_amount × 10^decimals

| Example | Human amount | Decimals | Raw amount (API value) |
|---|---|---|---|
| 0.001 SOL | 0.001 | 9 | 1000000 |
| 1 USDC | 1.0 | 6 | 1000000 |
| 100 USDC | 100.0 | 6 | 100000000 |
| 0.5 SOL | 0.5 | 9 | 500000000 |

Look up decimals: `pnpm fetch-api -e /tokens/v2/search -p '{"query":"USDC"}'` → check `decimals` field.

### Price-to-amount conversion (for Trigger limit orders)

When a user specifies a target price (e.g., "buy SOL at $150"), convert to `makingAmount` / `takingAmount`:

```
makingAmount = inputHumanAmount × 10^inputDecimals
takingAmount = (inputHumanAmount × targetPrice) × 10^outputDecimals
```

| Example | Input | Target price | makingAmount (input raw) | takingAmount (output raw) |
|---|---|---|---|---|
| Sell 0.001 SOL for USDC at $200/SOL | 0.001 SOL | $200 | 1000000 (0.001 × 10^9) | 200000 (0.001 × 200 × 10^6) |
| Buy SOL with 10 USDC at $150/SOL | 10 USDC | $150 | 10000000 (10 × 10^6) | 66666666 (10/150 × 10^9) |

For buy orders where the user specifies output price: `takingAmount = (inputHumanAmount / targetPrice) × 10^outputDecimals`.

## Critical directives

| Directive | Rule |
|---|---|
| **API key** (required) | All Jupiter REST calls must include `x-api-key` via `JUP_API_KEY` or `--api-key`. |
| **API versions** (required) | ALWAYS use exact version prefix. Price: `/price/v3`. Tokens: `/tokens/v2`. Ultra/Lend/Trigger/Recurring/Portfolio/Prediction/Send/Studio: all `/v1`. |
| **RPC** (for send-transaction) | Provide `--rpc-url` or set `SOLANA_RPC_URL` before sending signed transactions. |
| **Wallet safety** | Use a dedicated low-balance wallet. Never pass raw private keys via CLI flags. |
| **Execution safety** | Require explicit human confirmation before `wallet-sign`, `execute-*`, or `send-transaction`. |

## Quick reference

| Task | Script | Example |
|------|--------|---------|
| Call Jupiter REST endpoint | `fetch-api.ts` | `pnpm fetch-api -e /lend/v1/earn/tokens` |
| Sign an unsigned transaction | `wallet-sign.ts` | `pnpm wallet-sign -t "BASE64_TX" -w ~/.config/solana/id.json` |
| Execute Ultra order | `execute-order.ts` | `pnpm execute-ultra -r "REQUEST_ID" -t "SIGNED_TX"` |
| Execute Trigger order | `execute-order.ts` | `pnpm execute-trigger -r "REQUEST_ID" -t "SIGNED_TX"` |
| Execute Recurring order | `execute-order.ts` | `pnpm execute-recurring -r "REQUEST_ID" -t "SIGNED_TX"` |
| Send signed transaction to RPC | `send-transaction.ts` | `pnpm send-transaction -t "SIGNED_TX" -r "https://your-rpc"` |

Wallet inventory shortcuts:
- Portfolio positions: `pnpm fetch-api -e /portfolio/v1/positions/YOUR_WALLET_ADDRESS`
- Ultra holdings: `pnpm fetch-api -e /ultra/v1/holdings/YOUR_WALLET_ADDRESS`

## Execute path specification

Default rule: if a flow does **not** have a dedicated execute script, use `fetch-api` -> `wallet-sign` -> `send-transaction`.

| API family | Execute path |
|---|---|
| Ultra (`/ultra/v1`) | `fetch-api` (`/order`) -> `wallet-sign` -> `execute-ultra` (`/execute`) |
| Trigger (`/trigger/v1`) | `fetch-api` (`/createOrder`/`cancel*`) -> `wallet-sign` -> `execute-trigger` (`/execute`) |
| Recurring (`/recurring/v1`) | `fetch-api` (`/createOrder`/`cancelOrder`) -> `wallet-sign` -> `execute-recurring` (`/execute`) |
| Lend (`/lend/v1`) | `fetch-api` -> `wallet-sign` -> `send-transaction` |
| Prediction (`/prediction/v1`) | `fetch-api` -> `wallet-sign` -> `send-transaction` (when unsigned transaction returned) |
| Send (`/send/v1`) | `fetch-api` (`craft-*`) -> `wallet-sign` -> `send-transaction` |
| Studio (`/studio/v1`) | `fetch-api` for JSON endpoints; `send-transaction` when signed transaction submission needed |
| Portfolio / Tokens / Price | Read-only via `fetch-api` (no execute step) |

## Setup

```bash
cd /path/to/executing-jupiter
pnpm install
```

- Requires `jq` for JSON extraction in workflow commands.
- Set `JUP_API_KEY` env var or pass `--api-key`. Get key from [portal.jup.ag](https://portal.jup.ag).
- For `send-transaction`: set `SOLANA_RPC_URL` or pass `--rpc-url`. Use a dedicated private RPC for production.
- **Wallet address**: Many endpoints need the wallet's public address. Extract it from a wallet file:
  ```bash
  solana-keygen pubkey ~/.config/solana/id.json
  ```
  Or if `solana-keygen` is not installed, use the `wallet-sign` script's stderr output (it prints `Signed by: <pubkey>`) or ask the user for their address.

Minimum safe first session:
1. Run only read-only commands (holdings, price).
2. Review a quote/order response.
3. Set `CONFIRM_EXECUTE=yes` only when ready for live action.

## Execution workflow

```bash
# 1. Extract unsigned tx only when response includes .transaction
UNSIGNED_TX=$(echo "$RESULT" | jq -r '.transaction')
# Stop if UNSIGNED_TX is empty or "null"
# 2. Require explicit confirmation
test "${CONFIRM_EXECUTE:-}" = "yes" || { echo "Set CONFIRM_EXECUTE=yes after reviewing trade details"; exit 1; }
# 2. Sign (only proceed when exit code is 0)
SIGNED_TX=$(pnpm wallet-sign -t "$UNSIGNED_TX" --wallet ~/.config/solana/id.json)
# 3. Submit via execute-* (with -r REQUEST_ID) or send-transaction
```

Ultra/Trigger/Recurring responses also include `.requestId` — pass it to the execute script.

### Key execution caveats

- **Ultra**: Signed transactions expire in ~2 min. `/execute` is idempotent within TTL.
- **Trigger**: No on-chain minimum. Default zero slippage; set `slippageBps` for higher fill rate.
- **Recurring**: `params.time` only. Min $100 total, min 2 orders, min $50/order. Interval values: Hourly=3600, Daily=86400, Weekly=604800, Monthly=2592000.
- **Prediction**: **Geo-restricted** (US/South Korea blocked).
- **Send**: Dual-sign may be needed; `wallet-sign` supports one signer only.
- **Studio**: `/dbc-pool/submit` requires multipart — use `curl`, not `fetch-api`.

Full family gotchas: [references/api-families.md](references/api-families.md). Full bash examples: [references/playbooks.md](references/playbooks.md).
For beginners, start with: [First live swap in 10 lines](references/playbooks.md#first-live-swap-in-10-lines-beginner-path).

### Fee estimation

| API family | Fee model | How to check |
|---|---|---|
| Ultra | Fees + price impact embedded in response | Compare `inAmount` to `outAmount` for effective rate |
| Trigger | 0.1% platform fee (0.03% for stable pairs) | Included in fill price at execution |
| Recurring | 0.1% fee per order execution | Applied at fill time |

## Error recovery

| Symptom | Likely cause | Recovery |
|---|---|---|
| Expired signed payload | Ultra TTL (~2 min) or blockhash (~60s) elapsed | Re-fetch from originating endpoint, re-sign, re-execute |
| Rate limited (429) | Too many requests | Wait `Retry-After` header duration before retrying |
| Timeout (30s) | Network or RPC latency | Check [Solscan](https://solscan.io) before retrying to avoid duplicates |
| Missing RPC error | Neither `--rpc-url` nor `SOLANA_RPC_URL` set | Set `SOLANA_RPC_URL` env var or pass `--rpc-url` flag |
| `insufficient lamports` or `0x1` | Wallet lacks SOL for fees + amount | Check balance with portfolio endpoint; reduce amount or fund wallet |
| Simulation failed / preflight error | Transaction would fail on-chain | Read logs from `send-transaction` output. Common: insufficient balance, wrong token account |
| `null` token account / account not found | No ATA for this token yet | Transaction usually auto-creates ATAs. If not, use `spl-token create-account` first |
| Slippage exceeded | Market moved during signing window | Re-fetch order with larger `slippageBps`, or retry quickly |
| Blockhash expired | Too long between fetch and submit | Re-fetch, re-sign, re-execute. Aim to complete pipeline in <30s |
| `Transaction too large` | Too many instructions in one tx | Batch cancel with fewer orders (max 5 for Trigger) |
| Order not found on cancel | Order already filled or already cancelled | Check order status with `getTriggerOrders` or `getRecurringOrders` first |
| Prediction geo-blocked | US/South Korea IP restriction | Cannot use prediction markets from restricted regions |

## Common mistakes

- Forgetting `pnpm install` before running scripts.
- Using wrong API version prefix (e.g., `/price/v2` instead of `/price/v3`, `/tokens/v1` instead of `/tokens/v2`).
- Passing an unsigned transaction to `send-transaction` — must sign with `wallet-sign` first.
- Not checking `wallet-sign` exit code before proceeding to execute.
- Executing without manually confirming token, amount, and destination wallet.

## Reference guides

Read these only when needed:
- Playbook command sequences by product flow: [references/playbooks.md](references/playbooks.md)
- API families and endpoint inventory: [references/api-families.md](references/api-families.md)

For docs-only integration guidance, see the `integrating-jupiter` skill.
