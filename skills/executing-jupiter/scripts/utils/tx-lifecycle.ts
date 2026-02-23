import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";

export function deserializeTransaction(base64Tx: string): VersionedTransaction {
  const raw = Buffer.from(base64Tx, "base64");
  return VersionedTransaction.deserialize(raw);
}

export function signTransaction(base64Tx: string, signer: Keypair): {
  transaction: VersionedTransaction;
  serializedBase64: string;
} {
  const transaction = deserializeTransaction(base64Tx);
  transaction.sign([signer]);

  if (!isSigned(transaction)) {
    throw new Error("Transaction is not fully signed after signing step");
  }

  return {
    transaction,
    serializedBase64: Buffer.from(transaction.serialize()).toString("base64"),
  };
}

export function serializeTransaction(transaction: VersionedTransaction): string {
  return Buffer.from(transaction.serialize()).toString("base64");
}

export async function sendSignedTransaction(
  connection: Connection,
  signedBase64Transaction: string,
): Promise<string> {
  const raw = Buffer.from(signedBase64Transaction, "base64");
  return connection.sendRawTransaction(raw, {
    maxRetries: 3,
    skipPreflight: false,
  });
}

export function isSigned(transaction: VersionedTransaction): boolean {
  return transaction.signatures.length > 0 && transaction.signatures.every((sig) => !isZeroed(sig));
}

function isZeroed(sig: Uint8Array): boolean {
  for (const value of sig) {
    if (value !== 0) return false;
  }
  return true;
}
