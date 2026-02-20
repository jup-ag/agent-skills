#!/usr/bin/env tsx
/**
 * Usage:
 *   pnpm wallet-sign -t "BASE64_TX" --wallet ~/.config/solana/id.json
 *
 * SECURITY: Private keys must be in wallet files, not CLI args.
 */

import { Command } from "commander";
import { Keypair, VersionedTransaction } from "@solana/web3.js";
import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { fail, handleCliError } from "./utils.js";

interface SignOptions {
  unsignedTx: string;
  wallet: string;
}

function loadKeypair(filePath: string): Keypair {
  const expanded = filePath.startsWith("~") ? join(homedir(), filePath.slice(1)) : filePath;

  if (!existsSync(expanded)) {
    throw new Error(`Wallet file not found: ${expanded}`);
  }

  try {
    const secretKey = JSON.parse(readFileSync(expanded, "utf-8"));
    if (!Array.isArray(secretKey) || secretKey.length !== 64) {
      throw new Error("Invalid wallet format. Expected JSON array of 64 bytes (Solana CLI format)");
    }
    return Keypair.fromSecretKey(Uint8Array.from(secretKey));
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error(`Invalid JSON in wallet file: ${expanded}`);
    throw error;
  }
}

async function signTransaction(options: SignOptions): Promise<void> {
  let keypair: Keypair;
  try {
    keypair = loadKeypair(options.wallet);
  } catch (error) {
    fail(error instanceof Error ? error.message : "Failed to load keypair");
  }

  let transaction: VersionedTransaction;
  try {
    transaction = VersionedTransaction.deserialize(Buffer.from(options.unsignedTx, "base64"));
  } catch {
    fail("Failed to deserialize transaction", [
      "Ensure the transaction is a valid base64-encoded VersionedTransaction.",
    ]);
  }

  const staticKeys = transaction.message.staticAccountKeys.map((k) => k.toBase58());
  const feePayer = staticKeys[0];
  const programIds = transaction.message.compiledInstructions.map((ix) => staticKeys[ix.programIdIndex]);

  // Warn early if the wallet doesn't match the fee payer — the tx will fail on-chain otherwise
  const signerPubkey = keypair.publicKey.toBase58();
  if (feePayer && signerPubkey !== feePayer) {
    console.error(`\n⚠ WARNING: Wallet pubkey (${signerPubkey}) does not match fee payer (${feePayer}).`);
    console.error("  The signed transaction will likely fail on-chain.\n");
  }

  try {
    transaction.sign([keypair]);
  } catch (error) {
    fail("Failed to sign transaction", error instanceof Error ? [error.message] : []);
  }

  console.log(Buffer.from(transaction.serialize()).toString("base64"));

  console.error(`\nSigned by: ${signerPubkey}`);
  console.error(`Fee payer: ${feePayer}`);
  console.error(`Programs: ${[...new Set(programIds)].join(", ")}`);
}

const program = new Command();
program.exitOverride();

program
  .name("wallet-sign")
  .description("Sign Solana transactions using a local wallet file")
  .requiredOption("-t, --unsigned-tx <base64>", "Base64-encoded unsigned transaction")
  .requiredOption("-w, --wallet <path>", "Path to Solana CLI JSON wallet file (supports ~)")
  .action(signTransaction);

program.parseAsync(process.argv).catch(handleCliError);
