import type {
  Balance,
  DashboardData,
  Expense,
  Flat,
  MaintenanceActivity,
  Payment,
} from "@/types/dashboard";
import { toNumber } from "@/utils/currency";
import { DEMO_DATA } from "./demoData";
import { checkSheets } from "./dataChecks";

type Row = Record<string, unknown>;

const BASE_URL = (import.meta.env["VITE_SHEETDB_API_URL"] as string | undefined)?.replace(/\/$/, "");

export const isSheetDbConfigured = Boolean(BASE_URL);

/** Sheet (tab) names inside the connected Google Sheet. */
export const SHEETS = {
  flats: "Flats",
  payments: "Payments",
  expenses: "Expenses",
  balances: "Balances",
  activities: "Activities",
} as const;

function pick(row: Row, ...keys: string[]): string {
  for (const key of keys) {
    const match = Object.keys(row).find((k) => k.trim().toLowerCase() === key.toLowerCase());
    if (match) {
      const value = row[match];
      if (value !== null && value !== undefined && String(value).trim() !== "") {
        return String(value).trim();
      }
    }
  }
  return "";
}

async function fetchSheet(sheet: string): Promise<Row[]> {
  const url = `${BASE_URL}?sheet=${encodeURIComponent(sheet)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`SheetDB request for "${sheet}" failed (${res.status})`);
  }
  const json: unknown = await res.json();
  return Array.isArray(json) ? (json as Row[]) : [];
}

function mapFlat(row: Row): Flat | null {
  const flatNo = pick(row, "flat_no", "flat", "flatNo");
  if (!flatNo) return null;
  const occupancy = pick(row, "occupancy_status", "occupancy").toUpperCase();
  const active = pick(row, "active").toUpperCase();
  return {
    flatNo,
    ownerName: pick(row, "owner_name", "owner") || "Not recorded",
    phone: pick(row, "phone") || undefined,
    occupancyStatus: occupancy.includes("NOT") || occupancy.includes("VACANT") ? "NOT_OCCUPIED" : "OCCUPIED",
    maintenanceStartMonth: pick(row, "maintenance_start_month", "start_month") || undefined,
    monthlyMaintenance: toNumber(pick(row, "monthly_maintenance", "maintenance")),
    active: active === "" ? true : !["FALSE", "NO", "0"].includes(active),
  };
}

function mapPayment(row: Row, i: number): Payment | null {
  const flatNo = pick(row, "flat_no", "flat");
  const month = pick(row, "month");
  if (!flatNo || !month) return null;
  return {
    paymentId: pick(row, "payment_id") || `P-${i}`,
    flatNo,
    year: toNumber(pick(row, "year")),
    month,
    amount: toNumber(pick(row, "amount")),
    paymentDate: pick(row, "payment_date", "date"),
    status: (pick(row, "status") || "PAID").toUpperCase(),
    paymentMode: pick(row, "payment_mode", "mode") || undefined,
    remarks: pick(row, "remarks") || undefined,
  };
}

function mapExpense(row: Row, i: number): Expense | null {
  const month = pick(row, "month");
  const description = pick(row, "description", "particulars");
  if (!month && !description) return null;
  return {
    expenseId: pick(row, "expense_id") || `E-${i}`,
    year: toNumber(pick(row, "year")),
    month,
    date: pick(row, "expense_date", "date"),
    description: description || "Not recorded",
    amount: toNumber(pick(row, "amount")),
    status: (pick(row, "status") || "PAID").toUpperCase(),
    remarks: pick(row, "remarks") || undefined,
  };
}

function mapBalance(row: Row): Balance | null {
  const month = pick(row, "month");
  if (!month) return null;
  return {
    year: toNumber(pick(row, "year")),
    month,
    openingBalance: toNumber(pick(row, "opening_balance", "opening")),
  };
}

function mapActivity(row: Row, i: number): MaintenanceActivity | null {
  const activityName = pick(row, "activity_name", "activity");
  if (!activityName) return null;
  return {
    activityId: pick(row, "activity_id") || `A-${i}`,
    activityName,
    activityType: pick(row, "activity_type") || undefined,
    scheduledDate: pick(row, "scheduled_date", "due_date", "date"),
    completedDate: pick(row, "completed_date") || undefined,
    status: (pick(row, "status") || "UPCOMING").toUpperCase(),
    remarks: pick(row, "remarks") || undefined,
  };
}

function clean<T>(rows: Row[], mapper: (row: Row, i: number) => T | null): T[] {
  const result: T[] = [];
  rows.forEach((row, i) => {
    try {
      const mapped = mapper(row, i);
      if (mapped) result.push(mapped);
    } catch {
      /* skip a single malformed record instead of breaking the dashboard */
    }
  });
  return result;
}

export async function loadDashboardData(): Promise<DashboardData> {
  if (!BASE_URL) {
    return { ...DEMO_DATA, fetchedAt: new Date().toISOString(), issues: [] };
  }

  const optional = (s: string) => fetchSheet(s).catch(() => [] as Row[]);
  const [flats, payments, expenses, balances, activitiesNew, settingsRows] = await Promise.all([
    fetchSheet(SHEETS.flats),
    fetchSheet(SHEETS.payments),
    fetchSheet(SHEETS.expenses),
    optional(SHEETS.balances),
    optional("Maintenance Activities"),
    optional("Settings"),
  ]);
  const activities = activitiesNew.length ? activitiesNew : await optional(SHEETS.activities);

  const settings: Record<string, string> = {};
  for (const r of settingsRows) {
    const k = pick(r, "setting");
    if (k) settings[k.toLowerCase()] = pick(r, "value");
  }
  const defaultAmount = toNumber(settings["maintenance_amount"] ?? "");

  const mappedPayments = clean(payments, mapPayment);
  const mappedExpenses = clean(expenses, mapExpense);
  const mappedBalances = clean(balances, mapBalance);
  return {
    flats: clean(flats, mapFlat)
      .filter((f) => f.active)
      .map((f) => (f.monthlyMaintenance ? f : { ...f, monthlyMaintenance: defaultAmount })),
    payments: mappedPayments,
    expenses: mappedExpenses,
    balances: mappedBalances,
    activities: clean(activities, mapActivity),
    settings,
    issues: [
      ...checkSheets({ flats, payments, expenses, balances, activities, settings: settingsRows }),
      ...balanceMismatches(mappedBalances, mappedPayments, mappedExpenses),
    ],
    source: "sheetdb",
    fetchedAt: new Date().toISOString(),
  };
}

/** Append one row to a tab of the connected Google Sheet. */
export async function appendRow(sheet: string, row: Record<string, string | number>): Promise<void> {
  if (!BASE_URL) throw new Error("The Google Sheet is not connected, so nothing can be saved.");
  const res = await fetch(`${BASE_URL}?sheet=${encodeURIComponent(sheet)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ data: [row] }),
  });
  if (!res.ok) throw new Error(`Saving to the "${sheet}" tab failed (${res.status}): ${await res.text()}`);
}

/** Next id like P007 based on existing ids. */
export function nextId(prefix: string, ids: string[]): string {
  const max = ids.reduce((m, id) => {
    const n = Number(id.replace(/\D/g, ""));
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

const MONTH_LIST = ["january","february","march","april","may","june","july","august","september","october","november","december"];

/** Flags opening balances that don't equal last month's opening + collections − expenses. */
function balanceMismatches(balances: Balance[], payments: Payment[], expenses: Expense[]) {
  const key = (y: number, m: string) => y * 12 + MONTH_LIST.indexOf(m.toLowerCase());
  const byKey = new Map(balances.map((b) => [key(b.year, b.month), b]));
  const issues: { tab: string; row?: number; column?: string; message: string }[] = [];
  balances.forEach((b, i) => {
    const k = key(b.year, b.month);
    const prev = byKey.get(k - 1);
    if (!prev) return;
    const same = (y: number, m: string) => key(y, m) === k - 1;
    const inflow = payments.filter((p) => p.status === "PAID" && same(p.year, p.month)).reduce((s, p) => s + p.amount, 0);
    const outflow = expenses.filter((e) => same(e.year, e.month)).reduce((s, e) => s + e.amount, 0);
    const expected = prev.openingBalance + inflow - outflow;
    if (Math.abs(expected - b.openingBalance) > 0.5) {
      issues.push({
        tab: "Balances",
        row: i + 2,
        column: "opening_balance",
        message: `${b.month} ${b.year} opening balance is ${b.openingBalance}, but last month's closing works out to ${expected}.`,
      });
    }
  });
  return issues;
}
