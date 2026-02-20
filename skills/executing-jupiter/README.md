Jupiter execution skill for AI agents to run Jupiter API workflows from CLI.

## For non-technical traders

### Quick start checklist

Before running anything:
- Confirm you are using a dedicated low-balance wallet.
- Confirm `JUP_API_KEY` is set.
- Confirm `SOLANA_RPC_URL` is set for final submission.
- Confirm token, amount, and destination address manually.

Safe execution order:
1. Fetch quote/order data (`fetch-api`).
2. Review what will happen (token, amount, wallet, destination).
3. Ask for explicit confirmation: `CONFIRM_EXECUTE=yes`.
4. Sign (`wallet-sign`) only after confirmation.
5. Submit (`execute-*` or `send-transaction`) only after confirmation.

Never skip the confirmation step for live funds.

### Agent prompt template (copy/paste)

```text
Use the executing-jupiter skill.
I am a non-technical trader.
1) Start with read-only checks first.
2) Explain results in plain English.
3) Before any signing/submission, show token, amount, wallet, destination, and expected outcome.
4) Require my exact approval string: CONFIRM_EXECUTE=yes.
5) If I do not provide that exact string, stop.
```

## Prerequisites

- Node.js 18+
- pnpm
- Jupiter API key from [portal.jup.ag](https://portal.jup.ag)
- Solana wallet file for signing
- RPC endpoint URL for sending transactions

## Setup

```bash
cd /path/to/agent-skills/skills/executing-jupiter
pnpm install
export JUP_API_KEY=your_api_key_here
export SOLANA_RPC_URL=https://your-rpc-endpoint
```

## First run (safe, read-only)

```bash
# Check wallet positions
pnpm fetch-api -e /portfolio/v1/positions/YOUR_WALLET_ADDRESS

# Check token price
pnpm fetch-api -e /price/v3 -p '{"ids":"So11111111111111111111111111111111111111112"}'
```

## Usage

See [SKILL.md](SKILL.md) for full documentation, script reference, and execution workflows.
