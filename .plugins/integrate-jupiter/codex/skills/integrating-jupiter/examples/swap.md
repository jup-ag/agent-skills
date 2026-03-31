# Swap: End-to-End Example

> **Prerequisites:** This example uses the `jupiterFetch` helper defined in the
> **Developer Quickstart** section of the main `SKILL.md`. That helper prepends
> `https://api.jup.ag` to every path and attaches the `x-api-key` header
> automatically, so you never need to build full URLs or pass the API key
> manually.
>
> Note: The Swap API does **not** require a `Connection` object. Jupiter's
> `/swap/v2/execute` endpoint handles transaction submission on your behalf.
>
> **Production use:** Wrap the execute call in `withRetry` (defined in SKILL.md)
> to handle all retryable error codes per the error table in SKILL.md.

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
    transaction: string | null;
    requestId: string;
    router?: string;
    mode?: string;
    feeBps?: number;
    feeMint?: string;
    error?: string;
  }>(`/swap/v2/order?${params}`);

  if (order.error || !order.transaction) {
    throw new Error(`Order error: ${order.error ?? 'no transaction returned (is taker set?)'}`);
  }

  // 2. Sign the transaction
  const txBuf = Buffer.from(order.transaction, 'base64');
  const tx = VersionedTransaction.deserialize(txBuf);
  tx.sign([wallet]);

  const signedTx = Buffer.from(tx.serialize()).toString('base64');

  // 3. Execute — Jupiter submits the transaction; no Connection needed
  const result = await jupiterFetch<{
    status: string;
    signature: string;
    code: number;
    inputAmountResult?: string;
    outputAmountResult?: string;
    error?: string;
  }>('/swap/v2/execute', {
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
      inputAmount: result.inputAmountResult,
      outputAmount: result.outputAmountResult,
      explorerUrl: `https://solscan.io/tx/${result.signature}`,
    };
  }

  // Throw with structured context so withRetry can identify retryable errors
  const err: any = new Error(`Swap failed: ${result.error || 'unknown'}`);
  err.code = result.code;
  throw err;
}

// Usage: swapSolToUsdc(1_000_000_000) → swaps 1 SOL
```
