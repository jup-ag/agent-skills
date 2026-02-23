# Error codes

Use this response protocol for execution errors.

## Recovery classes
- `retry`: safe to repeat the same API call without new signature material.
- `rebuild`: refresh state, rebuild transaction/order, request new confirmation.
- `no-retry`: stop and require user or policy intervention.

## Core mappings
| Code | Meaning | Class | Required handling |
|---|---|---|---|
| `429` | Rate limited | `retry` | Backoff with jitter, honor `Retry-After` when present. |
| `5xx` | Upstream transient failure | `retry` | Retry bounded times, then surface failure. |
| `6001` | Slippage tolerance exceeded | `rebuild` | Re-quote, show changed price/impact, re-confirm before signing. |
| `-1005` | Execution state mismatch (stale/invalid build context) | `rebuild` | Re-fetch required state, rebuild transaction, new `requestId`, re-sign. |
| `401` / `403` | Auth or policy denied | `no-retry` | Stop. Ask for valid credentials or policy-compliant action. |
| `400` / validation errors | Invalid request params | `no-retry` | Fix inputs (amount, mint, account, decimals), then create a new action. |

## Global rules
- Do not treat `rebuild` as blind retry.
- Do not reuse a previous `requestId` for a rebuilt submit.
- On unknown code: default to `no-retry` unless clearly transient (`429`/`5xx`).
