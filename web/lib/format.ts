export function fmtSpaceThousands(value: number): string {
  return Math.round(value).toLocaleString("en-US").replace(/,/g, " ");
}

export function fmtMoneyUsd(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${fmtSpaceThousands(n)} $`;
}

export function fmtMoneyUsdSqm(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${fmtSpaceThousands(n)} $/m²`;
}

export function fmtNumber(n: number, decimals = 1): string {
  if (!Number.isFinite(n)) return "—";
  return n
    .toFixed(decimals)
    .replace(".", ",")
    .replace(/,0+$/, "");
}

export function fmtPct(n: number, showPlus = false): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n < 0 ? "−" : showPlus && n > 0 ? "+" : "";
  const str = Math.abs(n).toFixed(1).replace(".", ",");
  return `${sign}${str}%`;
}

/** @deprecated use fmtMoneyUsd / fmtNumber */
export function fmtK3(value: number): string {
  const v = Math.abs(value);
  if (v >= 1000) return `${Math.round(value / 1000)}`;
  if (v >= 100) return `${Math.round(value)}`;
  if (v >= 10) return `${value.toFixed(1).replace(/\.0$/, "")}`;
  return value.toFixed(2).replace(/\.?0+$/, "");
}

export function formatMetric(
  value: number,
  kind: "money" | "moneySqm" | "space" | "plain" | "k",
): string {
  if (kind === "money") return fmtMoneyUsd(value);
  if (kind === "moneySqm") return fmtMoneyUsdSqm(value);
  if (kind === "space") return fmtSpaceThousands(value);
  if (kind === "k") return fmtK3(value);
  return fmtNumber(value);
}
