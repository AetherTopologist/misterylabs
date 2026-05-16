import React, { useState } from "react";
import { ExternalLink } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { FractalInspirationAtlas } from "@/components/FractalInspirationAtlas";
import { SiteFooter } from "@/components/SiteFooter";

// ── Data ──────────────────────────────────────────────────

type InspirationTier = "primary" | "foundational" | "observer" | "mirror";

interface InspirationNode {
  id: string;
  name: string;
  role: string;
  signal: string;
  tags: string[];
  href?: string;
  category: string;
  tier: InspirationTier;
}

const INSPIRATIONS: InspirationNode[] = [

  // ── Foundational Signals ──────────────────────────────────

  {
    id: "bandyopadhyay",
    name: "Anirban Bandyopadhyay",
    role: "Biophysicist · Nanobrain pioneer · precision instrumentation",
    signal:
      "The Nanobrain architecture — time crystal oscillators, Geometric Music Language, and microtubule triplet resonance structures — serves as the observatory's primary instrumentation metaphor: a model for what ultra-precise temporal and spatial field sampling might look like. Handcrafted atom-probe scanning lineage informs the diagnostic philosophy. Treated here as research-facing aesthetic and instrumentation inspiration, not as a proven framework.",
    tags: [
      "nanobrain architecture",
      "time crystal instrumentation",
      "Geometric Music Language",
      "microtubule triplet resonance",
      "atom-probe precision",
      "temporal geometry",
    ],
    href: "https://en.wikipedia.org/wiki/Anirban_Bandyopadhyay",
    category: "Foundational Signals",
    tier: "primary",
  },
  {
    id: "roger-penrose",
    name: "Roger Penrose",
    role: "Mathematical physicist · optical geometry · spacetime topology",
    signal:
      "Null geodesics, Penrose diagrams, and twistor geometry articulate the causal architecture of spacetime as a visual and mathematical vocabulary. The conformal boundary, the light cone, the optical path as fundamental datum — these form the observatory's optical geometry intuition and the visual rigor behind its transport diagnostic language.",
    tags: [
      "null geodesics",
      "Penrose diagrams",
      "twistor theory",
      "causal structure",
      "optical geometry",
      "conformal boundary",
    ],
    href: "https://en.wikipedia.org/wiki/Roger_Penrose",
    category: "Foundational Signals",
    tier: "foundational",
  },
  {
    id: "etienne-boullee",
    name: "Étienne-Louis Boullée",
    role: "Visionary architect (1728–1799) · monumental observatory geometry",
    signal:
      "The Cenotaph for Newton — a hollow sphere large enough to contain the solar system, with stars cut into the shell — proposed that architecture could confront infinity as containment rather than extension. The interior becomes the universe it models. This is the visual lineage for the observatory's own monumental institutional calm: the idea that an instrument should feel as large as what it observes.",
    tags: [
      "Cenotaph for Newton",
      "spherical containment",
      "observatory architecture",
      "monumental institutional form",
      "infinity as interior",
      "civilizational scale",
    ],
    href: "https://en.wikipedia.org/wiki/%C3%89tienne-Louis_Boull%C3%A9e",
    category: "Foundational Signals",
    tier: "foundational",
  },

  // ── Supporting Observers ──────────────────────────────────

  {
    id: "albert-einstein",
    name: "Albert Einstein",
    role: "Theoretical physicist (1879–1955)",
    signal:
      "Spacetime is not the stage for physics — it is a participant. The curvature of geodesics by mass-energy is the conceptual origin of any renderer that takes field geometry seriously rather than approximating it as post-process distortion.",
    tags: [
      "general relativity",
      "spacetime curvature",
      "geodesic paths",
      "field equations",
      "thought experiment method",
    ],
    href: "https://en.wikipedia.org/wiki/Albert_Einstein",
    category: "Supporting Observers",
    tier: "observer",
  },
  {
    id: "william-hamilton",
    name: "William Rowan Hamilton",
    role: "Mathematician & physicist (1805–1865)",
    signal:
      "Quaternions as the algebra of rotation, and the Hamiltonian as the phase-space evolution operator — the mathematical substrate beneath every orientation traversal and field-state propagation in curved rendering systems.",
    tags: [
      "quaternions",
      "Hamiltonian mechanics",
      "phase space",
      "rotational algebra",
      "canonical coordinates",
    ],
    href: "https://en.wikipedia.org/wiki/William_Rowan_Hamilton",
    category: "Supporting Observers",
    tier: "observer",
  },
  {
    id: "felix-klein",
    name: "Felix Klein",
    role: "Mathematician (1849–1925)",
    signal:
      "The Klein bottle makes inside and outside continuous — a surface with no boundary and no orientation. The Erlangen programme redefined geometry not as shape but as invariant structure under transformation. The observatory borrows both: non-orientable topology as traversal metaphor, and invariant-under-transformation as the test of a valid transport model.",
    tags: [
      "Klein bottle",
      "non-orientable topology",
      "Erlangen programme",
      "transformation invariants",
      "projective geometry",
    ],
    href: "https://en.wikipedia.org/wiki/Felix_Klein",
    category: "Supporting Observers",
    tier: "observer",
  },
  {
    id: "alan-turing",
    name: "Alan Turing",
    role: "Computer scientist & mathematician (1912–1954)",
    signal:
      "Computation as a physical process with definable limits — the halting problem as a statement about what formal systems cannot know about themselves, and morphogenesis as an example of how simple rules generate complex spatial structure. Both inform how the observatory thinks about its own diagnostic instruments.",
    tags: [
      "computation theory",
      "halting problem",
      "morphogenesis",
      "formal decidability",
      "reaction-diffusion systems",
    ],
    href: "https://en.wikipedia.org/wiki/Alan_Turing",
    category: "Supporting Observers",
    tier: "observer",
  },
  {
    id: "benoit-mandelbrot",
    name: "Benoît Mandelbrot",
    role: "Mathematician (1924–2010)",
    signal:
      "Fractal geometry names what Euclidean geometry cannot: the recursive self-similarity of coastlines, clouds, and biological branching. A vocabulary for the irregular structures the observatory's transport systems encounter at field boundaries and seam topologies.",
    tags: [
      "fractal geometry",
      "self-similarity",
      "Julia sets",
      "coastline paradox",
      "natural boundary form",
    ],
    href: "https://en.wikipedia.org/wiki/Benoit_Mandelbrot",
    category: "Supporting Observers",
    tier: "observer",
  },
  {
    id: "emmy-noether",
    name: "Emmy Noether",
    role: "Abstract algebraist & theoretical physicist (1882–1935)",
    signal:
      "Every differentiable symmetry of the action corresponds to a conservation law — a profound link between abstract algebra and the deepest structure of physical reality. Transport invariants under traversal mode changes echo this connection.",
    tags: ["symmetry", "conservation laws", "abstract algebra", "field invariants"],
    href: "https://en.wikipedia.org/wiki/Emmy_Noether",
    category: "Supporting Observers",
    tier: "observer",
  },
  {
    id: "richard-feynman",
    name: "Richard Feynman",
    role: "Theoretical physicist (1918–1988)",
    signal:
      "The path integral: a particle takes all paths simultaneously, weighted by phase — the classical trajectory emerges as the stationary-phase result. The oracle path architecture in xPRIMEray traces all candidate geodesics to determine which transport boundary a pixel belongs to.",
    tags: ["path integrals", "QED", "oracle path lineage", "teaching clarity", "intellectual honesty"],
    href: "https://en.wikipedia.org/wiki/Richard_Feynman",
    category: "Supporting Observers",
    tier: "observer",
  },
  {
    id: "claude-shannon",
    name: "Claude Shannon",
    role: "Mathematician & electrical engineer (1916–2001)",
    signal:
      "Information is not meaning — but its mathematical structure underlies every signal, every compression, every communication channel. The diagnostic data the observatory emits is, at its foundation, a channel with capacity constraints.",
    tags: ["information theory", "entropy", "channel capacity", "signal structure"],
    href: "https://en.wikipedia.org/wiki/Claude_Shannon",
    category: "Supporting Observers",
    tier: "observer",
  },
  {
    id: "euclid",
    name: "Euclid",
    role: "Greek mathematician (c. 300 BCE)",
    signal:
      "Rigorous proof from minimal axioms — the idea that geometry could be derived entirely from five postulates remains one of the most powerful intellectual templates in history, and the baseline against which non-Euclidean geometry defines itself.",
    tags: ["axiomatic reasoning", "proof culture", "geometry foundations", "Euclidean baseline"],
    href: "https://en.wikipedia.org/wiki/Euclid",
    category: "Supporting Observers",
    tier: "observer",
  },
  {
    id: "poincare",
    name: "Henri Poincaré",
    role: "Mathematician & physicist (1854–1912)",
    signal:
      "Topology and dynamical systems emerged together from a single mind asking what happens when geometry becomes qualitative rather than quantitative — a precursor to the chaos and phase-space thinking that underpins modern field simulation.",
    tags: ["topology", "dynamical systems", "chaos precursor", "qualitative geometry"],
    href: "https://en.wikipedia.org/wiki/Henri_Poincar%C3%A9",
    category: "Supporting Observers",
    tier: "observer",
  },
  {
    id: "hilbert",
    name: "David Hilbert",
    role: "Mathematician (1862–1943)",
    signal:
      "Infinite-dimensional spaces, formalism, and the drive toward completeness — even after Gödel showed completeness was unattainable, Hilbert's programme launched a century of foundational inquiry that shaped every formal system the observatory's diagnostics rely on.",
    tags: ["formalism", "infinite-dimensional spaces", "completeness", "foundational inquiry"],
    href: "https://en.wikipedia.org/wiki/David_Hilbert",
    category: "Supporting Observers",
    tier: "observer",
  },
  {
    id: "karl-friston",
    name: "Karl Friston",
    role: "Theoretical neuroscientist",
    signal:
      "The brain does not passively receive the world — it actively models, predicts, and minimizes surprise between expectation and incoming signal. Active inference as a template for how an observatory instrument might decide where to look.",
    tags: ["free energy principle", "active inference", "predictive coding", "self-organization"],
    href: "https://en.wikipedia.org/wiki/Karl_Friston",
    category: "Supporting Observers",
    tier: "observer",
  },
  {
    id: "douglas-hofstadter",
    name: "Douglas Hofstadter",
    role: "Cognitive scientist & author",
    signal:
      "Strange loops and tangled hierarchies as structural features of formal systems — the idea that self-reference generates new levels of description, which the observatory encounters whenever a diagnostic instrument models its own output.",
    tags: ["strange loops", "Gödel", "self-reference", "formal hierarchy"],
    href: "https://en.wikipedia.org/wiki/Douglas_Hofstadter",
    category: "Supporting Observers",
    tier: "observer",
  },
  {
    id: "buckminster-fuller",
    name: "Buckminster Fuller",
    role: "Architect, systems theorist & futurist (1895–1983)",
    signal:
      "Synergetics and geodesic geometry — the principle that whole-system behavior is not derivable from examining parts in isolation. The observatory's transport seams are a geodesic phenomenon: locally flat, globally curved.",
    tags: ["synergetics", "geodesic geometry", "whole-systems thinking", "tensegrity"],
    href: "https://en.wikipedia.org/wiki/Buckminster_Fuller",
    category: "Supporting Observers",
    tier: "observer",
  },
  {
    id: "ewin-tang",
    name: "Ewin Tang",
    role: "Quantum algorithms researcher",
    signal:
      "Elegant mathematical insight can overturn assumptions previously believed computationally intractable. A reminder that the complexity class of a problem is a property of our understanding, not the problem itself.",
    tags: ["algorithmic elegance", "independent reasoning", "humility under complexity"],
    href: "https://ewintang.com/",
    category: "Supporting Observers",
    tier: "observer",
  },
  {
    id: "john-carmack",
    name: "John Carmack",
    role: "Game engine architect",
    signal:
      "From BSP trees to ray casting to megatextures — each breakthrough came from refusing to accept that real-time was the ceiling. Real-time rendering as engineering discipline, not just graphics artistry.",
    tags: ["real-time rendering", "software craftsmanship", "optimization culture", "iterative engineering"],
    href: "https://en.wikipedia.org/wiki/John_Carmack",
    category: "Supporting Observers",
    tier: "observer",
  },
  {
    id: "inigo-quilez",
    name: "Inigo Quilez",
    role: "Graphics researcher & shader artist",
    signal:
      "Entire worlds emerge from a few lines of math — signed distance functions and procedural noise as instruments of geometric poetry. The aesthetic model for concise, expressive transport code.",
    tags: ["ray marching", "SDF geometry", "procedural graphics", "open knowledge sharing"],
    href: "https://iquilezles.org/",
    category: "Supporting Observers",
    tier: "observer",
  },
  {
    id: "ken-perlin",
    name: "Ken Perlin",
    role: "Computer scientist & visual effects pioneer",
    signal:
      "Structured randomness as the foundation of every organic texture, terrain, and fluid ever rendered in real time. Noise is not the opposite of signal — it is a signal with a complex origin.",
    tags: ["procedural noise", "texture synthesis", "GPU algorithms", "natural rendering"],
    href: "https://en.wikipedia.org/wiki/Ken_Perlin",
    category: "Supporting Observers",
    tier: "observer",
  },
  {
    id: "blender-foundation",
    name: "Blender Foundation",
    role: "Open-source 3D creation suite",
    signal:
      "Professional-grade 3D tools can be radically open. Blender proved that community-driven development with a clear mission outpaces closed studios — the model for how the observatory's own tooling is approached.",
    tags: ["open source", "cycles renderer", "3D pipeline", "community governance"],
    href: "https://www.blender.org/",
    category: "Supporting Observers",
    tier: "observer",
  },

  // ── Cultural Mirrors ──────────────────────────────────────

  {
    id: "isaac-asimov",
    name: "Isaac Asimov",
    role: "Biochemist & science fiction author (1920–1992)",
    signal:
      "'That's funny…' — anomaly is the beginning of all discovery. Asimov's scientific imagination and insistence on accessible wonder set the tone for how the observatory communicates what it finds.",
    tags: ["scientific imagination", "curiosity as method", "accessible wonder", "interdisciplinary thought"],
    href: "https://en.wikipedia.org/wiki/Isaac_Asimov",
    category: "Cultural Mirrors",
    tier: "mirror",
  },
  {
    id: "stanley-kubrick",
    name: "Stanley Kubrick",
    role: "Filmmaker (1928–1999)",
    signal:
      "2001: A Space Odyssey established the visual grammar for deep-space instrumentation cinema — monumental silence, minimal UI, machine-readable readouts, and the aesthetic of a mission that proceeds with or without human comprehension. The visual tone reference for observatory instrumentation.",
    tags: ["2001 A Space Odyssey", "mission-control visual language", "monumental cinema", "scientific aesthetic"],
    href: "https://en.wikipedia.org/wiki/Stanley_Kubrick",
    category: "Cultural Mirrors",
    tier: "mirror",
  },
  {
    id: "arthur-c-clarke",
    name: "Arthur C. Clarke",
    role: "Science fiction author & futurist (1917–2008)",
    signal:
      "Any sufficiently advanced technology is indistinguishable from magic — and sufficiently rigorous imagination becomes a roadmap for physics to follow. Hard sci-fi as a design brief.",
    tags: ["hard sci-fi", "geostationary orbit", "monolith as metaphor", "long-range foresight"],
    href: "https://en.wikipedia.org/wiki/Arthur_C._Clarke",
    category: "Cultural Mirrors",
    tier: "mirror",
  },
  {
    id: "stanislaw-lem",
    name: "Stanisław Lem",
    role: "Science fiction author & philosopher (1921–2006)",
    signal:
      "The universe is under no obligation to be comprehensible — and science fiction is most honest when it refuses to make the alien legible to human categories. Epistemological humility as a design principle.",
    tags: ["philosophical sci-fi", "xenolinguistics", "epistemological humility", "information theory in fiction"],
    href: "https://en.wikipedia.org/wiki/Stanis%C5%82aw_Lem",
    category: "Cultural Mirrors",
    tier: "mirror",
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
  "Foundational Signals",
  "Supporting Observers",
  "Cultural Mirrors",
] as const;

// ── Tier styling ───────────────────────────────────────────

const TIER_CARD_CLS: Record<InspirationTier, string> = {
  primary:
    "col-span-full border-primary/45 bg-card/40 hover:border-primary/60 hover:bg-card/50",
  foundational:
    "border-primary/25 bg-card/30 hover:border-primary/40 hover:bg-card/40",
  observer:
    "border-border/35 bg-card/25 hover:border-primary/30 hover:bg-card/40",
  mirror:
    "border-border/20 bg-card/15 opacity-75 hover:border-border/40 hover:bg-card/25",
};

const TIER_BADGE: Record<InspirationTier, { label: string; cls: string } | null> = {
  primary: { label: "Primary Signal", cls: "text-primary/70" },
  foundational: { label: "Foundational", cls: "text-primary-glow/60" },
  observer: null,
  mirror: null,
};

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
  const badge = TIER_BADGE[node.tier];
  const signalCls =
    node.tier === "mirror" ? "text-foreground/55" : "text-foreground/75";
  const tagOpacity =
    node.tier === "mirror" ? "text-muted-foreground/45" : "text-muted-foreground/60";

  return (
    <div
      className={`diagnostic-frame rounded-sm border p-5 transition-base ${TIER_CARD_CLS[node.tier]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          {badge && (
            <span className={`mb-2 inline-block font-mono text-[9px] uppercase tracking-[0.3em] ${badge.cls}`}>
              {badge.label}
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

      <blockquote className={`mt-3 text-xs leading-relaxed italic ${signalCls}`}>
        "{node.signal}"
      </blockquote>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {node.tags.map((tag) => (
          <span
            key={tag}
            className={`rounded-sm border border-border/40 bg-secondary/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] ${tagOpacity}`}
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
            Observatory Lineage
          </span>
          <div className="h-px flex-1 bg-border/35" />
        </div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
          Foundational Observatory Lineage
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          The thinkers, instruments, and aesthetic lineages that shape how the observatory sees.
          Grouped by proximity to the research — from primary instrumentation inspiration, through
          supporting mathematical and engineering vocabulary, to the cultural mirrors that set the tone.
        </p>
        <p className="mt-1 max-w-2xl text-xs text-muted-foreground/55">
          Inspiration and visual vocabulary only — no claims of derivation or endorsement.
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
