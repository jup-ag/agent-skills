import { createJupiterClient } from "./utils/client";
import { confirmOrThrow } from "./utils/confirm";
import { mapJupiterError } from "./utils/errors";
import { createIntentContext, buildIntentHeaders } from "./utils/intent";
import { withRetry } from "./utils/retry";
import { parseUiAmountToAtomic, mustPositiveAtomic } from "./utils/amounts";
import { loadWalletContext } from "./utils/wallet";
import { signTransaction } from "./utils/tx-lifecycle";

type UltraOrderResponse = {
  transaction?: string;
  swapTransaction?: string;
  requestId?: string;
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const { payer } = loadWalletContext();
  const client = createJupiterClient();
  const intent = createIntentContext();

  const atomicAmount = mustPositiveAtomic(
    parseUiAmountToAtomic(args.amount, args.inputDecimals),
    "amount",
  );

  try {
    const order = await withRetry(() =>
      client.request<UltraOrderResponse>(
        `/ultra/v1/order?inputMint=${args.inputMint}&outputMint=${args.outputMint}&amount=${atomicAmount.toString()}&taker=${payer.publicKey.toBase58()}&slippageBps=${args.slippageBps}`,
        {
          method: "GET",
          headers: buildIntentHeaders(intent, { feature: "ultra-swap" }),
        },
      ),
    );

    const txBase64 = order.transaction ?? order.swapTransaction;
    if (!txBase64) {
      throw new Error("Order response missing transaction payload");
    }

    await confirmOrThrow({
      yes: args.yes,
      message: `Swap ${args.amount} (atomic ${atomicAmount}) from ${args.inputMint} to ${args.outputMint}.`,
    });

    const signed = signTransaction(txBase64, payer);

    // TODO: Verify exact execute endpoint payload shape for your API plan/version.
    const execution = await withRetry(() =>
      client.request<Record<string, unknown>>("/ultra/v1/execute", {
        method: "POST",
        headers: buildIntentHeaders(intent, { feature: "ultra-swap" }),
        body: JSON.stringify({
          signedTransaction: signed.serializedBase64,
          requestId: order.requestId,
        }),
      }),
    );

    console.log(JSON.stringify({ intentId: intent.intentId, execution }, null, 2));
  } catch (error) {
    const mapped = mapJupiterError(error);
    console.error(JSON.stringify(mapped, null, 2));
    process.exitCode = 1;
  }
}

type Args = {
  inputMint: string;
  outputMint: string;
  amount: string;
  inputDecimals: number;
  slippageBps: number;
  yes: boolean;
};

function parseArgs(argv: string[]): Args {
  const get = (name: string): string | undefined => {
    const idx = argv.indexOf(`--${name}`);
    return idx >= 0 ? argv[idx + 1] : undefined;
  };

  const inputMint = get("input-mint");
  const outputMint = get("output-mint");
  const amount = get("amount");

  if (!inputMint || !outputMint || !amount) {
    throw new Error(
      "Usage: tsx ultra-swap.ts --input-mint <mint> --output-mint <mint> --amount <uiAmount> [--input-decimals 6] [--slippage-bps 100] [--yes]",
    );
  }

  return {
    inputMint,
    outputMint,
    amount,
    inputDecimals: Number(get("input-decimals") ?? "6"),
    slippageBps: Number(get("slippage-bps") ?? "100"),
    yes: argv.includes("--yes"),
  };
}

void main();
