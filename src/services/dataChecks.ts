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

  // Duplicates
  const flatNos = new Set<string>();
  (raw.flats ?? []).forEach((r, i) => {
    const f = get(r, "flat_no");
    if (!f) return;
    if (flatNos.has(f)) add("Flats", i + 2, "flat_no", `Flat ${f} appears more than once.`);
    flatNos.add(f);
  });
  const seen = new Map<string, number>();
  (raw.payments ?? []).forEach((r, i) => {
    const f = get(r, "flat_no");
    const key = `${f}|${get(r, "year")}|${get(r, "month").toLowerCase()}`;
    if (!f) return;
    if (flatNos.size && !flatNos.has(f))
      add("Payments", i + 2, "flat_no", `Flat ${f} is not listed in the Flats tab.`);
    const prev = seen.get(key);
    if (prev) add("Payments", i + 2, "flat_no", `Duplicate payment: flat ${f} already paid for this month on row ${prev}.`);
    else seen.set(key, i + 2);
  });

  return issues;
}
