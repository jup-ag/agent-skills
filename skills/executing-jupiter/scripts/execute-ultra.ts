#!/usr/bin/env tsx
/**
 * execute-ultra.ts - Execute Ultra orders on Jupiter
 *
 * Usage:
 *   pnpm execute-ultra --request-id "UUID" --signed-tx "BASE64_SIGNED_TX"
 *
 * This script:
 *   1. Takes the requestId from /ultra/v1/order response
 *   2. Takes the signed transaction (sign with wallet-sign.ts first)
 *   3. POSTs to /ultra/v1/execute
 *   4. Returns execution result
 */

import { Command } from "commander";
import {
  CliError,
  assertHttpOk,
  fail,
  getApiKey,
  handleCliError, parseJsonResponse
} from "./utils.js";

const EXECUTE_URL = "https://api.jup.ag/ultra/v1/execute";
const REQUEST_TIMEOUT_MS = 30000;

interface ExecuteOptions {
  requestId: string;
  signedTx: string;
  apiKey?: string;
}

interface ExecuteResponse {
  status: "Success" | "Failed";
  signature?: string;
  error?: string;
  [key: string]: unknown;
}

async function executeOrder(options: ExecuteOptions): Promise<void> {
  const apiKey = getApiKey(options.apiKey);

  if (!apiKey) {
    fail("Jupiter API key is required.", [
      "Set JUP_API_KEY or pass --api-key.",
      "Get an API key at https://portal.jup.ag",
    ]);
  }

  // Validate inputs
  if (!options.requestId) {
    fail("--request-id is required", [
      "Get the requestId from the /ultra/v1/order response.",
    ]);
  }

  if (!options.signedTx) {
    fail("--signed-tx is required", [
      "Sign the transaction first using: pnpm wallet-sign --unsigned-tx ...",
    ]);
  }


  const body = {
    requestId: options.requestId,
    signedTransaction: options.signedTx,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(EXECUTE_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const operation = "POST /ultra/v1/execute";
    const parsed = await parseJsonResponse(response, operation);
    assertHttpOk({
      response,
      data: parsed,
      operation,
      rateLimitHint: "Ultra rate limits scale with your executed swap volume. See https://dev.jup.ag/docs/ultra/rate-limit.md",
    });
    const data = parsed as ExecuteResponse;

    // Output result
    console.log(JSON.stringify(data, null, 2));

    // Additional info to stderr
    if (data.status === "Success" && data.signature) {
      console.error(`\nTransaction successful!`);
      console.error(`Signature: ${data.signature}`);
      console.error(`Explorer: https://solscan.io/tx/${data.signature}`);
    } else if (data.status === "Failed") {
      const details: string[] = [];
      if (data.error) details.push(`Error: ${data.error}`);
      fail("Transaction failed during Ultra execute.", details);
    }
  } catch (error) {
    if (error instanceof CliError) {
      throw error;
    }
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        fail(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds`, [
          "The transaction MAY have executed on-chain despite the timeout.",
          "Check Solscan before retrying to avoid a duplicate swap.",
          "To verify: search your wallet address on https://solscan.io",
        ]);
      } else {
        fail(`Network error: ${error.message}`);
      }
    } else {
      fail("Unknown error occurred");
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

// CLI setup
const program = new Command();
program.exitOverride();

program
  .name("execute-ultra")
  .description("Execute Ultra orders on Jupiter")
  .requiredOption(
    "-r, --request-id <id>",
    "Request ID from /ultra/v1/order response"
  )
  .requiredOption(
    "-t, --signed-tx <base64>",
    "Base64-encoded signed transaction"
  )
  .option("-k, --api-key <key>", "Jupiter API key (or use JUP_API_KEY env var)")
  .action(executeOrder);

program.parseAsync(process.argv).catch(handleCliError);
