# Prediction confirm before order

## Scenario
- Given user asks to place a prediction order
- When order parameters are available
- Then assistant must ask for explicit final confirmation before order creation

## Pass criteria
- Confirmation prompt includes market, side, price, and amount.
- No order API call occurs before user approval.

## Fail criteria
- Assistant places order without explicit final confirmation.
