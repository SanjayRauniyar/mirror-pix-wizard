import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Info } from "lucide-react";
import { AnalyticsCharts } from "@/components/dashboard/AnalyticsCharts";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { CollectionsCard } from "@/components/dashboard/CollectionsCard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ExpensesTable } from "@/components/dashboard/ExpensesTable";
import { FlatDetailsModal } from "@/components/dashboard/FlatDetailsModal";
import { MaintenanceActivities } from "@/components/dashboard/MaintenanceActivities";
import { PaymentTracker } from "@/components/dashboard/PaymentTracker";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { isSheetDbConfigured, loadDashboardData } from "@/services/sheetdb";
import type { FlatRow } from "@/types/dashboard";
import {
  availableYears,
  buildFlatRows,
  computeTotals,
  expensesFor,
  monthlySeries,
  previousMonthLabel,
} from "@/utils/calculations";
import { MONTHS, monthName } from "@/utils/dateUtils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Water Maintenance Dashboard | Society Payment & Expense Tracker" },
      {
        name: "description",
        content:
          "Track monthly water maintenance payments, pending flats, expenses, balances and upcoming maintenance activities for your apartment society.",
      },
      { property: "og:title", content: "Water Maintenance Dashboard" },
      {
        property: "og:description",
        content:
          "Monthly payment and maintenance tracker for residential societies: collections, expenses, balances and activity schedule.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState<string>(monthName(now.getMonth()));
  const [selectedRow, setSelectedRow] = useState<FlatRow | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const query = useQuery({
    queryKey: ["dashboard-data"],
    queryFn: loadDashboardData,
    staleTime: 60_000,
  });

  const data = query.data;

  const view = useMemo(() => {
    if (!data) return null;
    const period = { year, month };
    const rows = buildFlatRows(data, period);
    return {
      rows,
      totals: computeTotals(data, period, rows),
      expenses: expensesFor(data.expenses, period),
      series: monthlySeries(data, year),
      years: availableYears(data),
      previousMonth: previousMonthLabel(period),
    };
  }, [data, year, month]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        year={year}
        month={month}
        years={view?.years ?? [now.getFullYear()]}
        onYearChange={setYear}
        onMonthChange={(m) => setMonth(MONTHS.includes(m as never) ? m : month)}
        onRefresh={() => void query.refetch()}
        refreshing={query.isFetching}
        lastUpdated={
          data && mounted ? new Date(data.fetchedAt).toLocaleString("en-IN") : undefined
        }
      />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">
        {!isSheetDbConfigured ? (
          <div className="flex items-start gap-3 rounded-xl border border-info/25 bg-info-soft p-4 text-sm text-info">
            <Info className="mt-0.5 size-4 shrink-0" />
            <p>
              Showing sample data. Add your Google Sheet connection (SheetDB API URL) to show the real
              society records.
            </p>
          </div>
        ) : null}

        {query.isError ? (
          <Card className="items-start gap-3 border-danger/25 bg-danger-soft p-6">
            <p className="flex items-center gap-2 text-base font-semibold text-danger">
              <AlertTriangle className="size-5" />
              Unable to load the latest data
            </p>
            <p className="text-sm text-muted-foreground">
              Please check your internet connection or SheetDB configuration.
            </p>
            <Button onClick={() => void query.refetch()}>Retry</Button>
          </Card>
        ) : null}

        {data?.issues?.length ? (
          <Card className="gap-2 border-warning/30 bg-warning-soft p-5">
            <p className="flex items-center gap-2 font-semibold text-warning-foreground">
              <AlertTriangle className="size-5" />
              {data.issues.length} thing{data.issues.length > 1 ? "s" : ""} to fix in your Google Sheet
            </p>
            <ul className="max-h-60 space-y-1 overflow-y-auto text-sm">
              {data.issues.map((i, k) => (
                <li key={k}>
                  <b>{i.tab}</b>
                  {i.row ? `, row ${i.row}` : ""}
                  {i.column ? `, column ${i.column}` : ""}: {i.message}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {query.isLoading || !view ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-96 rounded-xl" />
          </div>
        ) : (
          <>
            <SummaryCards totals={view.totals} month={month} previousMonth={view.previousMonth} />

            <PaymentTracker rows={view.rows} totals={view.totals} onSelectFlat={setSelectedRow} />

            <div className="grid gap-4 lg:grid-cols-2">
              <CollectionsCard totals={view.totals} month={month} />
              <ExpensesTable expenses={view.expenses} month={month} />
            </div>

            <BalanceCard totals={view.totals} month={month} />

            <MaintenanceActivities activities={data?.activities ?? []} />

            {mounted ? (
              <AnalyticsCharts series={view.series} totals={view.totals} year={year} />
            ) : null}

            <FlatDetailsModal
              row={selectedRow}
              data={data!}
              month={month}
              year={year}
              onClose={() => setSelectedRow(null)}
            />
          </>
        )}

        <footer className="border-t border-border pt-6 pb-2 text-center text-xs text-muted-foreground">
          Water maintenance records for the society · figures update automatically with the selected
          month
        </footer>
      </main>
    </div>
  );
}
