---
title: Lend API
description: Jupiter's lending protocol for depositing assets and earning yield. Deposit tokens to receive auto-compounding jlTokens that appreciate (earn yield)over time.
baseUrl: https://api.jup.ag/lend/v1/earn
notes:
  - See `../responses/lend.md` for response examples.
  - See `../about/lend-sdk.md` for SDK integration guide.
  - See `../about/lend-liquidation.md` for building a liquidation bot.
---

# Lend API

## Base URL

```
https://api.jup.ag/lend/v1/earn
```

## Guidelines
   - ALWAYS include `x-api-key` header with your API key
   - ALWAYS specify amounts in native units (smallest unit of the token, e.g., 6 decimals for USDC)
   - NEVER modify the returned transaction before signing
   - PREFER deposit/withdraw for asset-based operations, use mint/redeem for share-based operations

## Common Mistakes
- Using wrong decimal places for amounts (USDC = 6 decimals, SOL = 9 decimals)
- Forgetting to deserialize as VersionedTransaction
- Not checking available liquidity before large withdrawals

## Key Concepts

| Concept | Description |
|---------|-------------|
| jlTokens | Yield-bearing tokens received when depositing (e.g., jlUSDC, jlSOL) |
| Shares | jlToken balance representing your position in the pool |
| Assets | Underlying tokens (USDC, SOL, etc.) |
| Auto-compounding (yield) | jlTokens appreciate in value over time, no manual claiming |

## Prerequisites
### Dependencies
```bash
npm install @solana/web3.js@1 # Using v1 of web3.js instead of v2
npm install dotenv # If required for wallet setup
```

### RPC Setup 
```typescript
import { Connection } from "@solana/web3.js";

const connection = new Connection('https://api.mainnet-beta.solana.com');
```

### Development Wallet
#### Setup a wallet
```typescript
// index.js
import { Keypair } from '@solana/web3.js';
import dotenv from 'dotenv';
require('dotenv').config();

const wallet = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY || ''));
```

```bash
# .env
PRIVATE_KEY=""
```

### Load a wallet
```typescript
import { Keypair } from '@solana/web3.js';
import fs from 'fs';

const privateKeyArray = JSON.parse(fs.readFileSync('/Path/To/.config/solana/id.json', 'utf8').trim());
const wallet = Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
```

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tokens` | List available tokens/vaults for deposit |
| GET | `/positions` | Get user positions and balances |
| GET | `/earnings` | Get earnings for user positions |
| POST | `/deposit` | Create deposit transaction |
| POST | `/withdraw` | Create withdraw transaction |
| POST | `/mint` | Create mint shares transaction |
| POST | `/redeem` | Create redeem shares transaction |
| POST | `/deposit-instructions` | Get deposit instruction (for CPI) |
| POST | `/withdraw-instructions` | Get withdraw instruction (for CPI) |
| POST | `/mint-instructions` | Get mint instruction (for CPI) |
| POST | `/redeem-instructions` | Get redeem instruction (for CPI) |

---

## 1. GET /tokens

List all available tokens/vaults users can deposit into with their pool information and rates.

```
GET /lend/v1/earn/tokens
```

**Query Parameters**: None

### Example

```typescript
const tokensResponse = await fetch(
  'https://api.jup.ag/lend/v1/earn/tokens',
  { headers: { 'x-api-key': API_KEY } }
).then(r => r.json());

// Filter for USDC vault
const usdcVault = tokensResponse.find(
  t => t.mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
);
console.log(`USDC APY: ${usdcVault.supplyRate}%`);
```

---

## 2. GET /positions

Fetch existing positions for one or more users including shares, underlying assets, and balances.

```
GET /lend/v1/earn/positions
```

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `users` | string | Yes | Comma-separated list of wallet addresses |

### Example

```typescript
const positionsResponse = await fetch(
  `https://api.jup.ag/lend/v1/earn/positions?users=${walletAddress}`,
  { headers: { 'x-api-key': API_KEY } }
).then(r => r.json());
```

---

## 3. GET /earnings

Fetch earnings for one or more positions for a user.

```
GET /lend/v1/earn/earnings
```

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user` | string | Yes | User wallet address |
| `positions` | string | No | Comma-separated position identifiers |

### Example

```typescript
const earningsResponse = await fetch(
  `https://api.jup.ag/lend/v1/earn/earnings?user=${walletAddress}`,
  { headers: { 'x-api-key': API_KEY } }
).then(r => r.json());
```

---

## 4. POST /deposit

Request for a base64-encoded unsigned earn deposit transaction to deposit assets into an earn vault.

```
POST /lend/v1/earn/deposit
```

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `asset` | string | Yes | Token mint address to deposit |
| `amount` | string | Yes | Amount in native units (smallest unit) |
| `signer` | string | Yes | User's wallet address |

### Example

```typescript
const depositResponse = await fetch(
  'https://api.jup.ag/lend/v1/earn/deposit',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({
      asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      amount: '1000000', // 1 USDC (6 decimals)
      signer: walletAddress,
    }),
  }
).then(r => r.json());
```

---

## 5. POST /withdraw

Request for a base64-encoded unsigned earn withdraw transaction to withdraw assets from an earn vault.

```
POST /lend/v1/earn/withdraw
```

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `asset` | string | Yes | Token mint address to withdraw |
| `amount` | string | Yes | Amount in native units (smallest unit) |
| `signer` | string | Yes | User's wallet address |

### Example

```typescript
const withdrawResponse = await fetch(
  'https://api.jup.ag/lend/v1/earn/withdraw',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({
      asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      amount: '500000', // 0.5 USDC
      signer: walletAddress,
    }),
  }
).then(r => r.json());
```

---

## 6. POST /mint

Request for a base64-encoded unsigned earn mint transaction to mint jlTokens (shares) by depositing underlying asset.

```
POST /lend/v1/earn/mint
```

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `asset` | string | Yes | Token mint address |
| `shares` | string | Yes | Number of shares to mint |
| `signer` | string | Yes | User's wallet address |

### Example

```typescript
const mintResponse = await fetch(
  'https://api.jup.ag/lend/v1/earn/mint',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({
      asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      amount: '100', // 100 shares
      signer: walletAddress,
    }),
  }
).then(r => r.json());
```

---

## 7. POST /redeem

Request for a base64-encoded unsigned earn redeem transaction to redeem jlTokens (shares) for underlying asset.

```
POST /lend/v1/earn/redeem
```

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `asset` | string | Yes | Token mint address |
| `shares` | string | Yes | Number of shares to redeem |
| `signer` | string | Yes | User's wallet address |

### Example

```typescript
const redeemResponse = await fetch(
  'https://api.jup.ag/lend/v1/earn/redeem',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({
      asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      shares: '100', // 100 shares
      signer: walletAddress,
    }),
  }
).then(r => r.json());
```
---

## Instruction Endpoints

For CPI (Cross-Program Invocation) or custom transaction composition, use the instruction variants:

- `POST /deposit-instructions`
- `POST /withdraw-instructions`  
- `POST /mint-instructions`
- `POST /redeem-instructions`

These return instruction objects with `programId`, `accounts`, and `data` instead of full transactions.

---

## Workflows

### Complete Flow: Deposit Assets (IMPORTANT: Use endpoint /mint when the amount of shares to be obtained from deposit is specified)

```typescript
import { Keypair, VersionedTransaction, Connection } from '@solana/web3.js';

async function depositToEarn(
  asset: string,
  amount: string,
  wallet: Keypair
) {
  // Step 1. Get available tokens to verify asset is supported
  const tokens = await fetch(
    'https://api.jup.ag/lend/v1/earn/tokens',
    { headers: { 'x-api-key': API_KEY } }
  ).then(r => r.json());

  const vault = tokens.find(t => t.mint === asset);
  if (!vault) throw new Error('Asset not supported');

  // Step 2. Create deposit transaction
  const depositResponse = await fetch(
    'https://api.jup.ag/lend/v1/earn/deposit',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({
        asset,
        amount,
        signer: wallet.publicKey.toBase58(),
      }),
    }
  ).then(r => r.json());

  // Step 3. Sign transaction
  const transaction = VersionedTransaction.deserialize(
    Buffer.from(depositResponse.transaction, 'base64')
  );
  transaction.sign([wallet]);

  // Step 4. Send transaction (use your RPC)
  const connection = new Connection(RPC_URL);

  const transactionBinary = transaction.serialize();

  const blockhashInfo = await connection.getLatestBlockhashAndContext({
    commitment: 'processed',
  });

  const signature = await connection.sendRawTransaction(transactionBinary, {
    maxRetries: 0,
    skipPreflight: true,
  });

  return signature;

}
```

### Complete Flow: Withdraw Assets (IMPORTANT: Use endpoint /redeem when the amount of shares to be withdrawed/burned is specified)

```typescript
async function withdrawFromEarn(
  asset: string,
  amount: string,
  wallet: Keypair
) {
  // Step 1. Check position
  const positions = await fetch(
    `https://api.jup.ag/lend/v1/earn/positions?users=${wallet.publicKey}`,
    { headers: { 'x-api-key': API_KEY } }
  ).then(r => r.json());

  const position = positions.find(p => p.token.mint === asset);
  if (!position) throw new Error('No position found');

  // Step 2. Create withdraw transaction
  const withdrawResponse = await fetch(
    'https://api.jup.ag/lend/v1/earn/withdraw',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({
        asset,
        amount,
        signer: wallet.publicKey.toBase58(),
      }),
    }
  ).then(r => r.json());

  // Step 3. Sign and send
  const tx = VersionedTransaction.deserialize(
    Buffer.from(withdrawResponse.transaction, 'base64')
  );
transaction.sign([wallet]);

  // Step 4. Send transaction (use your RPC)
  const connection = new Connection(RPC_URL);

  const transactionBinary = transaction.serialize();

  const blockhashInfo = await connection.getLatestBlockhashAndContext({
    commitment: 'processed',
  });

  const signature = await connection.sendRawTransaction(transactionBinary, {
    maxRetries: 0,
    skipPreflight: true,
  });

  console.log(`Transaction sent: https://solscan.io/tx/${signature}`);
   
  return signature;
}
```

---

## Tips and Best Practices

### General
1. **Check liquidity before withdrawing** - Large withdrawals may be subject to Automated Debt Ceiling limits
2. **Use positions endpoint** to verify balances before operations
3. **jlTokens auto-compound** - No need to claim rewards, value appreciates over time
4. **Use instruction endpoints for CPI** - When integrating with other programs

### Decimal Reference

| Token | Decimals | 1 Token in Native Units |
|-------|----------|------------------------|
| USDC | 6 | 1000000 |
| SOL | 9 | 1000000000 |
| USDT | 6 | 1000000 |

### When to Use Which Endpoint

| Use Case | Endpoint |
|----------|----------|
| Deposit by asset amount | `/deposit` |
| Withdraw by asset amount | `/withdraw` |
| Deposit by share amount | `/mint` |
| Withdraw by share amount | `/redeem` |
| CPI / Custom transactions | `/*-instructions` |

## References
- [Response Examples](../responses/lend.md)
- [Lend SDK Guide](../about/lend-sdk.md)
- [Lend Liquidation Bot](../about/lend-liquidation.md)
- [Lend API Reference](https://dev.jup.ag/api-reference/lend)
- [Earn Documentation](https://dev.jup.ag/docs/lend/earn)
- [Lend SDK](https://dev.jup.ag/docs/lend/sdk)
