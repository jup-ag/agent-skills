import { createJupiterClient } from "./utils/client";
import { confirmOrThrow } from "./utils/confirm";
import { mapJupiterError } from "./utils/errors";
import { createIntentContext, buildIntentHeaders } from "./utils/intent";
import { withRetry } from "./utils/retry";
import { loadWalletContext } from "./utils/wallet";
import { signTransaction } from "./utils/tx-lifecycle";

type TriggerCancelResponse = {
  transaction?: string;
  tx?: string;
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const { payer } = loadWalletContext();
  const client = createJupiterClient();
  const intent = createIntentContext();

  try {
    const cancel = await withRetry(() =>
      client.request<TriggerCancelResponse>("/trigger/v1/cancelOrder", {
        method: "POST",
        headers: buildIntentHeaders(intent, { feature: "trigger-cancel" }),
        body: JSON.stringify({ owner: payer.publicKey.toBase58(), orderId: args.orderId }),
      }),
    );

    const txBase64 = cancel.transaction ?? cancel.tx;
    if (!txBase64) throw new Error("Trigger cancel response missing transaction");

    await confirmOrThrow({
      yes: args.yes,
      message: `Cancel trigger order ${args.orderId} for ${payer.publicKey.toBase58()}.`,
    });

    const signed = signTransaction(txBase64, payer);

    // TODO: Replace with direct RPC send if your stack does not provide a cancel execute endpoint.
    const submitted = await withRetry(() =>
      client.request<Record<string, unknown>>("/trigger/v1/execute", {
        method: "POST",
        headers: buildIntentHeaders(intent, { feature: "trigger-cancel" }),
        body: JSON.stringify({ signedTransaction: signed.serializedBase64, orderId: args.orderId }),
      }),
    );

    console.log(JSON.stringify({ intentId: intent.intentId, orderId: args.orderId, submitted }, null, 2));
  } catch (error) {
    console.error(JSON.stringify(mapJupiterError(error), null, 2));
    process.exitCode = 1;
  }
}

function parseArgs(argv: string[]): { orderId: string; yes: boolean } {
  const idx = argv.indexOf("--order-id");
  const orderId = idx >= 0 ? argv[idx + 1] : undefined;
  if (!orderId) {
    throw new Error("Usage: tsx trigger-cancel.ts --order-id <id> [--yes]");
  }

  return {
    orderId,
    yes: argv.includes("--yes"),
  };
}

void main();
