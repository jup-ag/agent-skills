---
name: executing-jupiter
description: Manual-only execution protocol for Jupiter actions (Ultra Swap, Trigger, Recurring, Prediction) with explicit confirmation and signing safeguards.
license: MIT
metadata:
  author: jupiter
  version: "1.0.0"
disable-model-invocation: true
tags:
  - jupiter
  - execution
  - ultra-swap
  - trigger
  - recurring
  - prediction
---

# Executing Jupiter

Manual-only skill for action execution. The assistant must never auto-sign or auto-send without explicit user confirmation.

## Execution protocol (global)

Always follow this sequence:
1. Resolve
2. Preview
3. Confirm
4. Sign/Execute
5. Report

### Resolve
- Identify product and exact action.
- Resolve wallet, cluster, token mints, amounts, slippage, and account assumptions.
- Resolve compliance constraints before any tx build.

### Preview
- Show a concise action preview: what changes on-chain, expected spend/receive, fees, and risks.
- Show endpoint path(s) and whether direct RPC send is required.

### Confirm
- Require explicit confirmation by default.
- `--yes` bypass is allowed only when user explicitly requested non-interactive execution in this session.
- If transaction payload changed (new quote, new blockhash, changed route), reconfirm.

Use this standard confirmation block before signing:

```text
Action:    [swap | trigger order | recurring order | prediction order | prediction claim]
Input:     [amount/token/mint details]
Output:    [expected output or claim context]
Slippage:  [auto | N bps | exact | n/a]
Fees:      [fee details]
Wallet:    [public key]

Type CONFIRM to proceed or CANCEL to abort.
```

### Sign/Execute
- Build transaction via product-specific endpoint.
- Sign only after confirmation.
- Execute via product-specific path (`/execute` where supported, direct RPC where required).
- If tx is stale/expired, rebuild, re-preview, and reconfirm before re-signing.

### Report
- Return signature/order id/status and next checks.
- Include partial-failure details and retry guidance.

## Safety defaults

- Confirmation required by default.
- Treat `--yes` as an explicit risk acceptance path; still block on compliance failures.
- Never reuse stale transactions; always rebuild/reconfirm.
- Fail closed when required parameters are missing.

## Product action docs

- [Ultra swap](ultra-swap.md)
- [Trigger create](trigger-create.md)
- [Trigger cancel](trigger-cancel.md)
- [Trigger list](trigger-list.md)
- [Recurring create](recurring-create.md)
- [Recurring cancel](recurring-cancel.md)
- [Prediction list](prediction-list.md)
- [Prediction create order](prediction-create-order.md)
- [Prediction claim](prediction-claim.md)

## Product execution map

- Ultra swap: `GET /ultra/v1/order` then `POST /ultra/v1/execute`
- Trigger create: `POST /trigger/v1/createOrder` then `POST /trigger/v1/execute`
- Trigger cancel: `POST /trigger/v1/cancelOrder` or `POST /trigger/v1/cancelOrders`; if `/execute` is unavailable, sign and send via RPC
- Recurring create: `POST /recurring/v1/createOrder` then `POST /recurring/v1/execute`
- Prediction: build tx via prediction endpoint, then direct RPC send and status polling (no `/execute`)

## Logic gap checks

- Confirm wallet owner matches action owner before any signing flow.
- Reject if cluster/network in resolved context differs from tx build context.
- Reconfirm when payload changes due to re-quote, blockhash refresh, or route updates.
- For prediction flows, block execution on compliance/geo restrictions even with `--yes`.

## Resources

- [Wallet setup](resources/wallet-setup.md)
- [Error codes](resources/error-codes.md)
- [Prediction safety](resources/prediction-safety.md)
- [Failure modes](resources/failure-modes.md)
