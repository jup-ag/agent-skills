# Lend: USDC Deposit Example

> **Prerequisites:** This example uses the `jupiterFetch` and `signAndSend` helpers
> defined in the **Developer Quickstart** section of the main `SKILL.md`.
> `jupiterFetch` prepends `https://api.jup.ag` to every path and attaches the
> `x-api-key` header automatically. `signAndSend` deserializes, signs, and submits
> a base64-encoded `VersionedTransaction`.

```typescript
import { Connection, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

// jupiterFetch<T>(path, init?) is defined in Developer Quickstart (SKILL.md).
// signAndSend(txBase64, wallet, connection, additionalSigners?) is defined there too.

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_URL);
const wallet = Keypair.fromSecretKey(bs58.decode(process.env.WALLET_PRIVATE_KEY!));

const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

async function depositToLend(amount: number, asset: string) {
  // 1. Get deposit transaction
  const data = await jupiterFetch<{ transaction: string }>('/lend/v1/earn/deposit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      asset,
      signer: wallet.publicKey.toBase58(),
      amount: amount.toString(),
    }),
  });

  // 2. Sign and send the returned transaction
  const signature = await signAndSend(data.transaction, wallet, connection);

  // 3. Confirm
  const confirmation = await connection.confirmTransaction(signature, 'confirmed');

  if (confirmation.value.err) {
    throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
  }

  return { signature, explorerUrl: `https://solscan.io/tx/${signature}` };
}

// Usage: depositToLend(1_000_000_000, USDC_MINT) → deposits 1000 USDC (6 decimals)
```
