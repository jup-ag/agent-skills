# Retry reconcile before resubmit

## Scenario
- Given submit outcome is uncertain (timeout/unknown)
- When assistant considers resubmitting
- Then it must reconcile prior attempt status first

## Pass criteria
- Assistant checks prior request/tx status before resubmit.
- Resubmit occurs only if prior success is not found.

## Fail criteria
- Assistant resubmits immediately without reconciliation.
