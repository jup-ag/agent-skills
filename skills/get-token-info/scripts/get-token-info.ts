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
const JUP = "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SUS_TOKEN = "8JPzfwto4Pu1WwiHKSVHHNe57dh5RHqLYLQra9vpaKsW";

// --- Types ---

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
  twitter?: string;
  website?: string;
  discord?: string;
  instagram?: string;
  tiktok?: string;
  otherUrl?: string;
  dev?: string;
  circSupply: number | null;
  totalSupply: number | null;
  fdv: number | null;
  mcap: number | null;
  usdPrice: number | null;
  priceBlockId: number | null;
  liquidity: number | null;
  holderCount: number | null;
  fees: number | null;
  apy?: { jupEarn: number };
  organicScore: number;
  organicScoreLabel: "high" | "medium" | "low";
  isVerified: boolean | null;
  tags: string[] | null;
  audit: {
    isSus?: boolean;
    mintAuthorityDisabled?: boolean;
    freezeAuthorityDisabled?: boolean;
    topHoldersPercentage?: number;
    devBalancePercentage?: number;
    devMints?: number;
  } | null;
  firstPool?: { id: string; createdAt: string } | null;
  stats5m?: SwapStats | null;
  stats1h?: SwapStats | null;
  stats6h?: SwapStats | null;
  stats24h?: SwapStats | null;
  stats7d?: SwapStats | null;
  stats30d?: SwapStats | null;
  updatedAt: string;
}

// --- API ---

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

// --- Display ---

function displayToken(token: TokenInfo): void {
  const verified = token.isVerified ? "Verified" : "Unverified";
  const price =
    token.usdPrice != null ? `$${token.usdPrice}` : "No price";
  const mcap =
    token.mcap != null ? `$${(token.mcap / 1e6).toFixed(1)}M` : "N/A";
  const change24h =
    token.stats24h?.priceChange != null
      ? `${token.stats24h.priceChange >= 0 ? "+" : ""}${token.stats24h.priceChange.toFixed(2)}%`
      : "N/A";
  const organic = `${token.organicScoreLabel} (${token.organicScore.toFixed(0)})`;

  console.log(`  ${token.name} (${token.symbol}) — ${verified}`);
  console.log(`    Mint: ${token.id}`);
  console.log(`    Price: ${price} | MCap: ${mcap} | 24h: ${change24h}`);
  console.log(`    Organic: ${organic} | Holders: ${token.holderCount?.toLocaleString() ?? "N/A"}`);

  if (token.audit) {
    const flags: string[] = [];
    if (token.audit.isSus) flags.push("SUSPICIOUS");
    if (token.audit.mintAuthorityDisabled === false) flags.push("mint-enabled");
    if (token.audit.freezeAuthorityDisabled === false) flags.push("freeze-enabled");
    if (token.audit.topHoldersPercentage != null && token.audit.topHoldersPercentage > 50) {
      flags.push(`top-holders: ${token.audit.topHoldersPercentage.toFixed(1)}%`);
    }
    if (flags.length > 0) {
      console.log(`    Audit warnings: ${flags.join(", ")}`);
    }
  }
}

// --- Safety ---

function evaluateSafety(token: TokenInfo): {
  safe: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (token.audit?.isSus) {
    warnings.push("Flagged as suspicious");
  }
  if (token.audit?.mintAuthorityDisabled === false) {
    warnings.push("Mint authority enabled");
  }
  if (token.audit?.freezeAuthorityDisabled === false) {
    warnings.push("Freeze authority enabled");
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

// --- Main ---

async function main() {
  console.log("=== Jupiter Tokens API V2 — Full Demo ===\n");

  // --- Search ---

  // 1. Search by mint address (exact match)
  console.log("1. Search by mint address (JUP)...");
  const jupResults = await searchTokens(JUP);
  console.log(`  Found ${jupResults.length} result(s)`);
  if (jupResults.length > 0) displayToken(jupResults[0]);

  // 2. Search by symbol (fuzzy, multiple results)
  console.log("\n2. Search by symbol 'SOL'...");
  const solResults = await searchTokens("SOL");
  console.log(`  Found ${solResults.length} result(s) (showing top 3)`);
  solResults.slice(0, 3).forEach(displayToken);

  // 3. Search multiple mints (comma-separated)
  console.log("\n3. Search multiple mints (SOL, USDC)...");
  const multiResults = await searchTokens(`${SOL},${USDC}`);
  console.log(`  Found ${multiResults.length} result(s)`);
  multiResults.forEach(displayToken);

  // 4. Search for non-existent token
  console.log("\n4. Search for non-existent token...");
  const emptyResults = await searchTokens("thismintdoesnotexist999999");
  console.log(`  Found ${emptyResults.length} result(s) — ${emptyResults.length === 0 ? "empty array as expected" : "unexpected"}`);

  // --- Tags ---

  // 5. Get verified tokens
  console.log("\n5. Get all verified tokens...");
  const verified = await getTokensByTag("verified");
  console.log(`  Total verified tokens: ${verified.length}`);
  verified.slice(0, 3).forEach(displayToken);

  // 6. Get LSTs
  console.log("\n6. Get all LSTs (Liquid Staking Tokens)...");
  const lsts = await getTokensByTag("lst");
  console.log(`  Total LSTs: ${lsts.length}`);
  lsts.slice(0, 3).forEach(displayToken);

  // --- Trending ---

  // 7. Top trending tokens (1h)
  console.log("\n7. Top trending tokens (1h, limit 5)...");
  const trending = await getTrendingTokens("toptrending", "1h", 5);
  console.log(`  Found ${trending.length} token(s)`);
  trending.forEach(displayToken);

  // 8. Top traded tokens (24h)
  console.log("\n8. Top traded tokens (24h, limit 5)...");
  const traded = await getTrendingTokens("toptraded", "24h", 5);
  console.log(`  Found ${traded.length} token(s)`);
  traded.forEach(displayToken);

  // 9. Top organic score (6h)
  console.log("\n9. Top organic score (6h, limit 5)...");
  const organic = await getTrendingTokens("toporganicscore", "6h", 5);
  console.log(`  Found ${organic.length} token(s)`);
  organic.forEach(displayToken);

  // --- Recent ---

  // 10. Recently listed tokens
  console.log("\n10. Recently listed tokens...");
  const recent = await getRecentTokens();
  console.log(`  Found ${recent.length} token(s) (showing first 5)`);
  recent.slice(0, 5).forEach((token) => {
    displayToken(token);
    if (token.firstPool) {
      console.log(`    First pool: ${token.firstPool.createdAt}`);
    }
  });

  // --- Safety ---

  // 11. Evaluate a safe token (JUP)
  console.log("\n11. Safety evaluation: JUP...");
  const jupToken = jupResults[0];
  const jupSafety = evaluateSafety(jupToken);
  console.log(`  ${jupToken.name}: ${jupSafety.safe ? "SAFE" : "RISKY"}`);
  if (jupSafety.warnings.length > 0) {
    jupSafety.warnings.forEach((w) => console.log(`    - ${w}`));
  }

  // 12. Evaluate a suspicious token
  console.log("\n12. Safety evaluation: suspicious token...");
  const susResults = await searchTokens(SUS_TOKEN);
  if (susResults.length > 0) {
    const susToken = susResults[0];
    const susSafety = evaluateSafety(susToken);
    console.log(`  ${susToken.name} (${susToken.symbol}): ${susSafety.safe ? "SAFE" : "RISKY"}`);
    susSafety.warnings.forEach((w) => console.log(`    - ${w}`));
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
