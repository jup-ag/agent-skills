import { createJupiterClient } from "./utils/client";
import { mapJupiterError } from "./utils/errors";
import { createIntentContext, buildIntentHeaders } from "./utils/intent";
import { withRetry } from "./utils/retry";
import { loadWalletContext } from "./utils/wallet";

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const { payer } = loadWalletContext();
  const client = createJupiterClient();
  const intent = createIntentContext();

  try {
    const response = await withRetry(() =>
      client.request<Record<string, unknown>>(
        `/trigger/v1/getTriggerOrders?owner=${payer.publicKey.toBase58()}&activeOnly=${String(args.activeOnly)}`,
        {
          method: "GET",
          headers: buildIntentHeaders(intent, { feature: "trigger-list" }),
        },
      ),
    );

    console.log(JSON.stringify({ intentId: intent.intentId, ...response }, null, 2));
  } catch (error) {
    console.error(JSON.stringify(mapJupiterError(error), null, 2));
    process.exitCode = 1;
  }
}

function parseArgs(argv: string[]): { activeOnly: boolean } {
  return {
    activeOnly: !argv.includes("--all"),
  };
}

void main();
