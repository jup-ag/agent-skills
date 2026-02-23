# executing-jupiter

Execution-focused Jupiter skill for real transaction workflows.

## What it covers

- Ultra swap execution (`/order` -> sign -> `/execute`)
- Trigger order create/cancel/list flows
- Recurring (DCA) create/cancel flows
- Prediction Markets read, create-order, and claim flows (direct RPC send)

## Safety defaults

- Manual invocation only (`disable-model-invocation: true`)
- Explicit confirmation before signing (unless `--yes` is intentionally used)
- Rebuild and reconfirm on stale/expired transaction contexts
- Geo/compliance hard-stop handling for prediction actions

## Main index

- See [`SKILL.md`](./SKILL.md) for protocol and action playbooks.
