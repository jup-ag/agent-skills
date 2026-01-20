---
title: Lend SDK
description: Walkthrough on integrating via the Jupiter Lend SDK including instruction methods, CPI context accounts, and read functions.
---

# Lend SDK

Walkthrough on integrating via the Jupiter Lend SDK.

The Jupiter Lend SDK provides a TypeScript interface for interacting with the Jupiter lending protocol. This documentation covers two main integration approaches: getting instruction objects for direct use and getting account contexts for Cross-Program Invocation (CPI) integrations.

---

## Installation

```bash
npm install @jup-ag/lend
```

---

## Setup

```typescript
import {
    Connection,
    Keypair, 
    PublicKey, 
    TransactionMessage, 
    TransactionInstruction, 
    VersionedTransaction
} from "@solana/web3.js";
import {
  getDepositIx, getWithdrawIx, // get instructions
  getDepositContext, getWithdrawContext, // get context accounts for CPI
} from "@jup-ag/lend/earn";
import { BN } from "bn.js";

const connection = new Connection("https://api.mainnet-beta.solana.com");
const signer = Keypair.fromSecretKey(new Uint8Array(privateKey));

// Example asset mints
const usdc = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"); // USDC mainnet
```

---

## Instruction Methods

### Get Deposit Instruction

```typescript
const depositIx = await getDepositIx({
    amount: new BN(1000000), // amount in token decimals (1 USDC)
    asset: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), // asset mint address
    signer: signer.publicKey, // signer public key
    connection, // Solana connection
    cluster: "mainnet",
});
```

### Get Withdraw Instruction

```typescript
const withdrawIx = await getWithdrawIx({
    amount: new BN(1000000), // amount in token decimals (1 USDC)
    asset: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), // asset mint address
    signer: signer.publicKey, // signer public key
    connection, // Solana connection
    cluster: "mainnet",
});
```

### Example Instruction Usage

```typescript
import {
    Connection,
    Keypair, 
    PublicKey, 
    TransactionMessage, 
    Transaction,
    TransactionInstruction,
    VersionedTransaction
} from "@solana/web3.js";
import {
    getDepositIx,
} from "@jup-ag/lend/earn";
import { BN } from "bn.js";

const signer = Keypair.fromSecretKey(new Uint8Array(privateKey));
const connection = new Connection('https://api.mainnet-beta.solana.com');

// Get deposit instruction
const depositIx = await getDepositIx({
    amount: new BN(1000000), // amount in token decimals (1 USDC)
    asset: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), // asset mint address
    signer: signer.publicKey, // signer public key
    connection, // Solana connection
    cluster: "mainnet",
});

// Convert the raw instruction to TransactionInstruction
const instruction = new TransactionInstruction({
    programId: new PublicKey(depositIx.programId),
    keys: depositIx.keys.map((key) => ({
        pubkey: new PublicKey(key.pubkey),
        isSigner: key.isSigner,
        isWritable: key.isWritable,
    })),
    data: Buffer.from(depositIx.data),
});

const latestBlockhash = await connection.getLatestBlockhash();
const messageV0 = new TransactionMessage({
    payerKey: signer.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: [instruction],
}).compileToV0Message();

const transaction = new VersionedTransaction(messageV0);
transaction.sign([signer]);
const serializedTransaction = transaction.serialize();

const signature = await connection.sendRawTransaction(serializedTransaction);
console.log(`https://solscan.io/tx/${signature}`);
```

---

## CPI (Cross-Program Invocation)

For Anchor programs that need to make CPI calls to Jupiter Lend, use the context methods.

### Deposit Context Accounts

```typescript
const depositContext = await getDepositContext({
    asset: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), // asset mint address
    signer: signer.publicKey, // signer public key
    connection,
});
```

**Deposit Context Accounts**

| Account | Purpose |
|---------|---------|
| `signer` | User's wallet public key |
| `depositorTokenAccount` | User's underlying token account (source) |
| `recipientTokenAccount` | User's jlToken account (destination) |
| `mint` | Underlying token mint |
| `lendingAdmin` | Protocol configuration PDA |
| `lending` | Pool-specific configuration PDA |
| `fTokenMint` | jlToken mint account |
| `supplyTokenReservesLiquidity` | Liquidity protocol token reserves |
| `lendingSupplyPositionOnLiquidity` | Protocol's position in liquidity pool |
| `rateModel` | Interest rate calculation model |
| `vault` | Protocol vault holding deposited tokens |
| `liquidity` | Main liquidity protocol PDA |
| `liquidityProgram` | Liquidity protocol program ID |
| `rewardsRateModel` | Rewards calculation model PDA |

### Withdraw Context Accounts

```typescript
const withdrawContext = await getWithdrawContext({
    asset: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), // asset mint address
    signer: signer.publicKey, // signer public key
    connection,
});
```

**Withdraw Context Accounts**

Similar to deposit context, plus:
- `ownerTokenAccount`: User's jlToken account (source of jlTokens to burn)
- `claimAccount`: Additional account for withdrawal claim processing

### Example CPI Usage

```typescript
const depositContext = await getDepositContext({
  asset: usdcMint,
  signer: userPublicKey,
});

// Pass these accounts to your Anchor program
await program.methods
  .yourDepositMethod(amount)
  .accounts({
    // Your program accounts
    userAccount: userAccount,

    // Jupiter Lend accounts (from context)
    signer: depositContext.signer,
    depositorTokenAccount: depositContext.depositorTokenAccount,
    recipientTokenAccount: depositContext.recipientTokenAccount,
    lendingAdmin: depositContext.lendingAdmin,
    lending: depositContext.lending,
    fTokenMint: depositContext.fTokenMint,
    // ... all other accounts from context

    lendingProgram: new PublicKey(
      "jup3YeL8QhtSx1e253b2FDvsMNC87fDrgQZivbrndc9"
    ),
  })
  .rpc();
```

---

## Read Functions

The Jupiter Lend SDK provides several read functions to query protocol data and user positions. These are helpful for displaying information on your frontend.

### Get All Lending Tokens

Retrieves all available lending tokens in the Jupiter Lend Earn protocol.

**Note**: The `getLendingTokens` function returns an array of `PublicKey` objects.

```typescript
import { getLendingTokens } from "@jup-ag/lend/earn";

const allTokens = await getLendingTokens({ connection });
```

**Response**:
```typescript
[
    PublicKey,
    PublicKey,
    ...
]
```

### Get Token Details

Fetches detailed information about a specific lending token.

```typescript
import { getLendingTokenDetails } from "@jup-ag/lend/earn";

const tokenDetails = await getLendingTokenDetails({
    lendingToken: new PublicKey("9BEcn9aPEmhSPbPQeFGjidRiEKki46fVQDyPpSQXPA2D"), // allTokens[x]
    connection,
});
```

**Response**:
```typescript
{
  id: number; // ID of jlToken, starts from 1
  address: PublicKey; // Address of jlToken
  asset: PublicKey; // Address of underlying asset
  decimals: number; // Decimals of asset (same as jlToken decimals)
  totalAssets: BN; // Total underlying assets in the pool
  totalSupply: BN; // Total shares supply
  convertToShares: BN; // Multiplier to convert assets to shares
  convertToAssets: BN; // Multiplier to convert shares to assets
  rewardsRate: BN; // Rewards rate (1e4 decimals, 1e4 = 100%)
  supplyRate: BN; // Supply APY rate (1e4 decimals, 1e4 = 100%)
}
```

### Get User Position

Retrieves a user's lending position for a specific asset.

```typescript
import { getUserLendingPositionByAsset } from "@jup-ag/lend/earn";

const userPosition = await getUserLendingPositionByAsset({
    asset: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), // Underlying asset
    user: signer.publicKey, // User's wallet address
    connection,
});
```

**Response**:
```typescript
{
  lendingTokenShares: BN; // User's shares in jlToken
  underlyingAssets: BN; // User's underlying assets
  underlyingBalance: BN; // User's underlying balance
}
```

---

## References
- [Lend API Endpoints](../endpoints/lend.md)
- [Lend API Responses](../responses/lend.md)
- [Lend Liquidation Bot](./lend-liquidation.md)
- [Jupiter Lend SDK Documentation](https://dev.jup.ag/docs/lend/sdk)
