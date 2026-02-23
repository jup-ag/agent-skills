import { createJupiterClient } from "./utils/client";
import { confirmOrThrow } from "./utils/confirm";
import { mapJupiterError } from "./utils/errors";
import { createIntentContext, buildIntentHeaders } from "./utils/intent";
import { withRetry } from "./utils/retry";
import { parseUiAmountToAtomic, mustPositiveAtomic } from "./utils/amounts";
import { loadWalletContext } from "./utils/wallet";
import { signTransaction, sendSignedTransaction } from "./utils/tx-lifecycle";

type PredictionCreateOrderResponse = {
  transaction?: string;
  tx?: string;
  orderId?: string;
};

type PredictionOrderStatus = {
  status?: string;
  orderPubkey?: string;
  [key: string]: unknown;
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const { connection, payer } = loadWalletContext();
  const client = createJupiterClient();
  const intent = createIntentContext();

  const stakeAtomic = mustPositiveAtomic(parseUiAmountToAtomic(args.stake, args.stakeDecimals), "stake");

  try {
    // TODO: Replace payload with exact market/account schema for your target prediction program.
    const created = await withRetry(() =>
      client.request<PredictionCreateOrderResponse>("/prediction/v1/orders", {
        method: "POST",
        headers: buildIntentHeaders(intent, { feature: "prediction-create-order" }),
        body: JSON.stringify({
          owner: payer.publicKey.toBase58(),
          marketId: args.marketId,
          side: args.side,
          stake: stakeAtomic.toString(),
        }),
      }),
    );

    const txBase64 = created.transaction ?? created.tx;
    if (!txBase64) throw new Error("Prediction create response missing transaction");

    await confirmOrThrow({
      yes: args.yes,
      message: `Create prediction order market=${args.marketId}, side=${args.side}, stake=${args.stake}.`,
    });

    const signed = signTransaction(txBase64, payer);
    const signature = await sendSignedTransaction(connection, signed.serializedBase64);
    const status = await pollPredictionOrderStatus(client, created.orderId);

    console.log(
      JSON.stringify(
        {
          intentId: intent.intentId,
          orderId: created.orderId,
          signature,
          status,
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

async function pollPredictionOrderStatus(
  client: ReturnType<typeof createJupiterClient>,
  orderId?: string,
): Promise<PredictionOrderStatus | null> {
  if (!orderId) return null;

  return withRetry(() =>
    client.request<PredictionOrderStatus>(`/prediction/v1/orders/status/${encodeURIComponent(orderId)}`, {
      method: "GET",
    }),
  );
}

type Args = {
  marketId: string;
  side: "yes" | "no";
  stake: string;
  stakeDecimals: number;
  yes: boolean;
};

function parseArgs(argv: string[]): Args {
  const get = (name: string): string | undefined => {
    const idx = argv.indexOf(`--${name}`);
    return idx >= 0 ? argv[idx + 1] : undefined;
  };

  const marketId = get("market-id");
  const sideRaw = get("side");
  const stake = get("stake");

  if (!marketId || !stake || (sideRaw !== "yes" && sideRaw !== "no")) {
    throw new Error(
      "Usage: tsx prediction-create-order.ts --market-id <id> --side <yes|no> --stake <uiAmount> [--stake-decimals 6] [--yes]",
    );
  }

  return {
    marketId,
    side: sideRaw,
    stake,
    stakeDecimals: Number(get("stake-decimals") ?? "6"),
    yes: argv.includes("--yes"),
  };
}

void main();
