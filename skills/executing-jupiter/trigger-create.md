# Trigger create

Use for creating a trigger/limit order.

## Endpoint contract

1. `POST /trigger/v1/createOrder`
2. `POST /trigger/v1/execute`

## Required inputs

- owner wallet
- input/output mint and making/taking amounts
- trigger params (price intent, expiry if applicable)

## Resolve -> Preview -> Confirm -> Sign/Execute -> Report

### Resolve
- Validate intended trigger price logic and token pair.
- Validate order size and fee assumptions.

### Preview
- Show order intent, limits, and failure modes (may not fill).
- Show create + execute endpoint sequence.

### Confirm
- Require explicit confirmation by default.
- Reconfirm if order payload changes before signing.

### Sign/Execute
- Build order tx with `/trigger/v1/createOrder`.
- Sign and submit via `/trigger/v1/execute`.
- If stale, rebuild and repeat Preview+Confirm.

### Report
- Return order public key / tx signature and how to monitor.

## Related docs

- [SKILL](SKILL.md)
- [Trigger list](trigger-list.md)
- [Trigger cancel](trigger-cancel.md)
