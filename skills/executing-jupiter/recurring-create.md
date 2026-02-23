# Recurring create

Use for creating recurring (DCA-style) orders.

## Endpoint contract

1. `POST /recurring/v1/createOrder`
2. `POST /recurring/v1/execute`

## Required inputs

- owner wallet
- input/output mint
- recurring schedule params (time-based)
- budget/amount constraints

## Resolve -> Preview -> Confirm -> Sign/Execute -> Report

### Resolve
- Validate recurring cadence, total budget, and per-order amount constraints.
- Validate time-based params are explicit.

### Preview
- Show schedule, projected number of executions, fees, and cancellation path.
- Show create + execute sequence.

### Confirm
- Require explicit confirmation before signing.
- Reconfirm if schedule or payload changes.

### Sign/Execute
- Build tx with `/recurring/v1/createOrder`.
- Sign and submit with `/recurring/v1/execute`.
- If stale, rebuild and repeat Preview+Confirm.

### Report
- Return recurring order id, tx signature, and monitoring/cancel guidance.

## Related docs

- [SKILL](SKILL.md)
- [Recurring cancel](recurring-cancel.md)
- [Ultra swap](ultra-swap.md)
