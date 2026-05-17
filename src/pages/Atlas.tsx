import React, { useState } from "react";
import { ExternalLink } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { FractalInspirationAtlas } from "@/components/FractalInspirationAtlas";
import { SiteFooter } from "@/components/SiteFooter";

// ── Types ─────────────────────────────────────────────────

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

// ── Inspiration Data ──────────────────────────────────────
// Canonical ordering: Foundational Optical Transport → Differential Geometry →
// Hamiltonian Transport → Metric Relativity → Observer Geometry → Symmetry →
// Multi-Path Intuition → Temporal Instrumentation → Boundary Correspondence →
// Systems / Computation → Cultural / Mythic Mirrors

const INSPIRATIONS: InspirationNode[] = [

  // ── Temporal Instrumentation & Nanobrain (Primary Signal) ─

  {
    id: "bandyopadhyay",
    name: "Anirban Bandyopadhyay",
    role: "Biophysicist · Nanobrain pioneer · precision instrumentation",
    signal:
      "Nanobrain, time crystal instrumentation, and Geometric Music Language frame the observer as a temporal analyzer: structure is sampled through precision, rhythm, and coherent measurement rather than merely seen. xPRIMEray borrows this instrumentation metaphor for its observatory model: each diagnostic frame becomes a sampled transport field, each pixel a possible time-series witness to hidden curvature structure. Treated here as research-facing aesthetic and instrumentation inspiration, not as a proven framework.",
    tags: [
      "nanobrain architecture",
      "time crystal instrumentation",
      "Geometric Music Language",
      "microtubule triplet resonance",
      "atom-probe precision",
      "temporal geometry",
    ],
    href: "https://en.wikipedia.org/wiki/Anirban_Bandyopadhyay",
    category: "Temporal Instrumentation & Nanobrain",
    tier: "primary",
  },

  // ── Foundational Optical Transport ───────────────────────

  {
    id: "james-clerk-maxwell",
    name: "James Clerk Maxwell",
    role: "Mathematical physicist (1831–1879)",
    signal:
      "GRIN optics and the wave theory of light: the refractive index as a continuous field governing ray trajectories through gradient media. Maxwell's fish-eye lens is the conceptual ancestor of every curved-transport field renderer that treats the medium itself as the geometry.",
    tags: [
      "GRIN optics",
      "refractive index field",
      "wave equations",
      "electromagnetic theory",
      "gradient media",
    ],
    href: "https://en.wikipedia.org/wiki/James_Clerk_Maxwell",
    category: "Foundational Optical Transport",
    tier: "foundational",
  },

  // ── Differential Geometry & Curvature ────────────────────

  {
    id: "gauss-riemann",
    name: "Gauss & Riemann",
    role: "Mathematicians (19th century)",
    signal:
      "Differential geometry of curved surfaces: intrinsic curvature, geodesics, and the metric tensor as descriptors of space itself rather than as coordinate impositions. The curved null-geodesic traversal at the heart of xPRIMEray follows paths that Gauss and Riemann first gave language to.",
    tags: [
      "differential geometry",
      "intrinsic curvature",
      "metric tensor",
      "geodesic paths",
      "Riemannian manifolds",
    ],
    href: "https://en.wikipedia.org/wiki/Bernhard_Riemann",
    category: "Differential Geometry & Curvature",
    tier: "foundational",
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
    category: "Differential Geometry & Curvature",
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
    category: "Differential Geometry & Curvature",
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
    category: "Differential Geometry & Curvature",
    tier: "observer",
  },

  // ── Hamiltonian / Quaternion Transport ───────────────────

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
    category: "Hamiltonian / Quaternion Transport",
    tier: "observer",
  },

  // ── Effective Optical Metric / GRIN Analogy ───────────────

  {
    id: "gordon-metric",
    name: "Gordon Metric",
    role: "Walter Gordon (1893–1939) · effective optical metric in media",
    signal:
      "The Gordon metric formalizes how light in a dielectric medium experiences an effective curved spacetime: the refractive index field directly defines the metric through which photons travel. Every ray in a gradient-index medium follows a geodesic through Gordon's effective metric — making GRIN optics formally equivalent to curved-space transport. This is the direct mathematical ancestor of xPRIMEray's curved-field rendering architecture.",
    tags: [
      "effective optical metric",
      "Gordon optical metric",
      "dielectric spacetime",
      "refractive index as curvature",
      "GRIN as curved-space transport",
      "metric analogue optics",
    ],
    href: "https://en.wikipedia.org/wiki/Gordon_metric",
    category: "Foundational Optical Transport",
    tier: "foundational",
  },

  // ── Metric Relativity Language ────────────────────────────

  {
    id: "misner-thorne-wheeler",
    name: "Misner, Thorne & Wheeler",
    role: "Physicists · Gravitation (1973)",
    signal:
      "Gravitation remains the definitive synthesis of general relativity as geometry — the language of metric tensors, curvature, and geodesic deviation articulated as a complete mathematical machinery. The observatory's transport diagnostic language echoes this vocabulary: field ownership, curvature domain maps, and boundary behavior.",
    tags: [
      "metric tensor language",
      "geodesic deviation",
      "spacetime curvature",
      "mathematical GR",
      "transport diagnostics",
    ],
    href: "https://en.wikipedia.org/wiki/Gravitation_(book)",
    category: "Metric Relativity Language",
    tier: "observer",
  },
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
    category: "Metric Relativity Language",
    tier: "observer",
  },

  // ── Observer Geometry & Causal Structure ─────────────────

  {
    id: "roger-penrose",
    name: "Roger Penrose",
    role: "Mathematical physicist · optical geometry · spacetime topology",
    signal:
      "Null geodesics, causal boundaries, and topological imagination give xPRIMEray its visual vocabulary for paths, horizons, and observer-dependent structure. Transport ownership maps and curved traversal diagnostics resonate with Penrose-style optical geometry: the path is not just a line, but a statement about the field it crosses.",
    tags: [
      "null geodesics",
      "Penrose diagrams",
      "twistor theory",
      "causal structure",
      "optical geometry",
      "conformal boundary",
    ],
    href: "https://en.wikipedia.org/wiki/Roger_Penrose",
    category: "Observer Geometry & Causal Structure",
    tier: "foundational",
  },

  // ── Symmetry & Invariants ─────────────────────────────────

  {
    id: "emmy-noether",
    name: "Emmy Noether",
    role: "Abstract algebraist & theoretical physicist (1882–1935)",
    signal:
      "Every differentiable symmetry of the action corresponds to a conservation law — a profound link between abstract algebra and the deepest structure of physical reality. Transport invariants under traversal mode changes echo this connection.",
    tags: ["symmetry", "conservation laws", "abstract algebra", "field invariants"],
    href: "https://en.wikipedia.org/wiki/Emmy_Noether",
    category: "Symmetry & Invariants",
    tier: "observer",
  },

  // ── Multi-Path / Quantum Transport Intuition ─────────────

  {
    id: "richard-feynman",
    name: "Richard Feynman",
    role: "Theoretical physicist (1918–1988)",
    signal:
      "The path integral: a particle takes all paths simultaneously, weighted by phase — the classical trajectory emerges as the stationary-phase result. The oracle path architecture in xPRIMEray traces all candidate geodesics to determine which transport boundary a pixel belongs to.",
    tags: ["path integrals", "QED", "oracle path lineage", "teaching clarity", "intellectual honesty"],
    href: "https://en.wikipedia.org/wiki/Richard_Feynman",
    category: "Multi-Path / Quantum Transport Intuition",
    tier: "observer",
  },

  // ── Boundary Correspondence ───────────────────────────────

  {
    id: "sabrina-pasterski",
    name: "Sabrina Pasterski",
    role: "Theoretical physicist · celestial holography",
    signal:
      "Celestial holography and soft theorems link asymptotic symmetries of spacetime to memory effects in gravitational radiation. The observatory's transport ownership mapping resonates with Pasterski's celestial sphere framing: every ray path carries a latent topology, and the boundary of the transport field is where geometry speaks most clearly.",
    tags: [
      "celestial holography",
      "soft theorems",
      "asymptotic symmetries",
      "gravitational memory",
      "boundary geometry",
    ],
    href: "https://en.wikipedia.org/wiki/Sabrina_Gonz%C3%A1lez_Pasterski",
    category: "Boundary Correspondence",
    tier: "observer",
  },

  // ── Frontier Interface Signals ────────────────────────────

  {
    id: "salvatore-pais",
    name: "Salvatore Pais",
    role: "Aerospace engineer · Naval patent discourse · field propulsion concepts",
    signal:
      "Naval aerospace patent discourse around high-energy electromagnetic field propulsion, inertial mass reduction, and engineered spacetime analogies — a frontier interface between engineering language and effective-metric speculation. Included as a transport-field speculation interface, not as validated physics.",
    tags: [
      "frontier aerospace engineering",
      "electromagnetic field propulsion",
      "effective metric analogy",
      "transport-field speculation",
      "engineered spacetime language",
    ],
    href: "https://en.wikipedia.org/wiki/Salvatore_Pais",
    category: "Frontier Interface Signals",
    tier: "observer",
  },
  {
    id: "ashton-forbes",
    name: "Ashton Forbes",
    role: "Open-source anomaly analyst · visual synthesis · transport interpretation",
    signal:
      "Represents a contemporary public-facing anomaly-analysis culture where visual evidence, optical transport interpretation, aerospace speculation, and open-source investigation intersect. The observer-as-analyst stance and cross-disciplinary synthesis methodology resonate with xPRIMEray's own diagnostic interpretation approach. Included as a signal interpretation and modern anomaly investigation culture reference, not as endorsement of specific claims.",
    tags: [
      "signal interpretation",
      "observer analysis",
      "cross-disciplinary synthesis",
      "anomaly investigation culture",
      "open-source transport analysis",
    ],
    href: "https://www.youtube.com/@AshtonForbes",
    category: "Frontier Interface Signals",
    tier: "observer",
  },

  // ── Systems / Computation ─────────────────────────────────

  {
    id: "claude-shannon",
    name: "Claude Shannon",
    role: "Mathematician & electrical engineer (1916–2001)",
    signal:
      "Information is not meaning — but its mathematical structure underlies every signal, every compression, every communication channel. The diagnostic data the observatory emits is, at its foundation, a channel with capacity constraints.",
    tags: ["information theory", "entropy", "channel capacity", "signal structure"],
    href: "https://en.wikipedia.org/wiki/Claude_Shannon",
    category: "Systems / Computation",
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
    category: "Systems / Computation",
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
    category: "Systems / Computation",
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
    category: "Systems / Computation",
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
    category: "Systems / Computation",
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
    category: "Systems / Computation",
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
    category: "Systems / Computation",
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
    category: "Systems / Computation",
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
    category: "Systems / Computation",
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
    category: "Systems / Computation",
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
    category: "Systems / Computation",
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
    category: "Systems / Computation",
    tier: "observer",
  },

  // ── Cultural / Mythic Mirrors ─────────────────────────────

  {
    id: "etienne-boullee",
    name: "Étienne-Louis Boullée",
    role: "Visionary architect (1728–1799) · monumental observatory geometry",
    signal:
      "The Cenotaph for Newton offers a monumental language for spherical containment, interior infinity, and architectural silence. xPRIMEray's observatory seal and horizon-cut imagery borrow this feeling: a civilization-scale instrument confronting hidden structure inside a bounded sphere.",
    tags: [
      "Cenotaph for Newton",
      "spherical containment",
      "observatory architecture",
      "monumental institutional form",
      "infinity as interior",
      "civilizational scale",
    ],
    href: "https://en.wikipedia.org/wiki/%C3%89tienne-Louis_Boull%C3%A9e",
    category: "Cultural / Mythic Mirrors",
    tier: "mirror",
  },
  {
    id: "isaac-asimov",
    name: "Isaac Asimov",
    role: "Biochemist & science fiction author (1920–1992)",
    signal:
      "'That's funny…' — anomaly is the beginning of all discovery. Asimov's scientific imagination and insistence on accessible wonder set the tone for how the observatory communicates what it finds.",
    tags: ["scientific imagination", "curiosity as method", "accessible wonder", "interdisciplinary thought"],
    href: "https://en.wikipedia.org/wiki/Isaac_Asimov",
    category: "Cultural / Mythic Mirrors",
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
    category: "Cultural / Mythic Mirrors",
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
    category: "Cultural / Mythic Mirrors",
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
    category: "Cultural / Mythic Mirrors",
    tier: "mirror",
  },
];

// ── XenoCitation Data ─────────────────────────────────────
// CANONICAL ORDER — do not reorder without updating this comment.
// Master hierarchy: Foundational Optical Transport (Maxwell) →
// Differential Geometry (Gauss/Riemann) → Hamiltonian Transport (Hamilton) →
// Gordon Metric (effective optical metric, 1923) →
// Metric Relativity (MTW) → Observer Geometry (Penrose) → Symmetry (Noether) →
// Multi-Path Intuition (Feynman) → Temporal Instrumentation (Bandyopadhyay) →
// Boundary Correspondence (Pasterski) → Frontier Interface (Pais, Forbes)

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
  // xc-001 — Foundational Optical Transport
  {
    id: "xc-001",
    name: "James Clerk Maxwell",
    era: "1831 – 1879",
    coreIdea:
      "GRIN optics and the wave theory of light: the refractive index as a continuous field governing ray trajectories through gradient media. Maxwell's fish-eye lens is the conceptual ancestor of every curved-transport renderer that treats the medium itself as the geometry.",
    xprimerayResonance:
      "Directly inspired the GRIN field rendering pipeline — curved transport through gradient-index media is the computational descendant of Maxwell's fish-eye lens. The refractive index field is the field xPRIMEray navigates.",
    feature: "GRINFieldRenderer · LuxCoreGRIN · CurvedFieldTraversal",
    motifLabel: "GRIN Optics",
    href: "https://AetherTopologist.github.io/GD_xPRIMEray/FEATURE_INDEX/",
    complete: true,
  },
  // xc-002 — Differential Geometry & Curvature
  {
    id: "xc-002",
    name: "Gauss & Riemann",
    era: "19th century",
    coreIdea:
      "Differential geometry of curved surfaces: intrinsic curvature, geodesics, and the metric tensor as descriptors of space itself rather than as coordinate impositions.",
    xprimerayResonance:
      "The curved null-geodesic traversal at the heart of xPRIMEray follows paths that Gauss and Riemann first gave language to. Each ray is a geodesic through a field-warped medium.",
    feature: "CurvedFieldTraversal · GeodesicPath",
    motifLabel: "Differential Geometry",
    href: "https://AetherTopologist.github.io/GD_xPRIMEray/FEATURE_INDEX/",
    complete: false,
  },
  // xc-003 — Hamiltonian / Quaternion Transport
  {
    id: "xc-003",
    name: "William Rowan Hamilton",
    era: "1805 – 1865",
    coreIdea:
      "Hamiltonian optics reformulates ray propagation as a phase-space flow — position plus direction as the fundamental state, governed by the optical Hamiltonian through a medium.",
    xprimerayResonance:
      "Phase-space transport intuition underpins xPRIMEray's traversal model: each ray state is position plus direction, propagated through the field's Hamiltonian structure. Quaternion algebra also informs orientation handling in curved traversal.",
    feature: "PhaseSpaceTransport · CurvedFieldTraversal",
    motifLabel: "Hamiltonian / Quaternion Transport",
    href: "https://AetherTopologist.github.io/GD_xPRIMEray/FEATURE_INDEX/",
    complete: false,
  },
  // xc-004 — Effective Optical Metric / GRIN Analogy
  {
    id: "xc-004",
    name: "Gordon Metric",
    era: "1923 · Walter Gordon",
    coreIdea:
      "The Gordon metric formalizes the equivalence between light propagation in a dielectric medium and geodesic motion in an effective curved spacetime: the refractive index field directly defines the metric tensor for photon trajectories.",
    xprimerayResonance:
      "This is the direct mathematical foundation for xPRIMEray's GRIN field rendering: every curved ray in a gradient-index medium is a geodesic through the Gordon effective metric. The refractive index field is not just an optical property — it is the curvature geometry xPRIMEray navigates.",
    feature: "GRINFieldRenderer · EffectiveMetricTransport · CurvedFieldTraversal",
    motifLabel: "Effective Optical Metric",
    href: "https://en.wikipedia.org/wiki/Gordon_metric",
    complete: false,
  },
  // xc-005 — Metric Relativity Language
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
  // xc-006 — Observer Geometry & Causal Structure
  {
    id: "xc-006",
    name: "Roger Penrose",
    era: "1931 – present",
    coreIdea:
      "Null geodesics, Penrose diagrams, and twistor geometry articulate the causal architecture of spacetime — the conformal boundary, the light cone, the optical path as fundamental datum.",
    xprimerayResonance:
      "Transport ownership maps and curved traversal diagnostics resonate with Penrose-style optical geometry: the path is not just a line, but a statement about the field it crosses. Observer geometry and causal structure inform how xPRIMEray assigns boundary ownership.",
    feature: "TransportOwnershipOverlay · CausalStructureDiagnostics",
    motifLabel: "Observer Geometry",
    href: "https://AetherTopologist.github.io/GD_xPRIMEray/FEATURE_INDEX/",
    complete: false,
  },
  // xc-007 — Symmetry & Invariants
  {
    id: "xc-007",
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
  // xc-008 — Multi-Path / Quantum Transport Intuition
  {
    id: "xc-008",
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
  // xc-009 — Temporal Instrumentation & Nanobrain
  {
    id: "xc-009",
    name: "Anirban Bandyopadhyay",
    era: "present",
    coreIdea:
      "Nanobrain, time crystal instrumentation, and Geometric Music Language frame the observer as a temporal analyzer: structure is sampled through precision, rhythm, and coherent measurement rather than merely seen.",
    xprimerayResonance:
      "xPRIMEray borrows this instrumentation metaphor: each diagnostic frame becomes a sampled transport field, each pixel a possible time-series witness to hidden curvature structure. Treated as research-facing aesthetic and instrumentation inspiration, not as a proven framework.",
    feature: "TemporalFieldSampling · DiagnosticInstrumentationModel",
    motifLabel: "Temporal Instrumentation",
    href: "https://AetherTopologist.github.io/GD_xPRIMEray/FEATURE_INDEX/",
    complete: false,
  },
  // xc-010 — Boundary Correspondence / Celestial Holography
  {
    id: "xc-010",
    name: "Sabrina Pasterski",
    era: "2010s – present",
    coreIdea:
      "Celestial holography and soft theorems — the mathematical structure linking asymptotic symmetries of spacetime to memory effects in gravitational radiation.",
    xprimerayResonance:
      "The observatory's transport ownership mapping resonates with Pasterski's celestial sphere framing: every ray path carries a latent topology, and the boundary of the transport field is where geometry speaks most clearly.",
    feature: "CelestialHolographyInspiration · TransportOwnershipOverlay",
    motifLabel: "Celestial Holography",
    href: "https://AetherTopologist.github.io/GD_xPRIMEray/FEATURE_INDEX/",
    complete: false,
  },
  // xc-011 — Frontier Interface: Field Propulsion Discourse
  {
    id: "xc-011",
    name: "Salvatore Pais",
    era: "1990s – present",
    coreIdea:
      "Naval aerospace patent discourse around high-energy electromagnetic field propulsion, inertial mass reduction, and engineered spacetime analogies — a frontier interface between engineering specification language and effective-metric speculation.",
    xprimerayResonance:
      "Resonates as a frontier aerospace engineering language reference: the conceptual framing of rotating electromagnetic fields and high-energy density regions as transport-field analogues maps loosely onto xPRIMEray's curved-transport vocabulary. Included as a transport-field speculation interface, not as validated physics.",
    feature: "FrontierAerospaceLanguage · TransportFieldSpeculation",
    motifLabel: "Field Propulsion Discourse",
    href: "https://en.wikipedia.org/wiki/Salvatore_Pais",
    complete: false,
  },
  // xc-012 — Frontier Interface: Anomaly Investigation Culture
  {
    id: "xc-012",
    name: "Ashton Forbes",
    era: "2010s – present",
    coreIdea:
      "Open-source anomaly analysis and cross-disciplinary visual synthesis: a contemporary public-facing investigation culture where optical transport interpretation, aerospace speculation, and observer analysis intersect without institutional gatekeeping.",
    xprimerayResonance:
      "Resonates as a model of modern anomaly investigation culture — the observer-as-analyst stance, the application of optical transport intuition to visual evidence, and the open synthesis methodology mirror how xPRIMEray approaches its own diagnostic interpretation. Included as a signal interpretation reference, not as endorsement of specific claims.",
    feature: "ObserverAnalysisModel · OpenSourceSynthesis",
    motifLabel: "Anomaly Investigation Culture",
    href: "https://www.youtube.com/@AshtonForbes",
    complete: false,
  },
];

// ── Category filter order — mirrors the master lineage hierarchy ──

const SIGNAL_CATEGORIES = [
  "All",
  "Foundational Optical Transport",
  "Differential Geometry & Curvature",
  "Hamiltonian / Quaternion Transport",
  "Metric Relativity Language",
  "Observer Geometry & Causal Structure",
  "Symmetry & Invariants",
  "Multi-Path / Quantum Transport Intuition",
  "Temporal Instrumentation & Nanobrain",
  "Boundary Correspondence",
  "Frontier Interface Signals",
  "Systems / Computation",
  "Cultural / Mythic Mirrors",
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
        <p className="mt-2 max-w-2xl text-xs italic text-muted-foreground/40">
          The sequence begins with established optical-transport and geometric foundations, then
          moves outward toward instrumentation, correspondence frameworks, and boundary correspondence.
        </p>
        <p className="mt-3 max-w-2xl rounded-sm border border-border/20 bg-secondary/15 px-3 py-2 text-xs italic text-muted-foreground/40">
          Frontier-interface entries (xc-011, xc-012) represent contemporary aerospace discourse
          and anomaly-analysis culture. Inclusion reflects conceptual resonance and public
          transport-language investigation — not endorsement or validation of extraordinary claims.
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
              {card.id.toUpperCase()} · Foundational Link
            </span>
          ) : (
            <span className="mb-2 inline-block font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground/40">
              {card.id.toUpperCase()} · Resonance Note
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
          xPRIMEray draws conceptual lineage from mathematical physics, instrumentation, and
          observatory architecture — not as endorsement or claimed derivation, but as resonance.
          These observers shaped the visual, mathematical, and instrumental vocabulary through which
          the observatory interprets transport structure.
        </p>
        <p className="mt-1 max-w-2xl text-xs text-muted-foreground/55">
          "Inspired by" and "resonates with" — not "proves" or "derives from."
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

        {active === "Frontier Interface Signals" && (
          <p className="mt-4 max-w-2xl rounded-sm border border-border/20 bg-secondary/15 px-3 py-2 text-xs italic text-muted-foreground/40">
            These frontier-interface entries represent contemporary aerospace discourse and
            anomaly-analysis culture. Inclusion reflects conceptual resonance and public
            transport-language investigation, not endorsement or validation of extraordinary claims.
          </p>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((node) => (
            <InspirationCard key={node.id} node={node} />
          ))}
        </div>
      </div>
    </section>
  );
}
