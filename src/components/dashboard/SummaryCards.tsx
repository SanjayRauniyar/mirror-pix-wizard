import {
  Banknote,
  Clock,
  PiggyBank,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Totals } from "@/utils/calculations";
import { formatINR } from "@/utils/currency";

function StatCard({
  icon: Icon,
  label,
  value,
  caption,
  tone = "info",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  caption?: string;
  tone?: "info" | "success" | "warning" | "danger" | "neutral";
}) {
  const tones = {
    info: "bg-info-soft text-info",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning-foreground",
    danger: "bg-danger-soft text-danger",
    neutral: "bg-neutral-soft text-muted-foreground",
  } as const;

  return (
    <Card className="gap-0 p-5 shadow-card transition-shadow hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", tones[tone])}>
          <Icon className="size-4.5" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
      {caption ? <p className="mt-1 text-xs text-muted-foreground">{caption}</p> : null}
    </Card>
  );
}

export function SummaryCards({
  totals,
  month,
  previousMonth,
}: {
  totals: Totals;
  month: string;
  previousMonth: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard
        icon={PiggyBank}
        label="Opening Balance"
        value={formatINR(totals.openingBalance)}
        caption={`Carried forward from ${previousMonth}`}
        tone="neutral"
      />
      <StatCard
        icon={Banknote}
        label="Monthly Collection"
        value={formatINR(totals.collection)}
        caption={`${month} collection`}
        tone="success"
      />
      <StatCard
        icon={TrendingUp}
        label="Total Funds"
        value={formatINR(totals.totalFunds)}
        caption="Opening balance + collection"
        tone="info"
      />
      <StatCard
        icon={Receipt}
        label="Total Expenses"
        value={formatINR(totals.expenses)}
        caption={`${month} expenses`}
        tone="warning"
      />
      <StatCard
        icon={Wallet}
        label="Current Balance"
        value={formatINR(totals.currentBalance)}
        caption="Funds available today"
        tone="success"
      />
      <StatCard
        icon={Clock}
        label="Pending Amount"
        value={`${formatINR(totals.pendingAmount)} pending`}
        caption={`${totals.pendingCount} flat(s) yet to pay`}
        tone={totals.pendingAmount > 0 ? "danger" : "success"}
      />
    </div>
  );
}
