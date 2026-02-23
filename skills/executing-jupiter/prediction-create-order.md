# Prediction create order

Use for placing a prediction market order.

## Endpoint contract

- Build order transaction via prediction order endpoint (`POST /prediction/v1/orders`)
- Send signed transaction directly to Solana RPC
- Poll order status via `GET /prediction/v1/orders/status/{pubkey}`
- Do not use `/execute`

## Required inputs

- owner wallet
- market id and side
- price/size intent in market units
- deposit mint and budget constraints

## Safety and compliance

- Geo/compliance guard is mandatory before tx build.
- Block restricted users (for example US/South Korea restrictions in prediction docs).
- Confirmation required by default; `--yes` only bypasses prompt, not compliance checks.

## Resolve -> Preview -> Confirm -> Sign/Execute -> Report

### Resolve
- Validate market state, order params, and buying-power constraints.
- Validate unit conversions and rounding.

### Preview
- Show side, size, max spend, and fill uncertainty.
- Explicitly state direct RPC send + status polling path.

### Confirm
- Require explicit confirmation before signing.
- If tx payload is rebuilt (stale blockhash or changed market), reconfirm.

### Sign/Execute
- Create tx payload from prediction order endpoint.
- Sign and send via RPC.
- Poll status endpoint until terminal state or timeout.
- If stale/expired before send, rebuild and repeat Preview+Confirm.

### Report
- Return signature, order pubkey, terminal status, and next actions.

## Related docs

- [SKILL](SKILL.md)
- [Prediction list](prediction-list.md)
- [Prediction claim](prediction-claim.md)
