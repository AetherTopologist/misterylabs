import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import type { Project } from "@/lib/types";
import { formatDate } from "@/lib/format";

interface Props {
  projects: Project[];
}

const statusVar: Record<string, string> = {
  Backlog: "var(--status-backlog)",
  Researching: "var(--status-research)",
  Validating: "var(--status-validate)",
  Building: "var(--status-build)",
  Blocked: "var(--status-blocked)",
  "Ready to Launch": "var(--status-ready)",
  Launched: "var(--status-launched)",
};

const WINDOW_DAYS = 60;

function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function MilestoneTimeline({ projects }: Props) {
  const [open, setOpen] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const { upcoming, overdue } = useMemo(() => {
    const withDates = projects.filter((p) => p.milestone_date);
    const upcoming: Array<{ project: Project; days: number }> = [];
    const overdue: Array<{ project: Project; days: number }> = [];
    for (const p of withDates) {
      const d = daysUntil(p.milestone_date);
      if (d < 0) overdue.push({ project: p, days: d });
      else if (showAll || d <= WINDOW_DAYS) upcoming.push({ project: p, days: d });
    }
    upcoming.sort((a, b) => a.days - b.days);
    overdue.sort((a, b) => b.days - a.days);
    return { upcoming, overdue };
  }, [projects, showAll]);

  const ticks = [0, 7, 14, 30, 60];
  const maxWindow = showAll
    ? Math.max(WINDOW_DAYS, ...upcoming.map((u) => u.days), 0)
    : WINDOW_DAYS;

  const total = upcoming.length + overdue.length;

  return (
    <section className="rounded-xl border border-border/60 bg-card/30">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border/50 px-3 py-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground transition-base hover:text-foreground"
          aria-expanded={open}
        >
          {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          Upcoming milestones
          <span className="text-border">//</span>
          <span className="text-foreground/80">
            Next {showAll ? "all" : `${WINDOW_DAYS}d`}
          </span>
          <span className="rounded-md bg-secondary/70 px-1.5 py-0.5 text-[10px] tabular-nums text-foreground/80">
            {total}
          </span>
        </button>

        <button
          onClick={() => setShowAll((v) => !v)}
          className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-base hover:text-primary"
        >
          {showAll ? "Window" : "Show all"}
        </button>
      </div>

      {open && (
        <div className="space-y-3 p-3">
          {total === 0 ? (
            <div className="py-3 text-center font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              No milestones in window
            </div>
          ) : (
            <>
              {/* Overdue lane */}
              {overdue.length > 0 && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/[0.04] p-2">
                  <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-destructive">
                    <AlertTriangle className="h-3 w-3" />
                    Overdue
                    <span className="text-destructive/60">({overdue.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {overdue.map(({ project, days }) => (
                      <MilestoneChip key={project.id} project={project} days={days} />
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline track */}
              <div className="relative">
                <div className="relative h-8">
                  {/* baseline */}
                  <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-border" />
                  {/* ticks */}
                  {ticks.map((t) => {
                    if (t > maxWindow) return null;
                    const left = (t / maxWindow) * 100;
                    return (
                      <div
                        key={t}
                        className="absolute top-1/2 -translate-y-1/2"
                        style={{ left: `${left}%` }}
                      >
                        <div className="h-2 w-px bg-border" />
                        <div className="mt-1 -translate-x-1/2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                          {t === 0 ? "Today" : `+${t}d`}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Chips by date */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {upcoming.length === 0 ? (
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      No upcoming in window
                    </div>
                  ) : (
                    upcoming.map(({ project, days }) => (
                      <MilestoneChip key={project.id} project={project} days={days} />
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function MilestoneChip({ project, days }: { project: Project; days: number }) {
  const color = `hsl(${statusVar[project.status]})`;
  let pillClass = "bg-success/15 text-success ring-success/30";
  let label = `T+${days}d`;
  if (days < 0) {
    pillClass = "bg-destructive/15 text-destructive ring-destructive/40";
    label = `OVERDUE ${Math.abs(days)}d`;
  } else if (days === 0) {
    pillClass = "bg-warning/20 text-warning ring-warning/40";
    label = "TODAY";
  } else if (days <= 7) {
    pillClass = "bg-warning/15 text-warning ring-warning/30";
    label = `T-${days}d`;
  } else if (days <= 30) {
    pillClass = "bg-info/15 text-info ring-info/30";
    label = `T-${days}d`;
  } else {
    label = `T-${days}d`;
  }

  return (
    <Link
      to={`/projects/${project.id}`}
      className="group inline-flex max-w-[280px] items-center gap-1.5 rounded-md border border-border/60 bg-card px-2 py-1 transition-base hover:border-primary/40 hover:bg-secondary/40"
      title={`${project.title} · ${formatDate(project.milestone_date)}`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
      <span className="truncate text-[11px] font-medium text-foreground">{project.title}</span>
      <span
        className={`ml-1 inline-flex items-center rounded px-1.5 py-px font-mono text-[9px] uppercase tracking-wider ring-1 ring-inset ${pillClass}`}
      >
        {label}
      </span>
    </Link>
  );
}
