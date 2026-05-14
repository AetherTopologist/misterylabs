import React from "react";
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
  Layers,
} from "lucide-react";
import { KleinBottleSVG } from "@/components/KleinBottleSVG";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { EvidenceVault } from "@/components/EvidenceVault";
import { FractalInspirationAtlas } from "@/components/FractalInspirationAtlas";
import { SeeingIsNotOpeningYourEyes } from "@/components/SeeingIsNotOpeningYourEyes";
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

interface InspirationNode {
  id: string;
  name: string;
  role: string;
  signal: string;
  tags: string[];
  href?: string;
  category?: string;
  featured?: boolean;
}

const INSPIRATIONS: InspirationNode[] = [
  // ── Featured ──────────────────────────────────────────────
  {
    id: "isaac-asimov",
    name: "Isaac Asimov",
    role: "Biochemist & science fiction author",
    signal:
      "The most exciting phrase to hear in science is not 'Eureka!' but 'That's funny…' — anomaly is the beginning of all discovery.",
    tags: ["scientific imagination", "curiosity as method", "interdisciplinary thought", "accessible wonder"],
    href: "https://en.wikipedia.org/wiki/Isaac_Asimov",
    category: "Sci-Fi & Imagination",
    featured: true,
  },
  // ── Mathematics & Physics ─────────────────────────────────
  {
    id: "roger-penrose",
    name: "Roger Penrose",
    role: "Mathematical physicist",
    signal:
      "Consciousness, geometry, and physics are not separate territories — they share a single underlying structure that mathematics glimpses but cannot yet fully see.",
    tags: ["twistor theory", "tiling & aperiodicity", "quantum mind", "geometry of spacetime"],
    href: "https://en.wikipedia.org/wiki/Roger_Penrose",
    category: "Mathematics & Physics",
  },
  {
    id: "euclid",
    name: "Euclid",
    role: "Greek mathematician (c. 300 BCE)",
    signal:
      "Rigorous proof from minimal axioms: the idea that geometry could be derived entirely from five postulates remains one of the most powerful intellectual templates in history.",
    tags: ["axiomatic reasoning", "proof culture", "geometry", "foundations of mathematics"],
    href: "https://en.wikipedia.org/wiki/Euclid",
    category: "Mathematics & Physics",
  },
  {
    id: "emmy-noether",
    name: "Emmy Noether",
    role: "Abstract algebraist & theoretical physicist",
    signal:
      "Every symmetry in nature corresponds to a conservation law — a profound link between abstract algebra and the deepest structure of physical reality.",
    tags: ["symmetry", "conservation laws", "abstract algebra", "perseverance against exclusion"],
    href: "https://en.wikipedia.org/wiki/Emmy_Noether",
    category: "Mathematics & Physics",
  },
  {
    id: "poincare",
    name: "Henri Poincaré",
    role: "Mathematician & physicist",
    signal:
      "Topology and dynamical systems emerged together from a single mind asking what happens when geometry becomes qualitative rather than quantitative.",
    tags: ["topology", "dynamical systems", "chaos precursor", "mathematical intuition"],
    href: "https://en.wikipedia.org/wiki/Henri_Poincar%C3%A9",
    category: "Mathematics & Physics",
  },
  {
    id: "hilbert",
    name: "David Hilbert",
    role: "Mathematician",
    signal:
      "We must know, we will know — even as Gödel proved the limits of formal systems, Hilbert's vision of mathematical completeness launched a century of foundational inquiry.",
    tags: ["formalism", "infinite-dimensional spaces", "completeness", "mathematical ambition"],
    href: "https://en.wikipedia.org/wiki/David_Hilbert",
    category: "Mathematics & Physics",
  },
  {
    id: "richard-feynman",
    name: "Richard Feynman",
    role: "Theoretical physicist",
    signal:
      "The pleasure of finding things out — physics as play, as path integral, as honest reckoning with what we do not yet understand.",
    tags: ["path integrals", "QED", "teaching clarity", "intellectual honesty"],
    href: "https://en.wikipedia.org/wiki/Richard_Feynman",
    category: "Mathematics & Physics",
  },
  // ── CS & Graphics ─────────────────────────────────────────
  {
    id: "ewin-tang",
    name: "Ewin Tang",
    role: "Quantum algorithms researcher",
    signal:
      "Elegant mathematical insight can overturn assumptions previously believed computationally impossible.",
    tags: ["independent reasoning", "algorithmic elegance", "youthful rigor", "humility under complexity"],
    href: "https://ewintang.com/",
    category: "CS & Graphics",
  },
  {
    id: "claude-shannon",
    name: "Claude Shannon",
    role: "Mathematician & electrical engineer",
    signal:
      "Information is not meaning — but its mathematical structure underlies every signal, every compression, every communication channel ever built.",
    tags: ["information theory", "entropy", "channel capacity", "mathematical engineering"],
    href: "https://en.wikipedia.org/wiki/Claude_Shannon",
    category: "CS & Graphics",
  },
  {
    id: "john-carmack",
    name: "John Carmack",
    role: "Game engine architect",
    signal:
      "Render the impossible efficiently: from BSP trees to ray casting to megatextures, each breakthrough came from refusing to accept that real-time was the ceiling.",
    tags: ["real-time rendering", "software craftsmanship", "optimization culture", "iterative engineering"],
    href: "https://en.wikipedia.org/wiki/John_Carmack",
    category: "CS & Graphics",
  },
  {
    id: "inigo-quilez",
    name: "Inigo Quilez",
    role: "Graphics researcher & shader artist",
    signal:
      "Entire worlds can emerge from a few lines of math — signed distance functions and procedural noise as instruments of geometric poetry.",
    tags: ["ray marching", "SDF geometry", "procedural graphics", "open knowledge sharing"],
    href: "https://iquilezles.org/",
    category: "CS & Graphics",
  },
  {
    id: "ken-perlin",
    name: "Ken Perlin",
    role: "Computer scientist & visual effects pioneer",
    signal:
      "Noise is not the opposite of signal — structured randomness is the foundation of every organic texture, terrain, and fluid ever rendered in real time.",
    tags: ["procedural noise", "texture synthesis", "GPU algorithms", "natural rendering"],
    href: "https://en.wikipedia.org/wiki/Ken_Perlin",
    category: "CS & Graphics",
  },
  {
    id: "blender-foundation",
    name: "Blender Foundation",
    role: "Open-source 3D creation suite",
    signal:
      "Professional-grade 3D tools can be radically open: Blender proved that community-driven development outpaces closed studios when the mission is clear.",
    tags: ["open source", "cycles renderer", "3D pipeline", "community governance"],
    href: "https://www.blender.org/",
    category: "CS & Graphics",
  },
  // ── Emergence & Complexity ────────────────────────────────
  {
    id: "karl-friston",
    name: "Karl Friston",
    role: "Theoretical neuroscientist",
    signal:
      "The brain does not passively receive the world — it actively models, predicts, and minimizes the surprise between its expectations and incoming signals.",
    tags: ["free energy principle", "active inference", "predictive coding", "self-organization"],
    href: "https://en.wikipedia.org/wiki/Karl_Friston",
    category: "Emergence & Complexity",
  },
  {
    id: "douglas-hofstadter",
    name: "Douglas Hofstadter",
    role: "Cognitive scientist & author",
    signal:
      "Strange loops, self-reference, and tangled hierarchies are not anomalies in formal systems — they are the substrate from which consciousness and meaning arise.",
    tags: ["strange loops", "Gödel", "self-reference", "consciousness & identity"],
    href: "https://en.wikipedia.org/wiki/Douglas_Hofstadter",
    category: "Emergence & Complexity",
  },
  {
    id: "bandyopadhyay",
    name: "Anirban Bandyopadhyay",
    role: "Biophysicist & consciousness researcher",
    signal:
      "Consciousness may be substrate-independent and fractal in nature — a resonance phenomenon that pervades biology at every scale, not an emergent property of neurons alone.",
    tags: ["fractal neuroscience", "resonance & consciousness", "microtubule physics", "unconventional hypotheses"],
    href: "https://en.wikipedia.org/wiki/Anirban_Bandyopadhyay",
    category: "Emergence & Complexity",
  },
  {
    id: "buckminster-fuller",
    name: "Buckminster Fuller",
    role: "Architect, systems theorist & futurist",
    signal:
      "You never change things by fighting against the existing reality. To change something, build a new model that makes the existing model obsolete.",
    tags: ["synergetics", "geodesic geometry", "whole-systems thinking", "doing more with less"],
    href: "https://en.wikipedia.org/wiki/Buckminster_Fuller",
    category: "Emergence & Complexity",
  },
  // ── Sci-Fi & Imagination ──────────────────────────────────
  {
    id: "arthur-c-clarke",
    name: "Arthur C. Clarke",
    role: "Science fiction author & futurist",
    signal:
      "Any sufficiently advanced technology is indistinguishable from magic — and sufficiently rigorous imagination becomes a roadmap for physics to follow.",
    tags: ["hard sci-fi", "geostationary orbit", "monolith as metaphor", "long-range foresight"],
    href: "https://en.wikipedia.org/wiki/Arthur_C._Clarke",
    category: "Sci-Fi & Imagination",
  },
  {
    id: "stanislaw-lem",
    name: "Stanisław Lem",
    role: "Science fiction author & philosopher",
    signal:
      "The universe is under no obligation to be comprehensible — and science fiction is most honest when it refuses to make alien truly legible to human categories.",
    tags: ["xenolinguistics", "philosophical sci-fi", "information theory in fiction", "epistemological humility"],
    href: "https://en.wikipedia.org/wiki/Stanis%C5%82aw_Lem",
    category: "Sci-Fi & Imagination",
  },
];

type PortalStatus = "live" | "research" | "archive" | "coming-soon";

interface ResearchPortal {
  id: string;
  title: string;
  desc: string;
  href: string;
  status: PortalStatus;
  icon: React.ElementType;
}

const PORTAL_STATUS: Record<PortalStatus, { label: string; cls: string }> = {
  live: { label: "Live", cls: "text-success border-success/25 bg-success/10" },
  research: { label: "Research", cls: "text-info border-info/25 bg-info/10" },
  archive: { label: "Archive", cls: "text-muted-foreground border-border/40 bg-secondary/30" },
  "coming-soon": { label: "Coming Soon", cls: "text-warning border-warning/25 bg-warning/10" },
};

const PORTALS: ResearchPortal[] = [
  {
    id: "xprimeray-docs",
    title: "xPRIMEray Docs",
    desc: "Full documentation for the curved transport observatory.",
    href: "https://aethertopologist.github.io/GD_xPRIMEray/",
    status: "live",
    icon: Orbit,
  },
  {
    id: "github-repo",
    title: "GitHub Repository",
    desc: "Source code, commit history, and open development.",
    href: "https://github.com/AetherTopologist/GD_xPRIMEray",
    status: "live",
    icon: Github,
  },
  {
    id: "cathedral-probe",
    title: "Cathedral Probe Architecture",
    desc: "Wormhole fixture topology and traversal geometry design notes.",
    href: "https://aethertopologist.github.io/GD_xPRIMEray/Research/cathedral_probe_architecture/",
    status: "research",
    icon: Telescope,
  },
  {
    id: "transport-island",
    title: "Transport Island Microscopy",
    desc: "Resolving transport instability in curved null-geodesic rendering.",
    href: "https://aethertopologist.github.io/GD_xPRIMEray/Research/transport_island_microscopy/",
    status: "research",
    icon: Microscope,
  },
  {
    id: "validation-ladder",
    title: "Curved Field Validation Ladder",
    desc: "Latest visual validation packet — convergence and correctness milestones.",
    href: "https://aethertopologist.github.io/GD_xPRIMEray/#current-milestone-curved-field-validation-ladder",
    status: "research",
    icon: Activity,
  },
];

const RESEARCH_ATLAS = [
  { title: "Curved Transport", desc: "Core field of study", icon: Waves },
  { title: "GRIN Optics", desc: "Gradient index fields", icon: Compass },
  { title: "Rendering Diagnostics", desc: "Instrumentation & metrics", icon: Microscope },
  { title: "Pareidolia Lab", desc: "Perception & pattern", icon: Eye },
  { title: "Media Lab", desc: "Visual experiments & ACT research", icon: Film },
  { title: "Field Methods", desc: "Philosophy of measurement", icon: Telescope },
  { title: "Klein Topology", desc: "Non-orientable manifolds, recursive geometry", icon: Layers },
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
                <a href="#evidence-vault">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Validation Archive
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
              <FieldNote icon={Layers} title="Klein Topology" desc="Non-orientable traversal, recursive manifolds" />
            </div>
          </aside>
        </div>
      </section>

      {/* ── SEEING IS NOT OPENING YOUR EYES ───────────────── */}
      <SeeingIsNotOpeningYourEyes />

      {/* ── FRACTAL INSPIRATION ATLAS ─────────────────────── */}
      <div id="inspiration">
        <FractalInspirationAtlas />
      </div>

      {/* ── ACTIVE RESEARCH SYSTEMS ───────────────────────── */}
      <section className="border-t border-border/35">
        <div className="container py-12">
          <SectionHeader sys="SYS // 01" title="Active Research Systems" />

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

          {/* Title block — larger than other sections */}
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

      {/* ── RESEARCH PORTALS ─────────────────────────────── */}
      <section id="portals" className="border-t border-border/35">
        <div className="container py-12">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/45">
              SYS // 02.A
            </span>
            <div className="h-px w-12 bg-border/35" />
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary-glow/60">
              Direct Access
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
            Research Portals
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Direct entry points into the xPRIMEray observatory — docs, source, and active research notes.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PORTALS.map((portal) => (
              <PortalCard key={portal.id} portal={portal} />
            ))}
          </div>
        </div>
      </section>

      {/* ── VALIDATION ARCHIVE ────────────────────────────── */}
      <section id="evidence-vault" className="border-t border-border/35">
        <div className="container py-16">
          <SectionHeader sys="SYS // 03" title="Validation Archive" />
          <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground/45">
            Milestone archaeology · predecessor research lineage
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Validated repository snapshots, visual artifacts, and historical milestones that
            establish the research lineage feeding into the active xPRIMEray observatory.
          </p>
          <div className="mt-8">
            <EvidenceVault />
          </div>
        </div>
      </section>

      {/* ── RESEARCH NOTES ────────────────────────────────── */}
      <section id="research-notes" className="border-t border-border/35">
        <div className="container py-16">
          <SectionHeader sys="SYS // 04" title="Research Notes" />
          <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground/45">
            Docs · field reports · active research domains
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Docs, papers, and field reports across the observatory's active research domains.
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

      {/* ── SIGNALS & INSPIRATIONS ────────────────────────── */}
      <SignalsSection />

      {/* ── MEDIA LAB · OPEN SIGNAL ───────────────────────── */}
      <section id="media-lab" className="border-t border-border/35">
        <div className="container py-16">
          <SectionHeader sys="SYS // 05" title="Media Lab" />
          <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground/45">
            Visual experiments · ACT research · Open signal
          </p>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            An open observatory for rendering researchers, visual artists, and curious engineers.
            Bring tests, renders, field notes, and code.
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
  const items: { label: string; desc: string; icon: React.ElementType; href: string; route?: boolean }[] = [
    { label: "xPRIMEray", desc: "Active observatory", icon: Orbit, href: "#xprimeray" },
    { label: "Fractal Inspiration Atlas", desc: "Cognitive ancestry", icon: Sparkles, href: "#atlas" },
    { label: "Validation Archive", desc: "Evidence lineage", icon: FolderOpen, href: "#evidence-vault" },
    { label: "Research Notes", desc: "Field reports", icon: Microscope, href: "#research-notes" },
    { label: "Media Lab", desc: "Visual experiments", icon: Film, href: "#media-lab" },
    { label: "Mission Control", desc: "Project dashboard", icon: GitBranch, href: "/dashboard", route: true },
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

function PortalCard({ portal }: { portal: ResearchPortal }) {
  const badge = PORTAL_STATUS[portal.status];
  return (
    <a
      href={portal.href}
      target="_blank"
      rel="noreferrer"
      className="group diagnostic-frame flex flex-col rounded-sm border border-border/40 bg-card/25 p-4 transition-base hover:border-primary/40 hover:bg-card/45 hover:shadow-[0_0_16px_-4px_hsl(var(--primary)/0.2)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-secondary/60 ring-1 ring-inset ring-border/40">
          <portal.icon className="h-3.5 w-3.5 text-primary-glow" />
        </div>
        <span className={`rounded-sm border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] ${badge.cls}`}>
          {badge.label}
        </span>
      </div>
      <div className="mt-3 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold tracking-tight">{portal.title}</span>
          <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground/30 transition-base group-hover:text-primary/60" />
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{portal.desc}</p>
      </div>
    </a>
  );
}

function InspirationCard({ node }: { node: InspirationNode }) {
  return (
    <div
      className={`diagnostic-frame rounded-sm border p-5 transition-base hover:border-primary/30 hover:bg-card/40 ${
        node.featured
          ? "border-primary/40 bg-card/40 col-span-full"
          : "border-border/35 bg-card/25"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          {node.featured && (
            <span className="mb-2 inline-block font-mono text-[9px] uppercase tracking-[0.3em] text-primary/70">
              Featured Signal
            </span>
          )}
          <div className="text-sm font-semibold tracking-tight">{node.name}</div>
          <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60">
            {node.role}
          </div>
        </div>
        {node.href && (
          <a
            href={node.href}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-muted-foreground/30 transition-base hover:text-primary"
            aria-label={`External link for ${node.name}`}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
      <blockquote className="mt-3 text-xs leading-relaxed text-foreground/75 italic">
        "{node.signal}"
      </blockquote>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {node.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-sm border border-border/40 bg-secondary/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground/60"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

const SIGNAL_CATEGORIES = [
  "All",
  "Sci-Fi & Imagination",
  "Mathematics & Physics",
  "CS & Graphics",
  "Emergence & Complexity",
] as const;

function SignalsSection() {
  const [active, setActive] = React.useState<string>("All");
  const visible =
    active === "All"
      ? INSPIRATIONS
      : INSPIRATIONS.filter((n) => n.category === active);

  return (
    <section id="signals" className="border-t border-border/35">
      <div className="container py-14">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/45">
            Influences
          </span>
          <div className="h-px flex-1 bg-border/35" />
        </div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
          Signals &amp; Inspirations
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          MisterY Labs is inspired by researchers, engineers, artists, physicists, game developers,
          and strange beautiful minds who challenged assumptions through curiosity, rigor, and
          imagination.
        </p>
        <p className="mt-1 max-w-2xl text-xs text-muted-foreground/55">
          Signals detected across mathematics, rendering, physics, computation, systems theory, and
          scientific imagination.
        </p>

        {/* Category filter */}
        <div className="mt-6 flex flex-wrap gap-2">
          {SIGNAL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`rounded-sm border px-3 py-1 font-mono text-[9px] uppercase tracking-[0.2em] transition-base ${
                active === cat
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border/40 text-muted-foreground/50 hover:border-border/70 hover:text-muted-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((node) => (
            <InspirationCard key={node.id} node={node} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Index;
