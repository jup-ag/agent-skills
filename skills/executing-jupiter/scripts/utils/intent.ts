import { randomUUID } from "node:crypto";

type IntentMeta = Record<string, string | number | boolean | null | undefined>;

export type IntentContext = {
  intentId: string;
  correlationId: string;
  createdAtIso: string;
};

export function createIntentContext(): IntentContext {
  return {
    intentId: `intent_${randomUUID()}`,
    correlationId: `corr_${randomUUID()}`,
    createdAtIso: new Date().toISOString(),
  };
}

export function buildIntentHeaders(intent: IntentContext, extra?: IntentMeta): Record<string, string> {
  const headers: Record<string, string> = {
    "x-intent-id": intent.intentId,
    "x-correlation-id": intent.correlationId,
    "x-intent-created-at": intent.createdAtIso,
  };

  if (!extra) return headers;

  for (const [key, value] of Object.entries(extra)) {
    if (value === undefined) continue;
    headers[`x-intent-meta-${key}`] = String(value);
  }

  return headers;
}
