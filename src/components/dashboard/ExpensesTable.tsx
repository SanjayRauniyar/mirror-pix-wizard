import { Receipt } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Expense } from "@/types/dashboard";
import { formatINR } from "@/utils/currency";
import { formatDayMonth } from "@/utils/dateUtils";

export function ExpensesTable({ expenses, month }: { expenses: Expense[]; month: string }) {
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <Card className="gap-0 overflow-hidden p-0 shadow-card">
      <div className="flex items-center justify-between border-b border-border p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Receipt className="size-5 text-warning" />
          Expenses
        </h2>
        <p className="text-sm text-muted-foreground">{month}</p>
      </div>

      {expenses.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">No expenses recorded for {month}.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((e) => (
              <TableRow key={e.expenseId}>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDayMonth(e.date)}
                </TableCell>
                <TableCell>{e.description}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatINR(e.amount)}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">
                    {e.status === "PAID" ? "Paid" : e.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="flex items-center justify-between border-t border-border p-5">
        <span className="font-semibold">Total Expenses</span>
        <span className="text-xl font-bold tabular-nums text-warning-foreground">{formatINR(total)}</span>
      </div>
    </Card>
  );
}
