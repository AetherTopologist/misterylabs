import { useEffect, useMemo, useState } from "react";
import { Search, Filter, X, LayoutGrid, Rows3, Columns3, ArrowUpDown } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectCardCompact } from "@/components/ProjectCardCompact";
import { KanbanBoard } from "@/components/KanbanBoard";
import { MilestoneTimeline } from "@/components/MilestoneTimeline";
import { OpsStatusBar } from "@/components/OpsStatusBar";
import { EvidenceVault } from "@/components/EvidenceVault";
import { QuickCreateDialog } from "@/components/QuickCreateDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useProjects } from "@/lib/store";
import {
  CATEGORIES,
  PRIORITIES,
  STATUSES,
  type Category,
  type Priority,
  type Status,
} from "@/lib/types";
import { timeAgo } from "@/lib/format";

type ViewMode = "grid" | "compact" | "kanban";
type Density = "comfortable" | "compact";
type SortKey = "updated" | "milestone" | "priority" | "progress";

const VIEW_KEY = "xprime:view";
const DENSITY_KEY = "xprime:density";
const SORT_KEY = "xprime:sort";

const PRIORITY_ORDER: Record<Priority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

const Index = () => {
  const projects = useProjects();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");
  const [categoryFilter, setCategoryFilter] = useState<Category | "All">("All");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "All">("All");

  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "grid";
    return ((localStorage.getItem(VIEW_KEY) as ViewMode) || "grid");
  });
  const [density, setDensity] = useState<Density>(() => {
    if (typeof window === "undefined") return "comfortable";
    return ((localStorage.getItem(DENSITY_KEY) as Density) || "comfortable");
  });
  const [sort, setSort] = useState<SortKey>(() => {
    if (typeof window === "undefined") return "updated";
    return ((localStorage.getItem(SORT_KEY) as SortKey) || "updated");
  });

  useEffect(() => { localStorage.setItem(VIEW_KEY, view); }, [view]);
  useEffect(() => { localStorage.setItem(DENSITY_KEY, density); }, [density]);
  useEffect(() => { localStorage.setItem(SORT_KEY, sort); }, [sort]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = projects
      .filter((p) => statusFilter === "All" || p.status === statusFilter)
      .filter((p) => categoryFilter === "All" || p.category === categoryFilter)
      .filter((p) => priorityFilter === "All" || p.priority === priorityFilter)
      .filter((p) => {
        if (!q) return true;
        const hay = [
          p.title, p.short_summary, p.full_description, p.notes, p.next_action, p.tags.join(" "),
        ].join(" ").toLowerCase();
        return hay.includes(q);
      });

    const sorted = [...list].sort((a, b) => {
      switch (sort) {
        case "milestone": {
          const aD = a.milestone_date ? +new Date(a.milestone_date) : Number.POSITIVE_INFINITY;
          const bD = b.milestone_date ? +new Date(b.milestone_date) : Number.POSITIVE_INFINITY;
          return aD - bD;
        }
        case "priority":
          return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        case "progress":
          return b.progress_percent - a.progress_percent;
        case "updated":
        default:
          return +new Date(b.updated_at) - +new Date(a.updated_at);
      }
    });
    return sorted;
  }, [projects, query, statusFilter, categoryFilter, priorityFilter, sort]);

  const hasFilters =
    !!query || statusFilter !== "All" || categoryFilter !== "All" || priorityFilter !== "All";

  const lastSync = projects.length
    ? projects.reduce((max, p) => (p.updated_at > max ? p.updated_at : max), projects[0].updated_at)
    : new Date().toISOString();

  const clear = () => {
    setQuery(""); setStatusFilter("All"); setCategoryFilter("All"); setPriorityFilter("All");
  };

  return (
    <div className="min-h-screen">
      <AppHeader />

      {/* System bar */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" aria-hidden />

      {/* Compressed Ops Status Bar */}
      <OpsStatusBar projects={projects} />

      {/* Sticky toolbar */}
      <section className="sticky top-16 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="container py-2.5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
            {/* Search */}
            <div className="relative w-full lg:max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search projects, tags, notes…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>

            {/* Filters (scrollable on overflow) */}
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
              <ChipGroup
                label="Status"
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as Status | "All")}
                options={["All", ...STATUSES]}
              />
              <ChipGroup
                label="Cat"
                value={categoryFilter}
                onChange={(v) => setCategoryFilter(v as Category | "All")}
                options={["All", ...CATEGORIES]}
              />
              <ChipGroup
                label="Pri"
                value={priorityFilter}
                onChange={(v) => setPriorityFilter(v as Priority | "All")}
                options={["All", ...PRIORITIES]}
              />
            </div>

            {/* Right cluster */}
            <div className="flex shrink-0 items-center gap-1.5">
              <ViewSwitcher value={view} onChange={setView} />

              {view === "grid" && (
                <DensityToggle value={density} onChange={setDensity} />
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2 text-xs">
                    <ArrowUpDown className="h-3 w-3" />
                    <span className="font-mono text-[10px] uppercase tracking-wider">{sort}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-wider">
                    Sort by
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                    <DropdownMenuRadioItem value="updated">Updated</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="milestone">Milestone</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="priority">Priority</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="progress">Progress</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={clear}
                >
                  <X className="h-3 w-3" /> Clear
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main */}
      <section className="container space-y-4 py-5">
        {/* Milestone timeline (hidden in kanban) */}
        {view !== "kanban" && <MilestoneTimeline projects={filtered} />}

        {/* Evidence Vault — visually separated from active work */}
        {view !== "kanban" && (
          <>
            <EvidenceVault />
            <div
              className="flex items-center gap-3 pt-1 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground"
              aria-hidden
            >
              <span>Active Work</span>
              <span className="h-px flex-1 bg-gradient-to-r from-border via-border/40 to-transparent" />
            </div>
          </>
        )}

        {/* Result counter */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            <Filter className="h-3 w-3" />
            Showing {filtered.length} / {projects.length}
            <span className="text-border">·</span>
            <span>view: {view}</span>
            {view === "grid" && (
              <>
                <span className="text-border">·</span>
                <span>density: {density}</span>
              </>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState onClear={clear} hasFilters={!!hasFilters} />
        ) : view === "kanban" ? (
          <KanbanBoard projects={filtered} />
        ) : view === "compact" ? (
          <div className="animate-fade-in overflow-hidden rounded-xl border border-border/60 bg-card/30">
            <div
              className="grid items-center gap-3 border-b border-border/60 bg-secondary/30 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground"
              style={{
                gridTemplateColumns:
                  "4px minmax(0,2.2fr) 130px 130px 60px 60px minmax(140px,1fr) minmax(0,1.6fr) 70px 16px",
              }}
            >
              <span />
              <span>Project</span>
              <span>Category</span>
              <span>Status</span>
              <span>Pri</span>
              <span>Conf</span>
              <span>Progress</span>
              <span>Next action</span>
              <span className="text-right">Updated</span>
              <span />
            </div>
            {filtered.map((p) => (
              <ProjectCardCompact key={p.id} project={p} />
            ))}
          </div>
        ) : (
          <div
            className={`grid animate-fade-in gap-4 ${
              density === "compact"
                ? "md:grid-cols-2 xl:grid-cols-4"
                : "md:grid-cols-2 xl:grid-cols-3"
            }`}
          >
            {filtered.map((p) => (
              <ProjectCard key={p.id} project={p} density={density} />
            ))}
          </div>
        )}
      </section>

      <footer className="container border-t border-border/60 py-4 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>
            xPRIME Lab v0.1
            <span className="mx-2 text-border">·</span>
            local log
            <span className="mx-2 text-border">·</span>
            {projects.length} entries
          </span>
          <span>last sync {timeAgo(lastSync)}</span>
        </div>
      </footer>
    </div>
  );
};

/* ---------- toolbar pieces ---------- */

function ChipGroup({
  label, value, options, onChange,
}: { label: string; value: string; options: readonly string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-md border border-border/70 bg-card/50 px-1 py-0.5">
      <span className="px-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-0.5">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={
                "rounded px-1.5 py-0.5 text-[11px] font-medium transition-base whitespace-nowrap " +
                (active
                  ? "bg-primary/15 text-primary-glow ring-1 ring-inset ring-primary/40"
                  : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground")
              }
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ViewSwitcher({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  const items: Array<{ key: ViewMode; icon: React.ComponentType<{ className?: string }>; label: string }> = [
    { key: "grid", icon: LayoutGrid, label: "Grid" },
    { key: "compact", icon: Rows3, label: "Compact" },
    { key: "kanban", icon: Columns3, label: "Kanban" },
  ];
  return (
    <div role="tablist" className="flex items-center gap-0.5 rounded-md border border-border/70 bg-card/50 p-0.5">
      {items.map(({ key, icon: Icon, label }) => {
        const active = value === key;
        return (
          <button
            key={key}
            role="tab"
            aria-pressed={active}
            aria-label={label}
            title={label}
            onClick={() => onChange(key)}
            className={
              "inline-flex h-7 items-center gap-1 rounded px-1.5 text-[11px] font-medium transition-base " +
              (active
                ? "bg-primary/15 text-primary-glow ring-1 ring-inset ring-primary/40"
                : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground")
            }
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}

function DensityToggle({ value, onChange }: { value: Density; onChange: (v: Density) => void }) {
  return (
    <div className="flex items-center gap-0.5 rounded-md border border-border/70 bg-card/50 p-0.5">
      {(["comfortable", "compact"] as const).map((d) => {
        const active = value === d;
        return (
          <button
            key={d}
            aria-pressed={active}
            onClick={() => onChange(d)}
            className={
              "h-7 rounded px-2 font-mono text-[10px] uppercase tracking-wider transition-base " +
              (active
                ? "bg-primary/15 text-primary-glow ring-1 ring-inset ring-primary/40"
                : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground")
            }
            title={d === "comfortable" ? "Comfortable" : "Compact"}
          >
            {d === "comfortable" ? "Cozy" : "Dense"}
          </button>
        );
      })}
    </div>
  );
}

function EmptyState({ onClear, hasFilters }: { onClear: () => void; hasFilters: boolean }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-muted-foreground">
        <Search className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-base font-semibold">No projects match</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {hasFilters ? "Try clearing filters or searching for something else." : "Spin up your first lab entry to get started."}
      </p>
      <div className="mt-4 flex gap-2">
        {hasFilters && <Button variant="secondary" size="sm" onClick={onClear}>Clear filters</Button>}
        <QuickCreateDialog />
      </div>
    </div>
  );
}

export default Index;
