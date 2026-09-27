import type {
  ActivityState,
  Balance,
  DashboardData,
  Expense,
  Flat,
  FlatRow,
  MaintenanceActivity,
  Payment,
  PaymentStatus,
} from "@/types/dashboard";
import {
  MONTHS,
  daysUntil,
  monthIndex,
  monthName,
  parseStartMonth,
  periodKey,
  previousPeriod,
} from "./dateUtils";

export interface Period {
  year: number;
  month: string;
}

const isPaid = (status: string) => (status || "").toUpperCase() === "PAID";

export function paymentsFor(payments: Payment[], period: Period): Payment[] {
  return payments.filter(
    (p) =>
      Number(p.year) === Number(period.year) &&
      monthIndex(p.month) === monthIndex(period.month) &&
      isPaid(p.status),
  );
}

export function expensesFor(expenses: Expense[], period: Period): Expense[] {
  return expenses.filter(
    (e) => Number(e.year) === Number(period.year) && monthIndex(e.month) === monthIndex(period.month),
  );
}

/** Is maintenance applicable for this flat in the selected month? */
export function maintenanceApplicable(flat: Flat, period: Period): boolean {
  if (flat.occupancyStatus === "NOT_OCCUPIED") return false;
  const start = parseStartMonth(flat.maintenanceStartMonth);
  if (!start) return true;
  return periodKey(period.year, period.month) >= start;
}

export function buildFlatRows(data: DashboardData, period: Period): FlatRow[] {
  const monthPayments = paymentsFor(data.payments, period);

  return [...data.flats]
    .sort((a, b) => a.flatNo.localeCompare(b.flatNo, undefined, { numeric: true }))
    .map((flat) => {
      const flatPayments = monthPayments.filter((p) => p.flatNo === flat.flatNo);
      const amountPaid = flatPayments.reduce((sum, p) => sum + p.amount, 0);
      const latest = flatPayments[flatPayments.length - 1];
      const applicable = maintenanceApplicable(flat, period);

      let status: PaymentStatus;
      let startsMonthLabel: string | undefined;
      if (flat.occupancyStatus === "NOT_OCCUPIED") {
        status = "NOT_OCCUPIED";
      } else if (!applicable) {
        status = "STARTS_LATER";
        const start = parseStartMonth(flat.maintenanceStartMonth);
        startsMonthLabel = start ? monthName(Number(start.split("-")[1]) - 1) : undefined;
      } else if (flatPayments.length > 0) {
        status = "PAID";
      } else {
        status = "PENDING";
      }

      return {
        flat,
        status,
        startsMonthLabel,
        amountPaid,
        paymentDate: latest?.paymentDate,
        paymentMode: latest?.paymentMode,
        expectedAmount: applicable ? flat.monthlyMaintenance : 0,
      };
    });
}

export interface Totals {
  totalFlats: number;
  paidCount: number;
  pendingCount: number;
  notOccupiedCount: number;
  startsLaterCount: number;
  applicableCount: number;
  collection: number;
  expected: number;
  pendingAmount: number;
  expenses: number;
  openingBalance: number;
  totalFunds: number;
  currentBalance: number;
}

export function computeTotals(data: DashboardData, period: Period, rows: FlatRow[]): Totals {
  const collection = paymentsFor(data.payments, period).reduce((s, p) => s + p.amount, 0);
  const expenses = expensesFor(data.expenses, period).reduce((s, e) => s + e.amount, 0);
  const expected = rows.reduce((s, r) => s + r.expectedAmount, 0);
  const openingBalance = resolveOpeningBalance(data, period);

  return {
    totalFlats: rows.length,
    paidCount: rows.filter((r) => r.status === "PAID").length,
    pendingCount: rows.filter((r) => r.status === "PENDING").length,
    notOccupiedCount: rows.filter((r) => r.status === "NOT_OCCUPIED").length,
    startsLaterCount: rows.filter((r) => r.status === "STARTS_LATER").length,
    applicableCount: rows.filter((r) => r.status === "PAID" || r.status === "PENDING").length,
    collection,
    expected,
    pendingAmount: Math.max(expected - collection, 0),
    expenses,
    openingBalance,
    totalFunds: openingBalance + collection,
    currentBalance: openingBalance + collection - expenses,
  };
}

function findBalance(balances: Balance[], period: Period): Balance | undefined {
  return balances.find(
    (b) => Number(b.year) === Number(period.year) && monthIndex(b.month) === monthIndex(period.month),
  );
}

/**
 * Opening balance = manual entry from the Balances sheet when present,
 * otherwise carried forward from the latest earlier entry by rolling
 * collections and expenses month by month.
 */
export function resolveOpeningBalance(data: DashboardData, period: Period): number {
  const direct = findBalance(data.balances, period);
  if (direct) return direct.openingBalance;

  const target = periodKey(period.year, period.month);
  const earlier = data.balances
    .filter((b) => periodKey(b.year, b.month) < target)
    .sort((a, b) => periodKey(a.year, a.month).localeCompare(periodKey(b.year, b.month)));
  const anchor = earlier[earlier.length - 1];
  if (!anchor) return 0;

  let balance = anchor.openingBalance;
  let cursor: Period = { year: anchor.year, month: anchor.month };
  let guard = 0;
  while (periodKey(cursor.year, cursor.month) < target && guard++ < 240) {
    balance +=
      paymentsFor(data.payments, cursor).reduce((s, p) => s + p.amount, 0) -
      expensesFor(data.expenses, cursor).reduce((s, e) => s + e.amount, 0);
    const idx = monthIndex(cursor.month);
    cursor = idx === 11 ? { year: cursor.year + 1, month: "January" } : { year: cursor.year, month: monthName(idx + 1) };
  }
  return balance;
}

export function previousMonthLabel(period: Period): string {
  return previousPeriod(period.year, period.month).month;
}

export function activityState(activity: MaintenanceActivity, today = new Date()): ActivityState {
  if (activity.completedDate || (activity.status || "").toUpperCase() === "COMPLETED") return "COMPLETED";
  const days = daysUntil(activity.scheduledDate, today);
  if (days === null) return "UPCOMING";
  if (days < 0) return "OVERDUE";
  if (days <= 7) return "DUE_SOON";
  return "UPCOMING";
}

export function availableYears(data: DashboardData): number[] {
  const years = new Set<number>();
  data.payments.forEach((p) => p.year && years.add(Number(p.year)));
  data.expenses.forEach((e) => e.year && years.add(Number(e.year)));
  data.balances.forEach((b) => b.year && years.add(Number(b.year)));
  [2025, 2026, 2027, new Date().getFullYear()].forEach((y) => years.add(y));
  return [...years].sort((a, b) => a - b);
}

export function monthlySeries(data: DashboardData, year: number) {
  return MONTHS.map((month) => {
    const period = { year, month };
    return {
      month: month.slice(0, 3),
      collection: paymentsFor(data.payments, period).reduce((s, p) => s + p.amount, 0),
      expenses: expensesFor(data.expenses, period).reduce((s, e) => s + e.amount, 0),
    };
  });
}
