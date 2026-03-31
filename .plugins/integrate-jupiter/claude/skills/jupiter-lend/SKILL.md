---
name: jupiter-lend
version: 0.1.2
description: Interact with Jupiter Lend Protocol. Read-only SDK (@jup-ag/lend-read) for querying liquidity pools, lending markets (jlTokens), and vaults. Write SDK (@jup-ag/lend) for lending (deposit/withdraw) and vault operations (deposit collateral, borrow, repay, manage positions).
homepage: https://jup.ag/lend
metadata:
  protocol: jupiter-lend
  category: defi
  chains: [solana]
---

# Jupiter Lend Protocol

Jupiter Lend (powered by Fluid Protocol) is a lending and borrowing protocol on Solana. It offers **Liquidity Pools**, **Lending Markets (jlTokens)**, and **Vaults** for leveraged positions.

The protocol uses two main SDKs:

- `@jup-ag/lend-read`: Read-only queries for all programs (Liquidity, Lending, Vaults)
- `@jup-ag/lend`: Write operations (deposit, withdraw, borrow, repay)

## Agent usage

Example prompts you can use to demo Jupiter Lend integrations:

- Discover all available vaults and list them
- Fetch all vault positions for a user
- Deposit collateral and borrow in a single transaction
- Repay max debt and withdraw max collateral for a position
- Get user Earn (jlToken) positions and underlying balances
- Build a flashloan for arbitrage or liquidation
- Get liquidity rates and APY for a token
- Create a new vault position (positionId 0), deposit collateral, and borrow

## SDK Installation

```bash
# For read operations (queries, prices, positions)
npm install @jup-ag/lend-read

# For write operations (transactions)
npm install @jup-ag/lend
```

---

# 1. Key Concepts & Protocol Jargon

Understanding the architecture and terminology of Jupiter Lend will help you build better integrations.

### Architecture: The Two-Layer Model

- **Liquidity Layer (Single Orderbook)**: The foundational layer where all assets reside. It manages token limits, rate curves, and unified liquidity. Users never interact with this directly.
- **Protocol Layer**: User-facing modules (Lending and Vaults) that sit on top of the Liquidity Layer and interact with it via Cross-Program Invocations (CPIs).

### Terminology

- **jlToken (Jupiter Lend Token)**: The yield-bearing asset you receive when supplying tokens to the Lending protocol (e.g., `jlUSDC`). As interest accrues, the exchange rate increases, making your `jlToken` worth more underlying `USDC`.
- **Exchange Price**: The conversion rate used to translate between "raw" stored amounts and actual token amounts. It continuously increases as interest is earned on supply or accrued on debt.
- **Collateral Factor (CF)**: The maximum Loan-to-Value (LTV) ratio allowed when opening or managing a position.
- **Liquidation Threshold (LT)**: The LTV at which a position becomes undercollateralized and eligible for liquidation.
- **Liquidation Max Limit (LML)**: The absolute maximum LTV limit. If a position's risk ratio exceeds this boundary, it is automatically absorbed by the protocol to protect liquidity providers.
- **Liquidation Penalty**: The discount percentage offered to liquidators when they repay debt on behalf of a risky position.
- **Rebalance**: An operation that synchronizes the upper protocol layer's accounting (Vaults/Lending) with its actual position on the Liquidity layer. It also syncs the orderbook to account for any active accrued rewards.
- **Tick-based Architecture**: The Vaults protocol groups positions into "ticks" based on their risk level (debt-to-collateral ratio). This allows the protocol to efficiently manage risk and process liquidations at scale.
- **Dust Borrow**: A tiny residual amount of debt intentionally kept on positions to handle division rounding complexities.
- **Sentinel Values**: Constants like `MAX_WITHDRAW_AMOUNT` and `MAX_REPAY_AMOUNT` that tell the protocol to dynamically calculate and withdraw/repay the maximum mathematically possible amount for a position.

### Amounts and units

All SDK amounts use **base units** (smallest token unit, e.g. `1_000_000` = 1 USDC for 6 decimals).

---

# 2. Jupiter Earn (Lending)

Jupiter Earn allows users to supply assets to earn yield. In return, users receive yield-bearing `jlTokens` (e.g., `jlUSDC`).

### Lending Module (jlTokens)

Access jlToken (Jupiter Lend token) markets, exchange prices, and user positions.

```typescript
// Get all jlToken details at once
const allDetails = await client.lending.getAllJlTokenDetails();

// Get user's jlToken balance
const position = await client.lending.getUserPosition(USDC, userPublicKey);
```

## Lending (Earn)

Deposit underlying assets to receive yield-bearing tokens, or withdraw them.

```typescript
import { getDepositIxs, getWithdrawIxs } from "@jup-ag/lend/earn";
import BN from "bn.js";

// Deposit 1 USDC (base units: 1_000_000 for 6 decimals)
const { ixs: depositIxs } = await getDepositIxs({
  amount: new BN(1_000_000),
  asset: USDC_PUBKEY,
  signer: userPublicKey,
  connection,
});

// Withdraw 0.1 USDC (100_000 base units @ 6 decimals)
const { ixs: withdrawIxs } = await getWithdrawIxs({
  amount: new BN(100_000),
  asset: USDC_PUBKEY,
  signer: userPublicKey,
  connection,
});
```

---

# 3. Jupiter Borrow (Vaults)

Vaults handle collateral deposits and debt borrowing.

### Vault Module & Discovery

Access vault configurations, positions, exchange prices, and liquidation data. This is crucial for dynamically listing all available leverage markets.

```typescript
// Discover all available vaults
const allVaults = await client.vault.getAllVaults();
const totalVaults = allVaults.length;

// Get comprehensive vault data (config + state + rates + limits) for a specific vault
const vaultId = 1;
const vaultData = await client.vault.getVaultByVaultId(vaultId);

// Check borrowing limits dynamically before prompting users
const borrowLimit = vaultData.limitsAndAvailability.borrowLimit;
const borrowable = vaultData.limitsAndAvailability.borrowable;
```

---

### Finding User Vault Positions

Before making Vault operations (like deposit, borrow, or repay), you need to know a user's existing `positionId` (which maps to an NFT).

```typescript
const userPublicKey = new PublicKey("YOUR_WALLET_PUBKEY");

// Retrieve all positions owned by the user
// Each position includes full vault data: NftPosition & { vault: VaultEntireData }
const positions = await client.vault.getAllUserPositions(userPublicKey);

positions.forEach((p) => {
  console.log(`Position ID (nftId): ${p.nftId}`);
  console.log(`Vault ID: ${p.vault.constantViews.vaultId}`);
  console.log(`Collateral Supplied: ${p.supply.toString()}`);
  console.log(`Debt Borrowed: ${p.borrow.toString()}`);
});
```

## Vaults (Borrow)

Vaults handle collateral deposits and debt borrowing. **All vault operations use the `getOperateIx` function.**

The direction of the operation is determined by the sign of `colAmount` and `debtAmount`:

- **Deposit**: `colAmount` > 0, `debtAmount` = 0
- **Withdraw**: `colAmount` < 0, `debtAmount` = 0
- **Borrow**: `colAmount` = 0, `debtAmount` > 0
- **Repay**: `colAmount` = 0, `debtAmount` < 0

**Sentinels**: `MAX_REPAY_AMOUNT` and `MAX_WITHDRAW_AMOUNT` are already signed (negative); pass them as-is—do not call `.neg()` on them.

**Important**: If `positionId` is `0`, a new position NFT is created, and the SDK returns the new `positionId`.

### Common Vault Patterns

**1. Deposit Collateral**

```typescript
import { getOperateIx } from "@jup-ag/lend/borrow";

// Deposit 1 USDC (base units: 1_000_000 for 6 decimals)
const { ixs, addressLookupTableAccounts, positionId: newPositionId } = await getOperateIx({
  vaultId: 1,
  positionId: 0, // 0 = create new position
  colAmount: new BN(1_000_000), // Positive = Deposit
  debtAmount: new BN(0),
  connection,
  signer,
});
```

**2. Borrow Debt**

```typescript
// Borrow 0.5 USDC (500_000 base units @ 6 decimals)
const { ixs, addressLookupTableAccounts } = await getOperateIx({
  vaultId: 1,
  positionId: EXISTING_POSITION_ID, // Use the nftId retrieved from the read SDK
  colAmount: new BN(0),
  debtAmount: new BN(500_000), // Positive = Borrow (0.5 USDC @ 6 decimals)
  connection,
  signer,
});
```

**3. Repay Debt (Using Max Sentinel)**
When users want to repay their *entire* debt, do not try to calculate exact dust amounts. Use the `MAX_REPAY_AMOUNT` sentinel exported by the SDK.

```typescript
import { getOperateIx, MAX_REPAY_AMOUNT } from "@jup-ag/lend/borrow";

const { ixs, addressLookupTableAccounts } = await getOperateIx({
  vaultId: 1,
  positionId: EXISTING_POSITION_ID,
  colAmount: new BN(0),
  debtAmount: MAX_REPAY_AMOUNT, // Tells the protocol to clear the full debt
  connection,
  signer,
});
```

**4. Withdraw Collateral (Using Max Sentinel)**
Similarly, to withdraw all available collateral, use the `MAX_WITHDRAW_AMOUNT` sentinel.

```typescript
import { getOperateIx, MAX_WITHDRAW_AMOUNT } from "@jup-ag/lend/borrow";

const { ixs, addressLookupTableAccounts } = await getOperateIx({
  vaultId: 1,
  positionId: EXISTING_POSITION_ID,
  colAmount: MAX_WITHDRAW_AMOUNT, // Tells the protocol to withdraw everything
  debtAmount: new BN(0),
  connection,
  signer,
});
```

**5. Combined operate**

You can batch multiple operations—such as depositing + borrowing, or repaying + withdrawing—in a single transaction using `getOperateIx`:

- **a. Deposit + Borrow in one Tx:**
Pass both `colAmount` and `debtAmount` to deposit collateral and borrow simultaneously.
  ```typescript
  const { ixs, addressLookupTableAccounts } = await getOperateIx({
    vaultId: 1,
    positionId: 0, // Create new position
    colAmount: new BN(1_000_000), // Deposit 1 USDC (6 decimals)
    debtAmount: new BN(500_000),  // Borrow 0.5 USDC (6 decimals)
    connection,
    signer,
  });
  ```
- **b. Repay + Withdraw in one Tx:**
Repay debt and withdraw collateral at once. Use max sentinels for a full repayment or to withdraw the maximum available.
  ```typescript
  import { getOperateIx, MAX_WITHDRAW_AMOUNT, MAX_REPAY_AMOUNT } from "@jup-ag/lend/borrow";

  const { ixs, addressLookupTableAccounts } = await getOperateIx({
    vaultId: 1,
    positionId: EXISTING_POSITION_ID,
    colAmount: MAX_WITHDRAW_AMOUNT, // Withdraw all collateral
    debtAmount: MAX_REPAY_AMOUNT,   // Repay all debt
    connection,
    signer,
  });
  ```

---

---

# 4. Flashloans

Flashloans allow you to borrow liquidity from the protocol without requiring upfront collateral. Return the borrowed amount within the exact same transaction—there are **no flashloan fees**. Borrow the asset you need directly for arbitrage, liquidations, or other use cases.

### Executing a Flashloan (@jup-ag/lend)

The `@jup-ag/lend` SDK provides simple helper functions to retrieve the instructions needed to execute a flashloan. The most convenient way is using `getFlashloanIx`.

```typescript
import { getFlashloanIx } from "@jup-ag/lend/flashloan";
import { Connection, PublicKey, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import BN from "bn.js";

async function executeFlashloan() {
  const connection = new Connection("https://api.mainnet-beta.solana.com");
  const signer = new PublicKey("YOUR_WALLET_PUBKEY");
  const asset = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"); // USDC

  const borrowAmount = new BN(100_000_000); // 100 USDC (base units, 6 decimals)

  // 1. Get the borrow and payback instructions
  const { borrowIx, paybackIx } = await getFlashloanIx({
    connection,
    signer,
    asset,
    amount: borrowAmount,
  });

  // 2. Define your custom instructions that utilize the borrowed funds
  const myCustomArbitrageInstructions = [
    // ... your instructions here
  ];

  // 3. Assemble the transaction: Borrow -> Custom Logic -> Payback
  const instructions = [
    borrowIx,
    ...myCustomArbitrageInstructions,
    paybackIx
  ];

  const latestBlockhash = await connection.getLatestBlockhash();
  const message = new TransactionMessage({
    payerKey: signer,
    recentBlockhash: latestBlockhash.blockhash,
    instructions,
  }).compileToV0Message();

  const transaction = new VersionedTransaction(message);
  // Sign and send...
}
```

---

# 5. Liquidity

The Liquidity layer is the foundation of Jupiter Lend, holding all the underlying assets. While you usually interact with the Earn and Borrow layers, querying the Liquidity layer directly is highly useful for analytics, dashboards, and APY aggregators.

### Liquidity Module

Access liquidity pool data, interest rates, and user supply/borrow positions.

```typescript
const USDC = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

// Get market data for a token (rates, prices, utilization)
const data = await client.liquidity.getOverallTokenData(USDC);

// View rates (basis points: 10000 = 100%)
const supplyApr = Number(data.supplyRate) / 100;
const borrowApr = Number(data.borrowRate) / 100;
```

---

# 6. Jupiter Lend Build Kit

The Jupiter Lend Build Kit offers developer components, powerful utilities, and in-depth documentation to help you build and integrate with Jupiter Lend efficiently.

**Base URL**: [https://dev.jup.ag/docs/lend](https://dev.jup.ag/docs/lend)

### Build Kit Documentation Index

- **Getting started**: [overview](https://dev.jup.ag/docs/lend), [API vs SDK](https://dev.jup.ag/docs/lend/api-vs-sdk)
- **Earn**: [overview](https://dev.jup.ag/docs/lend/earn), [deposit](https://dev.jup.ag/docs/lend/earn/deposit), [withdraw](https://dev.jup.ag/docs/lend/earn/withdraw), [read data](https://dev.jup.ag/docs/lend/earn/read-data)
- **Wallet integrations (Privy)**: [Earn with Privy](https://dev.jup.ag/docs/lend/wallets/privy-earn), [Borrow with Privy](https://dev.jup.ag/docs/lend/wallets/privy-borrow)
- **Borrow**: [overview](https://dev.jup.ag/docs/lend/borrow), [create position](https://dev.jup.ag/docs/lend/borrow/create-position), [deposit](https://dev.jup.ag/docs/lend/borrow/deposit), [borrow](https://dev.jup.ag/docs/lend/borrow/borrow), [repay](https://dev.jup.ag/docs/lend/borrow/repay), [withdraw](https://dev.jup.ag/docs/lend/borrow/withdraw), [combined operate](https://dev.jup.ag/docs/lend/borrow/combined), [liquidate](https://dev.jup.ag/docs/lend/borrow/liquidation), [read vault data](https://dev.jup.ag/docs/lend/borrow/read-vault-data)
- **Flashloan**: [overview](https://dev.jup.ag/docs/lend/flashloan), [execute](https://dev.jup.ag/docs/lend/flashloan/execute)
- **Advanced**: [advanced/multiply](https://dev.jup.ag/docs/lend/advanced/multiply), [advanced/unwind](https://dev.jup.ag/docs/lend/advanced/unwind), [advanced/repay-withdraw-collateral](https://dev.jup.ag/docs/lend/advanced/repay-with-collateral-max-withdraw), [advanced/vault-swap](https://dev.jup.ag/docs/lend/advanced/vault-swap), [advanced/utilization-after-deposit](https://dev.jup.ag/docs/lend/advanced/utilization-after-deposit), [advanced/native-staked-vault/overview](https://dev.jup.ag/docs/lend/advanced/native-staked-vault/overview), [advanced/native-staked-vault/deposit](https://dev.jup.ag/docs/lend/advanced/native-staked-vault/deposit), [advanced/native-staked-vault/withdraw](https://dev.jup.ag/docs/lend/advanced/native-staked-vault/withdraw)
- **Liquidity**: [liquidity/analytics](https://dev.jup.ag/docs/lend/liquidity/analytics)
- **Resources**: [resources/program-addresses](https://dev.jup.ag/docs/lend/resources/program-addresses), [resources/idl-and-types](https://dev.jup.ag/docs/lend/resources/idl-and-types), [resources/dune](https://dev.jup.ag/docs/lend/resources/dune)

---

# 7. Complete Working Examples

> Copy-paste-ready scripts. Install dependencies: `npm install @solana/web3.js bn.js @jup-ag/lend @jup-ag/lend-read`

### Example 1 — Discover Position and Deposit (Read then Write)

This example demonstrates how to use the read-only SDK (`@jup-ag/lend-read`) to query a user's existing vault positions. If a position for the target vault exists, it uses that NFT ID. If not, it falls back to creating a new position. Finally, it uses the write SDK (`@jup-ag/lend`) to deposit collateral into the position.

```typescript
import {
  Connection,
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import BN from "bn.js";
import { Client } from "@jup-ag/lend-read";
import { getOperateIx } from "@jup-ag/lend/borrow";
import fs from "fs";
import path from "path";

const KEYPAIR_PATH = "/path/to/your/keypair.json";
const RPC_URL = "https://api.mainnet-beta.solana.com";
const VAULT_ID = 1;

const DEPOSIT_AMOUNT = new BN(1_000_000); // 1 USDC @ 6 decimals

function loadKeypair(keypairPath: string): Keypair {
  const fullPath = path.resolve(keypairPath);
  const secret = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  return Keypair.fromSecretKey(new Uint8Array(secret));
}

async function main() {
  const userKeypair = loadKeypair(KEYPAIR_PATH);
  const connection = new Connection(RPC_URL, { commitment: "confirmed" });
  const signer = userKeypair.publicKey;

  // 1. Read Data: Find existing user positions for the vault
  const client = new Client(connection);
  const positions = await client.vault.getAllUserPositions(signer);

  let targetPositionId = 0; // 0 = create new position

  const existing = positions.find((p) => p.vault.constantViews.vaultId === VAULT_ID);
  if (existing) {
    targetPositionId = existing.nftId;
    console.log(`Found existing position NFT: ${targetPositionId}`);
  }

  if (targetPositionId === 0) {
    console.log("No existing position found. Will create a new one.");
  }

  // 2. Write Data: Execute deposit
  const { ixs, addressLookupTableAccounts, nftId } = await getOperateIx({
    vaultId: VAULT_ID,
    positionId: targetPositionId,
    colAmount: DEPOSIT_AMOUNT,
    debtAmount: new BN(0), // Deposit only
    connection,
    signer,
  });

  if (!ixs?.length) throw new Error("No instructions returned.");

  // 3. Build the V0 Transaction Message
  const latestBlockhash = await connection.getLatestBlockhash();
  const message = new TransactionMessage({
    payerKey: signer,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: ixs,
  }).compileToV0Message(addressLookupTableAccounts ?? []);

  // 4. Sign and Send
  const transaction = new VersionedTransaction(message);
  transaction.sign([userKeypair]);

  const signature = await connection.sendTransaction(transaction, {
    skipPreflight: false,
    maxRetries: 3,
    preflightCommitment: "confirmed",
  });

  await connection.confirmTransaction({ signature, ...latestBlockhash }, "confirmed");

  console.log(`Deposit successful! Signature: ${signature}`);
  if (targetPositionId === 0) {
    console.log(`New position created with NFT ID: ${nftId}`);
  }
}

main().catch(console.error);
```

---

### Example 2 — Combined Operations (Deposit, Borrow, Repay, Withdraw)

This example demonstrates how to create a position, deposit collateral, and borrow debt in a single transaction. Then, it repays the debt and withdraws the collateral using the exact same `getOperateIx` function in a follow-up transaction. It also shows the critical step of **deduplicating Address Lookup Tables (ALTs)** when merging multiple instruction sets.

```typescript
import {
  Connection,
  Keypair,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import BN from "bn.js";
import { getOperateIx } from "@jup-ag/lend/borrow";
import fs from "fs";
import path from "path";

const KEYPAIR_PATH = "/path/to/your/keypair.json";
const RPC_URL = "https://api.mainnet-beta.solana.com";
const VAULT_ID = 1;

const DEPOSIT_AMOUNT = new BN(1_000_000);  // 1 USDC @ 6 decimals
const BORROW_AMOUNT = new BN(500_000);    // 0.5 USDC @ 6 decimals
const REPAY_AMOUNT = new BN(100_000);     // 0.1 USDC @ 6 decimals
const WITHDRAW_AMOUNT = new BN(200_000);  // 0.2 USDC @ 6 decimals

function loadKeypair(keypairPath: string): Keypair {
  const fullPath = path.resolve(keypairPath);
  const secret = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  return Keypair.fromSecretKey(new Uint8Array(secret));
}

async function main() {
  const userKeypair = loadKeypair(KEYPAIR_PATH);
  const connection = new Connection(RPC_URL, { commitment: "confirmed" });
  const signer = userKeypair.publicKey;

  // 1. Create position + Deposit + Borrow
  const { ixs: depositBorrowIxs, addressLookupTableAccounts: depositBorrowAlts, positionId } = await getOperateIx({
    vaultId: VAULT_ID,
    positionId: 0,
    colAmount: DEPOSIT_AMOUNT,
    debtAmount: BORROW_AMOUNT,
    connection,
    signer,
  });

  // 2. Repay + Withdraw
  const repayWithdrawResult = await getOperateIx({
    vaultId: VAULT_ID,
    positionId: positionId!,
    colAmount: WITHDRAW_AMOUNT.neg(),
    debtAmount: REPAY_AMOUNT.neg(),
    connection,
    signer,
  });

  // Merge instructions
  const allIxs = [...(depositBorrowIxs ?? []), ...(repayWithdrawResult.ixs ?? [])];

  // Merge and Deduplicate Address Lookup Tables (ALTs)
  const allAlts = [
    ...(depositBorrowAlts ?? []),
    ...(repayWithdrawResult.addressLookupTableAccounts ?? []),
  ];
  const seenKeys = new Set<string>();
  const mergedAlts = allAlts.filter((alt) => {
    const k = alt.key.toString();
    if (seenKeys.has(k)) return false;
    seenKeys.add(k);
    return true;
  });

  if (!allIxs.length) throw new Error("No instructions returned.");

  // Build the V0 Transaction Message
  const latestBlockhash = await connection.getLatestBlockhash();
  const message = new TransactionMessage({
    payerKey: signer,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: allIxs,
  }).compileToV0Message(mergedAlts);

  // Sign and Send
  const transaction = new VersionedTransaction(message);
  transaction.sign([userKeypair]);

  const signature = await connection.sendTransaction(transaction, {
    skipPreflight: false,
    maxRetries: 3,
    preflightCommitment: "confirmed",
  });

  await connection.confirmTransaction({ signature, ...latestBlockhash }, "confirmed");

  console.log("Combined operate successful! Signature:", signature);
}

main().catch(console.error);
```

---

# 8. Resources

## API Documentation

- **Jupiter Lend Overview**: [dev.jup.ag/docs/lend](https://dev.jup.ag/docs/lend)
- **Lend API (Earn)**: [api-reference/lend/earn](https://dev.jup.ag/api-reference/lend/earn) | REST API for Earn operations (deposit/withdraw/mint/redeem, tokens, positions, earnings)
- **Lend API (Borrow)**: *(Coming Soon)*

## SDKs

- **Read SDK (`@jup-ag/lend-read`)**: [NPM](https://www.npmjs.com/package/@jup-ag/lend-read) | Read-only SDK for querying liquidity pools, lending markets (jlTokens), and vaults
- **Write SDK (`@jup-ag/lend`)**: [NPM](https://www.npmjs.com/package/@jup-ag/lend) | Core SDK for building write transactions (deposits, withdraws, operates)

## Smart Contracts

- **Public Repository**: [Instadapp/fluid-solana-programs](https://github.com/Instadapp/fluid-solana-programs/)
- **IDLs and Types**: [IDLs & types (`/target` folder)](https://github.com/jup-ag/jupiter-lend/tree/main/target)

## Program IDs (Mainnet)


| Program                   | Address                                       |
| ------------------------- | --------------------------------------------- |
| Liquidity                 | `jupeiUmn818Jg1ekPURTpr4mFo29p46vygyykFJ3wZC` |
| Lending(Earn)             | `jup3YeL8QhtSx1e253b2FDvsMNC87fDrgQZivbrndc9` |
| Lending Reward Rate Model | `jup7TthsMgcR9Y3L277b8Eo9uboVSmu1utkuXHNUKar` |
| Vaults(Borrow)            | `jupr81YtYssSyPt8jbnGuiWon5f6x9TcDEFxYe3Bdzi` |
| Oracle                    | `jupnw4B6Eqs7ft6rxpzYLJZYSnrpRgPcr589n5Kv4oc` |
| Flashloan                 | `jupgfSgfuAXv4B6R2Uxu85Z1qdzgju79s6MfZekN6XS` |
