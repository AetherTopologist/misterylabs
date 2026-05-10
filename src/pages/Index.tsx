import { Link } from "react-router-dom";
import {
  Github,
  FolderOpen,
  Sparkles,
  Waves,
  Orbit,
  Activity,
  Eye,
  Film,
  Telescope,
  GitBranch,
  Microscope,
  Compass,
  CircleDot,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { EvidenceVault } from "@/components/EvidenceVault";
import { FractalInspirationAtlas } from "@/components/FractalInspirationAtlas";
import { useProjects } from "@/lib/store";
import heroImg from "@/assets/hero-curved-transport.jpg";

// ── Data ──────────────────────────────────────────────────

type SystemStatus = "active" | "researching" | "building";

interface ResearchSystem {
  id: string;
  name: string;
  desc: string;
  status: SystemStatus;
  label: string;
  href: string | null;
}

const ACTIVE_SYSTEMS: ResearchSystem[] = [
  {
    id: "xprimeray",
    name: "xPRIMEray",
    desc: "Curved transport renderer — Godot engine research harness",
    status: "active",
    label: "ACTIVE",
    href: "https://aethertopologist.github.io/GD_xPRIMEray/",
  },
  {
    id: "cathedral",
    name: "Cathedral Probe",
    desc: "Wormhole fixture and traversal topology experiments",
    status: "active",
    label: "ACTIVE",
    href: null,
  },
  {
    id: "islands",
    name: "Transport Islands",
    desc: "Bounded optical anomaly detection and classification",
    status: "researching",
    label: "RESEARCHING",
    href: null,
  },
  {
    id: "validation",
    name: "Curved Field Validation Ladder",
    desc: "Convergence diagnostics and renderer correctness suite",
    status: "building",
    label: "BUILDING",
    href: null,
  },
];

const STATUS_DOT: Record<SystemStatus, string> = {
  active: "bg-success animate-signal-pulse",
  researching: "bg-info",
  building: "bg-primary",
};

const STATUS_LABEL_CLS: Record<SystemStatus, string> = {
  active: "text-success",
  researching: "text-info",
  building: "text-primary-glow",
};

const FLAGSHIP_CARDS = [
  {
    title: "Transport Engine",
    desc: "Real-time curved ray path simulation and render harness.",
    icon: Orbit,
    tag: "CORE",
  },
  {
    title: "LuxCoreGRIN",
    desc: "Production-grade GRIN-field rendering research.",
    icon: Sparkles,
    tag: "RESEARCH",
  },
  {
    title: "Validation Cockpit",
    desc: "Instrumentation, probes, metrics, and visual regression.",
    icon: Activity,
    tag: "DIAGNOSTICS",
  },
  {
    title: "Island Classifier",
    desc: "Detecting and classifying bounded transport anomalies.",
    icon: CircleDot,
    tag: "ANALYSIS",
  },
];

const RESEARCH_ATLAS = [
  { title: "Curved Transport", desc: "Core field of study", icon: Waves },
  { title: "GRIN Optics", desc: "Gradient index fields", icon: Compass },
  { title: "Rendering Diagnostics", desc: "Instrumentation & metrics", icon: Microscope },
  { title: "Pareidolia Lab", desc: "Perception & pattern", icon: Eye },
  { title: "ACT Media", desc: "Animation & storytelling", icon: Film },
  { title: "Myth → Measurement", desc: "Philosophy & method", icon: Telescope },
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
              Curved Transport Observatory
            </p>
            <div className="mt-2 h-px w-20 bg-gradient-to-r from-primary/50 to-transparent" />

            <p className="mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Experimental instruments for rendering, probing, and explaining how signals traverse
              curved fields, gradient media, and simulated space.
              <br />
              Open methods. Reproducible results.
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
                <a href="#evidence-vault">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Evidence Vault
                </a>
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
            </div>
          </aside>
        </div>
      </section>

<<<<<<< HEAD
      {/* ── ACTIVE RESEARCH SYSTEMS ───────────────────────── */}
      <section className="border-t border-border/35">
        <div className="container py-12">
          <SectionHeader sys="SYS // 01" title="Active Research Systems" />
=======
      {/* FRACTAL INSPIRATION ATLAS */}
      <FractalInspirationAtlas />

      {/* FLAGSHIP */}
      <section id="xprimeray" className="border-t border-border/60 bg-gradient-to-b from-background to-card/30">
        <div className="container py-16">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary-glow">Flagship Project</div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            <span className="text-gradient">xPRIMEray</span> Rendering Engine
          </h2>
          <p className="mt-4 max-w-3xl text-base text-muted-foreground">
            A Godot-based experimental rendering engine for studying curved ray transport, GRIN-style
            fields, bounded optical transport anomalies, wormhole fixtures, ownership maps, cathedral
            probing, and renderer validation.
          </p>
>>>>>>> f751bfc49ed0293e76f3996f74162c691f8ff558

          <div className="mt-6 overflow-hidden rounded-sm border border-border/40">
            {/* Column header */}
            <div className="grid grid-cols-[20px_1fr_auto] items-center gap-6 border-b border-border/30 bg-card/20 px-5 py-2">
              <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/40">
                SIG
              </span>
              <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/40">
                System · Descriptor
              </span>
              <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/40">
                State
              </span>
            </div>

            {ACTIVE_SYSTEMS.map((sys, i) => (
              <SystemRow
                key={sys.id}
                sys={sys}
                isLast={i === ACTIVE_SYSTEMS.length - 1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── PRIMARY SYSTEM: xPRIMEray ─────────────────────── */}
      <section id="xprimeray" className="border-t border-border/35">
        <div className="container py-16">
          <SectionHeader sys="SYS // 02" title="xPRIMEray Rendering Engine" />
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            A Godot-based research harness for curved ray transport, GRIN-style fields, bounded
            optical anomalies, wormhole fixtures, cathedral probing, and renderer validation.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              </div>
            ))}
          </div>

          {/* Docs entry point */}
          <div className="diagnostic-frame mt-6 flex flex-col gap-5 rounded-sm border border-primary/20 bg-card/25 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-mono text-[8px] uppercase tracking-[0.35em] text-primary-glow">
                Public Documentation
              </div>
              <h3 className="mt-1 text-base font-semibold">
                xPRIMEray — Curved Transport Observatory
              </h3>
              <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
                Research notes, architecture docs, and validation artifacts for the curved transport
                renderer.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Button asChild>
                <a
                  href="https://aethertopologist.github.io/GD_xPRIMEray/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  xPRIMEray Docs
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a
                  href="https://github.com/AetherTopologist/GD_xPRIMEray"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── EVIDENCE VAULT ────────────────────────────────── */}
      <section id="evidence-vault" className="border-t border-border/35">
        <div className="container py-16">
          <SectionHeader sys="SYS // 03" title="Evidence Vault" />
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Repository snapshots, visual artifacts, and validation records — metadata only, kept
            lightweight.
          </p>
          <div className="mt-8">
            <EvidenceVault />
          </div>
        </div>
      </section>

      {/* ── RESEARCH ATLAS ────────────────────────────────── */}
      <section id="research-notes" className="border-t border-border/35">
        <div className="container py-16">
          <SectionHeader sys="SYS // 04" title="Research Atlas" />
          <p className="mt-2 text-sm text-muted-foreground">
            Active domains and research vectors within the observatory.
          </p>
          <div className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {RESEARCH_ATLAS.map((l) => (
              <div
                key={l.title}
                className="flex items-center gap-3 rounded-sm border border-border/35 bg-card/25 px-4 py-3 transition-base hover:border-primary/30 hover:bg-card/45"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-secondary/50">
                  <l.icon className="h-4 w-4 text-primary-glow" />
                </span>
                <div>
                  <div className="text-sm font-medium">{l.title}</div>
                  <div className="text-xs text-muted-foreground">{l.desc}</div>
                </div>
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

      {/* ── OPEN SIGNAL ───────────────────────────────────── */}
      <section id="media-lab" className="border-t border-border/35">
        <div className="container py-16">
          <SectionHeader sys="SYS // 05" title="Open Signal" />
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            MisterY Labs is an open observatory. Engineers, artists, skeptics, and rendering
            researchers are welcome. Bring tests, renders, doubts, and code.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <a
                href="https://github.com/AetherTopologist/GD_xPRIMEray"
                target="_blank"
                rel="noreferrer"
              >
                <Github className="mr-2 h-4 w-4" />
                Join on GitHub
              </a>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard">
                <GitBranch className="mr-2 h-4 w-4" />
                Mission Control
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="border-t border-border/35">
        <div className="container py-5">
          <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/40">
            <div className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-signal-pulse" />
              <span>MisterY Labs · MYL-OBS-001 · Nominal</span>
            </div>
            <span>Open research · Reproducible · Community-driven</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────

function TelemetryOverlay() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      {/* Primary transport arc — indigo */}
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
      {/* Secondary arc — cyan */}
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
      {/* Short diagonal probe trace */}
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
      {/* Node — primary intersection */}
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
      {/* Node — secondary */}
      <circle
        cx="280"
        cy="270"
        r="1.5"
        fill="hsl(245, 90%, 75%)"
        fillOpacity="0.45"
        style={{ opacity: 0, animation: "arc-fade 0.6s ease-out 6.6s forwards" }}
      />
      {/* Very faint reference crosshair */}
      <line
        x1="0" y1="300" x2="1200" y2="300"
        stroke="hsl(245, 90%, 66%)"
        strokeWidth="0.3"
        strokeOpacity="0.04"
      />
      <line
        x1="600" y1="0" x2="600" y2="600"
        stroke="hsl(245, 90%, 66%)"
        strokeWidth="0.3"
        strokeOpacity="0.03"
      />
    </svg>
  );
}

function SectionHeader({ sys, title }: { sys: string; title: string }) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/45">
          {sys}
        </span>
        <div className="h-px flex-1 bg-border/35" />
      </div>
      <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
    </div>
  );
}

function SystemRow({ sys, isLast }: { sys: ResearchSystem; isLast: boolean }) {
  const rowCls = [
    "group grid grid-cols-[20px_1fr_auto] items-center gap-6 px-5 py-3.5 transition-base",
    !isLast ? "border-b border-border/25" : "",
    sys.href ? "hover:bg-card/40 cursor-pointer" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const inner = (
    <>
      {/* Signal dot */}
      <div className="flex justify-center">
        <span className={`h-2 w-2 rounded-full ${STATUS_DOT[sys.status]}`} />
      </div>

      {/* Name + descriptor */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span className="font-mono text-sm font-medium">{sys.name}</span>
          <span className="text-xs text-muted-foreground">{sys.desc}</span>
        </div>
      </div>

      {/* State badge + external icon */}
      <div className="flex items-center gap-2.5">
        <span
          className={`font-mono text-[9px] uppercase tracking-[0.25em] ${STATUS_LABEL_CLS[sys.status]}`}
        >
          {sys.label}
        </span>
        {sys.href && (
          <ExternalLink className="h-3 w-3 text-muted-foreground/30 transition-base group-hover:text-primary" />
        )}
      </div>
    </>
  );

  if (sys.href) {
    return (
      <a href={sys.href} target="_blank" rel="noreferrer" className={rowCls}>
        {inner}
      </a>
    );
  }
  return <div className={rowCls}>{inner}</div>;
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
  const items = [
    { label: "Curved Transport", desc: "Core field", icon: Waves, href: "#research-notes" },
    { label: "GRIN Optics", desc: "Gradient fields", icon: Compass, href: "#research-notes" },
    { label: "Transport Islands", desc: "Anomalies", icon: CircleDot, href: "#xprimeray" },
    { label: "Diagnostics", desc: "Instrumentation", icon: Microscope, href: "#xprimeray" },
    { label: "Pareidolia Lab", desc: "Perception", icon: Eye, href: "#research-notes" },
    { label: "ACT Media", desc: "Experiments", icon: Film, href: "#media-lab" },
  ];
  return (
    <div className="rounded-sm border border-border/35 bg-card/30 py-2">
      <div className="px-4 py-1.5 font-mono text-[8px] uppercase tracking-[0.35em] text-muted-foreground/40">
        Subsystems
      </div>
      <div className="space-y-px">
        {items.map((it) => (
          <a
            key={it.label}
            href={it.href}
            className="flex items-center gap-2.5 px-3 py-2 transition-base hover:bg-secondary/35"
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-sm bg-secondary/50">
              <it.icon className="h-3 w-3 text-primary-glow" />
            </span>
            <span>
              <span className="block text-xs font-medium leading-tight">{it.label}</span>
              <span className="block text-[10px] text-muted-foreground">{it.desc}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

export default Index;
