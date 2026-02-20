# Runnable playbooks

## Wallet inventory: answer "what is in my wallet?"

```bash
# 1) Portfolio positions (broad Jupiter platform view)
pnpm fetch-api -e /portfolio/v1/positions/YOUR_WALLET_ADDRESS

# 2) Ultra holdings (swap-router holdings view)
pnpm fetch-api -e /ultra/v1/holdings/YOUR_WALLET_ADDRESS

# 3) Optional: staked JUP position
pnpm fetch-api -e /portfolio/v1/staked-jup/YOUR_WALLET_ADDRESS
```

## Lend: fetch market context and positions

```bash
# 1) List supported lend tokens
pnpm fetch-api -e /lend/v1/earn/tokens

# 2) View positions for a wallet
pnpm fetch-api -e /lend/v1/earn/positions -p '{"wallet":"YOUR_WALLET_ADDRESS"}'

# 3) View earnings for a wallet
pnpm fetch-api -e /lend/v1/earn/earnings -p '{"wallet":"YOUR_WALLET_ADDRESS"}'
```

## Trigger: inspect open orders and prepare create payload

```bash
# 1) Read current trigger orders for wallet
pnpm fetch-api -e /trigger/v1/getTriggerOrders -p '{"maker":"YOUR_WALLET_ADDRESS","page":1}'

# 2) Build a createOrder request body template
cat <<'JSON'
{
  "inputMint": "So11111111111111111111111111111111111111112",
  "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "maker": "YOUR_WALLET_ADDRESS",
  "payer": "YOUR_WALLET_ADDRESS",
  "params": {
    "makingAmount": "1000000",
    "takingAmount": "20000000"
  },
  "computeUnitPrice": "auto"
}
JSON
```

## Prediction: discover markets and close a position

```bash
# 1) List events
pnpm fetch-api -e /prediction/v1/events

# 2) Inspect open positions (query shape may vary by API revision)
pnpm fetch-api -e /prediction/v1/positions -p '{"owner":"YOUR_WALLET_ADDRESS"}'

# 3) Close a position by pubkey
pnpm fetch-api -e /prediction/v1/positions/YOUR_POSITION_PUBKEY -m DELETE
```

## Submit a signed transaction with required RPC

```bash
# Option A: provide RPC per command
pnpm send-transaction -t "BASE64_SIGNED_TX" --rpc-url "https://your-rpc-endpoint"

# Option B: export once, then omit flag
export SOLANA_RPC_URL=https://your-rpc-endpoint
pnpm send-transaction -t "BASE64_SIGNED_TX"
```
