import { Link } from "react-router-dom";
import { ArrowUpRight, GitBranch, Calendar } from "lucide-react";
import type { Project } from "@/lib/types";
import { CategoryBadge } from "./Badges";
import { formatDate, timeAgo } from "@/lib/format";

interface Props {
  project: Project;
  density?: "comfortable" | "compact";
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

export function ProjectCard({ project, density = "comfortable" }: Props) {
  const compact = density === "compact";
  const statusColor = `hsl(${statusVar[project.status]})`;
  const pad = compact ? "p-3" : "p-4";

  const visibleTags = project.tags.slice(0, 2);
  const extraTags = project.tags.length - visibleTags.length;

  return (
    <Link
      to={`/projects/${project.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card-gradient shadow-card transition-base hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Left status accent */}
      <span
        className="absolute left-0 top-0 h-full w-[3px]"
        style={{ background: statusColor }}
        aria-hidden
      />

      <div className={pad}>
        {/* Mono header row */}
        <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate" style={{ color: statusColor }}>
              {project.status}
            </span>
            <span className="text-border">/</span>
            <span className="truncate">{project.category}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="tabular-nums text-foreground/80">
              {project.progress_percent}%
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-base group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
          </div>
        </div>

        {/* Title */}
        <h3 className={`mt-2 ${compact ? "text-[15px]" : "text-base"} font-semibold leading-snug tracking-tight text-foreground`}>
          {project.title}
        </h3>

        {!compact && (
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
            {project.short_summary || project.full_description || "No summary yet."}
          </p>
        )}

        {/* Next action — single line, bordered */}
        <div className={`${compact ? "mt-2.5" : "mt-3"} flex items-start gap-2 rounded-md border border-border/60 bg-background/40 px-2.5 py-1.5`}>
          <span className="mt-px font-mono text-[10px] uppercase tracking-wider text-muted-foreground">→</span>
          <div className="line-clamp-1 text-[12.5px] text-foreground/85">
            {project.next_action || <span className="text-muted-foreground">No next action</span>}
          </div>
        </div>

        {/* Footer condensed */}
        <div className={`${compact ? "mt-2.5" : "mt-3"} flex items-center justify-between gap-2`}>
          <div className="flex min-w-0 items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <Dot color={`hsl(${priorityVar[project.priority]})`} title={`Priority: ${project.priority}`} />
            <span>{project.priority}</span>
            <span className="text-border">·</span>
            <Dot color={`hsl(${confidenceVar[project.confidence_level]})`} title={`Confidence: ${project.confidence_level}`} />
            <span>{project.confidence_level} conf</span>
            {visibleTags.length > 0 && (
              <>
                <span className="text-border">·</span>
                <div className="flex min-w-0 items-center gap-1">
                  {visibleTags.map((t) => (
                    <CategoryBadge key={t} value={t} className="px-1.5 py-0 text-[9px]" />
                  ))}
                  {extraTags > 0 && (
                    <span className="rounded bg-secondary/60 px-1 text-[9px] text-muted-foreground">+{extraTags}</span>
                  )}
                </div>
              </>
            )}
          </div>
          <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
            {timeAgo(project.updated_at)}
          </span>
        </div>

        {(project.github_repo_url || project.milestone_date) && !compact && (
          <div className="mt-2 flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {project.github_repo_url && (
              <span className="inline-flex items-center gap-1">
                <GitBranch className="h-3 w-3" /> repo
              </span>
            )}
            {project.milestone_date && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {formatDate(project.milestone_date)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Full-bleed progress bar */}
      <div className="mt-auto h-[2px] w-full bg-secondary/60">
        <div
          className="h-full"
          style={{
            width: `${Math.max(2, Math.min(100, project.progress_percent))}%`,
            background: `linear-gradient(90deg, ${statusColor}, hsl(var(--primary-glow)))`,
          }}
        />
      </div>
    </Link>
  );
}

function Dot({ color, title }: { color: string; title?: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full"
      style={{ background: color }}
      title={title}
    />
  );
}
