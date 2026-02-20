#!/usr/bin/env tsx
/**
 * send-transaction.ts - Send signed transactions to Solana RPC
 *
 * Usage:
 *   pnpm send-transaction --signed-tx "BASE64_SIGNED_TX"
 *   pnpm send-transaction --signed-tx "BASE64_SIGNED_TX" --rpc-url "https://your-rpc.com"
 *
 * This script:
 *   1. Takes a signed transaction (base64)
 *   2. Sends it once to the specified RPC endpoint
 *   3. Monitors blockhash validity and confirmation status
 *   4. Returns the transaction signature
 *
 * Use this for Metis swaps or any transaction that needs manual RPC submission.
 * For Ultra swaps, use execute-ultra.ts instead (Jupiter handles RPC internally).
 */

import { Command } from "commander";
import { Connection, VersionedTransaction, SendTransactionError } from "@solana/web3.js";
import { CliError, fail, handleCliError } from "./utils.js";

interface SendOptions {
  signedTx: string;
  rpcUrl?: string;
}

// Solana blockhashes valid ~60s; this is a safety ceiling (blockhash expiry is the primary exit)
const CONFIRMATION_TIMEOUT_MS = 60_000;
const STATUS_POLL_INTERVAL_MS = 2_000;
function getRpcUrl(providedUrl?: string): string {
  if (providedUrl) return providedUrl;
  if (process.env.SOLANA_RPC_URL) return process.env.SOLANA_RPC_URL;
  fail("RPC URL is required.", [
    "Provide --rpc-url or set SOLANA_RPC_URL in your environment.",
  ]);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isSigned(transaction: VersionedTransaction): boolean {
  const feePayerSig = transaction.signatures[0];
  if (!feePayerSig) return false;
  // Treat signatures as present only when at least one byte is non-zero.
  // This rejects placeholder signatures that are allocated but all 64 bytes are 0.
  return feePayerSig.some((b) => b !== 0);
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

    // Check blockhash validity — if expired, the tx can never land
    const { value: isValid } = await connection.isBlockhashValid(
      transaction.message.recentBlockhash,
      { commitment: "confirmed" },
    );

    if (!isValid) {
      fail("Transaction blockhash expired before confirmation.", [
        "The network moved past this transaction's blockhash window.",
        "Request a fresh transaction and try again.",
      ]);
    }

    await sleep(STATUS_POLL_INTERVAL_MS);
  }

  fail("Timed out waiting for transaction confirmation", [
    `Waited ${Math.ceil(CONFIRMATION_TIMEOUT_MS / 1000)} seconds for signature ${signature}.`,
    "Check explorer status and retry if needed.",
  ]);
}

async function sendTransaction(options: SendOptions): Promise<void> {
  const rpcUrl = getRpcUrl(options.rpcUrl);
  console.error(`Using RPC: ${rpcUrl}`);

  // Deserialize the transaction
  let transaction: VersionedTransaction;
  try {
    const txBuffer = Buffer.from(options.signedTx, "base64");
    transaction = VersionedTransaction.deserialize(txBuffer);
  } catch (error) {
    fail("Failed to deserialize transaction", [
      "Ensure the transaction is a valid base64-encoded signed VersionedTransaction.",
    ]);
  }

  // Check if transaction is actually signed (not just zero-filled)
  if (!isSigned(transaction)) {
    fail("Transaction has no signatures", [
      "Sign the transaction first using: pnpm wallet-sign --unsigned-tx ...",
    ]);
  }

  const connection = new Connection(rpcUrl, "confirmed");

  // First send with preflight to validate the transaction
  try {
    console.error("Sending transaction...");

    const signature = await connection.sendTransaction(transaction, {
      skipPreflight: false,
      maxRetries: 0,
      preflightCommitment: "confirmed",
    });

    console.error("Transaction sent, waiting for confirmation...");

    await sendAndConfirm(connection, transaction, signature);

    // Output signature to stdout
    console.log(signature);

    console.error(`\nTransaction confirmed!`);
    console.error(`Signature: ${signature}`);
    console.error(`Explorer: https://solscan.io/tx/${signature}`);
  } catch (error) {
    if (error instanceof CliError) {
      throw error;
    }
    if (error instanceof SendTransactionError) {
      const details = [`Message: ${error.message}`];

      const logs = error.logs;
      if (logs && logs.length > 0) {
        details.push("Transaction logs:");
        for (const log of logs) {
          details.push(`  ${log}`);
        }
      }
      fail("Failed to send transaction", details);
    } else if (error instanceof Error) {
      const details: string[] = [];

      if (error.message.includes("blockhash")) {
        details.push("Hint: The transaction's blockhash may have expired.");
        details.push("Request a fresh transaction and try again.");
      } else if (error.message.includes("insufficient")) {
        details.push("Hint: The wallet may have insufficient SOL for fees.");
      } else if (error.message.includes("429") || error.message.includes("rate")) {
        details.push("Hint: RPC rate limited. Try a different RPC endpoint.");
        details.push("You can specify one with: --rpc-url <url>.");
      }
      fail(error.message, details);
    } else {
      fail("Unknown error occurred");
    }
  }
}

// CLI setup
const program = new Command();
program.exitOverride();

program
  .name("send-transaction")
  .description("Send signed transactions to Solana RPC")
  .requiredOption("-t, --signed-tx <base64>", "Base64-encoded signed transaction")
  .option(
    "-r, --rpc-url <url>",
    "RPC endpoint URL (required unless SOLANA_RPC_URL is set)"
  )
  .action(sendTransaction);

program.parseAsync(process.argv).catch(handleCliError);
