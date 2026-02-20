# Runnable playbooks

All transaction-producing workflows follow the pattern in [SKILL.md Execution workflow](../SKILL.md#execution-workflow). Each playbook below shows the full bash pipeline for a specific API family.

## Table of contents

- [Mandatory safety gate (for live funds)](#mandatory-safety-gate-for-live-funds)
- [Common sign-and-execute template](#common-sign-and-execute-template)
- [Common token mints](#common-token-mints)
- [First live swap in 10 lines (beginner path)](#first-live-swap-in-10-lines-beginner-path)
- [Wallet inventory](#wallet-inventory)
- [Ultra: swap tokens](#ultra-swap-tokens)
- [Trigger: create a limit order](#trigger-create-a-limit-order)
- [Trigger: cancel a limit order](#trigger-cancel-a-limit-order)
- [Trigger: batch cancel limit orders](#trigger-batch-cancel-limit-orders)
- [Trigger: inspect open orders](#trigger-inspect-open-orders)
- [Recurring: create a DCA order](#recurring-create-a-dca-order)
- [Recurring: cancel a DCA order](#recurring-cancel-a-dca-order)
- [Lend: deposit / withdraw / redeem](#lend-deposit--withdraw--redeem)
- [Lend: check positions and earnings](#lend-check-positions-and-earnings)
- [Prediction: place an order](#prediction-place-an-order)
- [Prediction: claim winnings](#prediction-claim-winnings)
- [Prediction: inspect positions and close](#prediction-inspect-positions-and-close)
- [Send: craft and submit a transfer](#send-craft-and-submit-a-transfer)
- [Send: check invites](#send-check-invites)
- [Studio: create token transaction](#studio-create-token-transaction)
- [Submit a signed transaction (standalone)](#submit-a-signed-transaction-standalone)

## Mandatory safety gate (for live funds)

Before any `wallet-sign`, `execute-*`, or `send-transaction` command:

```bash
# 1) Review trade details from the fetched JSON first
# 2) Set explicit approval for this shell session
export CONFIRM_EXECUTE=yes
```

If `CONFIRM_EXECUTE` is not `yes`, do not continue to signing/submission.

## Common sign-and-execute template

Every transaction-producing workflow follows this pattern after fetching. The family-specific sections below only show the **fetch step** and deviations — use this template for signing and submission.

**For Ultra / Trigger / Recurring** (dedicated execute endpoint):
```bash
# Sign
UNSIGNED_TX=$(echo "$ORDER" | jq -r '.transaction')
REQUEST_ID=$(echo "$ORDER" | jq -r '.requestId')
test -n "$UNSIGNED_TX" && test "$UNSIGNED_TX" != "null" || { echo "No transaction returned"; exit 1; }
test "${CONFIRM_EXECUTE:-}" = "yes" || { echo "Set CONFIRM_EXECUTE=yes after review"; exit 1; }
SIGNED_TX=$(pnpm wallet-sign -t "$UNSIGNED_TX" --wallet ~/.config/solana/id.json)
# Execute (replace FAMILY with ultra, trigger, or recurring)
pnpm execute-FAMILY -r "$REQUEST_ID" -t "$SIGNED_TX"
```

**For Lend / Prediction / Send** (generic RPC submission):
```bash
# Sign
UNSIGNED_TX=$(echo "$RESULT" | jq -r '.transaction')
test -n "$UNSIGNED_TX" && test "$UNSIGNED_TX" != "null" || { echo "No transaction returned"; exit 1; }
test "${CONFIRM_EXECUTE:-}" = "yes" || { echo "Set CONFIRM_EXECUTE=yes after review"; exit 1; }
SIGNED_TX=$(pnpm wallet-sign -t "$UNSIGNED_TX" --wallet ~/.config/solana/id.json)
# Submit to RPC
pnpm send-transaction -t "$SIGNED_TX" --rpc-url "https://your-rpc-endpoint"
```

## Common token mints

| Token | Mint Address | Decimals | 1 token = |
|-------|-------------|----------|-----------|
| SOL | So11111111111111111111111111111111111111112 | 9 | 1,000,000,000 lamports |
| USDC | EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v | 6 | 1,000,000 units |
| USDT | Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB | 6 | 1,000,000 units |
| JUP | JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN | 6 | 1,000,000 units |

## First live swap in 10 lines (beginner path)

Replace `YOUR_WALLET_ADDRESS` and `~/.config/solana/id.json` first.

```bash
export CONFIRM_EXECUTE=yes
ORDER=$(pnpm fetch-api -e /ultra/v1/order -p '{"inputMint":"So11111111111111111111111111111111111111112","outputMint":"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v","amount":1000000,"taker":"YOUR_WALLET_ADDRESS"}')
echo "$ORDER" | jq '{inputMint,outputMint,inAmount: .inAmount // .amount,outAmount:.outAmount,requestId}'
test "${CONFIRM_EXECUTE:-}" = "yes" || { echo "Set CONFIRM_EXECUTE=yes after review"; exit 1; }
UNSIGNED_TX=$(echo "$ORDER" | jq -r '.transaction')
REQUEST_ID=$(echo "$ORDER" | jq -r '.requestId')
test -n "$UNSIGNED_TX" && test "$UNSIGNED_TX" != "null" || { echo "No transaction returned"; exit 1; }
SIGNED_TX=$(pnpm wallet-sign -t "$UNSIGNED_TX" --wallet ~/.config/solana/id.json)
pnpm execute-ultra -r "$REQUEST_ID" -t "$SIGNED_TX"
echo "Done. Verify on Solscan with returned signature."
```

## Wallet inventory

```bash
# Portfolio positions (broad Jupiter platform view)
pnpm fetch-api -e /portfolio/v1/positions/YOUR_WALLET_ADDRESS

# Ultra holdings (swap-router holdings view)
pnpm fetch-api -e /ultra/v1/holdings/YOUR_WALLET_ADDRESS

# Optional: staked JUP position
pnpm fetch-api -e /portfolio/v1/staked-jup/YOUR_WALLET_ADDRESS
```

## Ultra: swap tokens

```bash
# 1) Fetch order
ORDER=$(pnpm fetch-api -e /ultra/v1/order -p '{
  "inputMint": "So11111111111111111111111111111111111111112",
  "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "amount": 1000000,
  "taker": "YOUR_WALLET_ADDRESS"
}')
# 2) Sign and execute — see "Common sign-and-execute template" (Ultra path)
```

Example response from `/ultra/v1/order`:
```json
{ "transaction": "base64...", "requestId": "uuid-...", "inputMint": "So111...", "outputMint": "EPjF...", "inAmount": "1000000", "outAmount": "19500000" }
```

Example response from `/ultra/v1/execute`:
```json
{ "status": "Success", "signature": "5K7c..." }
```

## Trigger: create a limit order

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
# 2) Sign and execute — see "Common sign-and-execute template" (Trigger path)
```

Example response from `/trigger/v1/createOrder`:
```json
{ "transaction": "base64...", "requestId": "uuid-..." }
```

## Trigger: cancel a limit order

```bash
ORDER=$(pnpm fetch-api -e /trigger/v1/cancelOrder -m POST -b '{
  "maker": "YOUR_WALLET_ADDRESS",
  "orderPubkey": "ORDER_PUBKEY"
}')
# Sign and execute — see "Common sign-and-execute template" (Trigger path)
```

## Trigger: batch cancel limit orders

Batches up to 5 cancellations per transaction. For more than 5, repeat in batches.

```bash
ORDER=$(pnpm fetch-api -e /trigger/v1/cancelOrders -m POST -b '{
  "maker": "YOUR_WALLET_ADDRESS",
  "orderPubkeys": ["ORDER_PUBKEY_1", "ORDER_PUBKEY_2", "ORDER_PUBKEY_3"]
}')
# Sign and execute — see "Common sign-and-execute template" (Trigger path)
```

### Trigger: inspect open orders

```bash
pnpm fetch-api -e /trigger/v1/getTriggerOrders -p '{"maker":"YOUR_WALLET_ADDRESS","page":1}'
```

## Recurring: create a DCA order

Use `params.time` only (price-based is deprecated). Interval values: Hourly=3600, Daily=86400, Weekly=604800, Monthly=2592000.

```bash
ORDER=$(pnpm fetch-api -e /recurring/v1/createOrder -m POST -b '{
  "user": "YOUR_WALLET_ADDRESS",
  "inputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "outputMint": "So11111111111111111111111111111111111111112",
  "params": { "time": { "inAmount": 100000000, "numberOfOrders": 2, "interval": 86400 } }
}')
# Sign and execute — see "Common sign-and-execute template" (Recurring path)
```

Example response from `/recurring/v1/createOrder`:
```json
{ "transaction": "base64...", "requestId": "uuid-..." }
```

## Recurring: cancel a DCA order

```bash
ORDER=$(pnpm fetch-api -e /recurring/v1/cancelOrder -m POST -b '{
  "user": "YOUR_WALLET_ADDRESS",
  "orderPubkey": "ORDER_PUBKEY"
}')
# Sign and execute — see "Common sign-and-execute template" (Recurring path)
```

## Lend: deposit / withdraw / redeem

All three Lend operations follow the same pattern — only the endpoint and semantics differ:

| Action | Endpoint | What it does |
|--------|----------|-------------|
| Deposit | `POST /lend/v1/earn/deposit` | Deposit tokens into a lending market |
| Withdraw | `POST /lend/v1/earn/withdraw` | Withdraw principal from a market |
| Redeem | `POST /lend/v1/earn/redeem` | Convert receipt tokens back to underlying (e.g. jlpUSDC -> USDC) |

```bash
# 1) List supported lend tokens
pnpm fetch-api -e /lend/v1/earn/tokens

# 2) Fetch transaction (replace ENDPOINT with deposit, withdraw, or redeem)
RESULT=$(pnpm fetch-api -e /lend/v1/earn/ENDPOINT -m POST -b '{
  "wallet": "YOUR_WALLET_ADDRESS",
  "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "amount": "1000000"
}')
# 3) Sign and submit — see "Common sign-and-execute template" (Lend/Prediction/Send path)
```

Example response:
```json
{ "transaction": "base64..." }
```

### Lend: check positions and earnings

```bash
pnpm fetch-api -e /lend/v1/earn/positions -p '{"wallet":"YOUR_WALLET_ADDRESS"}'
pnpm fetch-api -e /lend/v1/earn/earnings -p '{"wallet":"YOUR_WALLET_ADDRESS"}'
```

## Prediction: place an order

> **Price convention**: 1,000,000 native units = $1.00 USD. An `amount` of `500000` means $0.50.

> **Geo-restricted**: US and South Korea IPs are blocked.

```bash
# 1) Search for events
pnpm fetch-api -e /prediction/v1/events/search -p '{"query":"BTC"}'

# 2) Get orderbook for a market
pnpm fetch-api -e /prediction/v1/orderbook/MARKET_ID

# 3) Place an order
RESULT=$(pnpm fetch-api -e /prediction/v1/orders -m POST -b '{
  "marketId": "MARKET_ID",
  "side": "YES",
  "amount": "1000000",
  "owner": "YOUR_WALLET_ADDRESS"
}')
# 4) Sign and submit — see "Common sign-and-execute template" (Lend/Prediction/Send path)
```

## Prediction: claim winnings

Check `position.claimable` before claiming.

```bash
# 1) Check positions for claimable winnings
POSITIONS=$(pnpm fetch-api -e /prediction/v1/positions -p '{"owner":"YOUR_WALLET_ADDRESS"}')
echo "$POSITIONS" | jq '.positions[] | select(.claimable == true) | {pubkey, claimable, payout}'

# 2) Claim a winning position
RESULT=$(pnpm fetch-api -e /prediction/v1/positions/YOUR_POSITION_PUBKEY/claim -m POST)
# 3) Sign and submit — see "Common sign-and-execute template" (Lend/Prediction/Send path)
```

### Prediction: inspect positions and close

```bash
pnpm fetch-api -e /prediction/v1/positions -p '{"owner":"YOUR_WALLET_ADDRESS"}'
pnpm fetch-api -e /prediction/v1/positions/YOUR_POSITION_PUBKEY -m DELETE
```

## Send: craft and submit a transfer

> **Dual-sign caveat**: `craft-send` may require sender + invite-derived keypair. `wallet-sign` supports one signer. See [Send docs](https://dev.jup.ag/docs/send/index.md) for dual-sign cases.

```bash
RESULT=$(pnpm fetch-api -e /send/v1/craft-send -m POST -b '{
  "senderAddress": "YOUR_WALLET_ADDRESS",
  "recipientAddress": "RECIPIENT_ADDRESS",
  "mint": "So11111111111111111111111111111111111111112",
  "amount": "1000000"
}')
# Sign and submit (single-signer only) — see "Common sign-and-execute template" (Lend/Prediction/Send path)
```

### Send: check invites

```bash
pnpm fetch-api -e /send/v1/pending-invites -p '{"senderAddress":"YOUR_WALLET_ADDRESS"}'
pnpm fetch-api -e /send/v1/invite-history -p '{"senderAddress":"YOUR_WALLET_ADDRESS"}'
```

## Studio: create token transaction

```bash
# 1) Create a token pool transaction
pnpm fetch-api -e /studio/v1/dbc-pool/create-tx -m POST -b '{
  "creator": "YOUR_WALLET_ADDRESS",
  "name": "My Token",
  "symbol": "MTK",
  "uri": "https://example.com/metadata.json"
}'

# 2) Look up pool addresses for an existing mint
pnpm fetch-api -e /studio/v1/dbc-pool/addresses/TOKEN_MINT_ADDRESS

# 3) Calculate fees
pnpm fetch-api -e /studio/v1/dbc/fee -m POST -b '{"mint":"TOKEN_MINT_ADDRESS"}'
```

### Studio: submit via multipart (curl)

`POST /studio/v1/dbc-pool/submit` requires multipart/form-data — `fetch-api` cannot handle this. Use `curl` directly:

```bash
curl -X POST "https://api.jup.ag/studio/v1/dbc-pool/submit" \
  -H "x-api-key: $JUP_API_KEY" \
  -F "signedTransaction=BASE64_SIGNED_TX" \
  -F "mintKeypair=BASE64_MINT_KEYPAIR" \
  -F "image=@/path/to/token-logo.png"
```

## Submit a signed transaction (standalone)

```bash
# With explicit RPC
pnpm send-transaction -t "BASE64_SIGNED_TX" --rpc-url "https://your-rpc-endpoint"

# With environment variable
export SOLANA_RPC_URL=https://your-rpc-endpoint
pnpm send-transaction -t "BASE64_SIGNED_TX"
```
