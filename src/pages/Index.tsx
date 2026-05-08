import { Link } from "react-router-dom";
import {
  ArrowRight,
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
import { useProjects } from "@/lib/store";
import heroImg from "@/assets/hero-curved-transport.jpg";

const FLAGSHIP_CARDS = [
  {
    title: "Godot xPRIMEray Engine",
    desc: "Real-time curved transport engine and tools.",
    icon: Orbit,
  },
  {
    title: "LuxCoreGRIN Prototype",
    desc: "Production-grade curved-ray rendering research.",
    icon: Sparkles,
  },
  {
    title: "Validation Cockpit",
    desc: "Instrumentation, probes, metrics, visual tests.",
    icon: Activity,
  },
  {
    title: "Transport Island Research",
    desc: "Detecting and classifying bounded optical transport anomalies.",
    icon: CircleDot,
  },
];

const RESEARCH_LANES = [
  { title: "Curved Transport", desc: "Core field of study", icon: Waves },
  { title: "GRIN Optics", desc: "Gradient index research", icon: Compass },
  { title: "Rendering Diagnostics", desc: "Instrumentation & metrics", icon: Microscope },
  { title: "Pareidolia Lab", desc: "Perception & pattern", icon: Eye },
  { title: "ACT Media Experiments", desc: "Animation & storytelling", icon: Film },
  { title: "Myth → Measurement", desc: "Philosophy & method", icon: Telescope },
];

const Index = () => {
  const projects = useProjects();
  const evidenceCount = projects.reduce((n, p) => n + (p.evidence_links?.length ?? 0), 0);
  const validatedCount = projects.filter((p) => p.status === "Validating" || p.status === "Ready to Launch").length;
  const inProgress = projects.filter((p) => p.status === "Building" || p.status === "Researching").length;

  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" aria-hidden />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-70"
          style={{ backgroundImage: `url(${heroImg})`, backgroundSize: "cover", backgroundPosition: "center right" }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/85 to-background/30" aria-hidden />
        <div className="container grid gap-10 py-16 lg:grid-cols-[1fr_360px] lg:py-24">
          {/* Left: stats + nav rail */}
          <aside className="hidden flex-col gap-4 lg:flex lg:order-first lg:col-start-1 lg:row-span-2">
            <StatusPanel validated={validatedCount} evidence={evidenceCount} inProgress={inProgress} total={projects.length} />
            <NavRail />
          </aside>

          {/* Center hero */}
          <div className="lg:col-start-2">
            <h1 className="bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-5xl font-extrabold tracking-tight text-transparent md:text-6xl lg:text-7xl">
              MisterY Labs
            </h1>
            <p className="mt-3 text-2xl font-light text-foreground/90 md:text-3xl">
              Home of <span className="text-primary-glow">Curved Transport Research</span>
            </p>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              MisterY Labs builds experimental tools for rendering, probing, and explaining curved
              photon paths through gradient fields, optical anomalies, and simulated space.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild className="bg-gradient-to-r from-primary to-primary-glow shadow-glow">
                <a href="#xprimeray">
                  <Orbit className="mr-2 h-4 w-4" /> Explore xPRIMEray <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="https://github.com/" target="_blank" rel="noreferrer">
                  <Github className="mr-2 h-4 w-4" /> View GitHub
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#evidence-vault">
                  <FolderOpen className="mr-2 h-4 w-4" /> Evidence Vault
                </a>
              </Button>
            </div>
          </div>

          {/* Right: curved-transport callout */}
          <aside className="rounded-2xl border border-primary/30 bg-card/60 p-5 backdrop-blur-md lg:col-start-3 lg:row-span-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary-glow">Curved Transport</div>
            <p className="mt-3 text-sm leading-relaxed text-foreground/90">
              The study of how rays, signals, and images behave when their paths bend through
              fields, media, gradients, or simulated space.
            </p>
            <div className="mt-5 space-y-3">
              <CalloutItem icon={Waves} title="Curved Photon Paths" desc="Visualize light in motion" />
              <CalloutItem icon={CircleDot} title="Bounded Anomalies" desc="Transport islands & distortions" />
              <CalloutItem icon={Microscope} title="Measurable Models" desc="Testable, reproducible, open" />
            </div>
          </aside>
        </div>
      </section>

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

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FLAGSHIP_CARDS.map((c) => (
              <div
                key={c.title}
                className="group relative overflow-hidden rounded-xl border border-border/60 bg-card/60 p-5 transition-base hover:border-primary/50 hover:shadow-glow"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 ring-1 ring-inset ring-primary/30">
                  <c.icon className="h-5 w-5 text-primary-glow" />
                </div>
                <h3 className="mt-4 text-base font-semibold">{c.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EVIDENCE VAULT */}
      <section id="evidence-vault" className="border-t border-border/60">
        <div className="container py-16">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary-glow">Evidence Vault</div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Validated prior work and milestone timeline</h2>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
            Imported GitHub repository snapshots, scanned visual artifacts, captions, and repository
            links — kept lightweight, with metadata and links only.
          </p>
          <div className="mt-8">
            <EvidenceVault />
          </div>
        </div>
      </section>

      {/* RESEARCH LANES */}
      <section id="research-notes" className="border-t border-border/60 bg-gradient-to-b from-card/30 to-background">
        <div className="container py-16">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary-glow">Research Lanes</div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Explore key research domains</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {RESEARCH_LANES.map((l) => (
              <div
                key={l.title}
                className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/50 p-4 transition-base hover:border-primary/40"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary ring-1 ring-inset ring-border/60">
                  <l.icon className="h-4.5 w-4.5 text-primary-glow" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{l.title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{l.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section className="border-t border-border/60">
        <div className="container py-16">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary-glow">Operating Principle</div>
              <blockquote className="mt-4 text-2xl font-light leading-snug text-foreground md:text-3xl">
                “Science updates when tests fail. Pseudoscience doubles down after repeated failure.”
              </blockquote>
              <p className="mt-4 text-sm text-muted-foreground">— MisterY Labs</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/40 p-6">
              <h3 className="text-lg font-semibold">Speculative ideas, measurable tests</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                We explore speculative ideas only through measurable tests and reproducible visual
                evidence. No claims. No conclusions. Just better tools for seeing more clearly. We
                do not claim proof of UAPs, missing aircraft, teleportation, or hidden technology —
                we treat such topics only as cultural reasons why optical-anomaly simulation tools
                matter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* COMMUNITY */}
      <section id="media-lab" className="border-t border-border/60 bg-gradient-to-b from-background to-card/30">
        <div className="container py-16">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary-glow">Community</div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">An open observatory for the curious</h2>
          <p className="mt-4 max-w-3xl text-base text-muted-foreground">
            MisterY Labs welcomes artists, engineers, researchers, skeptics, rendering developers,
            optical-phenomena researchers, and curious observers. Bring your tests, your renders,
            your doubts, and your code.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <a href="https://github.com/" target="_blank" rel="noreferrer">
                <Github className="mr-2 h-4 w-4" /> Join on GitHub
              </a>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard">
                <GitBranch className="mr-2 h-4 w-4" /> Open Mission Control
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="container py-6 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>MisterY Labs · Curved Transport Research</span>
            <span>Open research · reproducible · community-driven</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

function CalloutItem({ icon: Icon, title, desc }: { icon: typeof Waves; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/10 ring-1 ring-inset ring-primary/30">
        <Icon className="h-4 w-4 text-primary-glow" />
      </div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}

function StatusPanel({ validated, evidence, inProgress, total }: { validated: number; evidence: number; inProgress: number; total: number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Mission Status</div>
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-success">Systems Nominal</div>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        <Stat label="Projects" value={total} />
        <Stat label="Evidence" value={evidence} />
        <Stat label="Validated" value={validated} />
        <Stat label="In Progress" value={inProgress} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-xl font-bold text-foreground">{value}</div>
      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
    </div>
  );
}

function NavRail() {
  const items = [
    { label: "Curved Transport", desc: "The field of study", icon: Waves },
    { label: "GRIN Optics", desc: "Gradient index fields", icon: Compass },
    { label: "Transport Islands", desc: "Bounded anomalies", icon: CircleDot },
    { label: "Diagnostics", desc: "Renderer instrumentation", icon: Microscope },
    { label: "Pareidolia Lab", desc: "Perception & pattern", icon: Eye },
    { label: "ACT Media", desc: "Creative experiments", icon: Film },
    { label: "Myth → Measurement", desc: "Philosophy & method", icon: Telescope },
  ];
  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-3 backdrop-blur-md">
      <div className="px-2 py-1 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Navigation</div>
      <div className="mt-1 space-y-0.5">
        {items.map((it) => (
          <a
            key={it.label}
            href="#research-notes"
            className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-base hover:bg-secondary/60"
          >
            <span className="grid h-7 w-7 place-items-center rounded-md bg-secondary ring-1 ring-inset ring-border/60">
              <it.icon className="h-3.5 w-3.5 text-primary-glow" />
            </span>
            <span className="flex-1">
              <span className="block text-[13px] font-medium leading-tight">{it.label}</span>
              <span className="block text-[11px] text-muted-foreground">{it.desc}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

export default Index;
