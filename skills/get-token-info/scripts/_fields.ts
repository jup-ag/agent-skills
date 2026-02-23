import "dotenv/config";
const API_KEY = process.env.JUPITER_API_KEY;
const BASE_URL = "https://api.jup.ag";

async function fetchToken(query: string) {
  const r = await fetch(`${BASE_URL}/tokens/v2/search?query=${encodeURIComponent(query)}`, {
    headers: { "x-api-key": API_KEY! },
  });
  return (await r.json())[0];
}

async function main() {
  // Get diverse tokens to see all conditional fields
  const jup = await fetchToken("JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN");
  const sol = await fetchToken("So11111111111111111111111111111111111111112");
  const usdc = await fetchToken("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
  const sus = await fetchToken("8JPzfwto4Pu1WwiHKSVHHNe57dh5RHqLYLQra9vpaKsW");

  // Print full JSON for each
  console.log("=== JUP (full) ===");
  console.log(JSON.stringify(jup, null, 2));
  console.log("\n=== SOL (full) ===");
  console.log(JSON.stringify(sol, null, 2));
  console.log("\n=== USDC (full) ===");
  console.log(JSON.stringify(usdc, null, 2));
  console.log("\n=== SUS (full) ===");
  console.log(JSON.stringify(sus, null, 2));

  // Collect all unique keys across all tokens
  const allKeys = new Set<string>();
  for (const token of [jup, sol, usdc, sus]) {
    for (const key of Object.keys(token)) allKeys.add(key);
  }
  console.log("\n=== ALL UNIQUE FIELDS ===");
  console.log(JSON.stringify([...allKeys].sort(), null, 2));
}
main();
