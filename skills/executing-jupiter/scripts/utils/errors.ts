export type ErrorMapping = {
  code: string;
  retryable: boolean;
  message: string;
  suggestedAction?: string;
  details?: string;
  status?: number;
};

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    public readonly url: string,
  ) {
    super(`HTTP ${status} for ${url}`);
    this.name = "HttpError";
  }
}

export function mapJupiterError(error: unknown): ErrorMapping {
  if (error instanceof HttpError) {
    return mapHttpFamily(error.status, stringifyBody(error.body));
  }
  if (hasStatus(error)) {
    return mapHttpFamily(error.status, stringifyBody((error as { causeBody?: unknown }).causeBody));
  }

  const text = extractErrorText(error);
  if (text.includes("6001")) {
    return {
      code: "SLIPPAGE_TOLERANCE_EXCEEDED",
      retryable: false,
      message: "Swap/route rejected due to slippage settings.",
      suggestedAction: "Increase slippage tolerance only if acceptable, then rebuild and retry.",
      details: text,
    };
  }

  if (text.includes("-1005") || text.toLowerCase().includes("expired")) {
    return {
      code: "TRANSACTION_EXPIRED",
      retryable: false,
      message: "Transaction/order context expired.",
      suggestedAction: "Re-quote or rebuild transaction, then reconfirm before submit.",
      details: text,
    };
  }

  if (text.includes("-1003") || text.toLowerCase().includes("not fully signed")) {
    return {
      code: "SIGNING_INCOMPLETE",
      retryable: false,
      message: "Transaction failed signature validation.",
      suggestedAction: "Verify signer set and payload, then rebuild before retrying.",
      details: text,
    };
  }

  return {
    code: "UNKNOWN",
    retryable: false,
    message: text || "Unexpected Jupiter error",
    suggestedAction: "Inspect raw error and endpoint contract before retrying.",
  };
}

function mapHttpFamily(status: number, details?: string): ErrorMapping {
  if (status === 429) {
    return {
      code: "HTTP_RATE_LIMIT",
      retryable: true,
      message: "Rate-limited by upstream.",
      suggestedAction: "Retry with backoff and reconcile status before resubmitting.",
      details,
      status,
    };
  }

  if (status >= 500) {
    return {
      code: "HTTP_SERVER_ERROR",
      retryable: true,
      message: "Upstream service failure.",
      suggestedAction: "Retry with backoff; stop after max attempts and report.",
      details,
      status,
    };
  }

  if (status === 401 || status === 403) {
    return {
      code: "HTTP_AUTH_OR_POLICY",
      retryable: false,
      message: "Request rejected by auth or policy controls.",
      suggestedAction: "Fix credentials/policy state; do not auto-retry.",
      details,
      status,
    };
  }

  if (status >= 400) {
    return {
      code: "HTTP_CLIENT_ERROR",
      retryable: false,
      message: "Request rejected by upstream.",
      suggestedAction: "Correct request inputs before retrying.",
      details,
      status,
    };
  }

  return {
    code: "HTTP_OTHER",
    retryable: false,
    message: "Unexpected HTTP response.",
    details,
    status,
  };
}

function extractErrorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "";
  }
}

function stringifyBody(body: unknown): string | undefined {
  if (!body) return undefined;
  if (typeof body === "string") return body;

  try {
    return JSON.stringify(body);
  } catch {
    return undefined;
  }
}

function hasStatus(value: unknown): value is { status: number } {
  return Boolean(
    value &&
      typeof value === "object" &&
      "status" in value &&
      typeof (value as { status?: unknown }).status === "number",
  );
}
