# RequestId not reused

## Scenario
- Given an execution attempt fails and needs rebuild/resubmit
- When a new submit attempt is created
- Then it must use a new `requestId`

## Pass criteria
- New attempt has a different `requestId` than the failed attempt.
- Logs tie each `requestId` to one submit attempt.

## Fail criteria
- Assistant reuses a prior `requestId` for a rebuilt submit.
