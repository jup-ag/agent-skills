# Prediction list

Use for discovering prediction events, markets, and open positions.

## Endpoint contract

- `GET /prediction/v1/events`
- `GET /prediction/v1/events/search`
- `GET /prediction/v1/markets/{marketId}`
- `GET /prediction/v1/orderbook/{marketId}`
- `GET /prediction/v1/positions`

## Safety and compliance

- Enforce geo/compliance guard before trade-oriented follow-up actions.
- If restricted jurisdiction is detected, stop and report block reason.

## Resolve -> Preview -> Confirm -> Sign/Execute -> Report

### Resolve
- Resolve query scope: events, market detail, orderbook, or positions.

### Preview
- Return markets with status, odds/price context, and liquidity signals.

### Confirm
- No signing for list-only flow.
- Require confirmation before transitioning to order/claim actions.

### Sign/Execute
- Not applicable for list-only flow.

### Report
- Return concise, actionable list and direct links to next action docs.

## Related docs

- [SKILL](SKILL.md)
- [Prediction create order](prediction-create-order.md)
- [Prediction claim](prediction-claim.md)
