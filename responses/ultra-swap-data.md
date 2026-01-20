---
title: Ultra Swap Data API Responses
description: Response examples and field descriptions for the Ultra Swap Data API endpoints including /search, /shield, and /holdings.
notes:
  - See `./../endpoints/ultra-swap-data.md` for endpoint documentation.
---

# Ultra Swap Data API Responses

---

## GET /search

Search tokens by symbol, name, or mint address.

### Request
```typescript
const searchResponse = await fetch(
  'https://api.jup.ag/ultra/v1/search?query=So11111111111111111111111111111111111111112',
  { headers: { 'x-api-key': 'your-api-key' } }
).then(r => r.json());
```

### Success (200)

```json
[
  {
    "address": "So11111111111111111111111111111111111111112",
    "name": "Wrapped SOL",
    "symbol": "SOL",
    "decimals": 9,
    "logoURI": "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    "tags": ["verified", "community", "strict"],
    "daily_volume": 1234567890.12,
    "freeze_authority": null,
    "mint_authority": null
  }
]
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `address` | string | Token mint address |
| `name` | string | Token name |
| `symbol` | string | Token symbol |
| `decimals` | number | Token decimals |
| `logoURI` | string | Token logo URL |
| `tags` | string[] | Token tags (verified, community, strict, etc.) |
| `daily_volume` | number | 24h trading volume in USD |
| `freeze_authority` | string \| null | Freeze authority address |
| `mint_authority` | string \| null | Mint authority address |

### Failed (400/500)

```json
{
  "error": "<string>"
}
```

---

## GET /shield

Request token information and warnings for specified mints.

### Request

```typescript
const shieldResponse = await fetch(
  'https://api.jup.ag/ultra/v1/shield?mints=So11111111111111111111111111111111111111112,EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  { headers: { 'x-api-key': 'your-api-key' } }
).then(r => r.json());
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `mints` | string | Yes | Comma-separated list of mint addresses |

### Success (200)

```json
{
  "warnings": {
    "So11111111111111111111111111111111111111112": [],
    "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263": [
      {
        "type": "HAS_FREEZE_AUTHORITY",
        "message": "Token has freeze authority enabled",
        "severity": "warning",
        "source": "RugCheck"
      }
    ]
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `warnings` | object | Map of mint address to array of warnings |
| `warnings[mint]` | array | Array of warning objects for this mint |
| `warnings[mint][].type` | string | Warning type (see table below) |
| `warnings[mint][].message` | string | Human-readable warning message |
| `warnings[mint][].severity` | string | Severity level: `info`, `warning`, or `critical` |
| `warnings[mint][].source` | string | External source of warning (e.g., "RugCheck") |

### Warning Types

| Type | Description |
|------|-------------|
| `NOT_VERIFIED` | Token is not verified |
| `LOW_LIQUIDITY` | Token has low liquidity |
| `NOT_SELLABLE` | Token cannot be sold |
| `LOW_ORGANIC_ACTIVITY` | Low organic trading activity |
| `HAS_MINT_AUTHORITY` | Token has active mint authority |
| `HAS_FREEZE_AUTHORITY` | Token has freeze authority enabled |
| `HAS_PERMANENT_DELEGATE` | Token has permanent delegate |
| `NEW_LISTING` | Recently listed token |
| `VERY_LOW_TRADING_ACTIVITY` | Very low trading volume |
| `HIGH_SUPPLY_CONCENTRATION` | Supply concentrated in few wallets |
| `NON_TRANSFERABLE` | Token cannot be transferred |
| `MUTABLE_TRANSFER_FEES` | Transfer fees can be changed |
| `SUSPICIOUS_DEV_ACTIVITY` | Suspicious developer activity detected |
| `SUSPICIOUS_TOP_HOLDER_ACTIVITY` | Suspicious top holder activity |
| `HIGH_SINGLE_OWNERSHIP` | High percentage owned by single wallet |
| `{}%_TRANSFER_FEES` | Token has transfer fees (percentage in type) |

### Severity Levels

| Severity | Description |
|----------|-------------|
| `info` | Informational, no immediate risk |
| `warning` | Potential risk, proceed with caution |
| `critical` | High risk, strongly discouraged |

### Failed (400/500)

```json
{
  "error": "<string>"
}
```

---

## GET /holdings/{address}

Request token balances for a wallet address.

### Request

```typescript
const holdingsResponse = await fetch(
  'https://api.jup.ag/ultra/v1/holdings/3X2LFoTQecbpqCR7G5tL1kczqBKurjKPHhKSZrJ4wgWc',
  { headers: { 'x-api-key': 'your-api-key' } }
).then(r => r.json());
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `address` | string | Yes | Solana wallet address |

### Success (200)

```json
{
  "amount": "1000000000",
  "uiAmount": 1,
  "uiAmountString": "1",
  "tokens": {
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": [
      {
        "account": "5eS2emJwbT...tokenAccountAddress",
        "amount": "1000000",
        "uiAmount": 1,
        "uiAmountString": "1",
        "isFrozen": false,
        "isAssociatedTokenAccount": true,
        "decimals": 6,
        "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
      }
    ]
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `amount` | string | Total SOL balance in lamports |
| `uiAmount` | number | SOL balance with decimals applied |
| `uiAmountString` | string | SOL balance as string for precision |
| `tokens` | object | Map of mint address to array of token holdings |

### Token Holdings Fields

| Field | Type | Description |
|-------|------|-------------|
| `account` | string | Token account address |
| `amount` | string | Token balance in native units |
| `uiAmount` | number | Token balance with decimals applied |
| `uiAmountString` | string | Token balance as string for precision |
| `isFrozen` | boolean | Whether the token account is frozen |
| `isAssociatedTokenAccount` | boolean | Whether this is an ATA |
| `decimals` | number | Token decimals |
| `programId` | string | Token program ID |

### Failed (400/500)

```json
{
  "error": "<string>"
}
```

---

## GET /holdings/{address}/native

Request only the native SOL balance (more efficient than full holdings).

### Request

```typescript
const nativeBalance = await fetch(
  'https://api.jup.ag/ultra/v1/holdings/3X2LFoTQecbpqCR7G5tL1kczqBKurjKPHhKSZrJ4wgWc/native',
  { headers: { 'x-api-key': 'your-api-key' } }
).then(r => r.json());
```

### Success (200)

```json
{
  "amount": "1000000000",
  "uiAmount": 1,
  "uiAmountString": "1"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `amount` | string | SOL balance in lamports |
| `uiAmount` | number | SOL balance with decimals applied |
| `uiAmountString` | string | SOL balance as string for precision |
