# Lend API Responses

This file contains response examples and field descriptions for the Lend API endpoints from `../endpoints/lend.md`

---

## GET /tokens

### Success

```json
[
  {
    "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "symbol": "USDC",
    "name": "USD Coin",
    "decimals": 6,
    "jlMint": "jlUSDC...",
    "vault": "vault-address...",
    "supplyRate": "5.23",
    "rewardsRate": "0.5",
    "totalSupply": "1000000000000",
    "availableLiquidity": "500000000000",
    "utilizationRate": "0.50"
  },
  {
    "mint": "So11111111111111111111111111111111111111112",
    "symbol": "SOL",
    "name": "Wrapped SOL",
    "decimals": 9,
    "jlMint": "jlSOL...",
    "vault": "vault-address...",
    "supplyRate": "3.15",
    "rewardsRate": "0.25",
    "totalSupply": "500000000000000",
    "availableLiquidity": "250000000000000",
    "utilizationRate": "0.50"
  }
]
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `mint` | string | Token mint address |
| `symbol` | string | Token symbol |
| `name` | string | Token name |
| `decimals` | number | Token decimals |
| `jlMint` | string | jlToken mint address (yield-bearing token) |
| `vault` | string | Vault address |
| `supplyRate` | string | Current supply APY percentage |
| `rewardsRate` | string | Additional rewards APY percentage |
| `totalSupply` | string | Total supplied in native units |
| `availableLiquidity` | string | Available liquidity in native units |
| `utilizationRate` | string | Utilization rate (0-1) |

---

## GET /positions

### Success

```json
[
  {
    "ownerAddress": "user-wallet-address",
    "token": {
      "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "symbol": "USDC",
      "decimals": 6
    },
    "shares": "1000000000",
    "underlyingAssets": "1050000000",
    "underlyingBalance": "1050000000",
    "allowance": "0"
  }
]
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `ownerAddress` | string | User's wallet address |
| `token` | object | Token metadata |
| `token.mint` | string | Token mint address |
| `token.symbol` | string | Token symbol |
| `token.decimals` | number | Token decimals |
| `shares` | string | jlToken (share) balance in native units |
| `underlyingAssets` | string | Value in underlying asset units |
| `underlyingBalance` | string | Current balance in underlying asset |
| `allowance` | string | Token allowance |

---

## GET /earnings

### Success

```json
{
  "user": "user-wallet-address",
  "positions": [
    {
      "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "totalDeposited": "1000000000",
      "currentValue": "1050000000",
      "earnings": "50000000",
      "earningsUsd": "50.00"
    }
  ],
  "totalEarningsUsd": "50.00"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `user` | string | User's wallet address |
| `positions` | array | Array of position earnings |
| `positions[].mint` | string | Token mint address |
| `positions[].totalDeposited` | string | Total deposited in native units |
| `positions[].currentValue` | string | Current value in native units |
| `positions[].earnings` | string | Total earnings in native units |
| `positions[].earningsUsd` | string | Earnings in USD |
| `totalEarningsUsd` | string | Total earnings across all positions in USD |

---

## POST /deposit

### Success

```json
{
  "transaction": "AQAAAAAAAAAA...",
  "asset": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "amount": "1000000",
  "expectedShares": "950000"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `transaction` | string | Base64-encoded unsigned transaction |
| `asset` | string | Token mint address being deposited |
| `amount` | string | Amount being deposited in native units |
| `expectedShares` | string | Expected jlToken shares to receive |

---

## POST /withdraw

### Success

```json
{
  "transaction": "AQAAAAAAAAAA...",
  "asset": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "amount": "500000",
  "requiredShares": "475000"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `transaction` | string | Base64-encoded unsigned transaction |
| `asset` | string | Token mint address being withdrawn |
| `amount` | string | Amount being withdrawn in native units |
| `requiredShares` | string | jlToken shares that will be burned |

---

## POST /mint

### Success

```json
{
  "transaction": "AQAAAAAAAAAA...",
  "asset": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "shares": "1000000",
  "requiredAssets": "1050000"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `transaction` | string | Base64-encoded unsigned transaction |
| `asset` | string | Token mint address |
| `shares` | string | Number of shares to mint |
| `requiredAssets` | string | Required asset amount in native units |

---

## POST /redeem

### Success

```json
{
  "transaction": "AQAAAAAAAAAA...",
  "asset": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "shares": "1000000",
  "expectedAssets": "1050000"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `transaction` | string | Base64-encoded unsigned transaction |
| `asset` | string | Token mint address |
| `shares` | string | Number of shares to redeem |
| `expectedAssets` | string | Expected asset amount in native units |

---

## Instruction Endpoints

### POST /deposit-instructions (and similar)

### Success

```json
{
  "programId": "jup3YeL8QhtSx1e253b2FDvsMNC87fDrgQZivbrndc9",
  "accounts": [
    {
      "pubkey": "account-address",
      "isSigner": true,
      "isWritable": true
    }
  ],
  "data": "base64-encoded-instruction-data"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `programId` | string | Earn program ID |
| `accounts` | array | Account metas for the instruction |
| `accounts[].pubkey` | string | Account public key |
| `accounts[].isSigner` | boolean | Whether account must sign |
| `accounts[].isWritable` | boolean | Whether account is writable |
| `data` | string | Base64-encoded instruction data |

---

## Error Responses

### Failed (400)

```json
{
  "error": "Invalid asset mint address"
}
```

### Failed (400) - Insufficient Balance

```json
{
  "error": "Insufficient balance for withdrawal",
  "available": "500000",
  "requested": "1000000"
}
```

### Failed (400) - Liquidity

```json
{
  "error": "Insufficient liquidity for withdrawal",
  "availableLiquidity": "100000000",
  "requested": "500000000"
}
```

### Failed (401) - Authentication

```json
{
  "error": "Missing or invalid API key"
}
```

---

## Best Practices

| Error | Recommended Action |
|-------|-------------------|
| Insufficient balance | Show user's current position balance |
| Insufficient liquidity | Suggest smaller withdrawal or wait |
| Invalid asset | Verify mint address against /tokens |
| Transaction expired | Regenerate transaction |
| Missing API key | Check x-api-key header is set |
