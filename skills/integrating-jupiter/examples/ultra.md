# Ultra Swap: End-to-End Example

> **Prerequisites:** This example uses the `jupiterFetch` helper defined in the
> **Developer Quickstart** section of the main `SKILL.md`. That helper prepends
> `https://api.jup.ag` to every path and attaches the `x-api-key` header
> automatically, so you never need to build full URLs or pass the API key
> manually.
>
> Note: Unlike the standard swap flow, Ultra does **not** require a `Connection`
> object. Jupiter's `/ultra/v1/execute` endpoint handles transaction submission
> on your behalf.

```typescript
import { Keypair, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';

// jupiterFetch<T>(path, init?) is defined in Developer Quickstart (SKILL.md).
// It prepends https://api.jup.ag and adds the x-api-key header.

const wallet = Keypair.fromSecretKey(bs58.decode(process.env.WALLET_PRIVATE_KEY!));

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

async function swapSolToUsdc(amountLamports: number) {
  // 1. Get order
  const params = new URLSearchParams({
    inputMint: SOL_MINT,
    outputMint: USDC_MINT,
    amount: amountLamports.toString(),
    taker: wallet.publicKey.toBase58(),
  });

  const order = await jupiterFetch<{
    transaction: string;
    requestId: string;
    error?: string;
  }>(`/ultra/v1/order?${params}`);

  if (order.error) {
    throw new Error(`Order error: ${order.error}`);
  }

  // 2. Sign the transaction
  const txBuf = Buffer.from(order.transaction, 'base64');
  const tx = VersionedTransaction.deserialize(txBuf);
  tx.sign([wallet]);

  const signedTx = Buffer.from(tx.serialize()).toString('base64');

  // 3. Execute — Jupiter submits the transaction; no Connection needed
  const result = await jupiterFetch<{
    status: string;
    signature?: string;
    inputAmount?: string;
    outputAmount?: string;
    error?: string;
    code?: string;
  }>('/ultra/v1/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      signedTransaction: signedTx,
      requestId: order.requestId,
    }),
  });

  // 4. Confirm
  if (result.status === 'Success') {
    return {
      signature: result.signature,
      inputAmount: result.inputAmount,
      outputAmount: result.outputAmount,
      explorerUrl: `https://solscan.io/tx/${result.signature}`,
    };
  }

  throw new Error(`Swap failed: ${result.error || result.code || 'unknown'}`);
}

// Usage: swapSolToUsdc(1_000_000_000) → swaps 1 SOL
```
