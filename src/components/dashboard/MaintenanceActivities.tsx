import { AlertTriangle, CheckCircle2, Clock, Wrench } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ActivityState, MaintenanceActivity } from "@/types/dashboard";
import { activityState } from "@/utils/calculations";
import { formatDayMonth } from "@/utils/dateUtils";

const TONES: Record<ActivityState, string> = {
  COMPLETED: "border-success/25 bg-success-soft text-success",
  DUE_SOON: "border-warning/30 bg-warning-soft text-warning-foreground",
  OVERDUE: "border-danger/25 bg-danger-soft text-danger",
  UPCOMING: "border-info/20 bg-info-soft text-info",
};

const LABELS: Record<ActivityState, string> = {
  COMPLETED: "Completed",
  DUE_SOON: "Due soon",
  OVERDUE: "Overdue",
  UPCOMING: "Upcoming",
};

export function MaintenanceActivities({ activities }: { activities: MaintenanceActivity[] }) {
  const withState = activities.map((a) => ({ activity: a, state: activityState(a) }));
  const completed = withState.filter((a) => a.state === "COMPLETED");
  const upcoming = withState
    .filter((a) => a.state !== "COMPLETED")
    .sort((a, b) => a.activity.scheduledDate.localeCompare(b.activity.scheduledDate));

  return (
    <Card className="gap-0 p-5 shadow-card">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Wrench className="size-5 text-info" />
        Maintenance Activities
      </h2>

      {activities.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No maintenance activities recorded yet.</p>
      ) : (
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <Column title="Completed" items={completed} emptyText="Nothing completed yet." />
          <Column title="Upcoming" items={upcoming} emptyText="No upcoming activities." />
        </div>
      )}
    </Card>
  );
}

function Column({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: { activity: MaintenanceActivity; state: ActivityState }[];
  emptyText: string;
}) {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-muted-foreground uppercase">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {items.map(({ activity, state }) => (
            <li
              key={activity.activityId}
              className={cn("flex items-start gap-3 rounded-lg border p-3", TONES[state])}
            >
              {state === "COMPLETED" ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              ) : state === "OVERDUE" ? (
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              ) : (
                <Clock className="mt-0.5 size-4 shrink-0" />
              )}
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{activity.activityName}</p>
                <p className="text-xs">
                  {state === "COMPLETED"
                    ? formatDayMonth(activity.completedDate ?? activity.scheduledDate)
                    : `Due: ${formatDayMonth(activity.scheduledDate)}`}{" "}
                  · {LABELS[state]}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
