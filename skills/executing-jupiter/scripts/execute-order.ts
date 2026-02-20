#!/usr/bin/env tsx
/**
 * Unified executor for Jupiter order families (Ultra, Trigger, Recurring).
 *
 * Usage:
 *   pnpm execute-ultra   -r "REQUEST_ID" -t "SIGNED_TX"
 *   pnpm execute-trigger  -r "REQUEST_ID" -t "SIGNED_TX"
 *   pnpm execute-recurring -r "REQUEST_ID" -t "SIGNED_TX"
 *   pnpm execute-order --family ultra -r "REQUEST_ID" -t "SIGNED_TX"
 */

import { Command } from "commander";
import { CliError, TIMEOUT_DEFAULTS, assertHttpOk, fail, getApiKey, handleCliError, parseJsonResponse } from "./utils.js";

const { REQUEST_TIMEOUT_MS } = TIMEOUT_DEFAULTS;

type Family = "ultra" | "trigger" | "recurring";

interface FamilyConfig {
  url: string;
  operation: string;
  label: string;
  requestIdHint: string;
  rateLimitHint: string;
  timeoutWarning: string;
}

const FAMILY_CONFIG: Record<Family, FamilyConfig> = {
  ultra: {
    url: "https://api.jup.ag/ultra/v1/execute",
    operation: "POST /ultra/v1/execute",
    label: "Ultra",
    requestIdHint: "Request ID from /ultra/v1/order response",
    rateLimitHint: "Ultra rate limits scale with executed volume. See https://dev.jup.ag/docs/ultra/rate-limit.md",
    timeoutWarning: "The transaction MAY have executed on-chain. Check Solscan before retrying.",
  },
  trigger: {
    url: "https://api.jup.ag/trigger/v1/execute",
    operation: "POST /trigger/v1/execute",
    label: "Trigger",
    requestIdHint: "Request ID from /trigger/v1/createOrder response",
    rateLimitHint: "See rate limits and quotas at https://portal.jup.ag",
    timeoutWarning: "The order MAY have been placed on-chain. Check Solscan before retrying.",
  },
  recurring: {
    url: "https://api.jup.ag/recurring/v1/execute",
    operation: "POST /recurring/v1/execute",
    label: "Recurring",
    requestIdHint: "Request ID from /recurring/v1/createOrder response",
    rateLimitHint: "See rate limits and quotas at https://portal.jup.ag",
    timeoutWarning: "The order MAY have been created on-chain. Check Solscan before retrying.",
  },
};

interface ExecuteOptions {
  requestId: string;
  signedTx: string;
  apiKey?: string;
  family: Family;
}

interface ExecuteResponse {
  status: "Success" | "Failed";
  signature?: string;
  error?: string | null;
  code?: number;
  order?: string | null;
}

function isExecuteResponse(value: unknown): value is ExecuteResponse {
  return !!value && typeof value === "object" &&
    ((value as any).status === "Success" || (value as any).status === "Failed");
}

async function executeOrder(options: ExecuteOptions): Promise<void> {
  const config = FAMILY_CONFIG[options.family];
  const apiKey = getApiKey(options.apiKey);
  if (!apiKey) {
    fail("Jupiter API key is required.", ["Set JUP_API_KEY or pass --api-key."]);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: options.requestId, signedTransaction: options.signedTx }),
      signal: controller.signal,
    });

    const parsed = await parseJsonResponse(response, config.operation);
    assertHttpOk({
      response, data: parsed, operation: config.operation,
      rateLimitHint: config.rateLimitHint,
    });

    if (!isExecuteResponse(parsed)) {
      fail("Unexpected response shape.", ["Expected { status: Success|Failed }."]);
    }

    const data = parsed;
    console.log(JSON.stringify(data, null, 2));

    if (data.status === "Success" && data.signature) {
      console.error(`\nTransaction successful!`);
      console.error(`Signature: ${data.signature}`);
      console.error(`Explorer: https://solscan.io/tx/${data.signature}`);
    } else if (data.status === "Failed") {
      const details: string[] = [];
      if (data.error) details.push(`Error: ${data.error}`);
      if (data.code !== undefined) details.push(`Code: ${data.code}`);
      fail(`${config.label} execute failed.`, details);
    }
  } catch (error) {
    if (error instanceof CliError) throw error;
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        fail(`Timed out after ${REQUEST_TIMEOUT_MS / 1000}s`, [config.timeoutWarning]);
      }
      fail(`Network error: ${error.message}`);
    }
    fail("Unknown error occurred");
  } finally {
    clearTimeout(timeoutId);
  }
}

// Detect family from pnpm alias (e.g. "execute-ultra" -> "ultra") or argv
function detectFamilyFromAlias(): Family | null {
  const sources = [process.env.npm_lifecycle_event ?? "", process.argv[1] ?? ""];
  for (const source of sources) {
    for (const family of Object.keys(FAMILY_CONFIG) as Family[]) {
      if (source.includes(`execute-${family}`)) return family;
    }
  }
  return null;
}

const detectedFamily = detectFamilyFromAlias();

const program = new Command();
program.exitOverride();

program
  .name(detectedFamily ? `execute-${detectedFamily}` : "execute-order")
  .description(`Execute ${detectedFamily ? FAMILY_CONFIG[detectedFamily].label : "Jupiter"} orders on Jupiter`)
  .requiredOption("-r, --request-id <id>", detectedFamily ? FAMILY_CONFIG[detectedFamily].requestIdHint : "Request ID from order response")
  .requiredOption("-t, --signed-tx <base64>", "Base64-encoded signed transaction")
  .option("-k, --api-key <key>", "Jupiter API key (or use JUP_API_KEY env var)")
  .option("-f, --family <family>", "Order family: ultra, trigger, or recurring", detectedFamily ?? undefined)
  .action((opts) => {
    const family = opts.family as Family | undefined;
    if (!family || !FAMILY_CONFIG[family]) {
      fail("--family is required (ultra, trigger, or recurring).", [
        "Either use a named alias (pnpm execute-ultra) or pass --family explicitly.",
      ]);
    }
    return executeOrder({ ...opts, family });
  });

program.parseAsync(process.argv).catch(handleCliError);
