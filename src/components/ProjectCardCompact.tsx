import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { Project } from "@/lib/types";
import { timeAgo } from "@/lib/format";

interface Props {
  project: Project;
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

const confidenceVar: Record<string, string> = {
  Low: "var(--destructive)",
  Medium: "var(--warning)",
  High: "var(--success)",
};

export function ProjectCardCompact({ project }: Props) {
  const statusColor = `hsl(${statusVar[project.status]})`;
  return (
    <Link
      to={`/projects/${project.id}`}
      className="group grid items-center gap-3 border-b border-border/50 px-3 py-2.5 transition-base hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{
        gridTemplateColumns:
          "4px minmax(0,2.2fr) 130px 130px 60px 60px minmax(140px,1fr) minmax(0,1.6fr) 70px 16px",
      }}
    >
      {/* Status accent bar */}
      <span
        className="h-7 w-1 rounded-full"
        style={{ background: statusColor }}
        aria-hidden
      />

      {/* Title */}
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-foreground">{project.title}</div>
        {project.short_summary && (
          <div className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {project.short_summary}
          </div>
        )}
      </div>

      {/* Category */}
      <div className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {project.category}
      </div>

      {/* Status */}
      <div
        className="truncate font-mono text-[10px] uppercase tracking-[0.18em]"
        style={{ color: statusColor }}
      >
        {project.status}
      </div>

      {/* Priority */}
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: `hsl(${priorityVar[project.priority]})` }}
        />
        {project.priority.slice(0, 4)}
      </div>

      {/* Confidence */}
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: `hsl(${confidenceVar[project.confidence_level]})` }}
        />
        {project.confidence_level.slice(0, 3)}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.max(2, Math.min(100, project.progress_percent))}%`,
              background: `linear-gradient(90deg, ${statusColor}, hsl(var(--primary-glow)))`,
            }}
          />
        </div>
        <span className="font-mono text-[10px] tabular-nums text-foreground/80">
          {project.progress_percent}%
        </span>
      </div>

      {/* Next action */}
      <div className="min-w-0 truncate text-xs text-foreground/80">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          NEXT →{" "}
        </span>
        {project.next_action || <span className="text-muted-foreground">—</span>}
      </div>

      {/* Updated */}
      <div className="text-right font-mono text-[10px] tabular-nums text-muted-foreground">
        {timeAgo(project.updated_at)}
      </div>

      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-base group-hover:translate-x-0.5 group-hover:opacity-100" />
    </Link>
  );
}
