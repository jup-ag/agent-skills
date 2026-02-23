# Prediction claim

Use for claiming settlement on eligible prediction positions.

## Endpoint contract

- Build claim transaction via `POST /prediction/v1/positions/{pubkey}/claim`
- Send signed transaction directly to Solana RPC
- Do not use `/execute`

## Required inputs

- owner wallet
- position pubkey

## Safety and compliance

- Apply geo/compliance guard before claim flow.
- Verify position is claimable before tx creation.

## Resolve -> Preview -> Confirm -> Sign/Execute -> Report

### Resolve
- Validate ownership and `claimable` status.

### Preview
- Show expected claim amount and settlement context.

### Confirm
- Require explicit confirmation before signing.
- Reconfirm if claim payload is rebuilt.

### Sign/Execute
- Build claim tx.
- Sign and send via RPC.
- If stale, rebuild and repeat Preview+Confirm.

### Report
- Return claim signature, updated position status, and any remaining claimables.

## Related docs

- [SKILL](SKILL.md)
- [Prediction list](prediction-list.md)
- [Prediction create order](prediction-create-order.md)
