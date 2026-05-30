import React from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

// ── Nobel guiding stars ───────────────────────────────────

interface NobelStar {
  id: string;
  name: string;
  year: string;
  prize: string;
  concept: string;
  anchor: string;
  resonance: string;
  href: string;
  featured: boolean;
}

const NOBEL_STARS: NobelStar[] = [
  {
    id: "thouless",
    name: "David Thouless",
    year: "2016",
    prize: "Nobel · Physics",
    concept: "Topological Phases of Matter",
    anchor: "Global structure determines local behavior",
    resonance:
      "Transport seam topology in xPRIMEray — boundary ownership patterns that persist despite local field perturbations. The global fold of the field geometry determines what the observer classifies.",
    href: "https://en.wikipedia.org/wiki/David_Thouless",
    featured: true,
  },
  {
    id: "glauber",
    name: "Roy J. Glauber",
    year: "2005",
    prize: "Nobel · Physics",
    concept: "Quantum Optical Coherence",
    anchor: "Light carries structured statistical information",
    resonance:
      "Coherence structure in curved transport path bundles — the statistical signature of geodesic ensembles is a measurable field property, not random noise.",
    href: "https://en.wikipedia.org/wiki/Roy_J._Glauber",
    featured: true,
  },
  {
    id: "hansch",
    name: "Theodor W. Hänsch",
    year: "2005",
    prize: "Nobel · Physics",
    concept: "Precision Laser Spectroscopy",
    anchor: "Precision observation reveals hidden structure",
    resonance:
      "DOE measurement philosophy — the observatory's cutsheet and step-length sensitivity methodology are precision diagnostic instruments. Finer steps expose transport boundary structure.",
    href: "https://en.wikipedia.org/wiki/Theodor_W._H%C3%A4nsch",
    featured: true,
  },
  {
    id: "penrose",
    name: "Roger Penrose",
    year: "2020",
    prize: "Nobel · Physics",
    concept: "Black Holes & Mathematical Geometry",
    anchor: "Geometry is not the stage for physics — it is a participant",
    resonance:
      "Null geodesics, Penrose diagrams, and conformal boundary structure inform how xPRIMEray assigns transport boundary ownership. The path is not a line — it is a statement about the field it crosses.",
    href: "https://en.wikipedia.org/wiki/Roger_Penrose",
    featured: false,
  },
];

// ── Knowledge lattice layers ──────────────────────────────

type LatticeTier = "core" | "anchor" | "academic" | "inspiration" | "question" | "speculative";

interface LatticeLayer {
  n: number;
  label: string;
  tier: LatticeTier;
  items: string[];
  note: string | null;
  exploratory: boolean;
}

const LATTICE_LAYERS: LatticeLayer[] = [
  {
    n: 0,
    label: "xPRIMEray Core",
    tier: "core",
    items: [
      "Optical Transport Observatory",
      "Curved-ray GRIN traversal",
      "Observer disagreement",
      "GRIN field rendering",
      "Measurement packets",
      "Visual diagnostics",
    ],
    note: null,
    exploratory: false,
  },
  {
    n: 1,
    label: "Nobel Anchors",
    tier: "anchor",
    items: [
      "Topology (Thouless, 2016)",
      "Optical coherence (Glauber, 2005)",
      "Precision measurement (Hänsch, 2005)",
      "Geometry & black holes (Penrose, 2020)",
    ],
    note: "Established, Nobel-recognized. Resonance only — not reinterpreted.",
    exploratory: false,
  },
  {
    n: 2,
    label: "Normalized Academia",
    tier: "academic",
    items: [
      "Topological photonics",
      "Quantum optics",
      "Differential geometry",
      "Computational physics",
      "Information theory",
      "Optical ray transport",
    ],
    note: null,
    exploratory: false,
  },
  {
    n: 3,
    label: "Inspiration Atlas",
    tier: "inspiration",
    items: [
      "Plato — Forms & archetypal geometry",
      "Shannon — signal survival through noise",
      "Campbell — mythic pattern persistence",
      "Bandyopadhyay — temporal instrumentation",
      "Jung — collective symbolic structures",
    ],
    note: "Inspiration only — not derivation.",
    exploratory: true,
  },
  {
    n: 4,
    label: "Open Questions",
    tier: "question",
    items: [
      "How does transport geometry alter observation?",
      "Which structures survive projection?",
      "Can observer disagreement be measured precisely?",
      "What does topology do to apparent position?",
      "Can curved transport generate intuitive educational demos?",
    ],
    note: null,
    exploratory: true,
  },
  {
    n: 5,
    label: "Speculative Horizon",
    tier: "speculative",
    items: [
      "Over-space / Under-space toy models",
      "Observer Topology Sandbox",
      "Pattern persistence across projections",
      "Archetypal resonance as metaphor",
      "Prime structures in transport geometry",
    ],
    note: "Thought experiments only — not presented as settled fact.",
    exploratory: true,
  },
];

const TIER_STYLE: Record<LatticeTier, { badge: string; border: string; dot: string }> = {
  core:        { badge: "text-primary/70",    border: "border-primary/30",     dot: "bg-primary/60"    },
  anchor:      { badge: "text-amber-400/65",  border: "border-amber-500/28",   dot: "bg-amber-400/60"  },
  academic:    { badge: "text-cyan-400/58",   border: "border-cyan-500/20",    dot: "bg-cyan-400/45"   },
  inspiration: { badge: "text-violet-400/52", border: "border-violet-500/18",  dot: "bg-violet-400/40" },
  question:    { badge: "text-emerald-400/48",border: "border-emerald-500/16", dot: "bg-emerald-400/36"},
  speculative: { badge: "text-rose-400/40",   border: "border-rose-500/14",    dot: "bg-rose-400/32"   },
};

// ── Component ─────────────────────────────────────────────

export function FractalAcademia() {
  return (
    <section id="fractal-academia" className="border-t border-border/25">
      <div className="container py-16 lg:py-20">

        {/* Section header */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/40">
            Knowledge Topology
          </span>
          <div className="h-px flex-1 bg-border/20" />
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-amber-400/38">
            Exploratory Framework
          </span>
        </div>

        <div className="mt-2">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Fractal Academia
          </h2>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-primary/45">
            Guiding Stars of Optical Transport
          </p>
        </div>

        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground/70">
          MisterY Labs begins with established science, then unfolds outward into active research,
          inspiration, open questions, and speculative horizons. The goal is not to collapse all
          ideas into one truth, but to show where each idea lives in the knowledge topology.
        </p>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground/42">
          Each layer is epistemic distance from the observatory core.
          Outer layers are framed as "exploratory" — held at arm's length, not collapsed into the signal.
        </p>

        {/* ── Nobel Anchors ──────────────────────────── */}
        <div className="mt-12">
          <div className="mb-5 flex items-center gap-3">
            <span className="font-mono text-[8px] uppercase tracking-[0.35em] text-amber-400/55">
              ✦ Layer 1 · Nobel Anchors
            </span>
            <div className="h-px flex-1 bg-amber-500/15" />
          </div>
          <p className="mb-6 max-w-xl text-xs leading-relaxed text-muted-foreground/45">
            Four physics Nobel laureates whose established work directly anchors the observatory's
            core concepts. Included as resonance references — not as endorsement or claimed derivation.
          </p>

          {/* Featured three stars */}
          <div className="grid gap-4 sm:grid-cols-3">
            {NOBEL_STARS.filter(s => s.featured).map(star => (
              <NobelStarCard key={star.id} star={star} />
            ))}
          </div>

          {/* Penrose — secondary star, full width but subdued */}
          {NOBEL_STARS.filter(s => !s.featured).map(star => (
            <div key={star.id} className="mt-3">
              <NobelStarCard star={star} wide />
            </div>
          ))}
        </div>

        {/* ── Knowledge Lattice ──────────────────────── */}
        <div className="mt-14">
          <div className="mb-5 flex items-center gap-3">
            <span className="font-mono text-[8px] uppercase tracking-[0.35em] text-muted-foreground/40">
              Knowledge Lattice · 6 Layers
            </span>
            <div className="h-px flex-1 bg-border/18" />
          </div>
          <p className="mb-6 max-w-xl text-xs leading-relaxed text-muted-foreground/42">
            Concentric layers from established core outward to speculative horizon.
            Layers 3–5 are tagged exploratory — clearly outside the measurement-backed interior.
          </p>

          <div className="space-y-2">
            {LATTICE_LAYERS.map(layer => (
              <LatticeLayerRow key={layer.n} layer={layer} />
            ))}
          </div>
        </div>

        {/* ── Epistemic note ─────────────────────────── */}
        <div className="mt-8 rounded-sm border border-border/18 bg-secondary/8 p-4">
          <div className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/38">
            Epistemic Note
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground/50">
            Layers 3–5 are framed as inspiration, open questions, and speculative thought experiments.
            They are not presented as proof, derivation, or scientific confirmation of any claim.
            Language throughout uses "inspired by," "resonates with," and "toy model" — never "proves" or "derives from."
          </p>
        </div>

        {/* ── CTAs ───────────────────────────────────── */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Link
            to="/atlas"
            className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground/45 transition-base hover:text-cyan-400/65"
          >
            Explore Observatory Instruments →
          </Link>
          <span className="h-3 w-px bg-border/22" />
          <Link
            to="/research"
            className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground/45 transition-base hover:text-muted-foreground/75"
          >
            Research Systems →
          </Link>
        </div>

      </div>
    </section>
  );
}

// ── Sub-components ────────────────────────────────────────

function NobelStarCard({ star, wide = false }: { star: NobelStar; wide?: boolean }) {
  return (
    <div
      className={`diagnostic-frame rounded-sm border border-amber-500/18 bg-card/28 p-5 transition-base hover:border-amber-500/35 hover:bg-card/42 ${
        wide ? "flex flex-col sm:flex-row sm:gap-8" : ""
      }`}
    >
      {/* Badge row */}
      <div className={`${wide ? "sm:w-48 shrink-0" : ""}`}>
        <div className="mb-3 flex items-start justify-between gap-2">
          <span className="rounded-sm border border-amber-500/25 bg-amber-950/22 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-amber-400/60">
            {star.prize} · {star.year}
          </span>
          <a
            href={star.href}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-muted-foreground/28 transition-base hover:text-amber-400/60"
            aria-label={`Wikipedia: ${star.name}`}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <div className="text-sm font-semibold tracking-tight">{star.name}</div>
        <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-amber-400/48">
          {star.concept}
        </div>
      </div>

      <div className="flex-1">
        <blockquote className="mt-3 border-l-2 border-amber-500/22 pl-3 text-xs italic leading-relaxed text-foreground/62">
          "{star.anchor}"
        </blockquote>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground/42">
          <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-primary/38">
            ↳ resonance&nbsp;&nbsp;
          </span>
          {star.resonance}
        </p>
      </div>
    </div>
  );
}

function LatticeLayerRow({ layer }: { layer: LatticeLayer }) {
  const s = TIER_STYLE[layer.tier];
  return (
    <div
      className={`rounded-sm border ${s.border} bg-card/12 px-4 py-3 transition-base hover:bg-card/22 ${
        layer.exploratory ? "opacity-80" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <div className="flex items-center gap-2 shrink-0">
          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
          <span className={`font-mono text-[8px] uppercase tracking-[0.25em] ${s.badge}`}>
            Layer {layer.n} · {layer.label}
          </span>
        </div>
        {layer.exploratory && (
          <span className="rounded-sm border border-amber-500/18 bg-amber-950/15 px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.2em] text-amber-400/45">
            Exploratory
          </span>
        )}
        {layer.note && (
          <span className="font-mono text-[8px] italic text-muted-foreground/28 hidden sm:inline">
            — {layer.note}
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {layer.items.map(item => (
          <span
            key={item}
            className="rounded-sm border border-border/20 bg-secondary/20 px-2 py-0.5 font-mono text-[9px] text-muted-foreground/48"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
