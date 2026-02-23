import { Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";

export type WalletContext = {
  connection: Connection;
  payer: Keypair;
};

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    if (name === "PRIVATE_KEY") {
      throw new Error(
        "Missing required env var: PRIVATE_KEY. See skills/executing-jupiter/resources/wallet-setup.md",
      );
    }
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function loadKeypairFromEnv(envName = "PRIVATE_KEY"): Keypair {
  const raw = requireEnv(envName).trim();

  // Supports JSON byte array or base58 string.
  if (raw.startsWith("[")) {
    const bytes = Uint8Array.from(JSON.parse(raw) as number[]);
    return Keypair.fromSecretKey(bytes);
  }

  return Keypair.fromSecretKey(bs58.decode(raw));
}

export function loadWalletContext(): WalletContext {
  const rpcUrl = requireEnv("SOLANA_RPC_URL");
  const connection = new Connection(rpcUrl, "confirmed");
  const payer = loadKeypairFromEnv();
  return { connection, payer };
}
