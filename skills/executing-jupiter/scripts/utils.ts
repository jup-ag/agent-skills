/**
 * utils.ts - Shared utility functions for Jupiter API scripts
 */

export class CliError extends Error {
  exitCode: number;
  details: string[];

  constructor(message: string, details: string[] = [], exitCode = 1) {
    super(message);
    this.name = "CliError";
    this.exitCode = exitCode;
    this.details = details;
  }
}

export function fail(message: string, details: string[] = [], exitCode = 1): never {
  throw new CliError(message, details, exitCode);
}

export function handleCliError(error: unknown): never {
  if (error instanceof CliError) {
    console.error(`Error: ${error.message}`);
    for (const detail of error.details) {
      console.error(detail);
    }
    process.exit(error.exitCode);
  }

  if (error && typeof error === "object" && "exitCode" in error) {
    const commanderError = error as {
      message?: string;
      code?: string;
      exitCode?: number;
    };
    if (commanderError.code === "commander.helpDisplayed") {
      process.exit(0);
    }
    if (commanderError.message) {
      console.error(commanderError.message);
    }
    process.exit(commanderError.exitCode ?? 1);
  }

  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }

  console.error("Error: Unknown failure");
  process.exit(1);
}

function stringifyResponseData(data: unknown): string {
  if (typeof data === "string") return data;
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

function parseRetryAfterSeconds(raw: string): number | null {
  const asNumber = Number(raw);
  if (!Number.isNaN(asNumber) && asNumber >= 0) {
    return Math.ceil(asNumber);
  }

  const asDateMs = Date.parse(raw);
  if (Number.isNaN(asDateMs)) return null;

  const diffMs = asDateMs - Date.now();
  return diffMs > 0 ? Math.ceil(diffMs / 1000) : 0;
}

export function formatRetryAfter(headers: Headers): string | null {
  const retryAfterRaw = headers.get("Retry-After");
  if (!retryAfterRaw) return null;

  const retryAfterSeconds = parseRetryAfterSeconds(retryAfterRaw);
  if (retryAfterSeconds === null) {
    return retryAfterRaw;
  }
  return `${retryAfterSeconds}s`;
}

export async function parseJsonResponse(
  response: Response,
  operation: string
): Promise<unknown> {
  const bodyText = await response.text();
  if (!bodyText) {
    return null;
  }

  try {
    return JSON.parse(bodyText);
  } catch {
    fail(`API returned non-JSON response during ${operation}.`, [
      `Status: ${response.status}`,
      `Body: ${bodyText.slice(0, 500)}`,
    ]);
  }
}

export function assertHttpOk(params: {
  response: Response;
  data: unknown;
  operation: string;
  rateLimitHint?: string;
}): void {
  const { response, data, operation, rateLimitHint } = params;
  if (response.ok) return;

  if (response.status === 429) {
    const details: string[] = [];
    const retryAfter = formatRetryAfter(response.headers);
    if (retryAfter) {
      details.push(`Retry-After: ${retryAfter}`);
    }
    if (rateLimitHint) {
      details.push(rateLimitHint);
    }
    details.push(`Response: ${stringifyResponseData(data)}`);
    fail(`Rate limited during ${operation}.`, details);
  }

  fail(`API returned status ${response.status} during ${operation}.`, [
    `Response: ${stringifyResponseData(data)}`,
  ]);
}

/**
 * Gets the Jupiter API key from provided value or environment variable
 */
export function getApiKey(providedKey?: string): string | null {
  if (providedKey) return providedKey;
  if (process.env.JUP_API_KEY) return process.env.JUP_API_KEY;
  return null;
}
