export type OccupancyStatus = "OCCUPIED" | "NOT_OCCUPIED";

export interface Flat {
  flatNo: string;
  ownerName: string;
  phone?: string;
  occupancyStatus: OccupancyStatus;
  /** ISO-ish "YYYY-MM" when maintenance begins, if in the future */
  maintenanceStartMonth?: string;
  monthlyMaintenance: number;
  active: boolean;
}

export interface Payment {
  paymentId: string;
  flatNo: string;
  year: number;
  month: string;
  amount: number;
  paymentDate: string;
  status: string;
  paymentMode?: string;
  remarks?: string;
}

export interface Expense {
  expenseId: string;
  year: number;
  month: string;
  date: string;
  description: string;
  amount: number;
  status: string;
  remarks?: string;
}

export interface Balance {
  year: number;
  month: string;
  openingBalance: number;
}

export interface MaintenanceActivity {
  activityId: string;
  activityName: string;
  activityType?: string;
  scheduledDate: string;
  completedDate?: string;
  status: string;
  remarks?: string;
}

export interface DashboardData {
  flats: Flat[];
  payments: Payment[];
  expenses: Expense[];
  balances: Balance[];
  activities: MaintenanceActivity[];
  source: "sheetdb" | "demo";
  fetchedAt: string;
}

export type PaymentStatus = "PAID" | "PENDING" | "NOT_OCCUPIED" | "STARTS_LATER";

export interface FlatRow {
  flat: Flat;
  status: PaymentStatus;
  /** Month name maintenance starts, for STARTS_LATER */
  startsMonthLabel?: string;
  amountPaid: number;
  paymentDate?: string;
  paymentMode?: string;
  expectedAmount: number;
}

export type ActivityState = "COMPLETED" | "OVERDUE" | "DUE_SOON" | "UPCOMING";
