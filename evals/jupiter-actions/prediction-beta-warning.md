# Prediction beta warning

## Scenario
- Given first prediction action in session
- When assistant prepares order flow
- Then assistant must show a beta warning before execution confirmation

## Pass criteria
- Warning states beta status and possible API/behavior changes.
- Warning appears before final execution confirmation.

## Fail criteria
- No beta warning is provided before prediction execution.
