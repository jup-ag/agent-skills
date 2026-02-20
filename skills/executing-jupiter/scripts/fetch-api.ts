#!/usr/bin/env tsx
/**
 * Usage:
 *   pnpm fetch-api -e /ultra/v1/search -p '{"query":"SOL"}'
 *   pnpm fetch-api -e /lend/v1/earn/tokens
 *   pnpm fetch-api -e /prediction/v1/positions/PUBKEY -m DELETE
 */

import { Command } from "commander";
import { CliError, TIMEOUT_DEFAULTS, assertHttpOk, fail, getApiKey, handleCliError, parseJsonResponse } from "./utils.js";

const BASE_URL = "https://api.jup.ag";
const { REQUEST_TIMEOUT_MS } = TIMEOUT_DEFAULTS;
const REQUIRED_VERSION_PREFIXES = [
  "/ultra/v1",
  "/lend/v1",
  "/trigger/v1",
  "/recurring/v1",
  "/portfolio/v1",
  "/prediction/v1",
  "/send/v1",
  "/studio/v1",
  "/price/v3",
  "/tokens/v2",
];

interface FetchOptions {
  endpoint: string;
  params?: string;
  body?: string;
  method: string;
  apiKey?: string;
}

function parseJson(raw: string, flag: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    fail(`Invalid JSON in ${flag}`);
  }
}

function hasValidVersionPrefix(endpoint: string): boolean {
  return REQUIRED_VERSION_PREFIXES.some((prefix) => endpoint === prefix || endpoint.startsWith(`${prefix}/`));
}

async function fetchApi(options: FetchOptions): Promise<void> {
  const apiKey = getApiKey(options.apiKey);
  if (!apiKey) {
    fail("Jupiter API key is required.", [
      "Set JUP_API_KEY or pass --api-key.",
      "Get an API key at https://portal.jup.ag",
    ]);
  }

  if (!options.endpoint.startsWith("/")) {
    fail("Endpoint must start with '/'.", ["Example: /ultra/v1/order"]);
  }
  if (!hasValidVersionPrefix(options.endpoint)) {
    fail("Endpoint must use a supported Jupiter API version prefix.", [
      "Use one of: /ultra/v1, /lend/v1, /trigger/v1, /recurring/v1, /portfolio/v1, /prediction/v1, /send/v1, /studio/v1, /price/v3, /tokens/v2",
    ]);
  }

  const method = options.method.toUpperCase();
  if (!["GET", "POST", "DELETE"].includes(method)) {
    fail("--method must be one of GET, POST, DELETE");
  }

  let url = `${BASE_URL}${options.endpoint}`;
  const fetchOptions: RequestInit = {
    method,
    headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
  };

  if ((method === "GET" || method === "DELETE") && options.params) {
    const params = parseJson(options.params, "--params") as Record<string, unknown>;
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined) continue;
      if (Array.isArray(value)) {
        for (const item of value) searchParams.append(key, String(item));
      } else if (typeof value === "object") {
        searchParams.append(key, JSON.stringify(value));
      } else {
        searchParams.append(key, String(value));
      }
    }
    url += `?${searchParams.toString()}`;
  } else if (method === "POST") {
    const raw = options.body || options.params;
    if (raw) {
      parseJson(raw, options.body ? "--body" : "--params");
      fetchOptions.body = raw;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { ...fetchOptions, signal: controller.signal });
    const operation = `${method} ${options.endpoint}`;
    const data = await parseJsonResponse(response, operation);
    assertHttpOk({ response, data, operation, rateLimitHint: "Consider upgrading your API tier at https://portal.jup.ag" });
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    if (error instanceof CliError) throw error;
    if (error instanceof Error) {
      if (error.name === "AbortError") fail(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds`);
      fail(`Network error: ${error.message}`);
    }
    fail("Unknown error occurred");
  } finally {
    clearTimeout(timeoutId);
  }
}

const program = new Command();
program.exitOverride();

program
  .name("fetch-api")
  .description("Fetch data from Jupiter REST API endpoints")
  .requiredOption("-e, --endpoint <path>", "Endpoint path (e.g. /ultra/v1/order)")
  .option("-p, --params <json>", "Query params (GET/DELETE) or body (POST) as JSON")
  .option("-b, --body <json>", "Request body as JSON (POST)")
  .option("-m, --method <method>", "HTTP method (GET, POST, DELETE)", "GET")
  .option("-k, --api-key <key>", "Jupiter API key (or use JUP_API_KEY env var)")
  .action(fetchApi);

program.parseAsync(process.argv).catch(handleCliError);
