import { HttpError } from "./errors";
import { RetryableHttpError, RetryableNetworkError } from "./retry";

export type JupiterClient = {
  host: string;
  apiKey: string;
  request<T>(path: string, init?: RequestInit): Promise<T>;
};

export type ClientEnv = {
  host?: string;
  apiKey?: string;
};

export function createJupiterClient(env: ClientEnv = {}): JupiterClient {
  const host = (env.host ?? process.env.JUPITER_API_HOST ?? "https://api.jup.ag").replace(/\/$/, "");
  const apiKey = env.apiKey ?? process.env.JUPITER_API_KEY;
  const isLiteHost = host.includes("lite-api.jup.ag");

  if (!apiKey && !isLiteHost) {
    throw new Error("Missing required env var: JUPITER_API_KEY");
  }

  return {
    host,
    apiKey,
    async request<T>(path: string, init: RequestInit = {}): Promise<T> {
      const url = `${host}${path.startsWith("/") ? path : `/${path}`}`;

      let response: Response;
      try {
        response = await fetch(url, {
          ...init,
          headers: {
            "content-type": "application/json",
            ...(apiKey ? { "x-api-key": apiKey } : {}),
            ...(init.headers ?? {}),
          },
        });
      } catch (error) {
        throw new RetryableNetworkError("Network request failed", error);
      }

      const text = await response.text();
      const body = parseMaybeJson(text);

      if (!response.ok) {
        if (response.status === 429 || response.status >= 500) {
          throw new RetryableHttpError(response.status, body);
        }
        throw new HttpError(response.status, body, url);
      }

      return body as T;
    },
  };
}

function parseMaybeJson(text: string): unknown {
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
