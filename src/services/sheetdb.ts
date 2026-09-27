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
    return { ...DEMO_DATA, fetchedAt: new Date().toISOString() };
  }

  const [flats, payments, expenses, balances, activities] = await Promise.all([
    fetchSheet(SHEETS.flats),
    fetchSheet(SHEETS.payments),
    fetchSheet(SHEETS.expenses),
    fetchSheet(SHEETS.balances).catch(() => [] as Row[]),
    fetchSheet(SHEETS.activities).catch(() => [] as Row[]),
  ]);

  return {
    flats: clean(flats, mapFlat).filter((f) => f.active),
    payments: clean(payments, mapPayment),
    expenses: clean(expenses, mapExpense),
    balances: clean(balances, mapBalance),
    activities: clean(activities, mapActivity),
    source: "sheetdb",
    fetchedAt: new Date().toISOString(),
  };
}
