const inr = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

/** Indian numbering system, e.g. ₹14,400 */
export function formatINR(value: number | null | undefined): string {
  const n = toNumber(value);
  return `₹${inr.format(Math.round(n))}`;
}

export function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]/g, "");
    const parsed = Number.parseFloat(cleaned);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}
