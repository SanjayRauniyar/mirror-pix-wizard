/** Single source of truth for the Google Sheet layout used by the setup guide and data checks. */
export interface ColumnSpec {
  name: string;
  required: boolean;
  type: "Text" | "Number" | "Date (YYYY-MM-DD)" | "Month (YYYY-MM)" | "Month name" | "TRUE / FALSE";
  allowed?: string;
  example: string;
  purpose: string;
}

export interface SheetSpec {
  key: "flats" | "payments" | "expenses" | "balances" | "activities" | "settings";
  tab: string;
  intro: string;
  columns: ColumnSpec[];
  exampleRows: string[][];
}

export const SPREADSHEET_NAME = "Water Maintenance Management";

export const OCCUPANCY_VALUES = ["OCCUPIED", "NOT_OCCUPIED"];
export const PAYMENT_STATUS_VALUES = ["PAID"];
export const PAYMENT_MODES = ["UPI", "CASH", "BANK_TRANSFER", "CHEQUE", "OTHER"];
export const EXPENSE_STATUS_VALUES = ["PAID"];
export const ACTIVITY_STATUS_VALUES = ["COMPLETED", "UPCOMING"];
export const ACTIVITY_TYPES = ["FILTER_CLEANING", "FILTER_REPLACEMENT", "TANK_CLEANING", "OTHER"];
export const MONTH_NAMES =
  "January, February, March, April, May, June, July, August, September, October, November, December";

export const SHEET_SPECS: SheetSpec[] = [
  {
    key: "flats",
    tab: "Flats",
    intro: "One row per flat. This is the master list the dashboard uses to decide who should pay each month.",
    columns: [
      { name: "flat_no", required: true, type: "Text", example: "103", purpose: "Identifies the flat. Must be unique — never repeat a flat number." },
      { name: "owner_name", required: true, type: "Text", example: "Raj Kumar", purpose: "Shown in the payment tracker and flat details." },
      { name: "phone", required: false, type: "Text", example: "9876543210", purpose: "Contact number shown in flat details." },
      { name: "occupancy_status", required: true, type: "Text", allowed: "OCCUPIED, NOT_OCCUPIED", example: "OCCUPIED", purpose: "NOT_OCCUPIED flats are never counted as pending or expected." },
      { name: "maintenance_start_month", required: false, type: "Month (YYYY-MM)", example: "2026-10", purpose: "First month maintenance applies. Leave blank if it already applies." },
      { name: "monthly_maintenance", required: true, type: "Number", example: "600", purpose: "Amount expected from this flat each month. Numbers only, no ₹." },
      { name: "active", required: true, type: "TRUE / FALSE", allowed: "TRUE, FALSE", example: "TRUE", purpose: "FALSE hides the flat from the dashboard completely." },
    ],
    exampleRows: [
      ["101", "Owner 101", "", "NOT_OCCUPIED", "", "600", "TRUE"],
      ["102", "Owner 102", "", "NOT_OCCUPIED", "", "600", "TRUE"],
      ["103", "Owner 103", "", "OCCUPIED", "", "600", "TRUE"],
      ["104", "Owner 104", "", "OCCUPIED", "", "600", "TRUE"],
      ["105", "Owner 105", "", "OCCUPIED", "2026-10", "600", "TRUE"],
      ["106", "Owner 106", "", "OCCUPIED", "", "600", "TRUE"],
    ],
  },
  {
    key: "payments",
    tab: "Payments",
    intro: "One row per payment actually received. Never add a row for a flat that has not paid — a missing row is what marks a flat as pending.",
    columns: [
      { name: "payment_id", required: true, type: "Text", example: "P001", purpose: "Unique reference for the payment (P001, P002, …)." },
      { name: "flat_no", required: true, type: "Text", example: "103", purpose: "Must match a flat_no in the Flats tab." },
      { name: "year", required: true, type: "Number", example: "2026", purpose: "Year the payment is for." },
      { name: "month", required: true, type: "Month name", allowed: MONTH_NAMES, example: "September", purpose: "Month the payment is for (full English name)." },
      { name: "amount", required: true, type: "Number", example: "600", purpose: "Amount received. Numbers only, no ₹ or commas." },
      { name: "payment_date", required: true, type: "Date (YYYY-MM-DD)", example: "2026-09-04", purpose: "Date the money was received." },
      { name: "status", required: true, type: "Text", allowed: "PAID", example: "PAID", purpose: "Indicates that payment was received." },
      { name: "payment_mode", required: false, type: "Text", allowed: PAYMENT_MODES.join(", "), example: "UPI", purpose: "How the money was paid." },
      { name: "remarks", required: false, type: "Text", example: "September maintenance", purpose: "Any note." },
    ],
    exampleRows: [
      ["P001", "103", "2026", "September", "600", "2026-09-03", "PAID", "UPI", ""],
      ["P002", "104", "2026", "September", "600", "2026-09-04", "PAID", "UPI", ""],
      ["P003", "106", "2026", "September", "600", "2026-09-04", "PAID", "CASH", ""],
    ],
  },
  {
    key: "expenses",
    tab: "Expenses",
    intro: "One row per expense paid from the maintenance fund.",
    columns: [
      { name: "expense_id", required: true, type: "Text", example: "E001", purpose: "Unique reference (E001, E002, …)." },
      { name: "year", required: true, type: "Number", example: "2026", purpose: "Year the expense belongs to." },
      { name: "month", required: true, type: "Month name", allowed: MONTH_NAMES, example: "September", purpose: "Month the expense belongs to." },
      { name: "expense_date", required: true, type: "Date (YYYY-MM-DD)", example: "2026-09-04", purpose: "Date the money was spent." },
      { name: "description", required: true, type: "Text", example: "Ajay's monthly salary", purpose: "What the money was spent on." },
      { name: "amount", required: true, type: "Number", example: "1000", purpose: "Amount spent. Enter 1000, not ₹1,000." },
      { name: "status", required: true, type: "Text", allowed: "PAID", example: "PAID", purpose: "Indicates the expense was paid." },
      { name: "remarks", required: false, type: "Text", example: "", purpose: "Any note." },
    ],
    exampleRows: [
      ["E001", "2026", "September", "2026-09-04", "Ajay's monthly salary", "1000", "PAID", ""],
      ["E002", "2026", "September", "2026-09-10", "Two acid bottles for drain cleaning", "60", "PAID", ""],
      ["E003", "2026", "September", "2026-09-19", "Block 2 Manjeera application", "4000", "PAID", ""],
    ],
  },
  {
    key: "balances",
    tab: "Balances",
    intro: "Opening balance of the fund at the start of a month. You only need the first month — later months are calculated automatically.",
    columns: [
      { name: "year", required: true, type: "Number", example: "2026", purpose: "Year of the balance." },
      { name: "month", required: true, type: "Month name", allowed: MONTH_NAMES, example: "September", purpose: "Month of the balance." },
      { name: "opening_balance", required: true, type: "Number", example: "6574", purpose: "Money in the fund on the first day of the month. If entered, it overrides the calculated value." },
    ],
    exampleRows: [
      ["2026", "September", "6574"],
      ["2026", "October", "15914"],
    ],
  },
  {
    key: "activities",
    tab: "Maintenance Activities",
    intro: "Scheduled work like filter cleaning and tank cleaning. Fill completed_date only when the work is actually done.",
    columns: [
      { name: "activity_id", required: true, type: "Text", example: "A001", purpose: "Unique reference (A001, A002, …)." },
      { name: "activity_name", required: true, type: "Text", example: "Filter cleaning", purpose: "Shown on the dashboard." },
      { name: "activity_type", required: false, type: "Text", allowed: ACTIVITY_TYPES.join(", "), example: "FILTER_CLEANING", purpose: "Category of work." },
      { name: "scheduled_date", required: true, type: "Date (YYYY-MM-DD)", example: "2026-09-24", purpose: "When the work is due. Used to show Due soon / Overdue." },
      { name: "completed_date", required: false, type: "Date (YYYY-MM-DD)", example: "2026-09-24", purpose: "Fill only after the work is done — the activity then shows green." },
      { name: "status", required: true, type: "Text", allowed: ACTIVITY_STATUS_VALUES.join(", "), example: "UPCOMING", purpose: "COMPLETED or UPCOMING. Due soon / Overdue is worked out from the dates." },
      { name: "remarks", required: false, type: "Text", example: "", purpose: "Any note." },
    ],
    exampleRows: [
      ["A001", "Filter cleaning", "FILTER_CLEANING", "2026-09-04", "2026-09-04", "COMPLETED", ""],
      ["A002", "Filter replacement", "FILTER_REPLACEMENT", "2026-09-21", "2026-09-21", "COMPLETED", ""],
      ["A003", "Sump and overhead tank cleaning", "TANK_CLEANING", "2026-09-24", "", "UPCOMING", ""],
      ["A004", "Filter cleaning", "FILTER_CLEANING", "2026-10-01", "", "UPCOMING", ""],
      ["A005", "Filter replacement", "FILTER_REPLACEMENT", "2026-11-21", "", "UPCOMING", ""],
    ],
  },
  {
    key: "settings",
    tab: "Settings",
    intro: "Optional configuration. maintenance_amount is used for any flat whose monthly_maintenance is blank; society_name appears in the dashboard header.",
    columns: [
      { name: "setting", required: true, type: "Text", allowed: "maintenance_amount, currency, society_name", example: "maintenance_amount", purpose: "Name of the setting." },
      { name: "value", required: true, type: "Text", example: "600", purpose: "Value of the setting." },
    ],
    exampleRows: [
      ["maintenance_amount", "600"],
      ["currency", "INR"],
      ["society_name", "Water Maintenance Society"],
    ],
  },
];

export const specFor = (key: SheetSpec["key"]) => SHEET_SPECS.find((s) => s.key === key)!;
