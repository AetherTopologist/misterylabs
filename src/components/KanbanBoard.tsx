import { Link } from "react-router-dom";
import type { Project } from "@/lib/types";
import { STATUSES } from "@/lib/types";
import { timeAgo } from "@/lib/format";

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

const priorityVar: Record<string, string> = {
  Low: "var(--muted-foreground)",
  Medium: "var(--info)",
  High: "var(--warning)",
  Critical: "var(--destructive)",
};

export function KanbanBoard({ projects }: Props) {
  const grouped = STATUSES.map((s) => ({
    status: s,
    items: projects.filter((p) => p.status === s),
  }));

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4">
      <div className="flex min-w-max gap-3">
        {grouped.map(({ status, items }) => {
          const color = `hsl(${statusVar[status]})`;
          return (
            <div
              key={status}
              className="flex w-[280px] shrink-0 flex-col rounded-xl border border-border/60 bg-card/40"
              style={{
                background: `linear-gradient(180deg, hsl(${statusVar[status]} / 0.06), transparent 40%), hsl(var(--card) / 0.4)`,
              }}
            >
              {/* Column accent strip */}
              <div
                className="h-[2px] w-full rounded-t-xl"
                style={{ background: color }}
                aria-hidden
              />
              {/* Header */}
              <div className="flex items-center justify-between gap-2 border-b border-border/50 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: color }}
                  />
                  <span
                    className="font-mono text-[10px] uppercase tracking-[0.22em]"
                    style={{ color }}
                  >
                    {status}
                  </span>
                </div>
                <span className="rounded-md bg-secondary/70 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
                  {items.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-1 flex-col gap-2 p-2">
                {items.length === 0 ? (
                  <div className="grid place-items-center rounded-lg border border-dashed border-border/50 px-3 py-6 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Empty
                  </div>
                ) : (
                  items.map((p) => (
                    <Link
                      key={p.id}
                      to={`/projects/${p.id}`}
                      className="group block rounded-lg border border-border/60 bg-card p-2.5 transition-base hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="line-clamp-2 text-[13px] font-semibold leading-snug text-foreground">
                          {p.title}
                        </div>
                        <span
                          className="mt-1 h-2 w-2 shrink-0 rounded-full"
                          style={{ background: `hsl(${priorityVar[p.priority]})` }}
                          title={`Priority: ${p.priority}`}
                        />
                      </div>

                      {p.next_action && (
                        <div className="mt-1.5 line-clamp-2 text-[11px] text-muted-foreground">
                          → {p.next_action}
                        </div>
                      )}

                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(2, Math.min(100, p.progress_percent))}%`,
                            background: `linear-gradient(90deg, ${color}, hsl(var(--primary-glow)))`,
                          }}
                        />
                      </div>

                      <div className="mt-1.5 flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                        <span className="tabular-nums text-foreground/70">
                          {p.progress_percent}%
                        </span>
                        <span>{timeAgo(p.updated_at)}</span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
