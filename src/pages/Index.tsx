import React from "react";
import { Link } from "react-router-dom";
import {
  Github,
  FolderOpen,
  Sparkles,
  Waves,
  Orbit,
  Activity,
  CircleDot,
  ExternalLink,
  Layers,
  Microscope,
  Film,
  GitBranch,
} from "lucide-react";
import { KleinBottleSVG } from "@/components/KleinBottleSVG";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { SeeingIsNotOpeningYourEyes } from "@/components/SeeingIsNotOpeningYourEyes";
import { SiteFooter } from "@/components/SiteFooter";
import { useProjects } from "@/lib/store";
import heroImg from "@/assets/hero-curved-transport.jpg";

// ── Data ──────────────────────────────────────────────────

const FLAGSHIP_CARDS: {
  title: string;
  desc: string;
  icon: React.ElementType;
  tag: string;
  lineage: string | null;
}[] = [
  {
    title: "Transport Engine",
    desc: "Real-time curved ray path simulation and render harness.",
    icon: Orbit,
    tag: "CORE",
    lineage: null,
  },
  {
    title: "LuxCoreGRIN",
    desc: "Production-grade GRIN-field rendering research.",
    icon: Sparkles,
    tag: "RESEARCH",
    lineage: "Precursor renderer — directly informed xPRIMEray architecture",
  },
  {
    title: "Validation Cockpit",
    desc: "Instrumentation, probes, metrics, and visual regression.",
    icon: Activity,
    tag: "DIAGNOSTICS",
    lineage: null,
  },
  {
    title: "Island Classifier",
    desc: "Detecting and classifying bounded transport anomalies.",
    icon: CircleDot,
    tag: "ANALYSIS",
    lineage: null,
  },
];

// ── Page ──────────────────────────────────────────────────

const Index = () => {
  const projects = useProjects();
  const evidenceCount = projects.reduce(
    (n, p) => n + (p.attached_images?.filter((i) => i.source !== "placeholder").length ?? 0),
    0,
  );
  const validatedCount = projects.filter((p) => p.is_validated).length;
  const inProgress = projects.filter(
    (p) => p.status === "Building" || p.status === "Researching" || p.status === "Validating",
  ).length;

  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/25 to-transparent" aria-hidden />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Atmospheric layers */}
        <div
          className="pointer-events-none absolute inset-0 -z-20 opacity-35"
          style={{
            backgroundImage: `url(${heroImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center right",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/94 to-background/70"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-telemetry" aria-hidden />

        {/* SVG telemetry arc traces */}
        <TelemetryOverlay />

        <div className="container grid gap-8 py-16 lg:grid-cols-[210px_1fr_270px] lg:py-24">
          {/* Col 1: Observatory status + subsystems (desktop only) */}
          <aside className="hidden flex-col gap-3 lg:flex">
            <ObservatoryStatus
              validated={validatedCount}
              evidence={evidenceCount}
              inProgress={inProgress}
              total={projects.length}
            />
            <SubsystemsRail />
          </aside>

          {/* Col 2: Hero content */}
          <div>
            <div className="mb-5 flex items-center gap-2.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-muted-foreground/50">
                MYL-OBS-001
              </span>
              <span className="h-px w-5 bg-border/60" />
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-success">
                Operational
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-signal-pulse" />
            </div>

            <h1 className="text-5xl font-bold tracking-tight text-foreground md:text-6xl lg:text-[5.5rem] lg:leading-[1.05]">
              MisterY
              <br />
              <span className="text-gradient">Labs</span>
            </h1>

            <p className="mt-4 font-light text-muted-foreground md:text-lg">
              Gateway Observatory
            </p>

            <div className="mt-2 h-px w-20 bg-gradient-to-r from-primary/50 to-transparent" />

            <p className="mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground">
              MisterY Labs is a gateway observatory for curved transport research, visual
              diagnostics, and the mysteries that inspire them.
            </p>
            <p className="mt-2 max-w-lg text-xs leading-relaxed text-muted-foreground/55">
              Open instruments. Reproducible methods. Measurable results.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-none">
                <a
                  href="https://aethertopologist.github.io/GD_xPRIMEray/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Orbit className="mr-2 h-4 w-4" />
                  xPRIMEray Docs
                  <ExternalLink className="ml-2 h-3 w-3 opacity-60" />
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a
                  href="https://github.com/AetherTopologist/GD_xPRIMEray"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github className="mr-2 h-4 w-4" />
                  Repository
                </a>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/archive">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Validation Archive
                </Link>
              </Button>
            </div>
          </div>

          {/* Col 3: Field notes panel */}
          <aside className="diagnostic-frame rounded-sm border border-border/40 bg-card/40 p-5">
            <div className="font-mono text-[8px] uppercase tracking-[0.35em] text-muted-foreground/40">
              Field Notes
            </div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.3em] text-primary-glow">
              Curved Transport
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground/75">
              The study of how signals, rays, and images behave when their paths bend through
              gradients, fields, or simulated space.
            </p>
            <div className="mt-5 space-y-3.5">
              <FieldNote icon={Waves} title="Curved Photon Paths" desc="Light in motion through gradients" />
              <FieldNote icon={CircleDot} title="Bounded Anomalies" desc="Transport islands and distortions" />
              <FieldNote icon={Microscope} title="Measurable Models" desc="Testable, reproducible, open" />
              <FieldNote icon={Layers} title="Klein Topology" desc="Non-orientable traversal, recursive manifolds" />
            </div>
          </aside>
        </div>
      </section>

      {/* ── SEEING IS NOT OPENING YOUR EYES ───────────────── */}
      <SeeingIsNotOpeningYourEyes />

      {/* ── PRIMARY SYSTEM: xPRIMEray ─────────────────────── */}
      <section id="xprimeray" className="relative overflow-hidden border-t border-primary/15">
        {/* Subtle observatory atmosphere */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.045] via-transparent to-transparent"
          aria-hidden
        />
        {/* Faint transport arc accent */}
        <svg
          className="pointer-events-none absolute right-0 top-0 h-64 w-96 opacity-[0.07]"
          viewBox="0 0 400 260"
          preserveAspectRatio="xMaxYMin slice"
          aria-hidden
        >
          <path
            d="M 400 0 Q 200 80 100 200 T -20 260"
            fill="none"
            stroke="hsl(245, 90%, 72%)"
            strokeWidth="1.2"
          />
          <path
            d="M 400 40 Q 240 100 160 220"
            fill="none"
            stroke="hsl(190, 95%, 65%)"
            strokeWidth="0.7"
          />
          <circle cx="200" cy="130" r="3" fill="none" stroke="hsl(190, 95%, 65%)" strokeWidth="1" />
          <circle cx="100" cy="200" r="2" fill="hsl(245, 90%, 72%)" />
        </svg>

        <div className="container relative py-16 lg:py-20">
          {/* Status header row */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/45">
              SYS // 02
            </span>
            <div className="h-px w-12 bg-border/35" />
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-signal-pulse" />
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-success">
                Active Observatory
              </span>
            </div>
          </div>

          {/* Title block */}
          <div className="mt-4">
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              xPRIMEray
            </h2>
            <p className="mt-2 text-base font-light text-primary-glow/80 md:text-lg">
              Curved Transport Observatory
            </p>
            <div className="mt-3 h-px w-32 bg-gradient-to-r from-primary/45 to-transparent" />
          </div>

          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            A renderer research harness exploring curved-field traversal, transport topology,
            convergence diagnostics, validation systems, and visual observability.
          </p>
          <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted-foreground/55">
            Guided by Klein topology: the observer and the field share one continuous manifold.
            Where the signal goes, the geometry follows.
          </p>

          {/* Primary CTAs */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-none"
            >
              <a
                href="https://aethertopologist.github.io/GD_xPRIMEray/"
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Explore xPRIMEray Docs
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a
                href="https://github.com/AetherTopologist/GD_xPRIMEray"
                target="_blank"
                rel="noreferrer"
              >
                <Github className="mr-2 h-4 w-4" />
                GitHub Repository
              </a>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/research">
                <Microscope className="mr-2 h-4 w-4" />
                Research Systems
              </Link>
            </Button>
          </div>

          {/* Component cards */}
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FLAGSHIP_CARDS.map((c) => (
              <div
                key={c.title}
                className="diagnostic-frame group relative rounded-sm border border-border/40 bg-card/35 p-4 transition-base hover:border-primary/35 hover:bg-card/55"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="grid h-9 w-9 place-items-center rounded-sm bg-secondary/70 ring-1 ring-inset ring-border/50">
                    <c.icon className="h-4 w-4 text-primary-glow" />
                  </div>
                  <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground/40">
                    {c.tag}
                  </span>
                </div>
                <h3 className="text-sm font-semibold tracking-tight">{c.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.desc}</p>
                {c.lineage && (
                  <p className="mt-2.5 border-t border-border/25 pt-2 font-mono text-[10px] leading-snug text-muted-foreground/45">
                    ↳ {c.lineage}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MISSION AXIOM ─────────────────────────────────── */}
      <section className="border-t border-border/35">
        <div className="container py-16">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.35em] text-muted-foreground/50">
                Mission Axiom
              </div>
              <blockquote className="mt-5 text-xl font-light leading-relaxed text-foreground md:text-2xl">
                "Science updates when tests fail.
                <br />
                Pseudoscience doubles down after repeated failure."
              </blockquote>
              <p className="mt-4 font-mono text-[10px] text-muted-foreground/50">— MisterY Labs</p>
            </div>
            <div className="diagnostic-frame rounded-sm border border-border/35 bg-card/25 p-6">
              <div className="font-mono text-[8px] uppercase tracking-[0.35em] text-muted-foreground/40 mb-3">
                Operating Principle
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Speculative ideas explored only through measurable tests and reproducible visual
                evidence. No claims. No conclusions. Just better instruments for seeing more clearly.
              </p>
              <p className="mt-3 text-xs text-muted-foreground/50">
                We do not claim proof of UAPs, missing aircraft, or hidden technology — we treat
                such topics as motivation for why optical-anomaly simulation tools matter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── MANIFESTO ─────────────────────────────────────── */}
      <section className="border-t border-border/25">
        <div className="container py-16">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-start gap-10">
              <div className="border-l border-primary/20 pl-7 flex-1">
                <h2 className="text-xl font-bold tracking-tight md:text-2xl">
                  Gateway to the Unknown Known
                </h2>
                <blockquote className="mt-4 text-sm leading-relaxed text-foreground/70 italic">
                  "We build instruments for seeing what is usually hidden: transport seams,
                  convergence behavior, observer pathways, and the strange coherence between
                  technical systems and human imagination."
                </blockquote>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground/50">
                  The Klein bottle is our compass — a surface where inside and outside share
                  one continuous manifold. Topology before ontology.
                </p>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/40">
                  All paths are signals. All signals become structure.
                </p>
              </div>
              <div className="hidden md:block shrink-0 text-primary/20 mt-1">
                <KleinBottleSVG size={84} animated />
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default Index;

// ── Sub-components ────────────────────────────────────────

function TelemetryOverlay() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <path
        d="M -60 530 Q 280 210 700 370 T 1260 160"
        fill="none"
        stroke="hsl(245, 90%, 66%)"
        strokeWidth="0.9"
        strokeOpacity="0.13"
        style={{
          strokeDasharray: 2000,
          strokeDashoffset: 2000,
          opacity: 0,
          animation:
            "arc-draw 7s cubic-bezier(0.22,1,0.36,1) 0.5s forwards, arc-fade 2s ease-out 0.5s forwards",
        }}
      />
      <path
        d="M 80 640 Q 420 290 880 430"
        fill="none"
        stroke="hsl(190, 95%, 60%)"
        strokeWidth="0.6"
        strokeOpacity="0.1"
        style={{
          strokeDasharray: 2000,
          strokeDashoffset: 2000,
          opacity: 0,
          animation:
            "arc-draw 5.5s cubic-bezier(0.22,1,0.36,1) 1.6s forwards, arc-fade 2s ease-out 1.6s forwards",
        }}
      />
      <path
        d="M 820 70 L 1140 310"
        fill="none"
        stroke="hsl(245, 90%, 66%)"
        strokeWidth="0.4"
        strokeOpacity="0.09"
        style={{
          strokeDasharray: 2000,
          strokeDashoffset: 2000,
          opacity: 0,
          animation:
            "arc-draw 3s ease-out 2.8s forwards, arc-fade 1.5s ease-out 2.8s forwards",
        }}
      />
      <circle
        cx="700"
        cy="370"
        r="2.5"
        fill="none"
        stroke="hsl(190, 95%, 60%)"
        strokeWidth="1"
        strokeOpacity="0.55"
        style={{ opacity: 0, animation: "arc-fade 0.6s ease-out 7.2s forwards" }}
      />
      <circle
        cx="280"
        cy="270"
        r="1.5"
        fill="hsl(245, 90%, 75%)"
        fillOpacity="0.45"
        style={{ opacity: 0, animation: "arc-fade 0.6s ease-out 6.6s forwards" }}
      />
      <line x1="0" y1="300" x2="1200" y2="300" stroke="hsl(245, 90%, 66%)" strokeWidth="0.3" strokeOpacity="0.04" />
      <line x1="600" y1="0" x2="600" y2="600" stroke="hsl(245, 90%, 66%)" strokeWidth="0.3" strokeOpacity="0.03" />
    </svg>
  );
}

function FieldNote({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Waves;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-sm bg-secondary/60">
        <Icon className="h-3.5 w-3.5 text-primary-glow" />
      </span>
      <div>
        <div className="text-xs font-medium">{title}</div>
        <div className="text-[11px] text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}

function ObservatoryStatus({
  validated,
  evidence,
  inProgress,
  total,
}: {
  validated: number;
  evidence: number;
  inProgress: number;
  total: number;
}) {
  return (
    <div className="diagnostic-frame rounded-sm border border-border/40 bg-card/40 p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/45">
          Observatory
        </span>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-signal-pulse" />
          <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-success">
            Nominal
          </span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Metric label="Projects" value={total} />
        <Metric label="Evidence" value={evidence} />
        <Metric label="Validated" value={validated} />
        <Metric label="Active" value={inProgress} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-sm border border-border/25 bg-background/35 px-2 py-1.5 text-center">
      <div className="text-lg font-bold tabular-nums text-foreground">{value}</div>
      <div className="font-mono text-[8px] uppercase tracking-[0.15em] text-muted-foreground/50">
        {label}
      </div>
    </div>
  );
}

function SubsystemsRail() {
  const items: { label: string; desc: string; icon: React.ElementType; href: string; route?: boolean }[] = [
    { label: "xPRIMEray", desc: "Active observatory", icon: Orbit, href: "#xprimeray" },
    { label: "Atlas", desc: "Cognitive ancestry", icon: Sparkles, href: "/atlas", route: true },
    { label: "Archive", desc: "Evidence lineage", icon: FolderOpen, href: "/archive", route: true },
    { label: "Research", desc: "Field reports & systems", icon: Microscope, href: "/research", route: true },
    { label: "Media", desc: "Visual experiments", icon: Film, href: "/media", route: true },
    { label: "Mission", desc: "Project dashboard", icon: GitBranch, href: "/mission", route: true },
  ];
  const itemCls = "flex items-center gap-2.5 px-3 py-2 transition-base hover:bg-secondary/35";
  return (
    <div className="rounded-sm border border-border/35 bg-card/30 py-2">
      <div className="px-4 py-1.5 font-mono text-[8px] uppercase tracking-[0.35em] text-muted-foreground/40">
        Subsystems
      </div>
      <div className="space-y-px">
        {items.map((it) => {
          const inner = (
            <>
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-sm bg-secondary/50">
                <it.icon className="h-3 w-3 text-primary-glow" />
              </span>
              <span>
                <span className="block text-xs font-medium leading-tight">{it.label}</span>
                <span className="block text-[10px] text-muted-foreground">{it.desc}</span>
              </span>
            </>
          );
          return it.route ? (
            <Link key={it.label} to={it.href} className={itemCls}>{inner}</Link>
          ) : (
            <a key={it.label} href={it.href} className={itemCls}>{inner}</a>
          );
        })}
      </div>
    </div>
  );
}
