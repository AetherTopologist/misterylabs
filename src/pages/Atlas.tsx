import React, { useState } from "react";
import { ExternalLink } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { FractalInspirationAtlas } from "@/components/FractalInspirationAtlas";
import { SiteFooter } from "@/components/SiteFooter";

// ── Data ──────────────────────────────────────────────────

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

// ── XenoCitation Data ─────────────────────────────────────

interface XenoCitationCard {
  id: string;
  name: string;
  era: string;
  coreIdea: string;
  xprimerayResonance: string;
  feature: string;
  motifLabel: string;
  href: string;
  complete: boolean;
}

const XENO_CITATIONS: XenoCitationCard[] = [
  {
    id: "xc-001",
    name: "Sabrina Pasterski",
    era: "2010s – present",
    coreIdea:
      "Celestial holography and soft theorems — the mathematical structure linking asymptotic symmetries of spacetime to memory effects in gravitational radiation.",
    xprimerayResonance:
      "The observatory's transport ownership mapping resonates with Pasterski's celestial sphere framing: every ray path carries a latent topology, and the boundary of the transport field is where geometry speaks most clearly.",
    feature: "CelestialHolographyInspiration · TransportOwnershipOverlay",
    motifLabel: "Celestial Holography",
    href: "https://AetherTopologist.github.io/GD_xPRIMEray/FEATURE_INDEX/",
    complete: true,
  },
  {
    id: "xc-002",
    name: "Emmy Noether",
    era: "1882 – 1935",
    coreIdea:
      "Every differentiable symmetry of the action of a physical system has a corresponding conservation law.",
    xprimerayResonance:
      "Resonates with the xPRIMEray field symmetry diagnostics — transport invariants under traversal mode changes echo Noether's deep link between symmetry and conservation.",
    feature: "FieldSymmetryDiagnostics",
    motifLabel: "Field Symmetry",
    href: "https://AetherTopologist.github.io/GD_xPRIMEray/FEATURE_INDEX/",
    complete: false,
  },
  {
    id: "xc-003",
    name: "James Clerk Maxwell",
    era: "1831 – 1879",
    coreIdea:
      "GRIN optics and the wave theory of light: the refractive index as a continuous field governing ray trajectories.",
    xprimerayResonance:
      "Directly inspired the GRIN field rendering pipeline — curved transport through gradient-index media is the computational descendant of Maxwell's fish-eye lens.",
    feature: "GRINFieldRenderer · LuxCoreGRIN",
    motifLabel: "GRIN Optics",
    href: "https://AetherTopologist.github.io/GD_xPRIMEray/FEATURE_INDEX/",
    complete: false,
  },
  {
    id: "xc-004",
    name: "Gauss & Riemann",
    era: "19th century",
    coreIdea:
      "Differential geometry of curved surfaces: intrinsic curvature, geodesics, and the metric tensor as descriptors of space itself.",
    xprimerayResonance:
      "Resonates with the curved null-geodesic traversal at the heart of xPRIMEray — each ray follows a geodesic through a field-warped medium.",
    feature: "CurvedFieldTraversal · GeodesicPath",
    motifLabel: "Differential Geometry",
    href: "https://AetherTopologist.github.io/GD_xPRIMEray/FEATURE_INDEX/",
    complete: false,
  },
  {
    id: "xc-005",
    name: "Misner, Thorne & Wheeler",
    era: "1973",
    coreIdea:
      "Gravitation — the language of metric tensors, curvature, and geodesic deviation as the full mathematical machinery of general relativity.",
    xprimerayResonance:
      "Resonates with the transport diagnostic language: field ownership, curvature domain maps, and boundary behavior all echo MTW's geometric vocabulary.",
    feature: "CurvatureDomainMap · TransportDiagnostics",
    motifLabel: "Metric Tensor Language",
    href: "https://AetherTopologist.github.io/GD_xPRIMEray/FEATURE_INDEX/",
    complete: false,
  },
  {
    id: "xc-006",
    name: "Richard Feynman",
    era: "1918 – 1988",
    coreIdea:
      "Path integral formulation: a particle takes all paths simultaneously, weighted by phase — the classical path emerges as the stationary-phase result.",
    xprimerayResonance:
      "Inspired the oracle path architecture — the oracle traces all candidate geodesic paths to determine which transport boundary a pixel truly belongs to.",
    feature: "OraclePathTracer · IslandMicroscopy",
    motifLabel: "Path Integral",
    href: "https://AetherTopologist.github.io/GD_xPRIMEray/FEATURE_INDEX/",
    complete: false,
  },
];

const SIGNAL_CATEGORIES = [
  "All",
  "Sci-Fi & Imagination",
  "Mathematics & Physics",
  "CS & Graphics",
  "Emergence & Complexity",
] as const;

// ── Page ──────────────────────────────────────────────────

export default function AtlasPage() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/25 to-transparent" aria-hidden />
      <FractalInspirationAtlas />
      <XenoCitationSection />
      <SignalsSection />
      <SiteFooter />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────

function XenoCitationSection() {
  return (
    <section id="xeno-citations" className="border-t border-border/35">
      <div className="container py-14">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted-foreground/45">
            Conceptual Lineage
          </span>
          <div className="h-px flex-1 bg-border/35" />
        </div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">XenoCitations</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          xPRIMEray draws conceptual lineage from mathematical physics — not as endorsement or
          claimed derivation, but as resonance. These thinkers shaped the vocabulary the observatory
          uses to see.
        </p>
        <p className="mt-1 max-w-2xl text-xs text-muted-foreground/55">
          "Inspired by" and "resonates with" — not "proves" or "derives from."
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {XENO_CITATIONS.map((card) => (
            <XenoCitationCardView key={card.id} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}

function XenoCitationCardView({ card }: { card: XenoCitationCard }) {
  return (
    <div
      className={`diagnostic-frame rounded-sm border p-5 transition-base hover:border-primary/30 hover:bg-card/40 ${
        card.complete
          ? "border-primary/40 bg-card/40 col-span-full"
          : "border-border/35 bg-card/25"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          {card.complete ? (
            <span className="mb-2 inline-block font-mono text-[9px] uppercase tracking-[0.3em] text-primary/70">
              XC-001 · Complete
            </span>
          ) : (
            <span className="mb-2 inline-block font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground/40">
              Stub · In Progress
            </span>
          )}
          <div className="text-sm font-semibold tracking-tight">{card.name}</div>
          <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60">
            {card.era}
          </div>
        </div>
        <a
          href={card.href}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-muted-foreground/30 transition-base hover:text-primary"
          aria-label={`Feature link for ${card.name}`}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <blockquote className="mt-3 text-xs leading-relaxed text-foreground/75 italic">
        "{card.coreIdea}"
      </blockquote>

      <p className={`mt-3 text-xs leading-relaxed ${card.complete ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
        {card.xprimerayResonance}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-sm border border-border/40 bg-secondary/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground/60">
          {card.motifLabel}
        </span>
        <span className="font-mono text-[9px] text-muted-foreground/40">
          ↳ {card.feature}
        </span>
      </div>
    </div>
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

function SignalsSection() {
  const [active, setActive] = useState<string>("All");
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
