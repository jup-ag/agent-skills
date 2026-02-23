---
name: get-token-info
description: Search, discover, and evaluate Solana tokens using Jupiter Tokens API
  V2. Search by name, symbol, or mint address. Get verified or LST tokens by tag.
  Get trending, top traded, or top organic tokens by interval. Get recently listed
  tokens. Evaluate token safety using audit and organic score fields. Trigger on
  "search token", "find token", "token info", "trending tokens", "new tokens",
  "recently listed", "is this token safe", "token safety", "verified tokens",
  "what is [symbol]", "top tokens".
license: MIT
metadata:
  author: jup-ag
  version: "2.0"
---

# Get Token Info

Search, discover, and evaluate any Solana token using Jupiter's Tokens API V2.
Search by name, symbol, or mint address. Get trending, top traded, or recently
listed tokens. Assess token safety using audit and organic score data.

For a full explanation and common questions, see the
[docs guide](https://dev.jup.ag/guides/how-to-get-token-information).

## What You'll Build

A script that searches tokens, retrieves trending and recently listed tokens,
and evaluates token safety — all from one API.

## Prerequisites

- Node.js 18+
- Jupiter API key from [portal.jup.ag](https://portal.jup.ag)

## Step 1: Set Up

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```
JUPITER_API_KEY=your_api_key_here
```

Load the environment and define constants:

```typescript
import "dotenv/config";

const API_KEY = process.env.JUPITER_API_KEY;
if (!API_KEY) {
  throw new Error("Missing JUPITER_API_KEY in .env");
}

const BASE_URL = "https://api.jup.ag";
```

## Step 2: Define Types

The response is an array of token objects with many fields. Most fields are
nullable or conditional — use optional chaining when accessing them.

```typescript
interface SwapStats {
  priceChange?: number;
  holderChange?: number;
  liquidityChange?: number;
  volumeChange?: number;
  buyVolume?: number;
  sellVolume?: number;
  buyOrganicVolume?: number;
  sellOrganicVolume?: number;
  numBuys?: number;
  numSells?: number;
  numTraders?: number;
  numOrganicBuyers?: number;
  numNetBuyers?: number;
}

interface TokenInfo {
  id: string;
  name: string;
  symbol: string;
  icon: string | null;
  decimals: number;
  tokenProgram: string;
  createdAt: string;

  // Social (conditional)
  twitter?: string;
  website?: string;
  discord?: string;
  instagram?: string;
  tiktok?: string;
  otherUrl?: string;
  dev?: string;

  // Supply
  circSupply: number | null;
  totalSupply: number | null;

  // Market
  fdv: number | null;
  mcap: number | null;
  usdPrice: number | null;
  priceBlockId: number | null;
  liquidity: number | null;
  holderCount: number | null;
  fees: number | null;
  apy?: { jupEarn: number };     // Only present for assets listed on Jupiter Lend's Earn

  // Quality
  organicScore: number;
  organicScoreLabel: "high" | "medium" | "low";
  isVerified: boolean | null;
  tags: string[] | null;

  // Audit (all fields conditional)
  audit: {
    isSus?: boolean;
    mintAuthorityDisabled?: boolean;
    freezeAuthorityDisabled?: boolean;
    topHoldersPercentage?: number;
    devBalancePercentage?: number;
    devMints?: number;
  } | null;

  // Launch
  firstPool?: { id: string; createdAt: string } | null;

  // Stats
  stats5m?: SwapStats | null;
  stats1h?: SwapStats | null;
  stats6h?: SwapStats | null;
  stats24h?: SwapStats | null;
  stats7d?: SwapStats | null;
  stats30d?: SwapStats | null;

  updatedAt: string;
}
```

## Step 3: Search for Tokens

Search by mint address, symbol, or name. The API returns an array of matches.

```typescript
async function searchTokens(query: string): Promise<TokenInfo[]> {
  const url = `${BASE_URL}/tokens/v2/search?query=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: { "x-api-key": API_KEY! },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}
```

**Query options:**
- Mint address: `So11111111111111111111111111111111111111112` (exact match, 1 result)
- Symbol: `JUP` (fuzzy match, up to 20 results)
- Name: `Jupiter` (fuzzy match, up to 20 results)
- Multiple mints: `SOL_MINT,USDC_MINT` (comma-separated, max 100)

Not found returns an empty array `[]`.

## Step 4: Get Tokens by Tag

Retrieve all tokens belonging to a tag. Useful for building token pickers
with verification badges.

```typescript
async function getTokensByTag(tag: "verified" | "lst"): Promise<TokenInfo[]> {
  const url = `${BASE_URL}/tokens/v2/tag?query=${tag}`;
  const response = await fetch(url, {
    headers: { "x-api-key": API_KEY! },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}
```

Returns the **entire list** — ~4,500 verified tokens or 1,400+ LSTs.

## Step 5: Get Trending and Top Tokens

Fetch tokens ranked by category over a time interval. For `toptrending` and
`toptraded`, common blue-chip tokens are filtered out so you see what's
actually moving. `toporganicscore` includes all tokens.

```typescript
type Category = "toptrending" | "toptraded" | "toporganicscore";
type Interval = "5m" | "1h" | "6h" | "24h";

async function getTrendingTokens(
  category: Category,
  interval: Interval,
  limit: number = 50,
): Promise<TokenInfo[]> {
  const url = `${BASE_URL}/tokens/v2/${category}/${interval}?limit=${limit}`;
  const response = await fetch(url, {
    headers: { "x-api-key": API_KEY! },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}
```

**Categories:**

| Category | What it ranks |
|----------|---------------|
| `toptrending` | Most price movement |
| `toptraded` | Highest trading volume |
| `toporganicscore` | Highest organic (real) activity |

**Intervals:** `5m`, `1h`, `6h`, `24h`

**Limit:** 1–100 (default 50).

## Step 6: Get Recently Listed Tokens

Fetch tokens that recently had their first liquidity pool created. Useful
for discovering new tokens before they gain traction.

```typescript
async function getRecentTokens(): Promise<TokenInfo[]> {
  const url = `${BASE_URL}/tokens/v2/recent`;
  const response = await fetch(url, {
    headers: { "x-api-key": API_KEY! },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}
```

Returns ~30 tokens ordered by first pool creation time (not mint time).

## Step 7: Evaluate Token Safety

Use audit and organic score fields to assess risk. All audit fields are
conditional — check for presence, not value.

```typescript
function evaluateSafety(token: TokenInfo): {
  safe: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (token.audit?.isSus) {
    warnings.push("Flagged as suspicious");
  }
  if (token.audit?.mintAuthorityDisabled === false) {
    warnings.push("Mint authority enabled — more tokens can be minted");
  }
  if (token.audit?.freezeAuthorityDisabled === false) {
    warnings.push("Freeze authority enabled — tokens can be frozen");
  }
  if (token.audit?.topHoldersPercentage != null && token.audit.topHoldersPercentage > 50) {
    warnings.push(`High holder concentration: ${token.audit.topHoldersPercentage.toFixed(1)}%`);
  }
  if (token.audit?.devBalancePercentage != null && token.audit.devBalancePercentage > 10) {
    warnings.push(`Dev holds ${token.audit.devBalancePercentage.toFixed(1)}% of supply`);
  }
  if (token.organicScoreLabel === "low") {
    warnings.push(`Low organic score: ${token.organicScore.toFixed(0)}/100`);
  }
  if (!token.isVerified) {
    warnings.push("Not verified");
  }

  return { safe: warnings.length === 0, warnings };
}
```

| Field | Safe | Risky |
|-------|------|-------|
| `isVerified` | `true` | `false` |
| `organicScoreLabel` | `"high"` | `"low"` |
| `audit.mintAuthorityDisabled` | `true` | `false` |
| `audit.freezeAuthorityDisabled` | `true` | `false` |
| `audit.isSus` | absent | `true` |
| `audit.topHoldersPercentage` | Low (< 20%) | High concentration |
| `audit.devBalancePercentage` | Low | High |

Note: `audit.isSus` is only present when the token is flagged as suspicious.
Not all risky tokens will have this flag.

## Error Handling

| Scenario | Behavior |
|----------|----------|
| No results found | Returns empty array `[]` |
| Invalid API key | HTTP 401 `{"code": 401, "message": "Unauthorized"}` |
| Rate limited | HTTP 429 `{"message": "Rate limit exceeded"}` |
| Multiple mints (>100) | Split into batches |

## What's Next

- [Get Token Prices](https://github.com/jup-ag/agent-skills/tree/main/skills/get-token-price) — USD prices via Price API V3
- [Full docs guide](https://dev.jup.ag/guides/how-to-get-token-information) — complete API explanation
- [Tokens API Reference](https://dev.jup.ag/api-reference/tokens/v2) — full endpoint schema
