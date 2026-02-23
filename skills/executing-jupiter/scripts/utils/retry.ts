import { HttpError } from "./errors";

export class RetryableHttpError extends Error {
  constructor(public readonly status: number, public readonly causeBody?: unknown) {
    super(`Retryable HTTP error: ${status}`);
    this.name = "RetryableHttpError";
  }
}

export class RetryableNetworkError extends Error {
  constructor(message: string, public readonly causeValue?: unknown) {
    super(message);
    this.name = "RetryableNetworkError";
  }
}

export type RetryOptions = {
  maxAttempts?: number;
  minDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
};

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 4;
  const minDelayMs = options.minDelayMs ?? 300;
  const maxDelayMs = options.maxDelayMs ?? 2_000;

  let attempt = 1;
  for (;;) {
    try {
      return await fn();
    } catch (error) {
      const retry = options.shouldRetry?.(error, attempt) ?? isRetryableError(error);
      if (!retry || attempt >= maxAttempts) throw error;

      const backoff = Math.min(maxDelayMs, minDelayMs * 2 ** (attempt - 1));
      const jitter = Math.floor(Math.random() * 125);
      await sleep(backoff + jitter);
      attempt += 1;
    }
  }
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof RetryableNetworkError) return true;
  if (error instanceof RetryableHttpError) return true;

  if (error instanceof HttpError) {
    return error.status === 429 || error.status >= 500;
  }

  if (!(error instanceof Error)) return false;

  const lower = error.message.toLowerCase();
  return (
    lower.includes("network") ||
    lower.includes("timeout") ||
    lower.includes("econnreset") ||
    lower.includes("etimedout")
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
