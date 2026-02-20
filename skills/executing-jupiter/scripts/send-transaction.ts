#!/usr/bin/env tsx
/**
 * Usage: pnpm send-transaction -t "SIGNED_TX" [--rpc-url "https://your-rpc.com"]
 */

import { Command } from "commander";
import { Connection, VersionedTransaction, SendTransactionError } from "@solana/web3.js";
import { CliError, TIMEOUT_DEFAULTS, fail, handleCliError } from "./utils.js";

const { CONFIRMATION_TIMEOUT_MS, STATUS_POLL_INTERVAL_MS } = TIMEOUT_DEFAULTS;

interface SendOptions {
  signedTx: string;
  rpcUrl?: string;
}

function getRpcUrl(providedUrl?: string): string {
  if (providedUrl) return providedUrl;
  if (process.env.SOLANA_RPC_URL) return process.env.SOLANA_RPC_URL;
  fail("RPC URL is required.", ["Provide --rpc-url or set SOLANA_RPC_URL."]);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendAndConfirm(
  connection: Connection,
  transaction: VersionedTransaction,
  signature: string,
): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < CONFIRMATION_TIMEOUT_MS) {
    const statuses = await connection.getSignatureStatuses([signature]);
    const status = statuses.value[0];

    if (status?.err) {
      fail("Transaction failed on-chain", [JSON.stringify(status.err, null, 2)]);
    }

    if (status && (status.confirmationStatus === "confirmed" || status.confirmationStatus === "finalized")) {
      return;
    }

    const { value: isValid } = await connection.isBlockhashValid(
      transaction.message.recentBlockhash,
      { commitment: "confirmed" },
    );

    if (!isValid) {
      fail("Blockhash expired before confirmation.", ["Request a fresh transaction and try again."]);
    }

    await sleep(STATUS_POLL_INTERVAL_MS);
  }

  fail("Timed out waiting for confirmation", [
    `Waited ${Math.ceil(CONFIRMATION_TIMEOUT_MS / 1000)}s for ${signature}.`,
  ]);
}

async function sendTransaction(options: SendOptions): Promise<void> {
  const rpcUrl = getRpcUrl(options.rpcUrl);
  console.error(`Using RPC: ${rpcUrl}`);

  let transaction: VersionedTransaction;
  try {
    transaction = VersionedTransaction.deserialize(Buffer.from(options.signedTx, "base64"));
  } catch {
    fail("Failed to deserialize transaction", [
      "Ensure the transaction is a valid base64-encoded signed VersionedTransaction.",
    ]);
  }

  // Reject unsigned transactions — all-zero signatures are placeholders, not real signatures
  const feePayerSig = transaction.signatures[0];
  if (!feePayerSig || !feePayerSig.some((b) => b !== 0)) {
    fail("Transaction has no signatures", [
      "Sign the transaction first using: pnpm wallet-sign --unsigned-tx ...",
    ]);
  }

  const connection = new Connection(rpcUrl, "confirmed");

  try {
    console.error("Sending transaction...");
    const signature = await connection.sendTransaction(transaction, {
      skipPreflight: false,
      maxRetries: 0,
      preflightCommitment: "confirmed",
    });

    console.error("Waiting for confirmation...");
    await sendAndConfirm(connection, transaction, signature);

    console.log(signature);
    console.error(`\nTransaction confirmed!`);
    console.error(`Signature: ${signature}`);
    console.error(`Explorer: https://solscan.io/tx/${signature}`);
  } catch (error) {
    if (error instanceof CliError) throw error;
    if (error instanceof SendTransactionError) {
      const details = [`Message: ${error.message}`];
      if (error.logs?.length) {
        details.push("Transaction logs:");
        for (const log of error.logs) details.push(`  ${log}`);
      }
      fail("Failed to send transaction", details);
    }
    if (error instanceof Error) {
      const details: string[] = [];
      if (error.message.includes("blockhash")) {
        details.push("The transaction's blockhash may have expired. Request a fresh transaction.");
      } else if (error.message.includes("insufficient")) {
        details.push("The wallet may have insufficient SOL for fees.");
      } else if (error.message.includes("429") || error.message.includes("rate")) {
        details.push("RPC rate limited. Try a different RPC endpoint with --rpc-url.");
      }
      fail(error.message, details);
    }
    fail("Unknown error occurred");
  }
}

const program = new Command();
program.exitOverride();

program
  .name("send-transaction")
  .description("Send signed transactions to Solana RPC")
  .requiredOption("-t, --signed-tx <base64>", "Base64-encoded signed transaction")
  .option("-r, --rpc-url <url>", "RPC endpoint URL (or set SOLANA_RPC_URL)")
  .action(sendTransaction);

program.parseAsync(process.argv).catch(handleCliError);
