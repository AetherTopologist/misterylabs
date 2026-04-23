import { cn } from "@/lib/utils";
import type { Status, Priority, Confidence } from "@/lib/types";

const statusStyles: Record<Status, string> = {
  Backlog: "bg-status-backlog/15 text-status-backlog ring-status-backlog/30",
  Researching: "bg-status-research/15 text-status-research ring-status-research/30",
  Validating: "bg-status-validate/15 text-status-validate ring-status-validate/30",
  Building: "bg-status-build/15 text-primary-glow ring-status-build/40",
  Blocked: "bg-status-blocked/15 text-status-blocked ring-status-blocked/40",
  "Ready to Launch": "bg-status-ready/15 text-status-ready ring-status-ready/40",
  Launched: "bg-status-launched/15 text-status-launched ring-status-launched/40",
};

const priorityStyles: Record<Priority, string> = {
  Low: "bg-muted text-muted-foreground ring-border",
  Medium: "bg-info/10 text-info ring-info/30",
  High: "bg-warning/10 text-warning ring-warning/30",
  Critical: "bg-destructive/15 text-destructive ring-destructive/40",
};

const confidenceStyles: Record<Confidence, string> = {
  Low: "bg-destructive/10 text-destructive ring-destructive/30",
  Medium: "bg-warning/10 text-warning ring-warning/30",
  High: "bg-success/10 text-success ring-success/30",
};

const base =
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap";

export function StatusBadge({ value, className }: { value: Status; className?: string }) {
  return (
    <span className={cn(base, statusStyles[value], className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {value}
    </span>
  );
}

export function PriorityBadge({ value, className }: { value: Priority; className?: string }) {
  return <span className={cn(base, priorityStyles[value], className)}>{value}</span>;
}

export function ConfidenceBadge({ value, className }: { value: Confidence; className?: string }) {
  return (
    <span className={cn(base, confidenceStyles[value], className)}>
      Confidence: {value}
    </span>
  );
}

export function CategoryBadge({ value, className }: { value: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-secondary/60 px-2 py-0.5 text-xs font-medium text-secondary-foreground ring-1 ring-inset ring-border font-mono uppercase tracking-wide",
        className,
      )}
    >
      {value}
    </span>
  );
}
