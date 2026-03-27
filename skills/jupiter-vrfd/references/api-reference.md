# API Reference — Jupiter Token Verification

> **Base URL**: `https://token-verification-dev-api.jup.ag`

This reference intentionally documents only the 3 public submission routes used by the skill.

## Authentication

| Endpoint | Auth Required |
| --- | --- |
| `GET /express/check-eligibility` | None |
| `GET /payments/express/craft-txn` | None |
| `POST /payments/express/execute` | None |

---

## GET /express/check-eligibility

Checks whether a token is eligible for submission and whether the execute route could also accept `tokenMetadata`.

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

- `canVerify: true` means the token can use the submission flow
- `canVerify: false` means the caller should stop and inspect `verificationError`
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

Submits the signed transaction and creates the verification request.

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
| `twitterHandle` | string | Yes | Full `x.com` or `twitter.com` URL |
| `senderTwitterHandle` | string | No | Requester Twitter URL |
| `description` | string | Yes | Token description |
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
- if `tokenMetadata` is included, pass the object the user already has; this skill does not cover private metadata fetch or merge routes

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

## Validation Notes

- Solana addresses must be valid public keys
- Twitter URLs must be from `x.com`, `www.x.com`, `twitter.com`, or `www.twitter.com`
- The submission cost is 1 JUP, represented as `1000000` base units with 6 decimals
