import { createJupiterClient } from "./utils/client";
import { mapJupiterError } from "./utils/errors";
import { createIntentContext, buildIntentHeaders } from "./utils/intent";
import { withRetry } from "./utils/retry";

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const client = createJupiterClient();
  const intent = createIntentContext();

  try {
    // TODO: Adjust endpoint query fields (category/status/limit) for your product surface.
    const markets = await withRetry(() =>
      client.request<Record<string, unknown>>(`/prediction/v1/markets?status=${args.status}&limit=${args.limit}`, {
        method: "GET",
        headers: buildIntentHeaders(intent, { feature: "prediction-list" }),
      }),
    );

    console.log(JSON.stringify({ intentId: intent.intentId, ...markets }, null, 2));
  } catch (error) {
    console.error(JSON.stringify(mapJupiterError(error), null, 2));
    process.exitCode = 1;
  }
}

function parseArgs(argv: string[]): { status: string; limit: number } {
  const get = (name: string): string | undefined => {
    const idx = argv.indexOf(`--${name}`);
    return idx >= 0 ? argv[idx + 1] : undefined;
  };

  return {
    status: get("status") ?? "active",
    limit: Number(get("limit") ?? "20"),
  };
}

void main();
