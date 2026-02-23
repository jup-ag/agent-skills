import { createJupiterClient } from "./utils/client";
import { confirmOrThrow } from "./utils/confirm";
import { mapJupiterError } from "./utils/errors";
import { createIntentContext, buildIntentHeaders } from "./utils/intent";
import { withRetry } from "./utils/retry";
import { parseUiAmountToAtomic, mustPositiveAtomic } from "./utils/amounts";
import { loadWalletContext } from "./utils/wallet";
import { signTransaction } from "./utils/tx-lifecycle";

type RecurringCreateResponse = {
  transaction?: string;
  tx?: string;
  recurringOrderId?: string;
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const { payer } = loadWalletContext();
  const client = createJupiterClient();
  const intent = createIntentContext();

  const atomicAmount = mustPositiveAtomic(
    parseUiAmountToAtomic(args.amountPerCycle, args.inputDecimals),
    "amountPerCycle",
  );

  try {
    // TODO: Confirm the exact recurring create payload fields for your selected interval strategy.
    const created = await withRetry(() =>
      client.request<RecurringCreateResponse>("/recurring/v1/createOrder", {
        method: "POST",
        headers: buildIntentHeaders(intent, { feature: "recurring-create" }),
        body: JSON.stringify({
          owner: payer.publicKey.toBase58(),
          inputMint: args.inputMint,
          outputMint: args.outputMint,
          amountPerCycle: atomicAmount.toString(),
          interval: args.interval,
          totalOrders: args.totalOrders,
        }),
      }),
    );

    const txBase64 = created.transaction ?? created.tx;
    if (!txBase64) throw new Error("Recurring create response missing transaction");

    await confirmOrThrow({
      yes: args.yes,
      message: `Create recurring order ${args.interval} with amount ${args.amountPerCycle} ${args.inputMint}.`,
    });

    const signed = signTransaction(txBase64, payer);

    const submitted = await withRetry(() =>
      client.request<Record<string, unknown>>("/recurring/v1/execute", {
        method: "POST",
        headers: buildIntentHeaders(intent, { feature: "recurring-create" }),
        body: JSON.stringify({
          signedTransaction: signed.serializedBase64,
          recurringOrderId: created.recurringOrderId,
        }),
      }),
    );

    console.log(
      JSON.stringify(
        {
          intentId: intent.intentId,
          recurringOrderId: created.recurringOrderId,
          submitted,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    console.error(JSON.stringify(mapJupiterError(error), null, 2));
    process.exitCode = 1;
  }
}

type Args = {
  inputMint: string;
  outputMint: string;
  amountPerCycle: string;
  inputDecimals: number;
  interval: string;
  totalOrders: number;
  yes: boolean;
};

function parseArgs(argv: string[]): Args {
  const get = (name: string): string | undefined => {
    const idx = argv.indexOf(`--${name}`);
    return idx >= 0 ? argv[idx + 1] : undefined;
  };

  const inputMint = get("input-mint");
  const outputMint = get("output-mint");
  const amountPerCycle = get("amount-per-cycle");
  const interval = get("interval");

  if (!inputMint || !outputMint || !amountPerCycle || !interval) {
    throw new Error(
      "Usage: tsx recurring-create.ts --input-mint <mint> --output-mint <mint> --amount-per-cycle <uiAmount> --interval <cron|label> [--input-decimals 6] [--total-orders 10] [--yes]",
    );
  }

  return {
    inputMint,
    outputMint,
    amountPerCycle,
    inputDecimals: Number(get("input-decimals") ?? "6"),
    interval,
    totalOrders: Number(get("total-orders") ?? "10"),
    yes: argv.includes("--yes"),
  };
}

void main();
