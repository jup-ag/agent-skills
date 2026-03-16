# Trigger: Limit Order Example

> **Prerequisites:** This example uses the `jupiterFetch` helper defined in the
> **Developer Quickstart** section of the main `SKILL.md`. That helper prepends
> `https://api.jup.ag` to every path and attaches the `x-api-key` header
> automatically, so you never need to build full URLs or pass the API key
> manually.
>
> You also need `Keypair` and `VersionedTransaction` from `@solana/web3.js`.
> Note: Unlike lend, the Trigger flow does **not** use `signAndSend` or a
> `Connection` object. Jupiter's `/trigger/v1/execute` endpoint handles
> transaction submission on your behalf (similar to Ultra).

```typescript
import { Keypair, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';

// jupiterFetch<T>(path, init?) is defined in Developer Quickstart (SKILL.md).
// It prepends https://api.jup.ag and adds the x-api-key header.

const wallet = Keypair.fromSecretKey(bs58.decode(process.env.WALLET_PRIVATE_KEY!));

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

async function createLimitOrder(
  inputMint: string,
  outputMint: string,
  makingAmount: string,
  takingAmount: string
) {
  // 1. Create order
  const data = await jupiterFetch<{
    transaction: string;
    requestId: string;
    order?: string;
  }>('/trigger/v1/createOrder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      maker: wallet.publicKey.toBase58(),
      payer: wallet.publicKey.toBase58(),
      inputMint,
      outputMint,
      makingAmount,
      takingAmount,
      expiredAt: null, // no expiry
      feeBps: 0,
    }),
  });

  // 2. Sign the transaction locally
  const txBuf = Buffer.from(data.transaction, 'base64');
  const tx = VersionedTransaction.deserialize(txBuf);
  tx.sign([wallet]);

  const signedTx = Buffer.from(tx.serialize()).toString('base64');

  // 3. Execute — Jupiter submits the transaction; no Connection needed
  const result = await jupiterFetch<{
    status: string;
    signature?: string;
    order?: string;
    error?: string;
    code?: string;
  }>('/trigger/v1/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      signedTransaction: signedTx,
      requestId: data.requestId,
    }),
  });

  // 4. Confirm success
  if (result.status === 'Success') {
    return {
      signature: result.signature,
      order: result.order,
      explorerUrl: `https://solscan.io/tx/${result.signature}`,
    };
  }

  throw new Error(`Limit order failed: ${result.error || result.code || 'unknown'}`);
}

// Usage: createLimitOrder(USDC_MINT, SOL_MINT, '150000000', '1000000000')
// -> Buy 1 SOL when price hits 150 USDC
```
