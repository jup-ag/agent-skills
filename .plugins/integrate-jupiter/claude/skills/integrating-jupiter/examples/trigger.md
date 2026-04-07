# Trigger: Limit Order Example (v2)

> **Prerequisites:** This example uses the `jupiterFetch` helper defined in the
> **Developer Quickstart** section of the main `SKILL.md`. That helper prepends
> `https://api.jup.ag` to every path and attaches the `x-api-key` header
> automatically.
>
> Trigger v2 requires **dual-auth**: the `x-api-key` header (handled by `jupiterFetch`)
> plus a JWT `Authorization: Bearer <token>` for authenticated endpoints. The JWT is
> obtained via a challenge-response flow and lasts 24 hours. JWT expiry does NOT cancel
> open orders — they continue executing independently.
>
> Order placement requires a **vault + deposit pre-step**: funds are deposited into a
> per-wallet custodial vault (Privy) before the order is created. No separate `/execute`
> call is needed after that.

```typescript
import { Keypair, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl';

// jupiterFetch<T>(path, init?) is defined in Developer Quickstart (SKILL.md).
// It prepends https://api.jup.ag and adds the x-api-key header.

const wallet = Keypair.fromSecretKey(bs58.decode(process.env.WALLET_PRIVATE_KEY!));

const SOL_MINT  = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

// ─── Step 1: Authenticate — get JWT via challenge-response ───────────────────

async function getJwt(): Promise<string> {
  // 1a. Request a challenge
  const { challenge } = await jupiterFetch<{ type: string; challenge: string }>(
    '/trigger/v2/auth/challenge',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletPubkey: wallet.publicKey.toBase58(),
        type: 'message',
      }),
    }
  );

  // 1b. Sign the challenge with the wallet (base58-encoded)
  const signature = nacl.sign.detached(
    Buffer.from(challenge),
    wallet.secretKey
  );
  const signatureBase58 = bs58.encode(signature);

  // 1c. Verify — returns a 24-hour JWT
  const { token } = await jupiterFetch<{ token: string }>(
    '/trigger/v2/auth/verify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'message',
        walletPubkey: wallet.publicKey.toBase58(),
        signature: signatureBase58,
      }),
    }
  );

  return token;
}

// ─── Step 2: Deposit into vault ──────────────────────────────────────────────
// Funds are held in a per-wallet custodial vault until the order fills or is cancelled.

async function craftDeposit(jwt: string, inputMint: string, amount: string) {
  // 2a. Ensure vault exists (register on first use)
  await jupiterFetch('/trigger/v2/vault/register', {
    headers: { 'Authorization': `Bearer ${jwt}` },
  }).catch(() => {
    // Already registered — safe to ignore
  });

  // 2b. Craft unsigned deposit transaction
  const deposit = await jupiterFetch<{
    transaction: string;
    requestId: string;
  }>('/trigger/v2/deposit/craft', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}`,
    },
    body: JSON.stringify({
      inputMint,
      outputMint: USDC_MINT,    // destination token for the order
      userAddress: wallet.publicKey.toBase58(),
      amount,
    }),
  });

  // 2c. Sign deposit transaction
  const tx = VersionedTransaction.deserialize(Buffer.from(deposit.transaction, 'base64'));
  tx.sign([wallet]);
  const depositSignedTx = Buffer.from(tx.serialize()).toString('base64');

  return { depositRequestId: deposit.requestId, depositSignedTx };
}

// ─── Step 3: Create limit order ──────────────────────────────────────────────
// Sells 1 SOL when SOL price rises above $200 USD.

async function createLimitOrder(jwt: string) {
  const inputAmount = '1000000000'; // 1 SOL in lamports

  const { depositRequestId, depositSignedTx } = await craftDeposit(
    jwt, SOL_MINT, inputAmount
  );

  const order = await jupiterFetch<{
    id: string;
    txSignature: string;
    error?: string;
  }>('/trigger/v2/orders/price', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}`,
    },
    body: JSON.stringify({
      orderType: 'single',
      depositRequestId,
      depositSignedTx,
      userPubkey: wallet.publicKey.toBase58(),
      inputMint: SOL_MINT,
      inputAmount,
      outputMint: USDC_MINT,
      triggerMint: SOL_MINT,
      triggerCondition: 'above',    // trigger when SOL price rises above threshold
      triggerPriceUsd: 200.00,
      slippageBps: 100,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    }),
  });

  if (order.error) throw new Error(`Order failed: ${order.error}`);
  return order; // { id, txSignature }
}

// ─── Step 4: Check order history ─────────────────────────────────────────────

async function getOrderHistory(jwt: string) {
  return jupiterFetch<{ orders: Array<{ id: string; orderState: string }> }>(
    '/trigger/v2/orders/history',
    { headers: { 'Authorization': `Bearer ${jwt}` } }
  );
}

// ─── Step 5: Cancel an order (two-step flow) ─────────────────────────────────

async function cancelOrder(jwt: string, orderId: string) {
  // 5a. Initiate cancellation — returns unsigned withdrawal transaction
  const { transaction, requestId: cancelRequestId } = await jupiterFetch<{
    transaction: string;
    requestId: string;
  }>(`/trigger/v2/orders/price/cancel/${orderId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${jwt}` },
  });

  // 5b. Sign withdrawal transaction
  const tx = VersionedTransaction.deserialize(Buffer.from(transaction, 'base64'));
  tx.sign([wallet]);
  const signedTx = Buffer.from(tx.serialize()).toString('base64');

  // 5c. Confirm cancellation — funds return to wallet
  return jupiterFetch(`/trigger/v2/orders/price/confirm-cancel/${orderId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}`,
    },
    body: JSON.stringify({ signedTransaction: signedTx, cancelRequestId }),
  });
}

// ─── Usage ───────────────────────────────────────────────────────────────────

async function main() {
  const jwt = await getJwt();

  const order = await createLimitOrder(jwt);
  console.log('Order created:', order.id, 'tx:', order.txSignature);

  const { orders } = await getOrderHistory(jwt);
  console.log('Active orders:', orders.map(o => o.id));

  // Cancel if needed:
  // await cancelOrder(jwt, order.id);
}
```
