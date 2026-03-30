# API Reference — Jupiter Token Verification

> **Base URL**: `https://token-verification-dev-api.jup.ag`

This reference intentionally documents only the 3 public routes used by the skill.

For this skill, this file is the source of truth for:

- exact request and response shapes
- submission-mode field requirements
- accepted input formats and normalization rules
- available `tokenMetadata` fields

## Authentication

| Endpoint | Auth Required |
| --- | --- |
| `GET /express/check-eligibility` | None |
| `GET /payments/express/craft-txn` | None |
| `POST /payments/express/execute` | None |

---

## GET /express/check-eligibility

Checks whether a token can enter the public verification flow and whether the execute route could also accept `tokenMetadata`.

```http
GET https://token-verification-dev-api.jup.ag/express/check-eligibility?tokenId={tokenId}
```

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `tokenId` | string | Yes | Solana token mint address |

**Response**

```json
{
  "canVerify": true,
  "canMetadata": true,
  "verificationError": null,
  "metadataError": null
}
```

Notes:

- `canVerify: true` means the token can use the verification flow
- `canVerify: false` and `canMetadata: false` means the caller should stop and inspect `verificationError` and `metadataError`
- `canVerify: false` and `canMetadata: true` means verification is blocked, but a metadata-only execute request may still be possible
- `canMetadata: true` means `POST /payments/express/execute` may accept a `tokenMetadata` payload
- this skill does not document private helpers for fetching or merging metadata

---

## GET /payments/express/craft-txn

Creates the unsigned 1 JUP payment transaction used by the submission flow.

```http
GET https://token-verification-dev-api.jup.ag/payments/express/craft-txn?senderAddress={walletAddress}
```

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `senderAddress` | string | Yes | Wallet that will pay 1 JUP |

**Response**

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

The `transaction` value is unsigned. Verify it locally before signing.

---

## POST /payments/express/execute

Submits the signed transaction and creates the verification request, metadata update, or both.

```http
POST https://token-verification-dev-api.jup.ag/payments/express/execute
Content-Type: application/json
```

**Request body**

```json
{
  "transaction": "<base64-signed-transaction>",
  "requestId": "req_abc123",
  "senderAddress": "8xDr...",
  "tokenId": "So11111111111111111111111111111111111111112",
  "twitterHandle": "https://x.com/jupiterexchange",
  "senderTwitterHandle": "https://x.com/requester_handle",
  "description": "Official wrapped SOL token"
}
```

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `transaction` | string | Yes | Base64 signed transaction from `craft-txn` |
| `requestId` | string | Yes | Value returned by `craft-txn` |
| `senderAddress` | string | Yes | Wallet that signed the transaction |
| `tokenId` | string | Yes | Token mint being verified |
| `twitterHandle` | string | Yes for verification flow | The skill accepts `@handle`, bare `handle`, or `https://x.com/handle` from the user, then normalizes to `https://x.com/{handle}` before execute. For metadata-only execute, send `""` if the user did not provide one. |
| `senderTwitterHandle` | string | No | The skill accepts `@handle`, bare `handle`, or `https://x.com/handle`, then normalizes to `https://x.com/{handle}` before execute. |
| `description` | string | Yes for verification flow | Token description. For metadata-only execute, send `""` if the user did not provide one. |
| `tokenMetadata` | object | No | Optional metadata payload forwarded to the execute route |

**Response**

```json
{
  "status": "Success",
  "signature": "5tG8...",
  "verificationCreated": true,
  "metadataCreated": false,
  "totalTime": 2500
}
```

Notes:

- the route can create verification, metadata, or both depending on eligibility
- for metadata-only execute calls, the current schema still expects string values for `twitterHandle` and `description`; send `""` if the user did not provide them
- normalize `twitterHandle` and `senderTwitterHandle` to full `https://x.com/{handle}` URLs before execute
- if `tokenMetadata` is included, pass the object the user already has; this skill does not cover private metadata fetch or merge routes

---

## Canonical Execute Contract

Use this section as the single source of truth for building the execute request.

### Submission Modes

| Mode | Meaning |
| --- | --- |
| `verification` | Create a verification request only |
| `verification+metadata` | Create a verification request and update token metadata in the same paid request |
| `metadata-only` | Update token metadata without creating a verification request |

### Required Fields By Submission Mode

| Field | `verification` | `verification+metadata` | `metadata-only` | Notes |
| --- | --- | --- | --- | --- |
| `tokenId` | Yes | Yes | Yes | Solana token mint |
| `walletAddress` | Yes | Yes | Yes | User-facing name for `senderAddress` |
| `twitterHandle` | Yes | Yes | Send `""` | Normalize to full `https://x.com/{handle}` URL when present |
| `senderTwitterHandle` | Optional | Optional | Optional | Normalize to full `https://x.com/{handle}` URL when present |
| `description` | Yes | Yes | Send `""` | Short token description when verification is created |
| `tokenMetadata` | Omit | Optional | Yes | Include only the fields the user wants to update, plus `tokenId` |

### Accepted Input Formats And Normalization

| Field | User may provide | Normalize to |
| --- | --- | --- |
| `twitterHandle` | `@handle`, bare `handle`, or `https://x.com/handle` | `https://x.com/{handle}` |
| `senderTwitterHandle` | `@handle`, bare `handle`, or `https://x.com/handle` | `https://x.com/{handle}` |
| `tokenId` | mint with surrounding spaces | Trimmed string before validation |

Confirm handle normalization with the user before execute when the user did not already provide the normalized URL.

---

## Optional tokenMetadata Payload

`POST /payments/express/execute` accepts an optional `tokenMetadata` object with this shape:

```json
{
  "tokenId": "So11111111111111111111111111111111111111112",
  "icon": "https://example.com/icon.png",
  "name": "Token Name",
  "symbol": "TKN",
  "website": "https://example.com",
  "telegram": "https://t.me/example",
  "twitter": "https://x.com/example",
  "twitterCommunity": "https://x.com/i/communities/123",
  "discord": "https://discord.gg/example",
  "instagram": "https://instagram.com/example",
  "tiktok": "https://tiktok.com/@example",
  "circulatingSupply": "1000000",
  "useCirculatingSupply": true,
  "tokenDescription": "Token description",
  "coingeckoCoinId": "example-token",
  "useCoingeckoCoinId": true,
  "circulatingSupplyUrl": "https://example.com/supply",
  "useCirculatingSupplyUrl": true,
  "otherUrl": "https://example.com"
}
```

All fields other than `tokenId` are optional and may be `string`, `boolean`, or `null` according to the server schema.

### tokenMetadata Fields

| Field | Type | Description |
| --- | --- | --- |
| `tokenId` | string | Token mint being updated |
| `icon` | string | Token icon URL |
| `name` | string | Token name |
| `symbol` | string | Token symbol |
| `website` | string | Project website URL |
| `telegram` | string | Telegram link |
| `twitter` | string | Twitter / X URL |
| `twitterCommunity` | string | Twitter community URL |
| `discord` | string | Discord invite link |
| `instagram` | string | Instagram URL |
| `tiktok` | string | TikTok URL |
| `circulatingSupply` | string | Circulating supply value |
| `useCirculatingSupply` | boolean | Enable circulating supply display |
| `tokenDescription` | string | Token description |
| `coingeckoCoinId` | string | CoinGecko coin ID |
| `useCoingeckoCoinId` | boolean | Enable CoinGecko integration |
| `circulatingSupplyUrl` | string | URL that returns circulating supply |
| `useCirculatingSupplyUrl` | boolean | Enable supply URL |
| `otherUrl` | string | Any other relevant URL |

## Validation Notes

- Solana addresses must be valid public keys
- The submission cost is 1 JUP, represented as `1000000` base units with 6 decimals
