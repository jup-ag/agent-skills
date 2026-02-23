# Trigger cancel

Use for canceling one or multiple trigger orders.

## Endpoint contract

- `POST /trigger/v1/cancelOrder` (single)
- `POST /trigger/v1/cancelOrders` (batch)
- If `/trigger/v1/execute` is unavailable for the cancel flow: sign and send tx directly via RPC

## Required inputs

- owner wallet
- target order pubkey(s)
- cluster and signer context

## Resolve -> Preview -> Confirm -> Sign/Execute -> Report

### Resolve
- Resolve exact order ids to cancel and ownership.
- Choose single vs batch cancel endpoint.

### Preview
- Show which open orders will be canceled.
- Show execution path (`/execute` vs direct RPC send fallback).

### Confirm
- Require explicit confirmation; cancellation is irreversible.
- Reconfirm if cancel set changes.

### Sign/Execute
- Build cancel tx via `cancelOrder` or `cancelOrders`.
- If execute path exists in response contract, use it.
- Otherwise sign and send raw tx via RPC.
- If tx is stale, rebuild and reconfirm.

### Report
- Return canceled order ids and signatures.
- Include any orders that failed to cancel.

## Related docs

- [SKILL](SKILL.md)
- [Trigger list](trigger-list.md)
- [Trigger create](trigger-create.md)
