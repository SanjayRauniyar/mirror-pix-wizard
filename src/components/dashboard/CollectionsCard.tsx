import { Coins } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Totals } from "@/utils/calculations";
import { formatINR } from "@/utils/currency";

export function CollectionsCard({
  totals,
  month,
  previousMonth,
}: {
  totals: Totals;
  month: string;
  previousMonth: string;
}) {
  return (
    <Card className="gap-0 p-5 shadow-card">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Coins className="size-5 text-success" />
        Collections
      </h2>
      <dl className="mt-4 space-y-3">
        <Row label={`${previousMonth} Opening Balance`} value={formatINR(totals.openingBalance)} />
        <Row label={`${month} Collection`} value={formatINR(totals.collection)} />
        <Row label="Expected Collection" value={formatINR(totals.expected)} muted />
        <div className="flex items-center justify-between border-t border-border pt-3">
          <dt className="font-semibold">Total Funds</dt>
          <dd className="text-xl font-bold tabular-nums text-success">{formatINR(totals.totalFunds)}</dd>
        </div>
      </dl>
    </Card>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={muted ? "text-sm text-muted-foreground" : "text-sm"}>{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
