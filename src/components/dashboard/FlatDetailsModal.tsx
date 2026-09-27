import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DashboardData, FlatRow } from "@/types/dashboard";
import { formatINR } from "@/utils/currency";
import { formatDate, monthIndex, periodKey } from "@/utils/dateUtils";
import { StatusBadge } from "./StatusBadge";

export function FlatDetailsModal({
  row,
  data,
  month,
  year,
  onClose,
}: {
  row: FlatRow | null;
  data: DashboardData;
  month: string;
  year: number;
  onClose: () => void;
}) {
  if (!row) return null;

  const history = data.payments
    .filter((p) => p.flatNo === row.flat.flatNo)
    .filter((p) => periodKey(p.year, p.month) < periodKey(year, month))
    .sort((a, b) => periodKey(b.year, b.month).localeCompare(periodKey(a.year, a.month)))
    .slice(0, 6);

  const outstanding = Math.max(row.expectedAmount - row.amountPaid, 0);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Flat {row.flat.flatNo}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <Detail label="Owner" value={row.flat.ownerName} />
            <Detail
              label="Occupancy"
              value={row.flat.occupancyStatus === "OCCUPIED" ? "Occupied" : "Not occupied"}
            />
            <Detail label="Monthly maintenance" value={formatINR(row.flat.monthlyMaintenance)} />
            <Detail label="Payment mode" value={row.paymentMode ?? "—"} />
          </div>

          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">
                {month} {year}
              </p>
              <StatusBadge status={row.status} startsMonthLabel={row.startsMonthLabel} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <Detail label="Amount" value={formatINR(row.amountPaid)} />
              <Detail label="Paid on" value={row.status === "PAID" ? formatDate(row.paymentDate) : "—"} />
              <Detail label="Outstanding" value={formatINR(outstanding)} />
            </div>
          </div>

          <div>
            <p className="mb-2 font-semibold">Payment history</p>
            {history.length === 0 ? (
              <p className="text-muted-foreground">No earlier payments recorded.</p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {history.map((p) => (
                  <li key={p.paymentId} className="flex items-center justify-between px-3 py-2">
                    <span>
                      {p.month} {p.year}
                    </span>
                    <span className="tabular-nums">{formatINR(p.amount)}</span>
                    <span
                      className={
                        monthIndex(p.month) >= 0 && p.status.toUpperCase() === "PAID"
                          ? "text-success font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {p.status.toUpperCase() === "PAID" ? "Paid" : p.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
