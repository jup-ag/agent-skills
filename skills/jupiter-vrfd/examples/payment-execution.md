# Payment Execution

Use this guide after the user wants to submit a verification or metadata request and has confirmed the paying wallet details.

For request-field requirements, accepted input formats, normalization rules, and `tokenMetadata` fields, use [API Reference](api-reference.md). This guide is only for the local signing and execution mechanics.

The guide relies only on these routes:

- `GET /tokens/v2/verify/express/check-eligibility`
- `GET /tokens/v2/verify/express/craft-txn`
- `POST /tokens/v2/verify/express/execute`

Precondition:

- the selected submission mode is already known (`verification`, `verification+metadata`, or `metadata-only`)
- the user has already provided the paying wallet
- the user has confirmed that wallet holds at least 1000 JUP

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
- the script requires `@solana/web3.js@1` and `bs58` as dependencies
- prefer a plain ESM script saved as `submit-verification.mjs`
- if the user's project already has these packages, no additional installation is needed
- equivalent package-manager or shell commands are fine

If the user does not already have the required packages:

```bash
npm install @solana/web3.js@1 bs58
```

**Important**: This script requires `@solana/web3.js` **v1** (the `@1` version range). Version 2 has a completely different API surface — `Keypair`, `VersionedTransaction`, and `Connection` do not exist in v2. If the project already has v2 installed, either install v1 in a separate directory or use the v1 API equivalents.

Ensure the working directory is ESM-compatible (`"type": "module"` in `package.json`) or use the `.mjs` extension.

## 3. Write `submit-verification.mjs`

The script should:

1. load the keypair from the user's wallet source
2. craft the transaction via `GET /tokens/v2/verify/express/craft-txn?senderAddress={wallet}`
3. sign and execute via `POST /tokens/v2/verify/express/execute`
4. print the result

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

import { Keypair, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import fs from "fs";

// ── Parameters (agent fills these in) ────────────────
const KEYPAIR_PATH = ""; // e.g. "~/.config/solana/id.json" — leave empty if using ENV_KEY
const ENV_KEY = ""; // e.g. "PRIVATE_KEY" — leave empty if using KEYPAIR_PATH
const ENV_FILE = ""; // e.g. ".env" — path to env file, only needed with ENV_KEY
const TOKEN_ID = "";
const TWITTER_HANDLE = ""; // normalized to https://x.com/{handle}
const SENDER_TWITTER_HANDLE = ""; // optional, normalized
const DESCRIPTION = "";
const TOKEN_METADATA = null; // optional object, e.g. { tokenId: "...", name: "..." }

// ── Constants ────────────────────────────────────────
const BASE_URL = "https://api.jup.ag";
const API_KEY = process.env.JUPITER_API_KEY; // from portal.jup.ag
if (!API_KEY)
  throw new Error("Missing JUPITER_API_KEY env var — get one at portal.jup.ag");

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
          return Keypair.fromSecretKey(
            bs58.decode(match[2].replace(/^["']|["']$/g, ""))
          );
        }
      }
    }
    const envValue = process.env[ENV_KEY];
    if (envValue) {
      return Keypair.fromSecretKey(bs58.decode(envValue));
    }
  }

  throw new Error(
    "NO_KEY: Set KEYPAIR_PATH or ENV_KEY at the top of the script"
  );
}

// ── Sign and execute ─────────────────────────────────
async function signAndExecute(txBase64, wallet, craftData, executeParams) {
  const tx = VersionedTransaction.deserialize(Buffer.from(txBase64, "base64"));

  // Verify transaction before signing
  if (new Date(craftData.expireAt) <= new Date()) {
    throw new Error(
      "TRANSACTION_EXPIRED: craft-txn expireAt has passed — re-craft"
    );
  }
  console.log(
    `Verification: receiver=${craftData.receiverAddress}, mint=${craftData.mint}, amount=${craftData.amount}`
  );
  if (craftData.mint !== "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN") {
    throw new Error("MINT_MISMATCH: Expected JUP mint");
  }
  if (craftData.amount !== "1000000000") {
    throw new Error("AMOUNT_MISMATCH: Expected 1000000000 (1000 JUP)");
  }

  tx.sign([wallet]);

  const res = await fetch(`${BASE_URL}/tokens/v2/verify/express/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
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

  const craftRes = await fetch(
    `${BASE_URL}/tokens/v2/verify/express/craft-txn?senderAddress=${encodeURIComponent(
      senderAddress
    )}`,
    { headers: { "x-api-key": API_KEY } }
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
node submit-verification.mjs
```

Notes:

- if the script fails with `fetch failed`, rerun it with the environment's required network approval or escalation
- if the environment uses another package manager or runtime, equivalent commands are fine

Fallback for Node 22+ when the file is saved as `submit-verification.ts`:

```bash
node --experimental-strip-types submit-verification.ts
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

| Error                 | Likely cause                                                             |
| --------------------- | ------------------------------------------------------------------------ |
| `NO_KEY`              | KEYPAIR_PATH and ENV_KEY are both empty                                  |
| `WALLET_MISMATCH`     | Wallet address does not match signing key                                |
| `TRANSACTION_EXPIRED` | `craft-txn` `expireAt` has passed; re-craft a new transaction            |
| `MINT_MISMATCH`       | `craft-txn` returned an unexpected mint; do not sign                     |
| `AMOUNT_MISMATCH`     | `craft-txn` returned an unexpected amount; do not sign                   |
| `CRAFT_FAILED`        | Invalid wallet, insufficient balance, or upstream failure                |
| `EXECUTE_FAILED`      | Expired transaction, eligibility conflict, or execution failure          |
| `fetch failed`        | Outbound network blocked; rerun with the environment's required approval |
