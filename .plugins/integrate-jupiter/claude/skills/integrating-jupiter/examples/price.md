# Price: Multi-Token Lookup Example

> **Prerequisites:** This example uses the `jupiterFetch` helper defined in the
> **Developer Quickstart** section of the main `SKILL.md`. `jupiterFetch`
> prepends `https://api.jup.ag` to every path and attaches the `x-api-key`
> header automatically, so you never need to build full URLs or pass the API key
> manually.

```typescript
// jupiterFetch<T>(path, init?) is defined in Developer Quickstart (SKILL.md).
// It prepends https://api.jup.ag and adds the x-api-key header.

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const WBTC_MINT = '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh';

// Price API V3 response is keyed by mint. Each entry has usdPrice (number),
// blockId, decimals, priceChange24h, and liquidity. There is NO confidenceLevel
// field (that was V2). Mints with no reliable price are OMITTED from the
// response entirely — there is no null placeholder — so treat a missing mint
// as "unpriced" and fail closed for safety-sensitive actions.
type PriceEntry = {
  usdPrice: number;
  blockId: number;
  decimals: number;
  priceChange24h: number;
  liquidity?: number;
};

async function getPrices(mints: string[]) {
  const ids = mints.join(','); // max 50 mints per request

  const data = await jupiterFetch<Record<string, PriceEntry>>(
    `/price/v3?ids=${encodeURIComponent(ids)}`,
  );

  const prices: Record<string, PriceEntry | null> = {};
  for (const mint of mints) {
    // Missing mint => no reliable price. Fail closed.
    prices[mint] = data[mint] ?? null;
  }
  return prices;
}

// Usage:
// const prices = await getPrices([SOL_MINT, USDC_MINT, WBTC_MINT]);
// const solUsd = prices[SOL_MINT]?.usdPrice; // number | undefined
```
