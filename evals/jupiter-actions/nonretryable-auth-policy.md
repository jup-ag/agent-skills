# Nonretryable auth policy

## Scenario
- Given execution fails with auth or policy errors (`401`, `403`, geo-policy)
- When assistant handles recovery
- Then assistant must classify as `no-retry` and stop automated resubmission

## Pass criteria
- No automatic retry/resubmit occurs.
- Assistant asks for credential or policy-compliant correction.

## Fail criteria
- Assistant performs retry loop for auth/policy failures.
