import { Link } from "react-router-dom";
import { ArrowUpRight, GitBranch, Calendar } from "lucide-react";
import type { Project } from "@/lib/types";
import { CategoryBadge, ConfidenceBadge, PriorityBadge, StatusBadge } from "./Badges";
import { formatDate, timeAgo } from "@/lib/format";

interface Props {
  project: Project;
}

export function ProjectCard({ project }: Props) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card-gradient p-5 shadow-card transition-base hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge value={project.category} />
          <StatusBadge value={project.status} />
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-base group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
      </div>

      {/* Title + summary */}
      <h3 className="mt-3 text-lg font-semibold tracking-tight text-foreground">
        {project.title}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
        {project.short_summary || project.full_description || "No summary yet."}
      </p>

      {/* Progress */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
          <span>Progress</span>
          <span className="text-foreground">{project.progress_percent}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow transition-all"
            style={{ width: `${Math.max(2, Math.min(100, project.progress_percent))}%` }}
          />
        </div>
      </div>

      {/* Next action */}
      <div className="mt-4 rounded-lg border border-border/70 bg-background/40 p-3">
        <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
          Next action
        </div>
        <div className="mt-1 line-clamp-2 text-sm text-foreground/90">
          {project.next_action || <span className="text-muted-foreground">—</span>}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <PriorityBadge value={project.priority} />
        <ConfidenceBadge value={project.confidence_level} />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
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
        <span className="font-mono">Updated {timeAgo(project.updated_at)}</span>
      </div>
    </Link>
  );
}
