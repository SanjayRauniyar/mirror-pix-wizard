import type { DashboardData, Flat, Payment } from "@/types/dashboard";

const ALL_FLATS = [
  "101",
  "102",
  "103",
  "104",
  "105",
  "106",
  "201",
  "202",
  "203",
  "204",
  "205",
  "206",
  "301",
  "302",
  "303",
  "304",
  "305",
  "306",
  "401",
  "402",
  "403",
  "404",
  "405",
  "406",
  "501",
  "502",
  "503",
  "504",
  "505",
  "506",
];

const NOT_OCCUPIED = new Set(["101", "102", "305", "505"]);
const STARTS_LATER: Record<string, string> = { "105": "2026-10" };

const PAID_SEPTEMBER = [
  "103",
  "104",
  "106",
  "201",
  "202",
  "203",
  "204",
  "205",
  "206",
  "302",
  "303",
  "304",
  "306",
  "401",
  "402",
  "403",
  "404",
  "405",
  "406",
  "501",
  "502",
  "503",
  "504",
  "506",
];

const flats: Flat[] = ALL_FLATS.map((flatNo) => ({
  flatNo,
  ownerName: `Owner ${flatNo}`,
  occupancyStatus: NOT_OCCUPIED.has(flatNo) ? "NOT_OCCUPIED" : "OCCUPIED",
  maintenanceStartMonth: STARTS_LATER[flatNo],
  monthlyMaintenance: 600,
  active: true,
}));

function payment(flatNo: string, month: string, day: number, id: string): Payment {
  const monthNum = month === "July" ? "07" : month === "August" ? "08" : "09";
  return {
    paymentId: id,
    flatNo,
    year: 2026,
    month,
    amount: 600,
    paymentDate: `2026-${monthNum}-${String(day).padStart(2, "0")}`,
    status: "PAID",
    paymentMode: Number(flatNo) % 2 === 0 ? "UPI" : "Cash",
  };
}

const payments: Payment[] = [];
let counter = 1;
for (const month of ["July", "August"]) {
  for (const flatNo of ALL_FLATS) {
    if (NOT_OCCUPIED.has(flatNo) || STARTS_LATER[flatNo]) continue;
    payments.push(payment(flatNo, month, 5, `P${String(counter++).padStart(3, "0")}`));
  }
}
PAID_SEPTEMBER.forEach((flatNo, i) => {
  payments.push(payment(flatNo, "September", (i % 20) + 2, `P${String(counter++).padStart(3, "0")}`));
});

export const DEMO_DATA: DashboardData = {
  flats,
  payments,
  expenses: [
    {
      expenseId: "E001",
      year: 2026,
      month: "September",
      date: "2026-09-04",
      description: "Ajay's monthly salary",
      amount: 1000,
      status: "PAID",
    },
    {
      expenseId: "E002",
      year: 2026,
      month: "September",
      date: "2026-09-10",
      description: "Two acid bottles for drain cleaning",
      amount: 60,
      status: "PAID",
    },
    {
      expenseId: "E003",
      year: 2026,
      month: "September",
      date: "2026-09-19",
      description: "Block 2 Manjeera application",
      amount: 4000,
      status: "PAID",
    },
    {
      expenseId: "E004",
      year: 2026,
      month: "August",
      date: "2026-08-06",
      description: "Ajay's monthly salary",
      amount: 1000,
      status: "PAID",
    },
    {
      expenseId: "E005",
      year: 2026,
      month: "August",
      date: "2026-08-18",
      description: "Motor repair",
      amount: 2400,
      status: "PAID",
    },
    {
      expenseId: "E006",
      year: 2026,
      month: "July",
      date: "2026-07-07",
      description: "Ajay's monthly salary",
      amount: 1000,
      status: "PAID",
    },
  ],
  balances: [
    { year: 2026, month: "July", openingBalance: 2000 },
    { year: 2026, month: "August", openingBalance: 16600 },
    { year: 2026, month: "September", openingBalance: 6574 },
  ],
  activities: [
    {
      activityId: "A001",
      activityName: "Filter cleaning",
      activityType: "FILTER_CLEANING",
      scheduledDate: "2026-09-04",
      completedDate: "2026-09-04",
      status: "COMPLETED",
    },
    {
      activityId: "A002",
      activityName: "Filter replacement",
      activityType: "FILTER_REPLACEMENT",
      scheduledDate: "2026-09-21",
      completedDate: "2026-09-21",
      status: "COMPLETED",
    },
    {
      activityId: "A003",
      activityName: "Sump and overhead tank cleaning",
      activityType: "TANK_CLEANING",
      scheduledDate: "2026-09-24",
      status: "UPCOMING",
    },
    {
      activityId: "A004",
      activityName: "Filter cleaning",
      activityType: "FILTER_CLEANING",
      scheduledDate: "2026-10-01",
      status: "UPCOMING",
    },
    {
      activityId: "A005",
      activityName: "Filter replacement",
      activityType: "FILTER_REPLACEMENT",
      scheduledDate: "2026-11-21",
      status: "UPCOMING",
    },
  ],
  source: "demo",
  fetchedAt: new Date().toISOString(),
};
