#!/usr/bin/env tsx
/**
 * fetch-api.ts - Fetch data from Jupiter REST API endpoints
 *
 * Usage:
 *   pnpm fetch-api --endpoint /ultra/v1/search --params '{"query":"SOL"}'
 *   pnpm fetch-api --endpoint /lend/v1/earn/tokens
 *   pnpm fetch-api --endpoint /prediction/v1/positions/PUBKEY --method DELETE
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

const BASE_URL = "https://api.jup.ag";
const REQUEST_TIMEOUT_MS = 30000;

interface FetchOptions {
  endpoint: string;
  params?: string;
  body?: string;
  method: string;
  apiKey?: string;
}

function appendQueryParam(searchParams: URLSearchParams, key: string, value: unknown): void {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    for (const item of value) {
      appendQueryParam(searchParams, key, item);
    }
    return;
  }
  if (typeof value === "object") {
    searchParams.append(key, JSON.stringify(value));
    return;
  }
  searchParams.append(key, String(value));
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
    fail("Invalid endpoint path.", [
      "Endpoint must start with '/'.",
      "Example: /ultra/v1/order",
    ]);
  }

  // Build URL with query params for GET requests
  let url = `${BASE_URL}${options.endpoint}`;

  const headers: Record<string, string> = {
    "x-api-key": apiKey,
    "Content-Type": "application/json",
  };

  const method = options.method.toUpperCase();
  if (!["GET", "POST", "DELETE"].includes(method)) {
    fail("--method must be one of GET, POST, DELETE");
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  // Handle params for GET or body for POST
  if ((method === "GET" || method === "DELETE") && options.params) {
    try {
      const params = JSON.parse(options.params);
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        appendQueryParam(searchParams, key, value);
      }
      url += `?${searchParams.toString()}`;
    } catch (e) {
      fail("Invalid JSON in --params", ['Expected format: \'{"key":"value"}\'']);
    }
  } else if (method === "POST") {
    if (options.body) {
      try {
        // Validate JSON
        JSON.parse(options.body);
        fetchOptions.body = options.body;
      } catch (e) {
        fail("Invalid JSON in --body");
      }
    } else if (options.params) {
      // Allow --params for POST body as well
      try {
        JSON.parse(options.params);
        fetchOptions.body = options.params;
      } catch (e) {
        fail("Invalid JSON in --params");
      }
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { ...fetchOptions, signal: controller.signal });
    const operation = `${method} ${options.endpoint}`;
    const data = await parseJsonResponse(response, operation);
    assertHttpOk({
      response,
      data,
      operation,
      rateLimitHint: "Consider upgrading your API tier at https://portal.jup.ag",
    });

    // Output JSON to stdout for piping to other tools
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    if (error instanceof CliError) {
      throw error;
    }
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        fail(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds`);
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
  .name("fetch-api")
  .description("Fetch data from Jupiter REST API endpoints")
  .requiredOption("-e, --endpoint <path>", "Endpoint path (for example /ultra/v1/order)")
  .option(
    "-p, --params <json>",
    "Query parameters as JSON string (for GET/DELETE) or body (for POST)"
  )
  .option("-b, --body <json>", "Request body as JSON string (for POST)")
  .option("-m, --method <method>", "HTTP method (GET, POST, DELETE)", "GET")
  .option("-k, --api-key <key>", "Jupiter API key (or use JUP_API_KEY env var)")
  .action(fetchApi);

program.parseAsync(process.argv).catch(handleCliError);
