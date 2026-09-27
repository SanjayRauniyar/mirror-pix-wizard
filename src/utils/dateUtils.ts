export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export type MonthName = (typeof MONTHS)[number];

export function monthIndex(month: string): number {
  if (!month) return -1;
  const normalized = month.trim().toLowerCase();
  const idx = MONTHS.findIndex((m) => m.toLowerCase().startsWith(normalized.slice(0, 3)));
  return idx;
}

export function monthName(index: number): string {
  return MONTHS[((index % 12) + 12) % 12] as string;
}

/** Sortable key, e.g. 2026-09 */
export function periodKey(year: number, month: string): string {
  const idx = monthIndex(month);
  return `${year}-${String(idx + 1).padStart(2, "0")}`;
}

export function previousPeriod(year: number, month: string): { year: number; month: string } {
  const idx = monthIndex(month);
  if (idx <= 0) return { year: year - 1, month: "December" };
  return { year, month: monthName(idx - 1) };
}

export function samePeriod(a: { year: number; month: string }, b: { year: number; month: string }) {
  return Number(a.year) === Number(b.year) && monthIndex(a.month) === monthIndex(b.month);
}

/** Parses "2026-10", "October 2026", "Oct-2026" into a period key or null. */
export function parseStartMonth(raw?: string): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  const iso = value.match(/^(\d{4})[-/](\d{1,2})/);
  if (iso) return `${iso[1]!}-${String(Number(iso[2]!)).padStart(2, "0")}`;
  const withYear = value.match(/^([A-Za-z]+)[\s-]*(\d{4})$/);
  if (withYear) {
    const idx = monthIndex(withYear[1]!);
    if (idx >= 0) return `${withYear[2]!}-${String(idx + 1).padStart(2, "0")}`;
  }
  return null;
}

export function formatDate(raw?: string): string {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDayMonth(raw?: string): string {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long" });
}

export function daysUntil(raw: string, today = new Date()): number | null {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const b = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((a - b) / 86_400_000);
}
