---
title: Lend API
description: Jupiter's lending protocol for depositing assets and earning yield. Deposit tokens to receive auto-compounding jlTokens that appreciate (earn yield)over time.
baseUrl: https://api.jup.ag/lend/v1/earn
notes:
  - See `../responses/lend.md` for response examples.
  - See `../about/lend-sdk.md` for SDK integration guide.
  - See `../about/lend-liquidation.md` for building a liquidation bot.
---

## Table of Contents

- [Lend API](#lend-api)
  - [Base URL](#base-url)
  - [Guidelines](#guidelines)
  - [Common Mistakes](#common-mistakes)
  - [Key Concepts](#key-concepts)
  - [Prerequisites](#prerequisites)
    - [Dependencies](#dependencies)
    - [RPC Setup](#rpc-setup)
    - [Development Wallet](#development-wallet)
      - [Setup a wallet](#setup-a-wallet)
    - [Load a wallet](#load-a-wallet)
  - [Endpoints](#endpoints)
  - [1. GET /tokens](#1-get-tokens)
  - [2. GET /positions](#2-get-positions)
  - [3. GET /earnings](#3-get-earnings)
  - [4. POST /deposit](#4-post-deposit)
  - [5. POST /withdraw](#5-post-withdraw)
  - [6. POST /mint](#6-post-mint)
  - [7. POST /redeem](#7-post-redeem)
  - [Instruction Endpoints](#instruction-endpoints)
  - [Workflows](#workflows)
    - [Complete Flow: Deposit Assets](#complete-flow-deposit-assets)
    - [Complete Flow: Withdraw Assets](#complete-flow-withdraw-assets)
    - [Complete Flow: Mint Shares with Token Selection](#complete-flow-mint-shares-with-token-selection)
    - [Complete Flow: Redeem Shares](#complete-flow-redeem-shares)
    - [Complete Flow: Monitor Earnings](#complete-flow-monitor-earnings)
  - [Tips and Best Practices](#tips-and-best-practices)
    - [General](#general)
    - [Decimal Reference](#decimal-reference)
    - [When to Use Which Endpoint](#when-to-use-which-endpoint)
  - [References](#references)

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

See [Complete Workflows](#workflows) for full integration examples.

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

See [Complete Workflows](#workflows) for full integration examples.

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

See [Complete Workflows](#workflows) for full integration examples.

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

See [Complete Workflows](#workflows) for full integration examples.

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

See [Complete Workflows](#workflows) for full integration examples.

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

See [Complete Workflows](#workflows) for full integration examples.

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

See [Complete Workflows](#workflows) for full integration examples.

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

### Complete Flow: Deposit Assets

```typescript
import { Keypair, VersionedTransaction, Connection } from '@solana/web3.js';

async function depositToEarn(
  asset: string,
  amount: string,
  wallet: Keypair
) {
  // Step 1. Get available tokens and display rates
  const tokens = await fetch(
    'https://api.jup.ag/lend/v1/earn/tokens',
    { headers: { 'x-api-key': API_KEY } }
  ).then(r => r.json());

  // Display available tokens with APY rates
  console.log('Available tokens:');
  tokens.forEach(token => {
    console.log(`${token.symbol}: ${token.supplyRate}% APY (${token.rewardsRate}% rewards)`);
  });

  // Verify asset is supported
  const vault = tokens.find(t => t.mint === asset);
  if (!vault) throw new Error('Asset not supported');
  
  console.log(`Depositing to ${vault.symbol} with ${vault.supplyRate}% APY`);

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

### Complete Flow: Withdraw Assets

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

### Complete Flow: Mint Shares with Token Selection

```typescript
import { Keypair, VersionedTransaction, Connection } from '@solana/web3.js';

async function mintSharesWithSelection(wallet: Keypair) {
  // Step 1: Check available tokens and their rates
  const tokens = await fetch(
    'https://api.jup.ag/lend/v1/earn/tokens',
    { headers: { 'x-api-key': API_KEY } }
  ).then(r => r.json());

  // Display tokens with rates for user selection
  console.log('Available tokens:');
  tokens.forEach(token => {
    console.log(`${token.symbol}: ${token.supplyRate}% APY (${token.rewardsRate}% rewards)`);
    console.log(`  Total Supply: ${token.totalSupply}, Available: ${token.availableLiquidity}`);
  });

  // Step 2: User selects token and specifies shares
  const selectedAsset = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC
  const shares = '1000000'; // 1M shares

  // Step 3: Mint shares
  const mintResponse = await fetch(
    'https://api.jup.ag/lend/v1/earn/mint',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({
        asset: selectedAsset,
        shares,
        signer: wallet.publicKey.toBase58()
      }),
    }
  ).then(r => r.json());

  // Step 4: Sign and send transaction
  const transaction = VersionedTransaction.deserialize(
    Buffer.from(mintResponse.transaction, 'base64')
  );
  transaction.sign([wallet]);
  
  const connection = new Connection(RPC_URL);
  const transactionBinary = transaction.serialize();

  const blockhashInfo = await connection.getLatestBlockhashAndContext({
    commitment: 'processed',
  });

  const signature = await connection.sendRawTransaction(transactionBinary, {
    maxRetries: 0,
    skipPreflight: true,
  });

  console.log(`Minted ${shares} shares: https://solscan.io/tx/${signature}`);
  return signature;
}
```

### Complete Flow: Redeem Shares

```typescript
async function redeemShares(
  asset: string,
  shares: string,
  wallet: Keypair
) {
  // Step 1: Check current position
  const positions = await fetch(
    `https://api.jup.ag/lend/v1/earn/positions?users=${wallet.publicKey}`,
    { headers: { 'x-api-key': API_KEY } }
  ).then(r => r.json());

  const position = positions.find(p => p.token.mint === asset);
  if (!position) throw new Error('No position found');
  
  console.log(`Current shares: ${position.shares}`);
  console.log(`Underlying assets: ${position.underlyingAssets}`);
  console.log(`Redeeming ${shares} shares...`);

  // Step 2: Redeem shares
  const redeemResponse = await fetch(
    'https://api.jup.ag/lend/v1/earn/redeem',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({
        asset,
        shares,
        signer: wallet.publicKey.toBase58()
      }),
    }
  ).then(r => r.json());

  // Step 3: Sign and send transaction
  const transaction = VersionedTransaction.deserialize(
    Buffer.from(redeemResponse.transaction, 'base64')
  );
  transaction.sign([wallet]);
  
  const connection = new Connection(RPC_URL);
  const transactionBinary = transaction.serialize();

  const blockhashInfo = await connection.getLatestBlockhashAndContext({
    commitment: 'processed',
  });

  const signature = await connection.sendRawTransaction(transactionBinary, {
    maxRetries: 0,
    skipPreflight: true,
  });

  console.log(`Redeemed ${shares} shares: https://solscan.io/tx/${signature}`);
  return signature;
}
```

### Complete Flow: Monitor Earnings

```typescript
async function monitorEarnings(walletAddress: string) {
  // Step 1: Get user positions
  const positions = await fetch(
    `https://api.jup.ag/lend/v1/earn/positions?users=${walletAddress}`,
    { headers: { 'x-api-key': API_KEY } }
  ).then(r => r.json());

  console.log('Your positions:');
  positions.forEach(pos => {
    console.log(`${pos.token.symbol}:`);
    console.log(`  Shares: ${pos.shares}`);
    console.log(`  Underlying Assets: ${pos.underlyingAssets}`);
    console.log(`  Balance: ${pos.underlyingBalance}`);
  });

  // Step 2: Get earnings for all positions
  const earnings = await fetch(
    `https://api.jup.ag/lend/v1/earn/earnings?user=${walletAddress}`,
    { headers: { 'x-api-key': API_KEY } }
  ).then(r => r.json());

  console.log('\nEarnings Summary:');
  earnings.positions.forEach(pos => {
    console.log(`${pos.mint}:`);
    console.log(`  Total Deposited: ${pos.totalDeposited}`);
    console.log(`  Current Value: ${pos.currentValue}`);
    console.log(`  Earnings: ${pos.earnings} ($${pos.earningsUsd})`);
  });
  
  console.log(`\nTotal Earnings: $${earnings.totalEarningsUsd}`);
  
  return { positions, earnings };
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
