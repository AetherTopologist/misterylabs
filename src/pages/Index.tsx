import { useMemo, useState } from "react";
import { Search, Activity, Construction, AlertOctagon, Rocket, Filter, X } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { ProjectCard } from "@/components/ProjectCard";
import { QuickCreateDialog } from "@/components/QuickCreateDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/lib/store";
import { CATEGORIES, STATUSES, type Category, type Status } from "@/lib/types";

const Index = () => {
  const projects = useProjects();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");
  const [categoryFilter, setCategoryFilter] = useState<Category | "All">("All");

  const stats = useMemo(() => {
    return {
      total: projects.length,
      building: projects.filter((p) => p.status === "Building").length,
      blocked: projects.filter((p) => p.status === "Blocked").length,
      launched: projects.filter((p) => p.status === "Launched" || p.status === "Ready to Launch").length,
    };
  }, [projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects
      .filter((p) => statusFilter === "All" || p.status === statusFilter)
      .filter((p) => categoryFilter === "All" || p.category === categoryFilter)
      .filter((p) => {
        if (!q) return true;
        const hay = [
          p.title,
          p.short_summary,
          p.full_description,
          p.notes,
          p.next_action,
          p.tags.join(" "),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at));
  }, [projects, query, statusFilter, categoryFilter]);

  const hasFilters = query || statusFilter !== "All" || categoryFilter !== "All";

  return (
    <div className="min-h-screen">
      <AppHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60 bg-hero">
        <div className="absolute inset-0 bg-grid opacity-40" aria-hidden />
        <div className="container relative py-14 md:py-20">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-primary" />
            Solo creator command dashboard
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl">
            Track every <span className="text-gradient">project, experiment, and release</span> from concept to execution.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            xPRIME Lab is a research notebook crossed with mission control — built for one focused operator
            running engineering, physics, and content work in parallel.
          </p>

          {/* Stat tiles */}
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total projects" value={stats.total} icon={Activity} accent="from-primary to-primary-glow" />
            <StatCard label="Building now" value={stats.building} icon={Construction} accent="from-status-build to-primary-glow" />
            <StatCard label="Blocked" value={stats.blocked} icon={AlertOctagon} accent="from-status-blocked to-warning" />
            <StatCard label="Ready / launched" value={stats.launched} icon={Rocket} accent="from-status-launched to-accent" />
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <section className="container sticky top-16 z-30 -mt-px border-b border-border/60 bg-background/80 py-4 backdrop-blur-xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search title, tags, notes, next action…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FilterGroup
              label="Status"
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as Status | "All")}
              options={["All", ...STATUSES]}
            />
            <FilterGroup
              label="Category"
              value={categoryFilter}
              onChange={(v) => setCategoryFilter(v as Category | "All")}
              options={["All", ...CATEGORIES]}
            />
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={() => { setQuery(""); setStatusFilter("All"); setCategoryFilter("All"); }}
              >
                <X className="h-3.5 w-3.5" /> Clear
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="container py-8">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            Showing {filtered.length} of {projects.length}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState onClear={() => { setQuery(""); setStatusFilter("All"); setCategoryFilter("All"); }} hasFilters={!!hasFilters} />
        ) : (
          <div className="grid animate-fade-in gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </section>

      <footer className="container border-t border-border/60 py-8 text-center font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
        xPRIME Lab · v0.1 · local mission log
      </footer>
    </div>
  );
};

function StatCard({
  label, value, icon: Icon, accent,
}: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; accent: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card-gradient p-5 shadow-card transition-base hover:border-primary/30">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</div>
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${accent} text-primary-foreground shadow-glow`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="pointer-events-none absolute -bottom-12 -right-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl transition-base group-hover:bg-primary/20" />
    </div>
  );
}

function FilterGroup({
  label, value, options, onChange,
}: { label: string; value: string; options: readonly string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-border bg-card/60 p-1">
      <span className="px-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={
                "rounded-full px-2.5 py-1 text-xs font-medium transition-base " +
                (active
                  ? "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground")
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

function EmptyState({ onClear, hasFilters }: { onClear: () => void; hasFilters: boolean }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card/40 p-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
        <Search className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No projects match</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {hasFilters ? "Try clearing filters or searching for something else." : "Spin up your first lab entry to get started."}
      </p>
      <div className="mt-5 flex gap-2">
        {hasFilters && <Button variant="secondary" onClick={onClear}>Clear filters</Button>}
        <QuickCreateDialog />
      </div>
    </div>
  );
}

export default Index;
