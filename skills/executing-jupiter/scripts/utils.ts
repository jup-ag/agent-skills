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
    const e = error as { message?: string; code?: string; exitCode?: number };
    if (e.code === "commander.helpDisplayed") process.exit(0);
    if (e.message) console.error(e.message);
    process.exit(e.exitCode ?? 1);
  }

  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
  } else {
    console.error("Error: Unknown failure");
  }
  process.exit(1);
}

export function formatRetryAfter(headers: Headers): string | null {
  const raw = headers.get("Retry-After");
  if (!raw) return null;

  const asNumber = Number(raw);
  if (!Number.isNaN(asNumber) && asNumber >= 0) return `${Math.ceil(asNumber)}s`;

  const asDateMs = Date.parse(raw);
  if (!Number.isNaN(asDateMs)) {
    const diffMs = asDateMs - Date.now();
    return `${diffMs > 0 ? Math.ceil(diffMs / 1000) : 0}s`;
  }

  return raw;
}

export async function parseJsonResponse(response: Response, operation: string): Promise<unknown> {
  const bodyText = await response.text();
  if (!bodyText) return null;

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

  const body = typeof data === "string" ? data : JSON.stringify(data, null, 2);

  if (response.status === 429) {
    const details: string[] = [];
    const retryAfter = formatRetryAfter(response.headers);
    if (retryAfter) details.push(`Retry-After: ${retryAfter}`);
    if (rateLimitHint) details.push(rateLimitHint);
    details.push(`Response: ${body}`);
    fail(`Rate limited during ${operation}.`, details);
  }

  fail(`API returned status ${response.status} during ${operation}.`, [`Response: ${body}`]);
}

export function getApiKey(providedKey?: string): string | null {
  return providedKey || process.env.JUP_API_KEY || null;
}

/**
 * Standard timeout constants used across scripts.
 * REQUEST_TIMEOUT_MS: 30s covers 95th-percentile Jupiter API response time.
 * CONFIRMATION_TIMEOUT_MS: 60s allows for Solana slot confirmation under congestion.
 * STATUS_POLL_INTERVAL_MS: 2s balances RPC load vs timely confirmation detection.
 */
export const TIMEOUT_DEFAULTS = {
  REQUEST_TIMEOUT_MS: 30_000,
  CONFIRMATION_TIMEOUT_MS: 60_000,
  STATUS_POLL_INTERVAL_MS: 2_000,
} as const;
