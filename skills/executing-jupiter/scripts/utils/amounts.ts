const DECIMAL_PATTERN = /^\d+(\.\d+)?$/;

export function parseUiAmountToAtomic(uiAmount: string, decimals: number): bigint {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) {
    throw new Error(`Invalid decimals: ${decimals}`);
  }

  const value = uiAmount.trim();
  if (!DECIMAL_PATTERN.test(value)) {
    throw new Error(`Invalid amount format: ${uiAmount}`);
  }

  const [whole, fraction = ""] = value.split(".");
  if (fraction.length > decimals) {
    throw new Error(`Amount has too many decimal places (max ${decimals})`);
  }

  const paddedFraction = fraction.padEnd(decimals, "0");
  const atomic = `${whole}${paddedFraction}`.replace(/^0+(?=\d)/, "");
  return BigInt(atomic || "0");
}

export function formatAtomicToUiAmount(amount: bigint, decimals: number): string {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) {
    throw new Error(`Invalid decimals: ${decimals}`);
  }

  const negative = amount < 0n;
  const absolute = negative ? -amount : amount;
  const str = absolute.toString().padStart(decimals + 1, "0");

  if (decimals === 0) {
    return `${negative ? "-" : ""}${str}`;
  }

  const whole = str.slice(0, -decimals) || "0";
  const fraction = str.slice(-decimals).replace(/0+$/, "");
  const ui = fraction.length ? `${whole}.${fraction}` : whole;
  return `${negative ? "-" : ""}${ui}`;
}

export function mustPositiveAtomic(amount: bigint, field: string): bigint {
  if (amount <= 0n) {
    throw new Error(`${field} must be greater than 0`);
  }
  return amount;
}
