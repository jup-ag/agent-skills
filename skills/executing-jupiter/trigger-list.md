# Trigger list

Use for inspecting open/closed trigger orders before create/cancel decisions.

## Endpoint contract

- `GET /trigger/v1/getTriggerOrders`

## Resolve -> Preview -> Confirm -> Sign/Execute -> Report

### Resolve
- Resolve owner wallet and desired filter (open/history if supported).

### Preview
- Present normalized list with order id, pair, size, trigger condition, and status.

### Confirm
- No signing step for listing, but require confirmation before chaining into cancel/create actions.

### Sign/Execute
- Not applicable for list-only flow.

### Report
- Return concise table/list and suggested next action (`trigger-create.md` or `trigger-cancel.md`).

## Related docs

- [SKILL](SKILL.md)
- [Trigger create](trigger-create.md)
- [Trigger cancel](trigger-cancel.md)
