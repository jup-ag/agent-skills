# Payment Execution

Use this guide after the user wants to submit a verification or metadata request and has confirmed the paying wallet details.

For request-field requirements, accepted input formats, normalization rules, and `tokenMetadata` fields, use [API Reference](api-reference.md). This guide is only for the local signing and execution mechanics.

The guide relies only on these routes:

- `GET /express/check-eligibility`
- `GET /payments/express/craft-txn`
- `POST /payments/express/execute`

Precondition:

- the selected submission mode is already known (`verification`, `verification+metadata`, or `metadata-only`)
- the user has already provided the paying wallet
- the user has confirmed that wallet holds at least 1 JUP plus a small amount of SOL for fees

## 1. Wallet Source

The user provides their wallet keypair source. Two formats are supported:

- **Keypair JSON file** — a file path to a Solana keypair JSON array (e.g. `~/.config/solana/id.json`)
- **Environment variable** — an env var name containing a base58 private key (e.g. `PRIVATE_KEY` in `.env`)

Security rules:

- never accept a raw private key pasted in chat
- never read secret values into agent context
- only record file paths and env var names
- the signing key stays local; only the signed transaction is submitted

## 2. Preflight the Execution Environment

Before running the script:

- if HTTP or local file access is blocked by the current agent environment, request the required approval or hand the local execution steps to the user
- the script requires `@solana/web3.js@1`, `@solana/spl-token`, and `bs58` as dependencies
- prefer a plain ESM script saved as `pay.mjs`
- if the user's project already has these packages, no additional installation is needed
- equivalent package-manager or shell commands are fine

If the user does not already have the required packages:

```bash
npm install @solana/web3.js@1 @solana/spl-token bs58
```

Ensure the working directory is ESM-compatible (`"type": "module"` in `package.json`) or use the `.mjs` extension.

## 3. Write `pay.mjs`

The script should:

1. load the keypair from the user's wallet source
2. derive the wallet address locally and abort if it does not match the expected address
3. call `GET /payments/express/craft-txn?senderAddress={derivedWallet}`
4. deserialize and verify the returned transaction before signing (security requirement)
5. sign locally
6. call `POST /payments/express/execute`
7. print the result

The agent fills in the constant values at the top of the template from the conversation context. Normalize `twitterHandle` and `senderTwitterHandle` to `https://x.com/{handle}` format before writing them into the script (see [API Reference](api-reference.md) for normalization rules).

The script must include these comments:

```javascript
// SECURITY: Private key is used only for local signing.
// Only the signed transaction is sent to the Jupiter API.
// The private key never leaves this machine.
```

### Template

```javascript
// SECURITY: Private key is used only for local signing.
// Only the signed transaction is sent to the Jupiter API.
// The private key never leaves this machine.

import { Keypair, PublicKey, VersionedTransaction } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import bs58 from "bs58";
import fs from "fs";

// ── Parameters (agent fills these in) ────────────────
const KEYPAIR_PATH = ""; // e.g. "~/.config/solana/id.json" — leave empty if using ENV_KEY
const ENV_KEY = "";      // e.g. "PRIVATE_KEY" — leave empty if using KEYPAIR_PATH
const ENV_FILE = "";     // e.g. ".env" — path to env file, only needed with ENV_KEY
const WALLET_ADDRESS = "";
const TOKEN_ID = "";
const TWITTER_HANDLE = "";        // normalized to https://x.com/{handle}
const SENDER_TWITTER_HANDLE = ""; // optional, normalized
const DESCRIPTION = "";
const TOKEN_METADATA = null;      // optional object, e.g. { tokenId: "...", name: "..." }

// ── Constants ────────────────────────────────────────
const BASE_URL = "https://token-verification-dev-api.jup.ag";
const JUP_MINT = new PublicKey("JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN");
const COMPUTE_BUDGET_PROGRAM_ID = new PublicKey(
  "ComputeBudget111111111111111111111111111111"
);
const MAX_AMOUNT = BigInt(1_000_000);

// ── Load keypair ─────────────────────────────────────
function loadKeypair() {
  if (KEYPAIR_PATH) {
    const resolved = KEYPAIR_PATH.replace(/^~/, process.env.HOME);
    const secret = JSON.parse(fs.readFileSync(resolved, "utf8"));
    return Keypair.fromSecretKey(new Uint8Array(secret));
  }

  if (ENV_KEY) {
    if (ENV_FILE) {
      const resolvedEnv = ENV_FILE.replace(/^~/, process.env.HOME);
      const lines = fs.readFileSync(resolvedEnv, "utf8").split("\n");
      for (const line of lines) {
        const match = line.match(/^\s*(?:export\s+)?([^#=]+?)\s*=\s*(.*)\s*$/);
        if (match && match[1] === ENV_KEY) {
          return Keypair.fromSecretKey(bs58.decode(match[2].replace(/^["']|["']$/g, "")));
        }
      }
    }
    const envValue = process.env[ENV_KEY];
    if (envValue) {
      return Keypair.fromSecretKey(bs58.decode(envValue));
    }
  }

  throw new Error("NO_KEY: Set KEYPAIR_PATH or ENV_KEY at the top of the script");
}

// ── Verify transaction (VRFD security requirement) ───
function verifyTransaction(tx, craftData) {
  const accountKeys = tx.message.staticAccountKeys;
  const mainIxs = tx.message.compiledInstructions.filter(
    (ix) => !accountKeys[ix.programIdIndex].equals(COMPUTE_BUDGET_PROGRAM_ID)
  );

  if (mainIxs.length !== 1) {
    throw new Error("TX_VERIFY_FAILED: unexpected instruction count");
  }

  const ix = mainIxs[0];
  const programId = accountKeys[ix.programIdIndex];
  if (!programId.equals(TOKEN_PROGRAM_ID)) {
    throw new Error("TX_VERIFY_FAILED: unexpected program");
  }

  const data = Buffer.from(ix.data);
  const opcode = data[0];
  if ((opcode !== 3 && opcode !== 12) || data.length < 9) {
    throw new Error("TX_VERIFY_FAILED: not a token transfer");
  }

  const transferAmount = data.readBigUInt64LE(1);
  const expectedAmount = BigInt(craftData.amount);
  if (transferAmount !== expectedAmount || transferAmount > MAX_AMOUNT) {
    throw new Error("TX_VERIFY_FAILED: amount mismatch");
  }

  const destIndex =
    opcode === 12 ? ix.accountKeyIndexes[2] : ix.accountKeyIndexes[1];
  const destination = accountKeys[destIndex];
  const expectedReceiverAta = getAssociatedTokenAddressSync(
    JUP_MINT,
    new PublicKey(craftData.receiverAddress)
  );
  if (!destination.equals(expectedReceiverAta)) {
    throw new Error("TX_VERIFY_FAILED: destination mismatch");
  }
}

// ── Sign and execute ─────────────────────────────────
async function signAndExecute(txBase64, wallet, craftData, executeParams) {
  const tx = VersionedTransaction.deserialize(
    Buffer.from(txBase64, "base64")
  );

  verifyTransaction(tx, craftData);

  tx.sign([wallet]);

  const res = await fetch(`${BASE_URL}/payments/express/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transaction: Buffer.from(tx.serialize()).toString("base64"),
      requestId: craftData.requestId,
      ...executeParams,
    }),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { message: text };
  }

  if (res.ok && data.status === "Success") return data;
  throw new Error(`EXECUTE_FAILED: ${JSON.stringify(data)}`);
}

// ── Main ─────────────────────────────────────────────
async function main() {
  const wallet = loadKeypair();
  const senderAddress = wallet.publicKey.toBase58();

  if (senderAddress !== WALLET_ADDRESS) {
    throw new Error(
      `WALLET_MISMATCH: ${senderAddress} != ${WALLET_ADDRESS}`
    );
  }

  const craftRes = await fetch(
    `${BASE_URL}/payments/express/craft-txn?senderAddress=${encodeURIComponent(
      senderAddress
    )}`
  );
  if (!craftRes.ok) {
    throw new Error(
      `CRAFT_FAILED: ${craftRes.status}: ${await craftRes.text()}`
    );
  }
  const craftData = await craftRes.json();

  const result = await signAndExecute(
    craftData.transaction,
    wallet,
    craftData,
    {
      senderAddress,
      tokenId: TOKEN_ID,
      twitterHandle: TWITTER_HANDLE,
      description: DESCRIPTION,
      ...(SENDER_TWITTER_HANDLE
        ? { senderTwitterHandle: SENDER_TWITTER_HANDLE }
        : {}),
      ...(TOKEN_METADATA ? { tokenMetadata: TOKEN_METADATA } : {}),
    }
  );

  console.log(
    `SUCCESS:${JSON.stringify({
      signature: result.signature,
      verificationCreated: Boolean(result.verificationCreated),
      metadataCreated: Boolean(result.metadataCreated),
    })}`
  );
}

main().catch((err) => {
  console.error(`ERROR:${err.message}`);
  process.exit(1);
});
```

## 4. Run the Script

```bash
node pay.mjs
```

Notes:

- if the script fails with `fetch failed`, rerun it with the environment's required network approval or escalation
- if the environment uses another package manager or runtime, equivalent commands are fine

Fallback for Node 22+ when the file is saved as `pay.ts`:

```bash
node --experimental-strip-types pay.ts
```

Parse the output:

- `SUCCESS:<json>` means the request was accepted. The JSON payload includes `signature`, `verificationCreated`, and `metadataCreated`.
- `ERROR:<message>` means the flow failed.

## 5. Report

On success, report:

- Solana transaction signature
- token mint
- whether `verificationCreated` was `true`
- whether `metadataCreated` was `true`

If the agent had to hand the script to the user instead of running it locally, clearly state that the request was not executed by the agent.

Useful failure buckets:

| Error | Likely cause |
| --- | --- |
| `NO_KEY` | KEYPAIR_PATH and ENV_KEY are both empty |
| `WALLET_MISMATCH` | Wallet address does not match signing key |
| `CRAFT_FAILED` | Invalid wallet, insufficient balance, or upstream failure |
| `TX_VERIFY_FAILED` | Crafted transaction did not match expectations |
| `EXECUTE_FAILED` | Expired transaction, eligibility conflict, or execution failure |
| `fetch failed` | Outbound network blocked; rerun with the environment's required approval |
