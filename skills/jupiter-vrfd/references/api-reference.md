# API Reference — Jupiter Token Verification

> **Base URL**: `https://token-verification-dev-api.jup.ag`

## Authentication

Some endpoints require an API key passed via the `x-api-key` header:

| Endpoint | Auth Required |
| -------- | ------------- |
| `GET /combined/express/check-eligibility` | None |
| `GET /combined/basic/check-eligibility` | None |
| `POST /basic/submit` | API key |
| `GET /payments/express/craft-txn` | API key |
| `POST /payments/express/execute` | API key |

```
x-api-key: your-api-key-here
```

### Generating an API Key

> **Auth API Base URL**: `https://vrfd-auth-api-dev.jup.ag`

1. Open `https://vrfd-auth-api-dev.jup.ag/api/keys/new` in the browser — this handles login and key generation in one flow
2. Save the key immediately. It is shown **once** and cannot be retrieved again (only the prefix `vrfd_ak_xxxx...` is stored for display)

Creating a new key automatically **revokes** any existing active key for your account.

### Managing Keys

These endpoints are on the **auth-api** (`https://vrfd-auth-api-dev.jup.ag`), not the token-verification service.

| Endpoint               | Method   | Description                               |
| ---------------------- | -------- | ----------------------------------------- |
| `POST /api/keys`       | `POST`   | Generate a new API key (revokes existing) |
| `GET /api/keys`        | `GET`    | List your keys (prefix only)              |
| `DELETE /api/keys/:id` | `DELETE` | Revoke a specific key                     |

### Rate Limits

Endpoints protected by API key enforce a daily request limit per user (or IP if unauthenticated):

| Tier       | Daily Limit                 |
| ---------- | --------------------------- |
| Public     | 2 requests/day per endpoint |
| Enterprise | Unlimited                   |

The combined flow endpoints (`craft-txn`, `execute`, `submit`) are all rate limited under the `combined` namespace.

---

## Eligibility Rules

Before any submission (and before any payment in express), the system checks whether verification and metadata can proceed for the given token.

| Verification | Metadata | Result                  |
| ------------ | -------- | ----------------------- |
| Can          | Can      | Allow both              |
| Can          | Cannot   | Allow verification only |
| Cannot       | Can      | Allow metadata only     |
| Cannot       | Cannot   | Reject (409 Conflict)   |

**Verification can proceed if:**

- No existing verification exists for the token
- An existing verification was **rejected** (resubmission allowed)
- Upgrading from basic to premium tier

**Verification cannot proceed if:**

- A same-tier verification already exists (not rejected)
- Attempting to downgrade from premium to basic (with < 3 evaluations)

**Metadata can proceed if:**

- No existing metadata request exists for the token

**Metadata cannot proceed if:**

- A metadata request already exists for the token

---

## Get Existing Token Data

**`GET /tokenMetadata/getFromRpcAndSearch/:tokenId`**

Fetches the token's current metadata from RPC, search, and description APIs. **Call this before any metadata update** to get existing values that must be preserved.

```
GET https://token-verification-dev-api.jup.ag/tokenMetadata/getFromRpcAndSearch/{tokenId}
```

| Param     | Type   | Required | Notes                    |
| --------- | ------ | -------- | ------------------------ |
| `tokenId` | string | **Yes**  | Solana token mint address (path param) |

No authentication required.

**Response:**

```json
{
  "rpc": {
    "assetId": "So11111111111111111111111111111111111111112",
    "icon": "https://example.com/icon.png",
    "name": "Token Name",
    "symbol": "TKN",
    "website": "https://example.com",
    "telegram": null,
    "twitter": "https://x.com/token",
    "twitterCommunity": null,
    "discord": null,
    "instagram": null,
    "tiktok": null
  },
  "search": [
    {
      "id": "So11111111111111111111111111111111111111112",
      "name": "Token Name",
      "symbol": "TKN",
      "icon": "https://example.com/icon.png",
      "website": "https://example.com",
      "twitter": "https://x.com/token",
      "telegram": null
    }
  ],
  "description": {
    "description": "Token description text"
  }
}
```

**Field mapping to `tokenMetadata`:**

Use `search[0]` as the primary source for token info, `description.description` for `tokenDescription`, and `rpc` only for fields not available in `search` or when overriding on-chain metadata.

- `search[0].id` → `tokenId`
- `search[0].name` → `name`
- `search[0].symbol` → `symbol`
- `search[0].icon` → `icon`
- `search[0].website` → `website`
- `search[0].twitter` → `twitter`
- `search[0].telegram` → `telegram`
- `description.description` → `tokenDescription`
- `rpc.twitterCommunity` → `twitterCommunity` (not in search)
- `rpc.discord` → `discord` (not in search)
- `rpc.instagram` → `instagram` (not in search)
- `rpc.tiktok` → `tiktok` (not in search)

---

## Check Express Eligibility

**`GET /combined/express/check-eligibility`**

```
GET https://token-verification-dev-api.jup.ag/combined/express/check-eligibility?tokenId={tokenId}
```

| Param     | Type   | Required | Notes                    |
| --------- | ------ | -------- | ------------------------ |
| `tokenId` | string | **Yes**  | Solana token mint address |

**Response:**

```json
{
  "canVerify": true,
  "canMetadata": true,
  "verificationError": null,
  "metadataError": null
}
```

- `canVerify: true` → token is eligible for express verification
- `canVerify: false` → check `verificationError` for the reason
- `canMetadata: true` → token metadata can be submitted alongside verification
- `canMetadata: false` → check `metadataError` for the reason

---

## Check Basic Eligibility

**`GET /combined/basic/check-eligibility`**

```
GET https://token-verification-dev-api.jup.ag/combined/basic/check-eligibility?tokenId={tokenId}
```

| Param     | Type   | Required | Notes                    |
| --------- | ------ | -------- | ------------------------ |
| `tokenId` | string | **Yes**  | Solana token mint address |

**Response:**

```json
{
  "canVerify": true,
  "canMetadata": false,
  "verificationError": null,
  "metadataError": "Token metadata already exists"
}
```

Same response schema as express eligibility.

---

## Submit Basic Verification

**`POST /basic/submit`**

```
POST https://token-verification-dev-api.jup.ag/basic/submit
Content-Type: application/json
x-api-key: your-api-key-here
```

**Request body:**

```json
{
  "tokenId": "So11111111111111111111111111111111111111112",
  "walletAddress": "8xDr...",
  "submitVerification": true,
  "twitterHandle": "https://x.com/jupiterexchange",
  "senderTwitterHandle": "https://x.com/sender_handle",
  "description": "Official wrapped SOL token",
  "tokenMetadata": {
    "name": "Wrapped SOL",
    "symbol": "SOL"
  }
}
```

| Field                 | Type    | Required | Notes                                                              |
| --------------------- | ------- | -------- | ------------------------------------------------------------------ |
| `tokenId`             | string  | **Yes**  | Solana token mint address                                          |
| `walletAddress`       | string  | **Yes**  | Requester's wallet address (valid Solana address)                  |
| `submitVerification`  | boolean | No       | Set to `true` to submit verification request                       |
| `twitterHandle`       | string  | No       | Token's Twitter — must be a valid `x.com` or `twitter.com` URL     |
| `senderTwitterHandle` | string  | No       | Requester's Twitter — must be a valid `x.com` or `twitter.com` URL |
| `description`         | string  | No       | Description of the token                                           |
| `tokenMetadata`       | object  | No       | Optional token metadata to set alongside verification (see [tokenMetadata schema](#tokenmetadata-object)) |

> **Important:** When including `tokenMetadata`, first fetch existing data via `GET /tokenMetadata/getFromRpcAndSearch/{tokenId}`, merge the user's updates on top, and send all fields. This preserves values the user did not change.

**Response:**

```json
{
  "success": true,
  "data": {
    "verificationCreated": true,
    "metadataCreated": false
  }
}
```

> For **basic** verification, you're done here. The express payment flow is only needed for **express** verification (paid with JUP).

> **Note:** At least one of `submitVerification: true` or `tokenMetadata` must be provided. For a **metadata-only** update (when `canVerify: false` but `canMetadata: true`), set `submitVerification: false` and include only `tokenMetadata`:
>
> ```json
> {
>   "tokenId": "So11111111111111111111111111111111111111112",
>   "walletAddress": "8xDr...",
>   "submitVerification": false,
>   "tokenMetadata": {
>     "tokenId": "So11111111111111111111111111111111111111112",
>     "name": "Wrapped SOL",
>     "symbol": "SOL",
>     "website": "https://solana.com"
>   }
> }
> ```

---

## Craft Payment Transaction (Express Only)

**`GET /payments/express/craft-txn`**

```
GET https://token-verification-dev-api.jup.ag/payments/express/craft-txn?senderAddress={walletAddress}
x-api-key: your-api-key-here
```

| Param           | Type   | Required | Notes                        |
| --------------- | ------ | -------- | ---------------------------- |
| `senderAddress` | string | **Yes**  | Wallet that will pay 1 JUP |

**Response:**

```json
{
  "receiverAddress": "VRFD...",
  "mint": "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  "amount": "1000000",
  "tokenDecimals": 6,
  "feeLamports": 5000,
  "feeMint": "So11111111111111111111111111111111111111112",
  "feeTokenDecimals": 9,
  "feeAmount": 5000,
  "transaction": "<base64-encoded-unsigned-transaction>",
  "requestId": "req_abc123",
  "totalTime": "150ms",
  "expireAt": "2025-06-01T12:05:00Z",
  "code": 0,
  "gasless": false
}
```

The `transaction` field is a **base64-encoded unsigned transaction**. The user must sign it before proceeding to the execute step.

---

## Sign and Execute Payment (Express Only)

The user signs the transaction from the craft step client-side, then submits it to the execute endpoint. The server co-signs with its verification wallet before broadcasting.

**`POST /payments/express/execute`**

```
POST https://token-verification-dev-api.jup.ag/payments/express/execute
Content-Type: application/json
x-api-key: your-api-key-here
```

**Request body:**

```json
{
  "transaction": "<base64-signed-transaction>",
  "requestId": "req_abc123",
  "senderAddress": "8xDr...",
  "tokenId": "So11111111111111111111111111111111111111112",
  "twitterHandle": "https://x.com/jupiterexchange",
  "description": "Official wrapped SOL token",
  "tokenMetadata": {
    "name": "Jupiter Exchange",
    "symbol": "JUP"
  }
}
```

> Only include `senderTwitterHandle` and `tokenMetadata` if the user provided values. Omit any of these fields entirely if not provided — do not send empty strings.

| Field                 | Type   | Required | Notes                                      |
| --------------------- | ------ | -------- | ------------------------------------------ |
| `transaction`         | string | **Yes**  | Base64 user-signed transaction from craft   |
| `requestId`           | string | **Yes**  | From `craft-txn` response                   |
| `senderAddress`       | string | **Yes**  | Wallet that signed the transaction         |
| `tokenId`             | string | **Yes**  | Token mint being verified                  |
| `twitterHandle`       | string | **Yes**  | Token's Twitter URL                        |
| `senderTwitterHandle` | string | No       | Requester's Twitter URL                    |
| `description`         | string | **Yes**  | Description of the token                   |
| `tokenMetadata`       | object | No       | Optional token metadata to set alongside verification (see [tokenMetadata schema](#tokenmetadata-object)) |

> **Important:** When including `tokenMetadata`, first fetch existing data via `GET /tokenMetadata/getFromRpcAndSearch/{tokenId}`, merge the user's updates on top, and send all fields. This preserves values the user did not change.

**Response:**

```json
{
  "status": "Success",
  "signature": "5tG8...",
  "verificationCreated": true,
  "metadataCreated": false,
  "totalTime": 2500
}
```

On success, the server automatically creates a **express** verification request for the token. The `verificationCreated` and `metadataCreated` fields indicate what was created.

---

## tokenMetadata Object

Optional object for setting token metadata alongside verification. Can be included in both `POST /basic/submit` and `POST /payments/express/execute`.

> **Important:** Before building this object, fetch the token's existing data via `GET /tokenMetadata/getFromRpcAndSearch/{tokenId}` (see [Get Existing Token Data](#get-existing-token-data)). Use the existing values as the base, merge the user's updates on top, and send **all** fields. This ensures fields the user did not update retain their current values — any field sent as empty string or null will override and clear the existing value.

| Field                   | Type     | Required | Description                           |
| ----------------------- | -------- | -------- | ------------------------------------- |
| `tokenId`               | string   | **Yes**  | The token mint address                |
| `icon`                  | string?  | No       | Token icon URL                        |
| `name`                  | string?  | No       | Token name                            |
| `symbol`                | string?  | No       | Token symbol                          |
| `website`               | string?  | No       | Website URL                           |
| `telegram`              | string?  | No       | Telegram link                         |
| `twitter`               | string?  | No       | Twitter link                          |
| `twitterCommunity`      | string?  | No       | Twitter community link                |
| `discord`               | string?  | No       | Discord link                          |
| `instagram`             | string?  | No       | Instagram link                        |
| `tiktok`                | string?  | No       | TikTok link                           |
| `circulatingSupply`     | string?  | No       | Circulating supply value              |
| `useCirculatingSupply`  | boolean? | No       | Whether to use circulating supply     |
| `tokenDescription`      | string?  | No       | Token description                     |
| `coingeckoCoinId`       | string?  | No       | CoinGecko coin ID                     |
| `useCoingeckoCoinId`    | boolean? | No       | Whether to use CoinGecko coin ID      |
| `circulatingSupplyUrl`  | string?  | No       | URL for circulating supply API        |
| `useCirculatingSupplyUrl` | boolean? | No     | Whether to use circulating supply URL |
| `otherUrl`              | string?  | No       | Other URL (truncated to 200 chars)    |

---

## Data Types

### Verification Tiers

| Tier      | Cost    | Description                                                           |
| --------- | ------- | --------------------------------------------------------------------- |
| `basic`   | Free    | Standard verification — submit via `POST /basic/submit`               |
| `express` | 1 JUP | Paid verification — requires payment via `craft-txn` + `execute` flow. API value: `"premium"` |

### Verification Statuses

| Status     | Meaning                                            |
| ---------- | -------------------------------------------------- |
| `pending`  | Awaiting review                                    |
| `verified` | Approved                                           |
| `rejected` | Denied (check `rejectCategory` and `rejectReason`) |

### Reject Categories

`below_thresholds`, `insufficient_trading_activity`, `ticker_conflict`, `duplicate_token`, `others`, `NA`

### Twitter Handle Format

Twitter handles must be full URLs from `x.com` or `twitter.com`:

- `https://x.com/jupiterexchange` — valid
- `https://twitter.com/jupiterexchange` — valid
- `@jupiterexchange` — **invalid** (will be rejected)
- `jupiterexchange` — **invalid** (will be rejected)

Usernames must match `^[a-zA-Z0-9_]{1,15}$` (1–15 characters, alphanumeric + underscore).
