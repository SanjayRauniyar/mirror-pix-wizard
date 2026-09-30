import { Droplets, RefreshCw } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MONTHS } from "@/utils/dateUtils";

export function DashboardHeader({
  year,
  month,
  years,
  onYearChange,
  onMonthChange,
  onRefresh,
  refreshing,
  lastUpdated,
}: {
  year: number;
  month: string;
  years: number[];
  onYearChange: (year: number) => void;
  onMonthChange: (month: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
  lastUpdated?: string | undefined;
}) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-info-soft text-info">
            <Droplets className="size-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">Water Maintenance Dashboard</h1>
            <p className="text-sm text-muted-foreground">Monthly Payment &amp; Maintenance Tracker</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={String(year)} onValueChange={(v) => onYearChange(Number(v))}>
            <SelectTrigger className="w-[110px]" aria-label="Year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={month} onValueChange={onMonthChange}>
            <SelectTrigger className="w-[150px]" aria-label="Month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={onRefresh} disabled={refreshing} className="gap-2">
            <RefreshCw className={refreshing ? "size-4 animate-spin" : "size-4"} />
            Refresh
          </Button>

          <Button asChild variant="outline" className="hidden">
            <Link to="/setup-guide">Setup guide</Link>
          </Button>

          <p className="w-full text-xs text-muted-foreground sm:w-auto">
            {lastUpdated ? `Last updated ${lastUpdated}` : "Loading data…"}
          </p>
        </div>
      </div>
    </header>
  );
}
