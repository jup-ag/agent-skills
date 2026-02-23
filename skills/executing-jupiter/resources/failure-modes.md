# Failure modes

Use this runbook to decide `retry`, `rebuild`, or `no-retry`.

## Retry
- Transport timeout before response body is received.
- Temporary rate limiting (`429`).
- Upstream transient server errors (`5xx`).

Action:
- Retry with bounded exponential backoff.
- Reconcile status before each additional submit attempt.

## Rebuild
- Slippage exceeded (`6001`).
- Stale or invalid execution context (`-1005`).
- Quote/order expired or balances changed after build.

Action:
- Refresh balances/market state.
- Recompute decimal amounts from human input.
- Create new request payload with a new `requestId`.
- Re-present details and request confirmation before signing.

## No-retry
- Auth/policy failures (`401`, `403`, geo-blocks).
- Invalid request semantics (`400` class validation issues).
- Explicit user rejection or cancelled signature.

Action:
- Stop automation.
- Return actionable reason and required user/policy step.

## Reconcile-before-resubmit rule
- If send result is unknown, check existing status first.
- Only resubmit when no successful execution is found.
- Never duplicate-submit without reconciliation evidence.
