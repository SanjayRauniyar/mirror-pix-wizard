import { Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Totals } from "@/utils/calculations";
import { formatINR } from "@/utils/currency";

export function BalanceCard({ totals, month }: { totals: Totals; month: string }) {
  return (
    <Card className="items-center gap-2 border-success/25 bg-success-soft p-8 text-center shadow-card">
      <p className="flex items-center gap-2 text-sm font-semibold text-success">
        <Wallet className="size-4" />
        Current Balance · {month}
      </p>
      <p className="text-4xl font-bold tracking-tight tabular-nums text-success md:text-5xl">
        {formatINR(totals.currentBalance)}
      </p>
      <p className="text-sm text-muted-foreground tabular-nums">
        {formatINR(totals.openingBalance)} + {formatINR(totals.collection)} − {formatINR(totals.expenses)}
      </p>
    </Card>
  );
}
