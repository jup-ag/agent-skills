# Prediction safety

Prediction endpoints require stricter safeguards than spot execution.

## Mandatory warnings
- Show a beta warning before first prediction order in-session.
- Explain that prediction APIs can change and responses may be unstable.
- Require explicit confirmation before creating any prediction order.

## Georestriction handling
- Treat blocked geographies (including US and South Korea) as hard-stop policy.
- If API/policy indicates geo denial, do not retry and do not place the order.
- Provide a compliant fallback: read-only market data or no-action response.

## No bypass behavior
- Do not suggest VPN/proxy/workarounds.
- Do not offer steps to evade provider policy, legal restrictions, or controls.
- Keep blocked users in non-trading mode until policy allows execution.

## Order safety checks
- Confirm market id, side, price, and amount in human units before submit.
- Check claimability before claim actions; skip claim if not claimable.
