import { BarChart3 } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import type { Totals } from "@/utils/calculations";
import { formatINR } from "@/utils/currency";

interface SeriesPoint {
  month: string;
  collection: number;
  expenses: number;
}

export function AnalyticsCharts({
  series,
  totals,
  year,
}: {
  series: SeriesPoint[];
  totals: Totals;
  year: number;
}) {
  const statusData = [
    { name: "Paid", value: totals.paidCount, color: "var(--success)" },
    { name: "Pending", value: totals.pendingCount, color: "var(--danger)" },
    { name: "Not occupied", value: totals.notOccupiedCount, color: "var(--muted-foreground)" },
    { name: "Starts later", value: totals.startsLaterCount, color: "var(--warning)" },
  ].filter((d) => d.value > 0);

  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <BarChart3 className="size-5 text-info" />
        Analytics · {year}
      </h2>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Monthly collection">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={series}>
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} width={40} />
              <Tooltip formatter={(v: number) => formatINR(v)} />
              <Bar dataKey="collection" fill="var(--success)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Payment status">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85}>
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number, name) => [`${v} flats`, name as string]} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="mt-2 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
            {statusData.map((d) => (
              <li key={d.name} className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: d.color }} />
                {d.name} ({d.value})
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard title="Monthly expenses">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={series}>
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} width={40} />
              <Tooltip formatter={(v: number) => formatINR(v)} />
              <Bar dataKey="expenses" fill="var(--warning)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </section>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="gap-3 p-5 shadow-card">
      <p className="text-sm font-semibold text-muted-foreground">{title}</p>
      {children}
    </Card>
  );
}
