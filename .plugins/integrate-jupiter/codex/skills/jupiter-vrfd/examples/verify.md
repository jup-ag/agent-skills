# Verify: Express Verification Example

> **Prerequisites:** This script requires `@solana/web3.js@1` and `bs58` — v2
> of web3.js has a completely different API surface. The private key is used
> only for local signing — only the signed transaction is sent to the Jupiter
> API.

```typescript
import { Keypair, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';

const BASE = 'https://api.jup.ag';
const API_KEY = process.env.JUPITER_API_KEY!; // from portal.jup.ag

async function jupiterFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'x-api-key': API_KEY, ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Jupiter API ${res.status}: ${body}`);
  }
  return res.json();
}

const wallet = Keypair.fromSecretKey(bs58.decode(process.env.WALLET_PRIVATE_KEY!));

const TOKEN_ID = '';
const TWITTER_HANDLE = '';          // normalized to https://x.com/{handle}
const SENDER_TWITTER_HANDLE = '';   // optional, normalized
const DESCRIPTION = '';
const TOKEN_METADATA = null;        // optional object for metadata updates

async function verifyToken() {
  const senderAddress = wallet.publicKey.toBase58();

  // 1. Craft unsigned transaction
  const craft = await jupiterFetch<{
    transaction: string;
    requestId: string;
    mint: string;
    amount: string;
    expireAt: string;
  }>(`/tokens/v2/verify/express/craft-txn?senderAddress=${encodeURIComponent(senderAddress)}`);

  // 2. Verify transaction before signing
  if (craft.mint !== 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN') {
    throw new Error('Unexpected mint — do not sign');
  }
  if (craft.amount !== '1000000000') {
    throw new Error('Unexpected amount — do not sign');
  }
  if (new Date(craft.expireAt) <= new Date()) {
    throw new Error('Transaction expired — re-craft');
  }

  // 3. Sign the transaction
  const txBuf = Buffer.from(craft.transaction, 'base64');
  const tx = VersionedTransaction.deserialize(txBuf);
  tx.sign([wallet]);

  const signedTx = Buffer.from(tx.serialize()).toString('base64');

  // 4. Execute — submit signed transaction with verification details
  const result = await jupiterFetch<{
    status: string;
    signature: string;
    verificationCreated?: boolean;
    metadataCreated?: boolean;
    error?: string;
  }>('/tokens/v2/verify/express/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transaction: signedTx,
      requestId: craft.requestId,
      senderAddress,
      tokenId: TOKEN_ID,
      twitterHandle: TWITTER_HANDLE,
      description: DESCRIPTION,
      ...(SENDER_TWITTER_HANDLE ? { senderTwitterHandle: SENDER_TWITTER_HANDLE } : {}),
      ...(TOKEN_METADATA ? { tokenMetadata: TOKEN_METADATA } : {}),
    }),
  });

  // 5. Confirm
  if (result.status === 'Success') {
    return {
      signature: result.signature,
      verificationCreated: result.verificationCreated,
      metadataCreated: result.metadataCreated,
    };
  }

  throw new Error(`Verify failed: ${result.error || 'unknown'}`);
}

// Usage: verifyToken() after filling in the constants above
```
