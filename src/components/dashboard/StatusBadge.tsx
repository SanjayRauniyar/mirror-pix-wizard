import { cn } from "@/lib/utils";
import type { PaymentStatus } from "@/types/dashboard";

const STYLES: Record<PaymentStatus, string> = {
  PAID: "bg-success-soft text-success border-success/20",
  PARTIAL: "bg-warning-soft text-warning-foreground border-warning/30",
  PENDING: "bg-danger-soft text-danger border-danger/20",
  NOT_OCCUPIED: "bg-neutral-soft text-muted-foreground border-border",
  STARTS_LATER: "bg-warning-soft text-warning-foreground border-warning/30",
};

const DOTS: Record<PaymentStatus, string> = {
  PAID: "bg-success",
  PARTIAL: "bg-warning",
  PENDING: "bg-danger",
  NOT_OCCUPIED: "bg-muted-foreground/50",
  STARTS_LATER: "bg-warning",
};

export function StatusBadge({
  status,
  startsMonthLabel,
  className,
}: {
  status: PaymentStatus;
  startsMonthLabel?: string | undefined;
  className?: string | undefined;
}) {
  const label =
    status === "PAID"
      ? "Paid"
      : status === "PARTIAL"
        ? "Partial"
        : status === "PENDING"
          ? "Pending"
          : status === "NOT_OCCUPIED"
            ? "Not occupied"
            : startsMonthLabel
              ? `Starts ${startsMonthLabel}`
              : "Starts later";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        STYLES[status],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOTS[status])} />
      {label}
    </span>
  );
}
