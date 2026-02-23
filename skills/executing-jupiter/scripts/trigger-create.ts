import { createJupiterClient } from "./utils/client";
import { confirmOrThrow } from "./utils/confirm";
import { mapJupiterError } from "./utils/errors";
import { createIntentContext, buildIntentHeaders } from "./utils/intent";
import { withRetry } from "./utils/retry";
import { parseUiAmountToAtomic, mustPositiveAtomic } from "./utils/amounts";
import { loadWalletContext } from "./utils/wallet";
import { signTransaction } from "./utils/tx-lifecycle";

type TriggerCreateResponse = {
  transaction?: string;
  tx?: string;
  orderId?: string;
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const { payer } = loadWalletContext();
  const client = createJupiterClient();
  const intent = createIntentContext();

  const makingAmount = mustPositiveAtomic(
    parseUiAmountToAtomic(args.makingAmount, args.makingDecimals),
    "makingAmount",
  );

  try {
    // TODO: Confirm exact trigger create payload for your integration mode.
    const created = await withRetry(() =>
      client.request<TriggerCreateResponse>("/trigger/v1/createOrder", {
        method: "POST",
        headers: buildIntentHeaders(intent, { feature: "trigger-create" }),
        body: JSON.stringify({
          owner: payer.publicKey.toBase58(),
          inputMint: args.inputMint,
          outputMint: args.outputMint,
          makingAmount: makingAmount.toString(),
          triggerPrice: args.triggerPrice,
          // TODO: Add expiry/compute-unit params based on strategy.
        }),
      }),
    );

    const txBase64 = created.transaction ?? created.tx;
    if (!txBase64) throw new Error("Trigger create response missing transaction");

    await confirmOrThrow({
      yes: args.yes,
      message: `Create trigger order for ${args.inputMint} -> ${args.outputMint}, amount ${args.makingAmount}.`,
    });

    const signed = signTransaction(txBase64, payer);

    // TODO: Depending on API version you may submit on-chain directly instead of this endpoint.
    const submitted = await withRetry(() =>
      client.request<Record<string, unknown>>("/trigger/v1/execute", {
        method: "POST",
        headers: buildIntentHeaders(intent, { feature: "trigger-create" }),
        body: JSON.stringify({ signedTransaction: signed.serializedBase64, orderId: created.orderId }),
      }),
    );

    console.log(JSON.stringify({ intentId: intent.intentId, orderId: created.orderId, submitted }, null, 2));
  } catch (error) {
    console.error(JSON.stringify(mapJupiterError(error), null, 2));
    process.exitCode = 1;
  }
}

type Args = {
  inputMint: string;
  outputMint: string;
  makingAmount: string;
  makingDecimals: number;
  triggerPrice: string;
  yes: boolean;
};

function parseArgs(argv: string[]): Args {
  const get = (name: string): string | undefined => {
    const idx = argv.indexOf(`--${name}`);
    return idx >= 0 ? argv[idx + 1] : undefined;
  };

  const inputMint = get("input-mint");
  const outputMint = get("output-mint");
  const makingAmount = get("making-amount");
  const triggerPrice = get("trigger-price");

  if (!inputMint || !outputMint || !makingAmount || !triggerPrice) {
    throw new Error(
      "Usage: tsx trigger-create.ts --input-mint <mint> --output-mint <mint> --making-amount <uiAmount> --trigger-price <price> [--making-decimals 6] [--yes]",
    );
  }

  return {
    inputMint,
    outputMint,
    makingAmount,
    makingDecimals: Number(get("making-decimals") ?? "6"),
    triggerPrice,
    yes: argv.includes("--yes"),
  };
}

void main();
