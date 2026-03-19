# Express Payment Execution

When the user has confirmed an **express** verification request, the agent executes the payment end-to-end. The wallet address was already collected in Step 6d of the main flow.

## 7a. Resolve Private Key

The agent resolves the user's private key using this priority order:

1. **Check `.env` files** — Look for a `PRIVATE_KEY` or `SOLANA_PRIVATE_KEY` variable in `.env`, `.env.local`, or similar files in the current project directory. If found, use it directly.
2. **Check for keypair file** — Look for a Solana keypair JSON file (e.g., `~/.config/solana/id.json` or a path provided by the user). Load the keypair using `Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(path, 'utf8'))))`.
3. **Ask the user** — If no key is found via either method, ask the user to either:
   - Set it in a `.env` file (e.g., `PRIVATE_KEY=<base58-key>`) and the agent will read it from there
   - Provide the path to a Solana keypair JSON file

> **NEVER accept a private key directly in chat.** If a user pastes a raw private key in the conversation, warn them that this is insecure (keys persist in chat history and may be logged) and instruct them to use a `.env` file or keypair file path instead. Do not use the pasted key.

Once the private key is obtained, derive the wallet address from it (via `Keypair.fromSecretKey`) and confirm it matches the wallet address collected in Step 6d. If they don't match, warn the user and ask which to use.

> **Private Key Security Rules:**
> - The private key MUST stay local. It is NEVER sent to any server, API, or external service.
> - The key is used ONLY to sign the transaction on the user's machine. Only the **signed transaction** (not the key) is sent to the Jupiter API.
> - The script runs entirely locally — it reads the key, signs, and sends only the signed output.
> - Recommend the user use a dedicated wallet with minimal funds, not their main holdings wallet.
> - If the key is in a `.env` file, remind the user to ensure `.env` is in `.gitignore`.

## 7b. Set Up Execution Environment

Create a temporary directory and install dependencies:

```bash
TMPDIR=$(mktemp -d /tmp/jup-verify-XXXXXX)
cd "$TMPDIR" && npm init -y && npm install @solana/web3.js @solana/spl-token bs58
```

## 7c. Write the Payment Script

Write a `pay.ts` script and a separate `config.json` file in the temp directory. The config file contains all user-provided parameters. The script reads parameters from `config.json` at runtime — user input is NEVER interpolated into source code to prevent code injection. The script must:

1. Read the private key from an environment variable (`PRIVATE_KEY`) or keypair file path (`KEYPAIR_PATH`) passed at runtime
2. Derive the wallet address from the private key using `Keypair.fromSecretKey`
3. Call `GET /payments/express/craft-txn?senderAddress={derived-wallet}` with `x-api-key` header to get the unsigned transaction
4. Deserialize as a `VersionedTransaction` (matching the production UI implementation)
5. Verify the transaction contents before signing: decode the compiled instructions, confirm there is exactly one SPL Token transfer instruction (plus optional compute budget instructions), confirm the amount does not exceed 1 JUP, confirm the destination matches the expected receiver ATA, and reject if any unexpected instructions are present
6. Sign locally with `transaction.sign([keypair])` and serialize
7. Call `POST /payments/express/execute` with `x-api-key` header, the signed transaction, and all verification parameters
8. Print `SUCCESS:<signature>` on success or `ERROR:<code>:<message>` on failure

The script MUST include these security comments:

```typescript
// SECURITY: Private key is used ONLY for local signing.
// Only the signed transaction is sent to the Jupiter API.
// The private key NEVER leaves this machine.
```

**Template script:**

```typescript
// SECURITY: Private key is used ONLY for local signing.
// Only the signed transaction is sent to the Jupiter API.
// The private key NEVER leaves this machine.

import { Keypair, PublicKey, VersionedTransaction } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import bs58 from "bs58";
import fs from "fs";

const BASE_URL = "https://token-verification-dev-api.jup.ag";
const JUP_MINT = new PublicKey("JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN");
const COMPUTE_BUDGET_PROGRAM_ID = new PublicKey(
  "ComputeBudget111111111111111111111111111111"
);

// Read parameters from config file — NEVER interpolate user input into source code
// Only fields the user provided are included; missing fields are omitted from the request
const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
const TOKEN_ID: string = config.tokenId;
const TWITTER_HANDLE: string | undefined = config.twitterHandle ?? undefined;
const SENDER_TWITTER: string | undefined = config.senderTwitterHandle ?? undefined;
const DESCRIPTION: string | undefined = config.description ?? undefined;
const TOKEN_METADATA: Record<string, unknown> | undefined = config.tokenMetadata ?? undefined;

// Read private key from environment variable or keypair file — NEVER hardcoded in source
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const KEYPAIR_PATH = process.env.KEYPAIR_PATH;
if (!PRIVATE_KEY && !KEYPAIR_PATH) {
  console.error(
    "ERROR:NO_KEY:Set PRIVATE_KEY or KEYPAIR_PATH environment variable"
  );
  process.exit(1);
}

// Read API key from environment variable — required for authenticated endpoints
const API_KEY = process.env.JUPITER_API_KEY;
if (!API_KEY) {
  console.error(
    "ERROR:NO_API_KEY:Set JUPITER_API_KEY environment variable"
  );
  process.exit(1);
}

async function main() {
  // Derive wallet from private key
  let keypair: Keypair;
  if (PRIVATE_KEY) {
    keypair = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));
  } else {
    const secret = JSON.parse(fs.readFileSync(KEYPAIR_PATH!, "utf8"));
    keypair = Keypair.fromSecretKey(new Uint8Array(secret));
  }
  const senderAddress = keypair.publicKey.toBase58();
  console.log(`Wallet: ${senderAddress}`);

  // Step 1: Craft the unsigned payment transaction
  const craftRes = await fetch(
    `${BASE_URL}/payments/express/craft-txn?senderAddress=${senderAddress}`,
    {
      headers: { "x-api-key": API_KEY },
    }
  );

  if (!craftRes.ok) {
    const err = await craftRes.text();
    console.error(`ERROR:CRAFT_FAILED:${craftRes.status} ${err}`);
    process.exit(1);
  }

  const craftData = await craftRes.json();
  const { transaction: unsignedTxBase64, requestId } = craftData;

  if (!unsignedTxBase64 || !requestId) {
    console.error("ERROR:CRAFT_FAILED:Missing transaction or requestId in response");
    process.exit(1);
  }

  console.log(`Request ID: ${requestId}`);
  console.log(`Payment: ${craftData.amount} base units of JUP`);

  // Step 2: Deserialize as VersionedTransaction (matches production UI implementation)
  const txBuffer = Buffer.from(unsignedTxBase64, "base64");
  const transaction = VersionedTransaction.deserialize(txBuffer);

  // Step 3: Verify transaction contents before signing
  // SECURITY: Never blindly sign a server-provided transaction
  const accountKeys = transaction.message.staticAccountKeys;
  const compiledIxs = transaction.message.compiledInstructions;

  // Separate compute budget instructions from main instructions
  const mainIxs = compiledIxs.filter(
    (ix) => !accountKeys[ix.programIdIndex].equals(COMPUTE_BUDGET_PROGRAM_ID)
  );

  // Expect exactly one main instruction (SPL Token Transfer)
  if (mainIxs.length !== 1) {
    console.error(
      `ERROR:TX_VERIFY_FAILED:Expected 1 main instruction, found ${mainIxs.length}`
    );
    process.exit(1);
  }

  const ix = mainIxs[0];
  const programId = accountKeys[ix.programIdIndex];

  // Verify it is an SPL Token program instruction
  if (!programId.equals(TOKEN_PROGRAM_ID)) {
    console.error(
      `ERROR:TX_VERIFY_FAILED:Unexpected program ${programId.toBase58()}, expected SPL Token ${TOKEN_PROGRAM_ID.toBase58()}`
    );
    process.exit(1);
  }

  // Decode SPL Token transfer fields from instruction data
  // Transfer (opcode 3): [u8 opcode] [u64 amount], accounts = [source, destination, owner]
  // TransferChecked (opcode 12): [u8 opcode] [u64 amount] [u8 decimals], accounts = [source, mint, destination, owner]
  const data = Buffer.from(ix.data);
  const opcode = data[0];
  let transferAmount: bigint;
  if ((opcode === 3 || opcode === 12) && data.length >= 9) {
    transferAmount = data.readBigUInt64LE(1);
  } else {
    console.error(
      `ERROR:TX_VERIFY_FAILED:Not a Transfer instruction (opcode=${opcode})`
    );
    process.exit(1);
  }

  // Verify amount matches API response and does not exceed 1 JUP
  const expectedAmount = BigInt(craftData.amount);
  const MAX_AMOUNT = BigInt(1_000_000); // 1 JUP = 1,000,000 base units (6 decimals)
  if (transferAmount !== expectedAmount) {
    console.error(
      `ERROR:TX_VERIFY_FAILED:Amount mismatch — transaction has ${transferAmount}, API said ${expectedAmount}`
    );
    process.exit(1);
  }
  if (transferAmount > MAX_AMOUNT) {
    console.error(
      `ERROR:TX_VERIFY_FAILED:Amount ${transferAmount} exceeds maximum ${MAX_AMOUNT}`
    );
    process.exit(1);
  }

  // Verify destination matches expected receiver ATA
  // TransferChecked (opcode 12): accounts[2] is destination
  // Transfer (opcode 3): accounts[1] is destination
  const destAccountIndex = opcode === 12 ? ix.accountKeyIndexes[2] : ix.accountKeyIndexes[1];
  const destinationAccount = accountKeys[destAccountIndex];
  const receiverWallet = new PublicKey(craftData.receiverAddress);
  const expectedReceiverATA = getAssociatedTokenAddressSync(
    JUP_MINT,
    receiverWallet
  );
  if (!destinationAccount.equals(expectedReceiverATA)) {
    console.error(
      `ERROR:TX_VERIFY_FAILED:Destination ${destinationAccount.toBase58()} does not match expected receiver ATA ${expectedReceiverATA.toBase58()}`
    );
    process.exit(1);
  }

  console.log("Transaction verified: single SPL token transfer of 1 JUP ✓");

  // Step 4: Sign the transaction locally
  // SECURITY: Only the signed transaction leaves this machine, NOT the private key
  transaction.sign([keypair]);
  const signedTxBase64 = Buffer.from(transaction.serialize()).toString("base64");

  // Step 5: Execute — server co-signs and broadcasts
  // Only include optional fields that the user actually provided to avoid overriding existing data
  const executeBody: Record<string, unknown> = {
    transaction: signedTxBase64,
    requestId,
    senderAddress,
    tokenId: TOKEN_ID,
  };
  if (TWITTER_HANDLE) executeBody.twitterHandle = TWITTER_HANDLE;
  if (SENDER_TWITTER) executeBody.senderTwitterHandle = SENDER_TWITTER;
  if (DESCRIPTION) executeBody.description = DESCRIPTION;
  if (TOKEN_METADATA) executeBody.tokenMetadata = TOKEN_METADATA;

  const executeRes = await fetch(`${BASE_URL}/payments/express/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    body: JSON.stringify(executeBody),
  });

  const executeData = await executeRes.json();

  if (executeData.status === "Success") {
    console.log(`SUCCESS:${executeData.signature}`);
    console.log(`Verification created: ${executeData.verificationCreated}`);
    console.log(`Metadata created: ${executeData.metadataCreated}`);
  } else {
    console.error(`ERROR:EXECUTE_FAILED:${JSON.stringify(executeData)}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`ERROR:EXCEPTION:${err.message}`);
  process.exit(1);
});
```

Write a `config.json` file in the same temp directory with the collected parameters. For `tokenMetadata`, include the **full merged object** (existing data from `GET /tokenMetadata/getFromRpcAndSearch/{tokenId}` with user updates applied on top) so unchanged fields are preserved:

```json
{
  "tokenId": "<collected token mint>",
  "twitterHandle": "<collected twitter URL — OMIT THIS KEY if user skipped>",
  "senderTwitterHandle": "<collected sender twitter URL — OMIT THIS KEY if user skipped>",
  "description": "<collected description — OMIT THIS KEY if user skipped>",
  "tokenMetadata": {
    "tokenId": "<collected token mint>",
    "name": "<existing or updated value>",
    "symbol": "<existing or updated value>",
    "icon": "<existing or updated value>",
    "tokenDescription": "<existing or updated value>",
    "website": "<existing or updated value>",
    "twitter": "<existing or updated value>",
    "...all other fields from existing data with user updates merged in"
  }
}
```

Use `JSON.stringify()` to write this file, ensuring all user-provided values are properly escaped. NEVER embed user input directly into TypeScript source code — this prevents code injection attacks.

## 7d. Execute the Script

Run the script, passing the private key and API key via environment variables or keypair file path:

```bash
# Using .env private key:
cd "$TMPDIR" && PRIVATE_KEY="<base58-key>" JUPITER_API_KEY="<key>" npx tsx pay.ts

# Using keypair file:
cd "$TMPDIR" && KEYPAIR_PATH="/path/to/keypair.json" JUPITER_API_KEY="<key>" npx tsx pay.ts
```

Fallback if `tsx` is not available:

```bash
cd "$TMPDIR" && PRIVATE_KEY="<base58-key>" JUPITER_API_KEY="<key>" npx ts-node pay.ts
```

Parse the output:
- `SUCCESS:<signature>` → payment succeeded
- `ERROR:<code>:<message>` → payment failed, see error table in 7e

## 7e. Report Result and Clean Up

**On success:**

> Express verification payment submitted!
>
> | Detail          | Value                                                              |
> | --------------- | ------------------------------------------------------------------ |
> | **Signature**   | `{signature}`                                                      |
> | **Explorer**    | `https://solana.fm/tx/{signature}`                                 |
> | **Token**       | `{tokenId}`                                                        |
> | **Status**      | Express verification pending review                                |

**On failure**, map error patterns to likely causes:

| Error Pattern       | Likely Cause                                         | Suggestion                                              |
| ------------------- | ---------------------------------------------------- | ------------------------------------------------------- |
| `NO_KEY`            | Private key not provided                             | Set `PRIVATE_KEY` env var, add to `.env`, or set `KEYPAIR_PATH` to a keypair JSON file |
| `NO_API_KEY`        | API key not provided                                 | Set `JUPITER_API_KEY` env var or add to `.env`           |
| `CRAFT_FAILED:400`  | Invalid wallet or insufficient JUP balance           | Check wallet has ≥1 JUP + small SOL for fees             |
| `CRAFT_FAILED:401`  | Invalid or missing API key                           | Check `JUPITER_API_KEY` is set correctly                  |
| `CRAFT_FAILED:429`  | Rate limited (2 requests/day per key)                | Wait until the next day or use a different API key        |
| `TX_VERIFY_FAILED`  | Transaction contents don't match expectations        | Possible API change or malicious response — do not sign   |
| `EXECUTE_FAILED`    | Transaction expired, network error, or co-sign issue | Re-run the script (crafts a fresh transaction)           |
| `EXCEPTION`         | Script crash (network, dependency issue)             | Check Node.js v18+, check network connectivity           |

**Always clean up** — remove the temp directory to ensure no private key material remains on disk:

```bash
rm -rf "$TMPDIR"
```
