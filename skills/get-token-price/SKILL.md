---
name: get-token-price
description: Fetch real-time USD prices for one or more Solana tokens using Jupiter
  Price API V3. Trigger on "token price", "get price", "how much is SOL", "portfolio
  value", "price check". Returns usdPrice, liquidity, 24h change, and block recency
  for up to 50 tokens per request.
license: MIT
metadata:
  author: jup-ag
  version: "3.0"
---

# Get Token Prices

Fetch real-time USD prices for any Solana token using Jupiter's Price API V3. One
request returns prices for up to 50 tokens — the same data that powers jup.ag.

For a full explanation of how pricing works and common questions, see the
[docs guide](https://dev.jup.ag/guides/how-to-get-token-price).

## What You'll Build

A script that fetches current USD prices for Solana tokens and handles missing/unavailable prices gracefully.

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

// Well-known mints for testing
const SOL = "So11111111111111111111111111111111111111112";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const JUP = "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN";
```

## Step 2: Fetch Prices

Call the Price API V3 endpoint with comma-separated mint addresses:

```typescript
interface PriceData {
  createdAt: string;  // When the token was minted/created (fixed date for legacy tokens)
  liquidity: number;
  usdPrice: number;
  blockId: number;
  decimals: number;
  priceChange24h: number;
}

type PriceResponse = Record<string, PriceData>;

async function getTokenPrices(mints: string[]): Promise<PriceResponse> {
  const url = `${BASE_URL}/price/v3?ids=${mints.join(",")}`;
  const response = await fetch(url, {
    headers: { "x-api-key": API_KEY! },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}
```

Call it:

```typescript
const prices = await getTokenPrices([SOL, USDC, JUP]);
```

Expected output — a map keyed by mint address:

```json
{
  "So11111111111111111111111111111111111111112": {
    "createdAt": "2024-06-05T08:55:25.527Z",
    "liquidity": 621679197.67,
    "usdPrice": 77.99,
    "blockId": 402096793,
    "decimals": 9,
    "priceChange24h": -8.35
  }
}
```

## Step 3: Handle Missing Prices

Tokens without a reliable price are **omitted** from the response — they are not
present with a null value. Always check key existence:

```typescript
function displayPrice(mint: string, label: string, prices: PriceResponse): void {
  const data = prices[mint];
  if (!data) {
    console.log(`${label}: Price unavailable`);
    return;
  }
  const change = data.priceChange24h >= 0
    ? `+${data.priceChange24h.toFixed(2)}%`
    : `${data.priceChange24h.toFixed(2)}%`;
  console.log(
    `${label}: $${data.usdPrice.toFixed(data.decimals <= 6 ? 6 : 2)} (${change}) | Liquidity: $${(data.liquidity / 1e6).toFixed(1)}M`
  );
}
```

## Step 4: Calculate Portfolio Value

A practical use case — compute total USD value from token holdings:

```typescript
function calculatePortfolioValue(
  holdings: Record<string, number>,
  prices: PriceResponse
): number {
  let total = 0;
  for (const [mint, amount] of Object.entries(holdings)) {
    const price = prices[mint]?.usdPrice ?? 0;
    total += amount * price;
  }
  return total;
}
```

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Invalid/unknown mint | Omitted from response (key absent) |
| Suspicious token (fails heuristics) | Omitted from response |
| Invalid API key | HTTP 401 `{"code": 401, "message": "Unauthorized"}` |
| Rate limited | HTTP 429 `{"message": "Rate limit exceeded"}` |
| Too many mints (>50) | Split into multiple requests |

## What's Next

- [Get Token Information](https://github.com/jup-ag/agent-skills/tree/main/skills/search-token) — search tokens by name/symbol, get metadata and organic score
- [Full docs guide](https://dev.jup.ag/guides/how-to-get-token-price) — deeper explanation of pricing methodology
- [Price API Reference](https://dev.jup.ag/api-reference/price/v3/price) — full endpoint schema
