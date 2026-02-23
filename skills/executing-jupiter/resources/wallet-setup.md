# Wallet setup

Use this checklist before any state-changing Jupiter action.

## Required setup
- Use a supported Solana wallet that can sign `VersionedTransaction`.
- Connect to the intended cluster and show it to the user before signing.
- Ensure native SOL exists for fees and account rent.
- Ensure source token ATA exists or can be created in the transaction flow.
- Load token metadata so user-entered amounts can be converted with mint decimals.

## Safety gates
- Never auto-sign or auto-send transactions.
- Show signer address, token mint, human amount, and estimated fee before confirmation.
- Require explicit user confirmation for each signature request.
- If wallet/account changes mid-flow, invalidate prepared transactions and rebuild.

## Operational defaults
- Use fresh `requestId` values for each new submit attempt.
- Keep a per-action execution log: intent, requestId, signature, final status.
