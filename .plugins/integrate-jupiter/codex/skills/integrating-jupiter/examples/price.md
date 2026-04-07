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

async function getPrices(mints: string[], confidenceLevel: 'low' | 'medium' | 'high' = 'medium') {
  const ids = mints.join(',');

  const data = await jupiterFetch<{
    data: Record<string, { price: string; confidenceLevel?: string } | null>;
  }>(`/price/v3?ids=${encodeURIComponent(ids)}`);

  const prices: Record<string, { price: number; confidence: string } | null> = {};

  for (const mint of mints) {
    const entry = data.data?.[mint];
    if (!entry || !entry.price) {
      prices[mint] = null; // token not priced or unreliable
      continue;
    }

    // Filter by confidence — fail closed on low-confidence data
    const levels = ['low', 'medium', 'high'];
    const entryLevel = entry.confidenceLevel || 'low';
    if (levels.indexOf(entryLevel) < levels.indexOf(confidenceLevel)) {
      prices[mint] = null;
      continue;
    }

    prices[mint] = { price: parseFloat(entry.price), confidence: entryLevel };
  }

  return prices;
}

// Usage: getPrices([SOL_MINT, USDC_MINT, WBTC_MINT])
```
