# Portfolio API Responses

This file contains response examples and field descriptions for the Portfolio API endpoints including endpoints from `../endpoints/portfolio.md`

---

## GET /positions/{address}

### Success Response

```json
{
  "date": 1737417600,
  "owner": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "fetcherReports": [
    {
      "id": "jupiter-exchange",
      "status": "succeeded",
      "duration": 245,
      "error": null
    },
    {
      "id": "jupiter-governance",
      "status": "succeeded",
      "duration": 189,
      "error": null
    },
    {
      "id": "jupiter-perps",
      "status": "succeeded",
      "duration": 312,
      "error": null
    }
  ],
  "elements": [
    {
      "type": "multiple",
      "networkId": "solana",
      "platformId": "jupiter-wallet",
      "value": 2456.78,
      "label": "Wallet",
      "name": "Token Wallet",
      "tags": ["wallet", "liquid"],
      "data": {
        "assets": [
          {
            "type": "token",
            "networkId": "solana",
            "value": 2000.0,
            "attributes": {
              "lockedUntil": null,
              "isDeprecated": false,
              "isClaimable": false,
              "tags": ["liquid"],
              "validator": null,
              "prediction": null
            },
            "data": {
              "address": "So11111111111111111111111111111111111111112",
              "amount": 10.0,
              "price": 200.0
            },
            "name": "SOL",
            "imageUri": "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
            "ref": "So11111111111111111111111111111111111111112",
            "sourceRefs": [],
            "link": "https://explorer.solana.com/address/So11111111111111111111111111111111111111112"
          },
          {
            "type": "token",
            "networkId": "solana",
            "value": 456.78,
            "attributes": {
              "lockedUntil": null,
              "isDeprecated": false,
              "isClaimable": false,
              "tags": ["liquid"],
              "validator": null,
              "prediction": null
            },
            "data": {
              "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
              "amount": 456.78,
              "price": 1.0
            },
            "name": "USDC",
            "imageUri": "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
            "ref": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "sourceRefs": [],
            "link": null
          }
        ],
        "assetsYields": [
          [
            {
              "apy": 0.0,
              "apr": 0.0,
              "description": "No yield"
            }
          ],
          [
            {
              "apy": 0.0,
              "apr": 0.0,
              "description": "No yield"
            }
          ]
        ],
        "ref": null,
        "sourceRefs": [],
        "link": null
      },
      "netApy": 0.0
    },
    {
      "type": "liquidity",
      "networkId": "solana",
      "platformId": "jupiter-pools",
      "value": 1250.50,
      "label": "LiquidityPool",
      "name": "SOL-USDC Pool",
      "tags": ["lp", "earning"],
      "data": {
        "assets": [
          {
            "type": "token",
            "networkId": "solana",
            "value": 625.25,
            "attributes": {
              "lockedUntil": null,
              "isDeprecated": false,
              "isClaimable": false,
              "tags": ["liquidity"],
              "validator": null,
              "prediction": null
            },
            "data": {
              "address": "So11111111111111111111111111111111111111112",
              "amount": 3.126,
              "price": 200.0
            },
            "name": "SOL",
            "imageUri": "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
            "ref": "So11111111111111111111111111111111111111112",
            "sourceRefs": [
              {
                "address": "D8cy77BBepLMngZx6ZukaTff5hCt1HrWyKk3Hnd9oitf",
                "name": "SOL-USDC Pool"
              }
            ],
            "link": null
          },
          {
            "type": "token",
            "networkId": "solana",
            "value": 625.25,
            "attributes": {
              "lockedUntil": null,
              "isDeprecated": false,
              "isClaimable": false,
              "tags": ["liquidity"],
              "validator": null,
              "prediction": null
            },
            "data": {
              "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
              "amount": 625.25,
              "price": 1.0
            },
            "name": "USDC",
            "imageUri": "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
            "ref": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "sourceRefs": [
              {
                "address": "D8cy77BBepLMngZx6ZukaTff5hCt1HrWyKk3Hnd9oitf",
                "name": "SOL-USDC Pool"
              }
            ],
            "link": null
          }
        ],
        "assetsYields": [
          [
            {
              "apy": 8.5,
              "apr": 8.2,
              "description": "Trading fees + rewards"
            }
          ],
          [
            {
              "apy": 8.5,
              "apr": 8.2,
              "description": "Trading fees + rewards"
            }
          ]
        ],
        "ref": "D8cy77BBepLMngZx6ZukaTff5hCt1HrWyKk3Hnd9oitf",
        "sourceRefs": [
          {
            "address": "D8cy77BBepLMngZx6ZukaTff5hCt1HrWyKk3Hnd9oitf",
            "name": "SOL-USDC Pool"
          }
        ],
        "link": "https://jup.ag/pools/D8cy77BBepLMngZx6ZukaTff5hCt1HrWyKk3Hnd9oitf"
      },
      "netApy": 8.5
    },
    {
      "type": "leverage",
      "networkId": "solana",
      "platformId": "jupiter-perps",
      "value": 5250.00,
      "label": "Leverage",
      "name": "SOL-PERP Long",
      "tags": ["perp", "long"],
      "data": {
        "positionSize": 50.0,
        "entryPrice": 195.0,
        "markPrice": 200.0,
        "liquidationPrice": 175.0,
        "unrealizedPnl": 250.0,
        "leverage": 5,
        "side": "long",
        "collateral": {
          "asset": "USDC",
          "amount": 2000.0,
          "value": 2000.0
        }
      },
      "netApy": null
    },
    {
      "type": "borrowlend",
      "networkId": "solana",
      "platformId": "jupiter-lend",
      "value": 1500.0,
      "label": "Borrow/Lend",
      "name": "JLP Lending Position",
      "tags": ["lend", "collateral"],
      "data": {
        "collateral": {
          "asset": "JLP",
          "amount": 200.0,
          "value": 2000.0,
          "address": "27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4"
        },
        "debt": {
          "asset": "USDC",
          "amount": 500.0,
          "value": 500.0,
          "interestAccrued": 5.25,
          "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
        },
        "ltv": 0.25,
        "maxLtv": 0.85,
        "liquidationLtv": 0.90,
        "liquidationPrice": null,
        "borrowApy": 12.5,
        "supplyApy": null
      },
      "netApy": -12.5
    }
  ],
  "duration": 756,
  "tokenInfo": {
    "solana": {
      "So11111111111111111111111111111111111111112": {
        "name": "Wrapped SOL",
        "symbol": "SOL",
        "decimals": 9,
        "logoURI": "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
        "tags": ["verified", "community"],
        "extensions": {
          "coingeckoId": "wrapped-solana"
        }
      },
      "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": {
        "name": "USD Coin",
        "symbol": "USDC",
        "decimals": 6,
        "logoURI": "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
        "tags": ["verified", "stablecoin"],
        "extensions": {
          "coingeckoId": "usd-coin"
        }
      },
      "27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4": {
        "name": "Jupiter Perpetuals LP Token",
        "symbol": "JLP",
        "decimals": 6,
        "logoURI": "https://static.jup.ag/jlp/icon.png",
        "tags": ["verified", "lp-token"],
        "extensions": {
          "coingeckoId": "jupiter-perpetuals-liquidity-provider-token"
        }
      }
    }
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `date` | number | Unix timestamp when data was fetched |
| `owner` | string | Wallet address queried |
| `fetcherReports` | array | Status reports for each platform fetch |
| `fetcherReports[].id` | string | Platform ID |
| `fetcherReports[].status` | string | Fetch status: "succeeded", "failed", "timeout" |
| `fetcherReports[].duration` | number | Fetch duration in milliseconds |
| `fetcherReports[].error` | string \| null | Error message if failed |
| `elements` | array | Array of position elements |
| `elements[].type` | string | Position type: "multiple", "liquidity", "leverage", "borrowlend", "trade" |
| `elements[].networkId` | string | Network identifier (e.g., "solana") |
| `elements[].platformId` | string | Platform identifier |
| `elements[].value` | number | Total USD value of position |
| `elements[].label` | string | Position label for display |
| `elements[].name` | string | Human-readable position name |
| `elements[].tags` | array | Tags for categorization |
| `elements[].data` | object | Position-specific data (varies by type) |
| `elements[].netApy` | number \| null | Net APY for the position |
| `duration` | number | Total request duration in milliseconds |
| `tokenInfo` | object | Token metadata by network |
| `tokenInfo[network][address]` | object | Token details |
| `tokenInfo[network][address].name` | string | Token name |
| `tokenInfo[network][address].symbol` | string | Token symbol |
| `tokenInfo[network][address].decimals` | number | Token decimals |
| `tokenInfo[network][address].logoURI` | string | Token logo URL |
| `tokenInfo[network][address].tags` | array | Token tags |
| `tokenInfo[network][address].extensions` | object | Additional metadata |

### Position Type: `multiple`

Wallet token holdings with multiple assets.

**Key Fields in `data`:**

| Field | Type | Description |
|-------|------|-------------|
| `assets` | array | Array of token assets |
| `assets[].type` | string | Asset type (usually "token") |
| `assets[].value` | number | USD value of asset |
| `assets[].data.address` | string | Token mint address |
| `assets[].data.amount` | number | Token amount (human-readable, decimals applied) |
| `assets[].data.price` | number | Token price in USD |
| `assets[].name` | string | Token name |
| `assets[].imageUri` | string | Token image URL |
| `assetsYields` | array | Yield information per asset |
| `assetsYields[][].apy` | number | Annual percentage yield |
| `assetsYields[][].apr` | number | Annual percentage rate |
| `assetsYields[][].description` | string | Yield description |

### Position Type: `liquidity`

Liquidity pool positions.

**Key Fields in `data`:**

| Field | Type | Description |
|-------|------|-------------|
| `assets` | array | Array of LP token assets (usually 2) |
| `assets[].data.address` | string | Token mint address |
| `assets[].data.amount` | number | Token amount in pool |
| `assets[].data.price` | number | Token price |
| `assets[].sourceRefs` | array | Pool references |
| `assetsYields` | array | Yield per asset |
| `ref` | string | Pool address |
| `sourceRefs` | array | Pool contract references |
| `link` | string \| null | Pool info URL |

### Position Type: `leverage`

Perpetual or leveraged trading positions.

**Key Fields in `data`:**

| Field | Type | Description |
|-------|------|-------------|
| `positionSize` | number | Size of position in base asset |
| `entryPrice` | number | Entry price |
| `markPrice` | number | Current mark price |
| `liquidationPrice` | number | Liquidation price |
| `unrealizedPnl` | number | Unrealized profit/loss in USD |
| `leverage` | number | Leverage multiplier |
| `side` | string | Position side: "long" or "short" |
| `collateral` | object | Collateral details |
| `collateral.asset` | string | Collateral token symbol |
| `collateral.amount` | number | Collateral amount |
| `collateral.value` | number | Collateral value in USD |

### Position Type: `borrowlend`

Lending and borrowing positions.

**Key Fields in `data`:**

| Field | Type | Description |
|-------|------|-------------|
| `collateral` | object | Collateral details |
| `collateral.asset` | string | Collateral token symbol |
| `collateral.amount` | number | Collateral amount |
| `collateral.value` | number | Collateral value in USD |
| `collateral.address` | string | Collateral token mint |
| `debt` | object | Debt details |
| `debt.asset` | string | Debt token symbol |
| `debt.amount` | number | Debt amount |
| `debt.value` | number | Debt value in USD |
| `debt.interestAccrued` | number | Accrued interest |
| `debt.address` | string | Debt token mint |
| `ltv` | number | Current loan-to-value ratio (0-1) |
| `maxLtv` | number | Maximum LTV before restrictions |
| `liquidationLtv` | number | LTV at liquidation |
| `liquidationPrice` | number \| null | Liquidation price |
| `borrowApy` | number | Borrow APY percentage |
| `supplyApy` | number \| null | Supply APY percentage |

### Failed Fetcher Report

```json
{
  "date": 1737417600,
  "owner": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "fetcherReports": [
    {
      "id": "jupiter-exchange",
      "status": "succeeded",
      "duration": 245,
      "error": null
    },
    {
      "id": "external-platform",
      "status": "failed",
      "duration": 5000,
      "error": "Connection timeout"
    }
  ],
  "elements": [],
  "duration": 5245,
  "tokenInfo": {}
}
```

---

## GET /platforms

### Success Response

```json
[
  {
    "id": "jupiter-exchange",
    "name": "Jupiter Exchange",
    "image": "https://static.jup.ag/logo.png",
    "description": "The key liquidity aggregator on Solana",
    "defiLlamaId": "jupiter",
    "isDeprecated": false,
    "tokens": [
      "So11111111111111111111111111111111111111112",
      "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"
    ],
    "tags": ["dex", "aggregator", "swap"],
    "links": {
      "website": "https://jup.ag",
      "discord": "https://discord.gg/jup",
      "twitter": "https://twitter.com/JupiterExchange",
      "github": "https://github.com/jup-ag",
      "documentation": "https://dev.jup.ag"
    }
  },
  {
    "id": "jupiter-governance",
    "name": "Jupiter Governance",
    "image": "https://static.jup.ag/jup/icon.png",
    "description": "Stake JUP tokens to participate in governance",
    "defiLlamaId": null,
    "isDeprecated": false,
    "tokens": [
      "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"
    ],
    "tags": ["governance", "staking"],
    "links": {
      "website": "https://vote.jup.ag",
      "discord": "https://discord.gg/jup",
      "twitter": "https://twitter.com/JupiterExchange",
      "documentation": "https://dev.jup.ag/docs/governance"
    }
  },
  {
    "id": "jupiter-perps",
    "name": "Jupiter Perpetuals",
    "image": "https://static.jup.ag/perps/icon.png",
    "description": "Trade perpetual futures on Solana",
    "defiLlamaId": "jupiter-perpetuals",
    "isDeprecated": false,
    "tokens": [
      "27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4"
    ],
    "tags": ["perps", "derivatives", "leverage"],
    "links": {
      "website": "https://jup.ag/perps",
      "discord": "https://discord.gg/jup",
      "twitter": "https://twitter.com/JupiterExchange",
      "documentation": "https://dev.jup.ag/docs/perpetuals"
    }
  },
  {
    "id": "jupiter-lend",
    "name": "Jupiter Lend",
    "image": "https://static.jup.ag/lend/icon.png",
    "description": "Lend and borrow assets on Jupiter",
    "defiLlamaId": null,
    "isDeprecated": false,
    "tokens": [
      "27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4",
      "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "So11111111111111111111111111111111111111112"
    ],
    "tags": ["lending", "borrowing", "defi"],
    "links": {
      "website": "https://jup.ag/lend",
      "discord": "https://discord.gg/jup",
      "twitter": "https://twitter.com/JupiterExchange",
      "documentation": "https://dev.jup.ag/docs/lend"
    }
  }
]
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique platform identifier (use for filtering) |
| `name` | string | Human-readable platform name |
| `image` | string | Platform logo/image URL |
| `description` | string | Brief platform description |
| `defiLlamaId` | string \| null | DeFi Llama identifier for TVL/metrics |
| `isDeprecated` | boolean | Whether platform is deprecated |
| `tokens` | array | Array of token mint addresses supported |
| `tags` | array | Platform tags for categorization |
| `links` | object | External links |
| `links.website` | string | Platform website URL |
| `links.discord` | string | Discord invite URL |
| `links.twitter` | string | Twitter profile URL |
| `links.github` | string | GitHub organization URL |
| `links.medium` | string | Medium blog URL |
| `links.documentation` | string | Documentation URL |

---

## GET /staked-jup/{address}

### Success Response

```json
{
  "stakedAmount": 50000000000,
  "unstaking": [
    {
      "amount": 10000000000,
      "until": 1740009600
    },
    {
      "amount": 5000000000,
      "until": 1742688000
    }
  ]
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `stakedAmount` | string | Total JUP staked in native units (6 decimals) |
| `unstaking` | array | Array of unstaking schedules |
| `unstaking[].amount` | string | Amount being unstaked in native units |
| `unstaking[].until` | string | Unix timestamp when unstaking completes |

**Converting Native Units:**

JUP has 6 decimals, so divide by 1,000,000 to get human-readable amount:

```typescript
const stakedJup = parseInt(response.stakedAmount) / 1e6;
// 50000000000 / 1000000 = 50,000 JUP

const unstakingAmount = parseInt(response.unstaking[0].amount) / 1e6;
// 10000000000 / 1000000 = 10,000 JUP
```

### No Staking Response

```json
{
  "stakedAmount": 0,
  "unstaking": []
}
```

---

## Error Responses

### 400 Bad Request - Invalid Address

```json
{
  "error": "Invalid wallet address format"
}
```

### 404 Not Found - Invalid Endpoint

```json
{
  "error": "Endpoint not found"
}
```

### 429 Too Many Requests

```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error. Please try again."
}
```

---

## Best Practices

| Scenario | Recommendation |
|----------|----------------|
| Empty positions | Check `elements.length === 0` before processing |
| Failed platforms | Filter `fetcherReports` by `status === "succeeded"` |
| Token decimals | Always use `tokenInfo[network][address].decimals` for conversion |
| Unstaking dates | Convert `until` timestamp to Date: `new Date(until * 1000)` |
| Position types | Use type guards or switch statements to handle different `data` structures |
| Missing fields | Use optional chaining (`?.`) for nested fields that may not exist |
