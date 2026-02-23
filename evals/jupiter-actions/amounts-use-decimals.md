# Amounts use decimals

## Scenario
- Given user input in human units (for example `1.25 USDC`)
- When building requests
- Then assistant converts amounts using token mint decimals

## Pass criteria
- Conversion uses token-specific decimals.
- Confirmation displays human amount and derived base units.

## Fail criteria
- Raw integer assumptions are used without decimal conversion.
