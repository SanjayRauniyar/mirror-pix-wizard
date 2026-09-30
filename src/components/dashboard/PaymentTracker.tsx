import { useMemo, useState } from "react";
import { ArrowUpDown, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { FlatRow, PaymentStatus } from "@/types/dashboard";
import type { Totals } from "@/utils/calculations";
import { formatINR } from "@/utils/currency";
import { formatDate } from "@/utils/dateUtils";
import { StatusBadge } from "./StatusBadge";

type Filter = "ALL" | PaymentStatus;
type SortKey = "flat" | "date";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PAID", label: "Paid" },
  { key: "PARTIAL", label: "Partial" },
  { key: "PENDING", label: "Pending" },
  { key: "NOT_OCCUPIED", label: "Not Occupied" },
  { key: "STARTS_LATER", label: "Starts Later" },
];

export function PaymentTracker({
  rows,
  totals,
  onSelectFlat,
}: {
  rows: FlatRow[];
  totals: Totals;
  onSelectFlat: (row: FlatRow) => void;
}) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("flat");
  const [ascending, setAscending] = useState(true);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      if (filter !== "ALL" && row.status !== filter) return false;
      if (!q) return true;
      return (
        row.flat.flatNo.toLowerCase().includes(q) ||
        row.flat.ownerName.toLowerCase().includes(q) ||
        (row.flat.phone ?? "").toLowerCase().includes(q)
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === "flat") {
        return a.flat.flatNo.localeCompare(b.flat.flatNo, undefined, { numeric: true });
      }
      // Unpaid flats (no date) always go to the bottom, regardless of direction.
      if (!a.paymentDate && !b.paymentDate) return 0;
      if (!a.paymentDate) return 1;
      if (!b.paymentDate) return -1;
      return a.paymentDate.localeCompare(b.paymentDate);
    });
    return ascending ? sorted : sorted.reverse();
  }, [rows, filter, query, sortKey, ascending]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setAscending((v) => !v);
    else {
      setSortKey(key);
      setAscending(true);
    }
  };

  return (
    <Card className="gap-0 overflow-hidden p-0 shadow-card">
      <div className="flex flex-col gap-4 border-b border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Home className="size-5 text-info" />
            Maintenance Payment Tracker
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search flat, owner or phone"
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={filter === f.key ? "default" : "outline"}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
          <Summary label="Paid" value={`${totals.paidCount} / ${totals.applicableCount}`} tone="success" />
          <Summary label="Collected" value={formatINR(totals.collection)} tone="success" />
          <Summary label="Pending" value={formatINR(totals.pendingAmount)} tone="danger" />
          <Summary label="Not occupied" value={String(totals.notOccupiedCount)} tone="neutral" />
          <Summary label="Starts later" value={String(totals.startsLaterCount)} tone="warning" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button className="flex items-center gap-1" onClick={() => toggleSort("flat")}>
                  Flat No. <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="hidden md:table-cell">Occupancy</TableHead>
              <TableHead className="hidden md:table-cell">Monthly</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">
                <button className="flex items-center gap-1" onClick={() => toggleSort("date")}>
                  Payment Date <ArrowUpDown className="size-3.5" />
                </button>
              </TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  No flats match this filter.
                </TableCell>
              </TableRow>
            ) : (
              visible.map((row) => (
                <TableRow
                  key={row.flat.flatNo}
                  onClick={() => onSelectFlat(row)}
                  className="cursor-pointer"
                >
                  <TableCell className="font-semibold">{row.flat.flatNo}</TableCell>
                  <TableCell>{row.flat.ownerName}</TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {row.flat.occupancyStatus === "OCCUPIED" ? "Occupied" : "Vacant"}
                  </TableCell>
                  <TableCell className="hidden tabular-nums md:table-cell">
                    {formatINR(row.flat.monthlyMaintenance)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} startsMonthLabel={row.startsMonthLabel} />
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {row.status === "PAID" || row.status === "PARTIAL"
                      ? formatDate(row.paymentDate)
                      : "—"}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-semibold tabular-nums",
                      row.status === "PAID" && "text-success",
                      row.status === "PARTIAL" && "text-warning-foreground",
                    )}
                  >
                    {row.status === "PAID" || row.status === "PARTIAL"
                      ? formatINR(row.amountPaid)
                      : row.status === "PENDING"
                        ? formatINR(0)
                        : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function Summary({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "danger" | "warning" | "neutral";
}) {
  const tones = {
    success: "bg-success-soft text-success",
    danger: "bg-danger-soft text-danger",
    warning: "bg-warning-soft text-warning-foreground",
    neutral: "bg-neutral-soft text-muted-foreground",
  } as const;
  return (
    <div className={cn("rounded-lg px-3 py-2", tones[tone])}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="text-base font-bold tabular-nums">{value}</p>
    </div>
  );
}
