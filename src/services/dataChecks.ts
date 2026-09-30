import type { DataIssue } from "@/types/dashboard";
import { SHEET_SPECS, type SheetSpec } from "./sheetSchema";
import { MONTHS } from "@/utils/dateUtils";

type Row = Record<string, unknown>;

const norm = (s: string) => s.trim().toLowerCase();
const get = (row: Row, col: string) => {
  const k = Object.keys(row).find((x) => norm(x) === col);
  const v = k ? row[k] : "";
  return v === null || v === undefined ? "" : String(v).trim();
};

/** Checks raw sheet rows and reports problems with the exact tab, row and column to fix. */
export function checkSheets(raw: Partial<Record<SheetSpec["key"], Row[]>>): DataIssue[] {
  const issues: DataIssue[] = [];
  const add = (tab: string, row: number | undefined, column: string | undefined, message: string) =>
    issues.push({ tab, row, column, message });

  for (const spec of SHEET_SPECS) {
    const rows = raw[spec.key];
    if (!rows) continue;
    if (rows.length === 0) continue;
    const headers = new Set(rows.flatMap((r) => Object.keys(r).map(norm)));
    for (const col of spec.columns) {
      if (col.required && !headers.has(col.name))
        add(spec.tab, 1, col.name, `Column "${col.name}" is missing or its header was renamed.`);
    }
    rows.forEach((row, i) => {
      const line = i + 2; // row 1 is the header
      if (Object.values(row).every((v) => String(v ?? "").trim() === "")) return;
      for (const col of spec.columns) {
        if (!headers.has(col.name)) continue;
        const v = get(row, col.name);
        if (!v) {
          if (col.required) add(spec.tab, line, col.name, `"${col.name}" is empty.`);
          continue;
        }
        if (col.type === "Number" && Number.isNaN(Number(v.replace(/,/g, ""))))
          add(spec.tab, line, col.name, `"${v}" is not a number. Enter digits only, e.g. ${col.example}.`);
        if (col.type === "Date (YYYY-MM-DD)" && !/^\d{4}-\d{2}-\d{2}$/.test(v))
          add(spec.tab, line, col.name, `"${v}" should be a date like ${col.example}.`);
        if (col.type === "Month (YYYY-MM)" && !/^\d{4}-\d{2}$/.test(v))
          add(spec.tab, line, col.name, `"${v}" should look like ${col.example}.`);
        if (col.type === "Month name" && !MONTHS.some((m) => m.toLowerCase() === v.toLowerCase()))
          add(spec.tab, line, col.name, `"${v}" is not a full month name (use e.g. "September", not "Sept").`);
        if (col.type === "TRUE / FALSE" && !["TRUE", "FALSE"].includes(v.toUpperCase()))
          add(spec.tab, line, col.name, `"${v}" should be TRUE or FALSE.`);
        if (col.allowed && col.type === "Text" && col.name !== "setting") {
          const allowed = col.allowed.split(",").map((a) => a.trim().toUpperCase());
          if (!allowed.includes(v.toUpperCase()))
            add(spec.tab, line, col.name, `"${v}" is not allowed. Use one of: ${col.allowed}.`);
        }
      }
    });
  }

  // Duplicates (flat numbers compared case-insensitively, e.g. "a-101" = "A-101")
  const normFlat = (s: string) => s.trim().toUpperCase();
  const flatNos = new Set<string>();
  (raw.flats ?? []).forEach((r, i) => {
    const f = get(r, "flat_no");
    if (!f) return;
    if (flatNos.has(normFlat(f))) add("Flats", i + 2, "flat_no", `Flat ${f} appears more than once.`);
    flatNos.add(normFlat(f));
  });
  const seen = new Map<string, number>();
  (raw.payments ?? []).forEach((r, i) => {
    const f = get(r, "flat_no");
    const key = `${normFlat(f)}|${get(r, "year")}|${get(r, "month").toLowerCase()}`;
    if (!f) return;
    if (flatNos.size && !flatNos.has(normFlat(f)))
      add("Payments", i + 2, "flat_no", `Flat ${f} is not listed in the Flats tab.`);
    const prev = seen.get(key);
    if (prev) add("Payments", i + 2, "flat_no", `Duplicate payment: flat ${f} already paid for this month on row ${prev}.`);
    else seen.set(key, i + 2);
  });

  // Opening balance cross-check: a manual opening balance should match the
  // previous month's closing balance (opening + collections - expenses).
  const num = (s: string) => Number(s.replace(/,/g, "")) || 0;
  const mIdx = (m: string) => {
    const n = m.trim().toLowerCase();
    if (/^\d{1,2}$/.test(n)) return Number(n) - 1;
    return MONTHS.findIndex((x) => x.toLowerCase().startsWith(n.slice(0, 3)));
  };
  const keyOf = (y: string, m: string) => {
    const i = mIdx(m);
    return i < 0 ? null : Number(y) * 100 + i;
  };
  const balances = (raw.balances ?? [])
    .map((r, i) => ({ row: i + 2, key: keyOf(get(r, "year"), get(r, "month")), opening: num(get(r, "opening_balance")) }))
    .filter((b): b is { row: number; key: number; opening: number } => b.key !== null)
    .sort((a, b) => a.key - b.key);
  balances.forEach((b, i) => {
    if (i === 0) return;
    const prev = balances[i - 1]!;
    const collected = (raw.payments ?? [])
      .filter((r) => keyOf(get(r, "year"), get(r, "month")) === prev.key && get(r, "status").toUpperCase() === "PAID")
      .reduce((s, r) => s + num(get(r, "amount")), 0);
    const spent = (raw.expenses ?? [])
      .filter((r) => keyOf(get(r, "year"), get(r, "month")) === prev.key)
      .reduce((s, r) => s + num(get(r, "amount")), 0);
    const expected = prev.opening + collected - spent;
    if (Math.abs(b.opening - expected) > 1)
      add(
        "Balances",
        b.row,
        "opening_balance",
        `Opening balance ₹${b.opening.toLocaleString("en-IN")} does not match the previous month's closing balance ₹${expected.toLocaleString("en-IN")}. Check for missing payments or expenses.`,
      );
  });

  return issues;
}
