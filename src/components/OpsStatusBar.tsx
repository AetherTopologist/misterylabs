import { useMemo } from "react";
import type { Project } from "@/lib/types";

interface Props {
  projects: Project[];
}

export function OpsStatusBar({ projects }: Props) {
  const stats = useMemo(() => {
    const total = projects.length;
    const building = projects.filter((p) => p.status === "Building").length;
    const blocked = projects.filter((p) => p.status === "Blocked").length;
    const ready = projects.filter((p) => p.status === "Ready to Launch").length;
    const launched = projects.filter((p) => p.status === "Launched").length;
    const avg = total
      ? Math.round(projects.reduce((s, p) => s + (p.progress_percent || 0), 0) / total)
      : 0;
    return { total, building, blocked, ready, launched, avg };
  }, [projects]);

  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-hero">
      <div className="absolute inset-0 bg-grid opacity-30" aria-hidden />
      <div className="container relative py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: callsign */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-status-launched">
                <span className="absolute inset-0 animate-pulse-glow rounded-full bg-status-launched" />
              </span>
              <span className="text-foreground/80">Mission control</span>
              <span className="text-border">//</span>
              <span className="text-status-launched">Status nominal</span>
            </div>
            <h1 className="mt-2 text-base font-semibold tracking-tight text-foreground/90 md:text-lg">
              xPRIME <span className="text-gradient">Lab</span>
              <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
                · solo operator console for engineering, physics &amp; content ops
              </span>
            </h1>
          </div>

          {/* Right: KPIs */}
          <div className="flex flex-wrap items-stretch gap-x-1 gap-y-2 rounded-xl border border-border/70 bg-card/50 p-1.5 backdrop-blur">
            <Kpi label="Total" value={stats.total} hue="hsl(var(--primary))" />
            <Divider />
            <Kpi label="Building" value={stats.building} hue="hsl(var(--status-build))" />
            <Divider />
            <Kpi label="Blocked" value={stats.blocked} hue="hsl(var(--status-blocked))" />
            <Divider />
            <Kpi label="Ready" value={stats.ready} hue="hsl(var(--status-ready))" />
            <Divider />
            <Kpi label="Launched" value={stats.launched} hue="hsl(var(--status-launched))" />
            <Divider />
            <Kpi label="Avg %" value={stats.avg} hue="hsl(var(--accent))" suffix="%" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Kpi({
  label,
  value,
  hue,
  suffix,
}: {
  label: string;
  value: number;
  hue: string;
  suffix?: string;
}) {
  return (
    <div className="min-w-[72px] px-2.5 py-1">
      <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-lg font-semibold tabular-nums leading-none text-foreground">
        {value}
        {suffix && <span className="ml-0.5 text-xs text-muted-foreground">{suffix}</span>}
      </div>
      <div
        className="mt-1.5 h-[2px] w-full rounded-full opacity-70"
        style={{ background: hue }}
      />
    </div>
  );
}

function Divider() {
  return <div className="my-1.5 w-px bg-border/70" aria-hidden />;
}
