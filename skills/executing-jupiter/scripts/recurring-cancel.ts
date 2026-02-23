import { createJupiterClient } from "./utils/client";
import { confirmOrThrow } from "./utils/confirm";
import { mapJupiterError } from "./utils/errors";
import { createIntentContext, buildIntentHeaders } from "./utils/intent";
import { withRetry } from "./utils/retry";
import { loadWalletContext } from "./utils/wallet";
import { signTransaction } from "./utils/tx-lifecycle";

type RecurringCancelResponse = {
  transaction?: string;
  tx?: string;
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const { payer } = loadWalletContext();
  const client = createJupiterClient();
  const intent = createIntentContext();

  try {
    const canceled = await withRetry(() =>
      client.request<RecurringCancelResponse>("/recurring/v1/cancelOrder", {
        method: "POST",
        headers: buildIntentHeaders(intent, { feature: "recurring-cancel" }),
        body: JSON.stringify({
          owner: payer.publicKey.toBase58(),
          recurringOrderId: args.recurringOrderId,
        }),
      }),
    );

    const txBase64 = canceled.transaction ?? canceled.tx;
    if (!txBase64) throw new Error("Recurring cancel response missing transaction");

    await confirmOrThrow({
      yes: args.yes,
      message: `Cancel recurring order ${args.recurringOrderId}.`,
    });

    const signed = signTransaction(txBase64, payer);

    const submitted = await withRetry(() =>
      client.request<Record<string, unknown>>("/recurring/v1/execute", {
        method: "POST",
        headers: buildIntentHeaders(intent, { feature: "recurring-cancel" }),
        body: JSON.stringify({
          signedTransaction: signed.serializedBase64,
          recurringOrderId: args.recurringOrderId,
        }),
      }),
    );

    console.log(JSON.stringify({ intentId: intent.intentId, recurringOrderId: args.recurringOrderId, submitted }, null, 2));
  } catch (error) {
    console.error(JSON.stringify(mapJupiterError(error), null, 2));
    process.exitCode = 1;
  }
}

function parseArgs(argv: string[]): { recurringOrderId: string; yes: boolean } {
  const idx = argv.indexOf("--recurring-order-id");
  const recurringOrderId = idx >= 0 ? argv[idx + 1] : undefined;
  if (!recurringOrderId) {
    throw new Error("Usage: tsx recurring-cancel.ts --recurring-order-id <id> [--yes]");
  }

  return {
    recurringOrderId,
    yes: argv.includes("--yes"),
  };
}

void main();
