#!/usr/bin/env tsx
/**
 * execute-recurring.ts - Execute Recurring orders on Jupiter
 *
 * Usage:
 *   pnpm execute-recurring --request-id "UUID" --signed-tx "BASE64_SIGNED_TX"
 */

import { Command } from "commander";
import {
  CliError,
  assertHttpOk,
  fail,
  getApiKey,
  handleCliError,
  parseJsonResponse,
} from "./utils.js";

const EXECUTE_URL = "https://api.jup.ag/recurring/v1/execute";
const REQUEST_TIMEOUT_MS = 30000;

interface ExecuteOptions {
  requestId: string;
  signedTx: string;
  apiKey?: string;
}

interface ExecuteResponse {
  status: "Success" | "Failed";
  signature?: string;
  error?: string | null;
  order?: string | null;
}

function isExecuteResponse(value: unknown): value is ExecuteResponse {
  if (!value || typeof value !== "object") return false;

  const data = value as Record<string, unknown>;
  if (data.status !== "Success" && data.status !== "Failed") return false;

  if ("signature" in data && data.signature !== undefined && typeof data.signature !== "string") {
    return false;
  }

  if (
    "error" in data &&
    data.error !== undefined &&
    data.error !== null &&
    typeof data.error !== "string"
  ) {
    return false;
  }

  if (
    "order" in data &&
    data.order !== undefined &&
    data.order !== null &&
    typeof data.order !== "string"
  ) {
    return false;
  }

  return true;
}

async function executeOrder(options: ExecuteOptions): Promise<void> {
  const apiKey = getApiKey(options.apiKey);

  if (!apiKey) {
    fail("Jupiter API key is required.", [
      "Set JUP_API_KEY or pass --api-key.",
      "Get an API key at https://portal.jup.ag",
    ]);
  }

  if (!options.requestId) {
    fail("--request-id is required", [
      "Get the requestId from the /recurring/v1/createOrder response.",
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

    const operation = "POST /recurring/v1/execute";
    const parsed = await parseJsonResponse(response, operation);
    assertHttpOk({
      response,
      data: parsed,
      operation,
      rateLimitHint: "See rate limits and quotas in https://portal.jup.ag",
    });

    if (!isExecuteResponse(parsed)) {
      fail("Unexpected /recurring/v1/execute response shape.", [
        "Expected object with status=Success|Failed.",
      ]);
    }

    const data = parsed;
    console.log(JSON.stringify(data, null, 2));

    if (data.status === "Success" && data.signature) {
      console.error("\nTransaction successful!");
      console.error(`Signature: ${data.signature}`);
      console.error(`Explorer: https://solscan.io/tx/${data.signature}`);
    } else if (data.status === "Failed") {
      const details: string[] = [];
      if (data.error) details.push(`Error: ${data.error}`);
      fail("Transaction failed during Recurring execute.", details);
    }
  } catch (error) {
    if (error instanceof CliError) {
      throw error;
    }
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        fail(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds`, [
          "The order MAY have been created on-chain despite the timeout.",
          "Check Solscan before retrying to avoid a duplicate order.",
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

const program = new Command();
program.exitOverride();

program
  .name("execute-recurring")
  .description("Execute Recurring orders on Jupiter")
  .requiredOption(
    "-r, --request-id <id>",
    "Request ID from /recurring/v1/createOrder response"
  )
  .requiredOption(
    "-t, --signed-tx <base64>",
    "Base64-encoded signed transaction"
  )
  .option("-k, --api-key <key>", "Jupiter API key (or use JUP_API_KEY env var)")
  .action(executeOrder);

program.parseAsync(process.argv).catch(handleCliError);
