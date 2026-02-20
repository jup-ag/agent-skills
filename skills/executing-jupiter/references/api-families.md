# Supported API families and endpoints

## Table of contents

- [Intent routing shortcuts](#intent-routing-shortcuts)
- [Execute path specification](#execute-path-specification)
- [Ultra (`/ultra/v1`)](#ultra-ultrav1)
- [Lend (`/lend/v1`)](#lend-lendv1)
- [Trigger (`/trigger/v1`)](#trigger-triggerv1)
- [Recurring (`/recurring/v1`)](#recurring-recurringv1)
- [Tokens (`/tokens/v2`)](#tokens-tokensv2)
- [Price (`/price/v3`)](#price-pricev3)
- [Portfolio (`/portfolio/v1`)](#portfolio-portfoliov1)
- [Prediction markets (`/prediction/v1`)](#prediction-markets-predictionv1)
- [Send (`/send/v1`)](#send-sendv1)
- [Studio (`/studio/v1`)](#studio-studiov1)
- [On-chain and integration APIs (non-REST)](#on-chain-and-integration-apis-non-rest)

## Intent routing shortcuts

Use this section first when the user asks in natural language.

| User intent | Primary endpoint | Secondary endpoint | Notes |
|---|---|---|---|
| "What is in my wallet?" / "show my holdings" | `GET /portfolio/v1/positions/{address}` | `GET /ultra/v1/holdings/{account}` | Call both for best coverage: portfolio positions + swap-router holdings |
| "What tokens can I swap?" | `GET /ultra/v1/search` | `GET /tokens/v2/search` | `ultra/search` is swap-oriented, `tokens/search` is metadata-oriented |
| "What are my open limit orders?" | `GET /trigger/v1/getTriggerOrders` | none | Requires maker address |
| "What are my recurring orders?" | `GET /recurring/v1/getRecurringOrders` | none | Requires wallet/maker params based on API response shape |
| "What are my lend positions?" | `GET /lend/v1/earn/positions` | `GET /lend/v1/earn/earnings` | Use both for principal + yield context |

## Execute path specification

See the [execute path specification table in SKILL.md](../SKILL.md#execute-path-specification) for the canonical routing table.

## Ultra (`/ultra/v1`)

Script support:
- Fully supported end-to-end with `fetch-api` + `wallet-sign` + `execute-ultra`.

- `GET /ultra/v1/order`
- `POST /ultra/v1/execute`
- `GET /ultra/v1/holdings/{account}` -> Get user wallet holdings
- `GET /ultra/v1/shield`
- `GET /ultra/v1/search`
- `GET /ultra/v1/routers`

## Lend (`/lend/v1`)

Script support:
- `fetch-api` can call all listed endpoints.
- For state-changing endpoints that return unsigned transactions, sign returned base64 with `wallet-sign` and submit through your Solana RPC client.

- `POST /lend/v1/earn/deposit`
- `POST /lend/v1/earn/withdraw`
- `POST /lend/v1/earn/mint`
- `POST /lend/v1/earn/redeem`
- `POST /lend/v1/earn/deposit-instructions`
- `POST /lend/v1/earn/withdraw-instructions`
- `GET /lend/v1/earn/tokens`
- `GET /lend/v1/earn/positions`
- `GET /lend/v1/earn/earnings`

## Trigger (`/trigger/v1`)

Script support:
- `fetch-api` can call all listed endpoints.
- `execute-trigger` supports the `/execute` submission step.

- `POST /trigger/v1/createOrder`
- `POST /trigger/v1/cancelOrder`
- `POST /trigger/v1/cancelOrders`
- `POST /trigger/v1/execute`
- `GET /trigger/v1/getTriggerOrders`

## Recurring (`/recurring/v1`)

Script support:
- `fetch-api` can call all listed endpoints.
- `execute-recurring` supports the `/execute` submission step.

- `POST /recurring/v1/createOrder`
- `POST /recurring/v1/cancelOrder`
- `POST /recurring/v1/execute`
- `GET /recurring/v1/getRecurringOrders`

## Tokens (`/tokens/v2`)

Script support:
- Fully supported via `fetch-api` (read-only API).

- `GET /tokens/v2/search?query={q}`
- `GET /tokens/v2/tag?query={tag}`
- `GET /tokens/v2/{category}/{interval}`
- `GET /tokens/v2/recent`

## Price (`/price/v3`)

Script support:
- Fully supported via `fetch-api` (read-only API).

- `GET /price/v3?ids={mints}`

## Portfolio (`/portfolio/v1`)

Script support:
- Fully supported via `fetch-api` (read-only API).

- `GET /portfolio/v1/positions/{address}`
- `GET /portfolio/v1/positions/{address}?platforms={ids}`
- `GET /portfolio/v1/platforms`
- `GET /portfolio/v1/staked-jup/{address}`

## Prediction markets (`/prediction/v1`)

Script support:
- `fetch-api` supports listed `GET`, `POST`, and `DELETE` calls.
- Some operations depend on account ownership and eligibility checks from API responses.

- `GET /prediction/v1/events`
- `GET /prediction/v1/events/search`
- `GET /prediction/v1/markets/{marketId}`
- `GET /prediction/v1/orderbook/{marketId}`
- `POST /prediction/v1/orders`
- `GET /prediction/v1/orders/status/{pubkey}`
- `GET /prediction/v1/positions`
- `DELETE /prediction/v1/positions/{pubkey}`
- `POST /prediction/v1/positions/{pubkey}/claim`
- `GET /prediction/v1/history`
- `GET /prediction/v1/leaderboards`

## Send (`/send/v1`)

Script support:
- `fetch-api` can call all listed endpoints.
- Crafted transactions still require local signing and RPC submission.
- RPC is required for submission: pass `--rpc-url` or set `SOLANA_RPC_URL`.
- Invite claim flows are app-specific and may require Jupiter Mobile UX.

- `POST /send/v1/craft-send`
- `POST /send/v1/craft-clawback`
- `GET /send/v1/pending-invites`
- `GET /send/v1/invite-history`

## Studio (`/studio/v1`)

Script support:
- JSON endpoints are callable with `fetch-api`.
- `POST /studio/v1/dbc-pool/submit` uses multipart/form-data and is not directly supported by `fetch-api`; use `curl` or custom client code for file upload.

- `POST /studio/v1/dbc-pool/create-tx`
- `POST /studio/v1/dbc-pool/submit` (multipart/form-data)
- `GET /studio/v1/dbc-pool/addresses/{mint}`
- `POST /studio/v1/dbc/fee`
- `POST /studio/v1/dbc/fee/create-tx`

## On-chain and integration APIs (non-REST)

Script support:
- Not supported by `fetch-api` because these are not Jupiter REST endpoint families.

- Perps: on-chain via Anchor IDL (no REST endpoint set).
- Lock: on-chain program only (no REST endpoint set).
- Routing: integration strategy (DEX trait/RFQ webhook), not a single REST family in this skill.
