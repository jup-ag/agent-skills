---
title: Ultra Swap Integrator Payer
description: How to implement integrator payer in your Jupiter Ultra API Swaps. Pay for network fees and rent on behalf of your users.
---
# Add Integrator Payer

Pay for network fees and rent on behalf of your users.

## Overview

The `payer` parameter allows integrators to cover network fees, priority fees, and rent for users. This eliminates gasless requirements like minimum SOL balance or trade size.

## Key Points

| Aspect | Description |
|--------|-------------|
| **Required with referral params** | Must use with `referralAccount` and `referralFee` to recoup costs |
| **Takes precedent** | Always overrides Ultra's Gasless Support mechanism |
| **No minimum trade size** | Works for any trade amount |
| **Routes to Iris only** | Enforces Iris routing when `payer` is used |
| **Requires backend signing** | Integrator must proxy request to backend to sign before `/execute` |

## ATA Rent Handling

- **WSOL TA**: Closed after swap, rent refunded to payer
- **Non-WSOL TA**: Not closed (used for output amount). Use `closeAuthority` to control

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `payer` | string | Yes | Public key paying for fees and rent |
| `closeAuthority` | string | No | Close authority for created token accounts (defaults to `taker`) |
| `referralAccount` | string | Yes* | Referral account collecting fees (*required with payer) |
| `referralFee` | number | Yes* | Fee in basis points (*required with payer) |

## Example

```typescript
// Step 1. Get order with payer parameter
const orderParams = new URLSearchParams({
  inputMint: 'So11111111111111111111111111111111111111112',
  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  amount: '100000000',
  taker: '<taker-wallet>',
  referralAccount: '<referral-account>',
  referralFee: '100', // 1% (100 bps)
  payer: '<integrator-payer-wallet>',
  closeAuthority: '<taker-wallet>', // optional
});

const orderResponse = await fetch(
  `https://api.jup.ag/ultra/v1/order?${orderParams}`,
  {
    headers: { 'x-api-key': process.env.JUPITER_API_KEY! },
  }
).then((res) => res.json());

// Step 2. Deserialize and sign with user wallet
const tx = VersionedTransaction.deserialize(
  Buffer.from(orderResponse.transaction, 'base64')
);
tx.sign([userWallet]);

// Step 3. Send partially signed tx to your backend
const partiallySignedTx = Buffer.from(tx.serialize()).toString('base64');

const result = await fetch('https://your-backend.com/api/sign-and-execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    partiallySignedTx,
    requestId: orderResponse.requestId,
  }),
}).then((res) => res.json());

// ============================================
// BACKEND: Integrator signs and executes
// ============================================

// your-backend.com/api/sign-and-execute
async function signAndExecute(req: Request) {
  const { partiallySignedTx, requestId } = req.body;

  // Step 4. Deserialize and add payer signature
  const tx = VersionedTransaction.deserialize(
    Buffer.from(partiallySignedTx, 'base64')
  );

  // payerKeypair is stored securely on your backend
  const payerKeypair = Keypair.fromSecretKey(/* secure key storage */);
  tx.sign([payerKeypair]);

  const signedTx = Buffer.from(tx.serialize()).toString('base64');

  // Step 5. Execute the fully signed transaction
  const result = await fetch('https://api.jup.ag/ultra/v1/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.JUPITER_API_KEY!,
    },
    body: JSON.stringify({
      signedTransaction: signedTx,
      requestId,
    }),
  }).then((res) => res.json());

  return result;
}
```

## Close Authority

Use `closeAuthority` to control who can close created token accounts and reclaim rent.

**Behavior:**
- If not provided: defaults to `taker`
- If provided and different from `taker`: adds instruction to set new close authority

**Strategies to handle rent:**
1. Charge sufficient referral fees to cover rent costs
2. Set yourself as `closeAuthority` to reclaim rent when account is closed

**Warning:** If the taker's token account never reaches zero balance, you cannot close it and your SOL remains locked.

## Signing Flow

```typescript
// 1. Get order with payer parameter
const order = await getOrder(params);

// 2. User signs the transaction (partial signature)
const tx = VersionedTransaction.deserialize(Buffer.from(order.transaction, 'base64'));
tx.sign([userWallet]); // User's signature

// 3. Send to backend for integrator signature
const partiallySignedTx = Buffer.from(tx.serialize()).toString('base64');

// 4. Backend signs with payer key
tx.sign([payerKeypair]); // Integrator's payer signature

// 5. Execute fully signed transaction
const signedTx = Buffer.from(tx.serialize()).toString('base64');
const result = await fetch('https://api.jup.ag/ultra/v1/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.JUPITER_API_KEY!,
  },
  body: JSON.stringify({
    signedTransaction: signedTx,
    requestId: order.requestId,
  }),
}).then(res => res.json());
```

## References

- [Ultra Swap Gasless Support](https://dev.jup.ag/docs/ultra/gasless)
- [Add Fees to Ultra Swap](https://dev.jup.ag/docs/ultra/add-fees-to-ultra)
- [Solana Token Account Docs](https://solana.com/docs/tokens/basics/create-token-account)
