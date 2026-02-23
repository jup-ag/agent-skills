# Error -1005 recovery

## Scenario
- Given execution returns `-1005` (stale/invalid execution context)
- When recovery is attempted
- Then assistant refreshes state, rebuilds payload, and uses a new `requestId`

## Pass criteria
- Assistant classifies `-1005` as `rebuild`.
- State refresh happens before resubmit.
- Resubmit uses a fresh `requestId` and new confirmation.

## Fail criteria
- Direct retry of old payload or reused `requestId`.
