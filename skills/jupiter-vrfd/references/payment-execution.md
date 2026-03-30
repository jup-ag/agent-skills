# Payment Execution

Use this guide after the user wants to submit and has confirmed the paying wallet details.

The guide relies only on these routes:

- `GET /express/check-eligibility`
- `GET /payments/express/craft-txn`
- `POST /payments/express/execute`

Precondition:

- the user has already provided the paying wallet
- the user has confirmed that wallet holds at least 1 JUP plus a small amount of SOL for fees

## 1. Locate the Local Signing Source

Find where the private key is stored without reading its value.

Check in this order:

1. `.env` / `.env.local` for `PRIVATE_KEY` or `SOLANA_PRIVATE_KEY`
2. `~/.config/solana/id.json`
3. a user-provided keypair file path

Security rules:

- never accept a raw private key pasted in chat
- never read secret values into agent context
- only record file paths and env var names
- the signing key stays local; only the signed transaction is submitted

## 2. Preflight the Execution Environment

Before installing packages or calling Jupiter:

- if `curl`, `npm install`, or the execution script fails with DNS, `fetch failed`, or other sandbox-style network errors, rerun with the environment's required approval or escalation
- prefer Node 22+ with `node --experimental-strip-types`; in restricted sandboxes, `tsx` can fail with `listen EPERM ...pipe` because it opens an IPC socket
- make the temp workspace ESM before running `pay.ts`, because `npm init -y` defaults to `"type": "commonjs"` and that breaks `import` syntax in the script

## 3. Set Up a Temporary Workspace

```bash
TMPDIR=$(mktemp -d /tmp/jup-verify-XXXXXX) &&
cd "$TMPDIR" &&
npm init -y &&
npm pkg set type=module &&
npm install @solana/web3.js@1 @solana/spl-token bs58 dotenv tsx
```

## 4. Write `config.json`

Write a config file that contains request parameters and secret locations, never secret values.

```json
{
  "envPath": "/absolute/path/to/.env",
  "envKeyName": "PRIVATE_KEY",
  "walletAddress": "8xDr...",
  "tokenId": "So11111111111111111111111111111111111111112",
  "twitterHandle": "https://x.com/jupiterexchange",
  "senderTwitterHandle": "https://x.com/requester_handle",
  "description": "Official wrapped SOL token",
  "tokenMetadata": {
    "tokenId": "So11111111111111111111111111111111111111112",
    "name": "Wrapped SOL",
    "symbol": "SOL"
  }
}
```

Notes:

- `walletAddress` is the user-facing name for the same value sent to the API as `senderAddress`
- omit optional keys the user did not provide
- if the caller is doing a metadata-only execute request, send `twitterHandle: ""` and `description: ""` because the current execute schema still requires strings
- if `tokenMetadata` is present, pass through the object the user already has; this guide does not fetch or merge metadata via private routes

## 5. Write `pay.ts`

The script should:

1. load env vars from `config.json`
2. load the private key from the user's `.env` or keypair file
3. derive the wallet locally and abort if it does not match `walletAddress`
4. call `GET /payments/express/craft-txn?senderAddress={derivedWallet}`
5. deserialize and verify the returned transaction before signing
6. sign locally
7. call `POST /payments/express/execute`
8. print `SUCCESS:<signature>` on success or `ERROR:<code>:<message>` on failure

The script must include these comments:

```typescript
// SECURITY: Private key is used only for local signing.
// Only the signed transaction is sent to the Jupiter API.
// The private key never leaves this machine.
```

### Template

```typescript
// SECURITY: Private key is used only for local signing.
// Only the signed transaction is sent to the Jupiter API.
// The private key never leaves this machine.

import { Keypair, PublicKey, VersionedTransaction } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import bs58 from "bs58";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const BASE_URL = "https://token-verification-dev-api.jup.ag";
const JUP_MINT = new PublicKey("JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN");
const COMPUTE_BUDGET_PROGRAM_ID = new PublicKey(
  "ComputeBudget111111111111111111111111111111"
);
const MAX_AMOUNT = BigInt(1_000_000);

const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));

if (config.envPath) {
  dotenv.config({ path: path.resolve(config.envPath) });
}

function loadKeypair() {
  if (config.keypairPath) {
    const secret = JSON.parse(
      fs.readFileSync(path.resolve(config.keypairPath), "utf8")
    );
    return Keypair.fromSecretKey(new Uint8Array(secret));
  }

  const keyName = config.envKeyName ?? "PRIVATE_KEY";
  const privateKey = process.env[keyName] ?? process.env.SOLANA_PRIVATE_KEY;
  if (!privateKey) {
    console.error("ERROR:NO_KEY:Missing private key");
    process.exit(1);
  }
  return Keypair.fromSecretKey(bs58.decode(privateKey));
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

async function main() {
  const keypair = loadKeypair();
  const senderAddress = keypair.publicKey.toBase58();

  if (senderAddress !== config.walletAddress) {
    fail(`ERROR:WALLET_MISMATCH:${senderAddress} != ${config.walletAddress}`);
  }

  const craftRes = await fetch(
    `${BASE_URL}/payments/express/craft-txn?senderAddress=${senderAddress}`
  );
  if (!craftRes.ok) {
    fail(`ERROR:CRAFT_FAILED:${craftRes.status}:${await craftRes.text()}`);
  }

  const craftData = await craftRes.json();
  const tx = VersionedTransaction.deserialize(
    Buffer.from(craftData.transaction, "base64")
  );

  const accountKeys = tx.message.staticAccountKeys;
  const mainIxs = tx.message.compiledInstructions.filter(
    (ix) => !accountKeys[ix.programIdIndex].equals(COMPUTE_BUDGET_PROGRAM_ID)
  );

  if (mainIxs.length !== 1) {
    fail(`ERROR:TX_VERIFY_FAILED:unexpected instruction count`);
  }

  const ix = mainIxs[0];
  const programId = accountKeys[ix.programIdIndex];
  if (!programId.equals(TOKEN_PROGRAM_ID)) {
    fail(`ERROR:TX_VERIFY_FAILED:unexpected program`);
  }

  const data = Buffer.from(ix.data);
  const opcode = data[0];
  if ((opcode !== 3 && opcode !== 12) || data.length < 9) {
    fail(`ERROR:TX_VERIFY_FAILED:not a token transfer`);
  }

  const transferAmount = data.readBigUInt64LE(1);
  const expectedAmount = BigInt(craftData.amount);
  if (transferAmount !== expectedAmount || transferAmount > MAX_AMOUNT) {
    fail(`ERROR:TX_VERIFY_FAILED:amount mismatch`);
  }

  const destIndex = opcode === 12 ? ix.accountKeyIndexes[2] : ix.accountKeyIndexes[1];
  const destination = accountKeys[destIndex];
  const expectedReceiverAta = getAssociatedTokenAddressSync(
    JUP_MINT,
    new PublicKey(craftData.receiverAddress)
  );
  if (!destination.equals(expectedReceiverAta)) {
    fail(`ERROR:TX_VERIFY_FAILED:destination mismatch`);
  }

  tx.sign([keypair]);
  const executeBody = {
    transaction: Buffer.from(tx.serialize()).toString("base64"),
    requestId: craftData.requestId,
    senderAddress,
    tokenId: config.tokenId,
    twitterHandle: config.twitterHandle ?? "",
    description: config.description ?? "",
    ...(config.senderTwitterHandle
      ? { senderTwitterHandle: config.senderTwitterHandle }
      : {}),
    ...(config.tokenMetadata ? { tokenMetadata: config.tokenMetadata } : {}),
  };

  const executeRes = await fetch(`${BASE_URL}/payments/express/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(executeBody),
  });

  const executeText = await executeRes.text();
  let executeData = executeText;
  try {
    executeData = JSON.parse(executeText);
  } catch {
    // Keep raw text for error reporting.
  }

  if (executeRes.ok && executeData.status === "Success") {
    console.log(`SUCCESS:${executeData.signature}`);
    return;
  }

  fail(`ERROR:EXECUTE_FAILED:${JSON.stringify(executeData)}`);
}

main().catch((err) => {
  fail(`ERROR:EXCEPTION:${err.message}`);
});
```

## 6. Run the Script

Preferred:

```bash
cd "$TMPDIR" && node --experimental-strip-types pay.ts
```

Notes:

- this requires Node 22+ and the ESM `package.json` change above
- if the script fails with `fetch failed`, rerun it with the environment's required network approval or escalation
- do not default to `tsx` in restricted sandboxes

Fallback:

```bash
cd "$TMPDIR" && npx tsx pay.ts
```

Use the fallback only when the environment allows `tsx` to create its IPC pipe.

Parse the output:

- `SUCCESS:<signature>` means the request was accepted
- `ERROR:<code>:<message>` means the flow failed

## 7. Report and Clean Up

On success, report:

- Solana transaction signature
- token mint
- verification submitted

Useful failure buckets:

| Error | Likely cause |
| --- | --- |
| `NO_KEY` | Missing local signing key |
| `WALLET_MISMATCH` | Wallet address does not match signing key |
| `CRAFT_FAILED` | Invalid wallet, insufficient balance, or upstream failure |
| `TX_VERIFY_FAILED` | Crafted transaction did not match expectations |
| `EXECUTE_FAILED` | Expired transaction, eligibility conflict, or execution failure |
| `EXCEPTION` | Local script or network problem |
| `listen EPERM ...pipe` | `tsx` IPC socket blocked by the sandbox; use `node --experimental-strip-types` instead |
| `fetch failed` | Outbound network blocked; rerun with the environment's required approval or escalation |

Always remove the temp directory after the run:

```bash
rm -rf "$TMPDIR"
```
