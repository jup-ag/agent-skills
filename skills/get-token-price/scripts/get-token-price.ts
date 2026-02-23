import "dotenv/config";

// --- Config ---

const API_KEY = process.env.JUPITER_API_KEY;
if (!API_KEY) {
  console.error("Error: Missing JUPITER_API_KEY in .env");
  process.exit(1);
}

const BASE_URL = "https://api.jup.ag";

// Well-known mints
const SOL = "So11111111111111111111111111111111111111112";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const JUP = "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN";
const BONK = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263";
const UNKNOWN = "1111111111111111111111111111111111111111111";

// --- Types ---

interface PriceData {
  createdAt: string;
  liquidity: number;
  usdPrice: number;
  blockId: number;
  decimals: number;
  priceChange24h: number;
}

type PriceResponse = Record<string, PriceData>;

// --- Fetch ---

async function getTokenPrices(mints: string[]): Promise<PriceResponse> {
  const url = `${BASE_URL}/price/v3?ids=${mints.join(",")}`;
  console.log(`Fetching prices for ${mints.length} token(s)...`);

  const response = await fetch(url, {
    headers: { "x-api-key": API_KEY! },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// --- Display ---

function displayPrice(mint: string, label: string, prices: PriceResponse): void {
  const data = prices[mint];
  if (!data) {
    console.log(`  ${label}: Price unavailable (omitted from response)`);
    return;
  }

  const change =
    data.priceChange24h >= 0
      ? `+${data.priceChange24h.toFixed(2)}%`
      : `${data.priceChange24h.toFixed(2)}%`;

  const liquidity = `$${(data.liquidity / 1e6).toFixed(1)}M`;

  console.log(
    `  ${label}: $${data.usdPrice} (${change}) | Liquidity: ${liquidity} | Block: ${data.blockId}`
  );
}

// --- Portfolio ---

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

// --- Main ---

async function main() {
  console.log("=== Jupiter Price API V3 Demo ===\n");

  // 1. Fetch prices for well-known tokens
  console.log("1. Fetching prices for SOL, USDC, JUP, BONK...");
  const prices = await getTokenPrices([SOL, USDC, JUP, BONK]);

  displayPrice(SOL, "SOL", prices);
  displayPrice(USDC, "USDC", prices);
  displayPrice(JUP, "JUP", prices);
  displayPrice(BONK, "BONK", prices);

  // 2. Test with unknown/invalid mint
  console.log("\n2. Fetching price for unknown mint...");
  const unknownPrices = await getTokenPrices([UNKNOWN]);
  displayPrice(UNKNOWN, "Unknown", unknownPrices);
  console.log(`  (Response was empty object: ${JSON.stringify(unknownPrices)})`);

  // 3. Portfolio value calculation
  console.log("\n3. Calculating portfolio value...");
  const holdings = {
    [SOL]: 10, // 10 SOL
    [JUP]: 5000, // 5000 JUP
    [USDC]: 500, // 500 USDC
  };

  const allPrices = await getTokenPrices(Object.keys(holdings));
  const totalValue = calculatePortfolioValue(holdings, allPrices);

  for (const [mint, amount] of Object.entries(holdings)) {
    const price = allPrices[mint]?.usdPrice ?? 0;
    const label = mint === SOL ? "SOL" : mint === JUP ? "JUP" : "USDC";
    console.log(`  ${amount} ${label} x $${price} = $${(amount * price).toFixed(2)}`);
  }
  console.log(`  Total portfolio value: $${totalValue.toFixed(2)}`);

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
