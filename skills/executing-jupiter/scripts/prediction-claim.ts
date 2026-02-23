import { createJupiterClient } from "./utils/client";
import { confirmOrThrow } from "./utils/confirm";
import { mapJupiterError } from "./utils/errors";
import { createIntentContext, buildIntentHeaders } from "./utils/intent";
import { withRetry } from "./utils/retry";
import { loadWalletContext } from "./utils/wallet";
import { signTransaction, sendSignedTransaction } from "./utils/tx-lifecycle";

type PredictionClaimResponse = {
  transaction?: string;
  tx?: string;
};

type PredictionPositionsResponse = {
  positions?: Array<{
    pubkey?: string;
    claimable?: boolean;
  }>;
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const { connection, payer } = loadWalletContext();
  const client = createJupiterClient();
  const intent = createIntentContext();

  try {
    const positions = await withRetry(() =>
      client.request<PredictionPositionsResponse>("/prediction/v1/positions", {
        method: "GET",
        headers: buildIntentHeaders(intent, { feature: "prediction-claim" }),
      }),
    );

    const position = positions.positions?.find((item) => item.pubkey === args.positionPubkey);
    if (!position) {
      throw new Error(`Position not found: ${args.positionPubkey}`);
    }
    if (!position.claimable) {
      throw new Error(`Position is not claimable yet: ${args.positionPubkey}`);
    }

    await confirmOrThrow({
      yes: args.yes,
      message: `Claim prediction market rewards for position ${args.positionPubkey}.`,
    });

    const claim = await withRetry(() =>
      client.request<PredictionClaimResponse>(
        `/prediction/v1/positions/${encodeURIComponent(args.positionPubkey)}/claim`,
        {
          method: "POST",
          headers: buildIntentHeaders(intent, { feature: "prediction-claim" }),
          body: JSON.stringify({
            owner: payer.publicKey.toBase58(),
            // TODO: Add proof/index fields if your claim flow requires them.
          }),
        },
      ),
    );

    const txBase64 = claim.transaction ?? claim.tx;
    if (!txBase64) throw new Error("Prediction claim response missing transaction");

    const signed = signTransaction(txBase64, payer);
    const signature = await sendSignedTransaction(connection, signed.serializedBase64);
    console.log(JSON.stringify({ intentId: intent.intentId, positionPubkey: args.positionPubkey, signature }, null, 2));
  } catch (error) {
    console.error(JSON.stringify(mapJupiterError(error), null, 2));
    process.exitCode = 1;
  }
}

function parseArgs(argv: string[]): { positionPubkey: string; yes: boolean } {
  const idx = argv.indexOf("--position-pubkey");
  const positionPubkey = idx >= 0 ? argv[idx + 1] : undefined;

  if (!positionPubkey) {
    throw new Error("Usage: tsx prediction-claim.ts --position-pubkey <pubkey> [--yes]");
  }

  return {
    positionPubkey,
    yes: argv.includes("--yes"),
  };
}

void main();
