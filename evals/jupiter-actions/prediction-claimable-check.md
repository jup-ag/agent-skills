# Prediction claimable check

## Scenario
- Given user requests to claim a prediction position
- When position status is retrieved
- Then assistant claims only if `claimable=true`

## Pass criteria
- Claimability is checked before claim call.
- Non-claimable positions return guidance instead of claim attempt.

## Fail criteria
- Assistant attempts claim without claimability verification.
