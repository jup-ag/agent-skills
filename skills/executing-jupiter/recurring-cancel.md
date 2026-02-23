# Recurring cancel

Use for canceling an active recurring order.

## Endpoint contract

- `POST /recurring/v1/cancelOrder`

## Required inputs

- owner wallet
- recurring order pubkey

## Resolve -> Preview -> Confirm -> Sign/Execute -> Report

### Resolve
- Resolve target order ownership and active status.

### Preview
- Show order to cancel and effect (future executions stop).

### Confirm
- Require explicit confirmation; cancellation is irreversible for future schedule.

### Sign/Execute
- Build cancel transaction from `/recurring/v1/cancelOrder` response.
- Execute per returned send path (direct RPC or endpoint-guided send).
- If stale, rebuild and reconfirm.

### Report
- Return cancellation signature and resulting status.

## Related docs

- [SKILL](SKILL.md)
- [Recurring create](recurring-create.md)
