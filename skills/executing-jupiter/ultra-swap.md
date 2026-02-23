# Ultra swap

Use for immediate swap execution via Ultra.

## Endpoint contract

1. `GET /ultra/v1/order`
2. `POST /ultra/v1/execute`

## Required inputs

- `inputMint`, `outputMint`, `amount`, `taker`
- slippage policy and cluster

## Resolve -> Preview -> Confirm -> Sign/Execute -> Report

### Resolve
- Validate mint pair, amount units, wallet, and slippage assumptions.
- Reject missing token decimals context.

### Preview
- Show estimated in/out, route, fees, and expiry sensitivity.
- Show that execution uses `/ultra/v1/execute`.

### Confirm
- Ask for explicit confirmation before signing.
- If `--yes` is active, continue only when user already accepted non-interactive mode.

### Sign/Execute
- Request order from `/ultra/v1/order`.
- If payload is stale or requoted, return to Preview+Confirm.
- Sign returned tx and execute with `/ultra/v1/execute`.

### Report
- Return tx signature, execution status, and any fallback/retry guidance.

## Related docs

- [SKILL](SKILL.md)
- [Trigger create](trigger-create.md)
- [Recurring create](recurring-create.md)
