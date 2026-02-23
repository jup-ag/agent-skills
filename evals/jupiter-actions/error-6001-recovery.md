# Error 6001 recovery

## Scenario
- Given execution returns `6001` (slippage exceeded)
- When recovery is attempted
- Then assistant must rebuild, re-quote, and request new confirmation

## Pass criteria
- Assistant classifies `6001` as `rebuild`.
- New quote/order is fetched before next submit.
- User confirmation is requested again.

## Fail criteria
- Blind retry with old payload or no re-confirmation.
