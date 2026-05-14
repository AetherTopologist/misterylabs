import { useEffect, useMemo, useState } from "react";
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
    const validating = projects.filter((p) => p.status === "Validating").length;
    const avg = total
      ? Math.round(projects.reduce((s, p) => s + (p.progress_percent || 0), 0) / total)
      : 0;
    return { total, building, blocked, ready, launched, validating, avg };
  }, [projects]);

  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-observatory">
      <div className="container relative py-4">
        {/* Top instrumentation rail */}
        <div className="corner-marks panel">
          <div className="panel-header">
            <div className="flex items-center gap-3">
              <span className="relative inline-flex h-1.5 w-1.5">
                <span className="absolute inset-0 animate-pulse-glow rounded-full bg-status-launched" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-status-launched" />
              </span>
              <span className="text-foreground/80">Mission Control</span>
              <span className="text-border">//</span>
              <span className="text-status-launched">Operational</span>
              <span className="hidden text-border sm:inline">//</span>
              <span className="hidden sm:inline">Curved-Ray Rendering Command Center</span>
            </div>
            <ClockReadout />
          </div>

          {/* Body: callsign + KPI cluster */}
          <div className="flex flex-col gap-4 px-3 py-3 lg:flex-row lg:items-stretch lg:justify-between">
            {/* Callsign block */}
            <div className="min-w-0 lg:max-w-md">
              <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
                xPRIME Observatory · Render Node GRIN-RIG-01
              </div>
              <h1 className="mt-1.5 text-base font-semibold leading-tight tracking-tight text-foreground/95 md:text-lg">
                Mission <span className="text-gradient">Control</span>
                <span className="ml-2 font-mono text-[11px] font-normal text-muted-foreground">
                  · curved transport research, instrumentation &amp; archive
                </span>
              </h1>
              <div className="tick-row mt-3" aria-hidden />
              <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                <SmallReadout label="GPU" value="Enabled" tone="cool" />
                <SmallReadout label="Pipeline" value="Nominal" tone="ok" />
                <SmallReadout label="Storage" value="4.2 / 8 TB" tone="warm" />
              </div>
            </div>

            {/* KPI cluster */}
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              <Kpi label="Total"      value={stats.total}      tone="hsl(var(--instrument-line))" />
              <Kpi label="Building"   value={stats.building}   tone="hsl(var(--status-build))" />
              <Kpi label="Validating" value={stats.validating} tone="hsl(var(--status-validate))" />
              <Kpi label="Blocked"    value={stats.blocked}    tone="hsl(var(--status-blocked))" />
              <Kpi label="Ready"      value={stats.ready}      tone="hsl(var(--status-ready))" />
              <Kpi label="Launched"   value={stats.launched}   tone="hsl(var(--status-launched))" suffix={`· ${stats.avg}%`} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ClockReadout() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const utc = now.toISOString().slice(11, 19);
  const date = now.toISOString().slice(0, 10);
  return (
    <div className="flex items-center gap-3 text-[9px] tracking-[0.2em]">
      <span className="text-muted-foreground">UTC</span>
      <span className="readout text-foreground/90">{utc}</span>
      <span className="text-border">·</span>
      <span className="readout text-muted-foreground">{date}</span>
    </div>
  );
}

function SmallReadout({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "cool" | "warm" | "ok";
}) {
  const color =
    tone === "cool"
      ? "text-spectral-cool"
      : tone === "warm"
      ? "text-spectral-warm"
      : "text-status-launched";
  return (
    <div className="rounded border border-border/60 bg-background/40 px-2 py-1">
      <div className="text-[8.5px]">{label}</div>
      <div className={`mt-0.5 readout text-[10.5px] normal-case tracking-wider ${color}`}>
        {value}
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
  suffix,
}: {
  label: string;
  value: number;
  tone: string;
  suffix?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded border border-border/60 bg-background/40 px-2.5 py-1.5">
      <div className="font-mono text-[8.5px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 readout text-[18px] font-semibold leading-none text-foreground">
        {value}
        {suffix && (
          <span className="ml-1 font-mono text-[9px] font-normal tracking-wider text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {/* mini sparkline — abstract spectral pulse */}
      <svg viewBox="0 0 60 12" className="mt-1 h-2.5 w-full opacity-70" aria-hidden>
        <polyline
          fill="none"
          stroke={tone}
          strokeWidth="1"
          points="0,8 6,7 12,9 18,5 24,7 30,3 36,6 42,4 48,7 54,5 60,6"
        />
      </svg>
      <span
        className="absolute bottom-0 left-0 h-px w-full"
        style={{ background: tone, opacity: 0.5 }}
      />
    </div>
  );
}
