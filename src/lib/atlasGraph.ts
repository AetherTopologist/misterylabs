/**
 * Atlas Graph Data Layer
 * 
 * Unified data model for the new primary xPRIMEray Observatory Atlas visualization.
 * Designed for react-force-graph-3d with a cosmic, glowing, personal aesthetic.
 * 
 * Strongly references the visual language of the provided screenshot reference:
 * - Central prominent glowing xPRIMEray node as the point of elegant convergence
 * - Personal resonance "primaries" (especially Bell Labs as the Engineering Cathedral)
 * - Thinkers, concepts, and personal seeds orbiting with glowing connections
 * - Living, mysterious, high-end research / observatory feel
 */

import { INSPIRATIONS } from "../pages/Atlas"; // existing data source
import type { InspirationNode } from "../pages/Atlas";

// ── New Tier System (as requested) ─────────────────────────────
export type AtlasGraphTier =
  | "core"                    // The central xPRIMEray observatory node
  | "primary-signal"          // The strongest living signals (e.g. Bandyopadhyay)
  | "technical-lineage"       // Mathematical / physical foundations
  | "visual-inspiration"      // Rendering, graphics, visual thinking
  | "mythic-symbol"           // Cultural, cinematic, philosophical mirrors
  | "personal-resonance";     // Founder's personal journey nodes (Quake, Bell, NASA, etc.)

// ── Graph Node for Force Graph ────────────────────────────────
export interface AtlasGraphNode {
  id: string;
  name: string;
  tier: AtlasGraphTier;
  description: string;           // Main body text (from signal / coreIdea)
  whyItMatters?: string;         // Curated insight for the side panel
  influencedXPRIME?: string;     // Direct influence on the observatory
  tags: string[];
  href?: string;
  // Visual / physics hints for react-force-graph
  val?: number;                  // Node size (higher = more important / larger orb)
  group?: number;                // Optional clustering hint
}

// ── Graph Link ─────────────────────────────────────────────────
export interface AtlasGraphLink {
  source: string;
  target: string;
  relation?: string;             // "inspired", "formal ancestor", "personal seed", "resonance"
  strength?: number;
}

// ── Central Core Node ──────────────────────────────────────────
export const CORE_NODE: AtlasGraphNode = {
  id: "xprime",
  name: "xPRIMEray",
  tier: "core",
  description:
    "Curved Transport Observatory — a living research harness exploring transport topology, curved-field traversal, convergence behavior, and diagnostic observability through gradient-index media.",
  whyItMatters:
    "The convergence point. Every personal resonance, technical lineage, and mythic mirror ultimately feeds the question: how does structure reveal itself when light no longer travels straight?",
  influencedXPRIME: "Everything.",
  tags: ["curved transport", "observatory", "diagnostics", "GRIN", "topology"],
  val: 8,
};

// ── Personal Resonance Nodes (founder's journey) ───────────────
// These are the heart of the "personal" feeling in the reference screenshot.
// Bell Labs is explicitly treated as the Engineering Cathedral.
export const PERSONAL_RESONANCE_NODES: AtlasGraphNode[] = [
  {
    id: "bell-labs",
    name: "Bell Labs",
    tier: "personal-resonance",
    description:
      "A cathedral of interdisciplinary instrumentation. Where signal theory, observability, and scientific visualization were treated as sacred craft. The spiritual and practical ancestor of the observatory mindset.",
    whyItMatters:
      "The archetype of the 'engineering cathedral' — rigorous, playful, cross-disciplinary, and obsessed with making the invisible legible. The direct inspiration for calling xPRIMEray an observatory.",
    influencedXPRIME:
      "Telemetry architecture, convergence diagnostics, diagnostic quad panels, the entire 'observatory' framing and instrumentation culture.",
    tags: ["engineering cathedral", "signal theory", "observability", "instrumentation"],
    val: 5,
  },
  {
    id: "quake3",
    name: "Quake III Arena",
    tier: "personal-resonance",
    description:
      "The first real social engine of speed. Railguns, BSP traversal, prediction, and observer-relative space taught spatial intuition at inhuman velocity.",
    whyItMatters:
      "Trained an entire generation of minds in real-time spatial reasoning, topology under pressure, and the feeling of being inside a living, reacting world.",
    influencedXPRIME:
      "Transport island detection, observer-relative coordinate framing, the visceral understanding of movement through complex space.",
    tags: ["spatial intuition", "BSP", "prediction", "arena topology"],
    val: 4,
  },
  {
    id: "three-blue-one-brown",
    name: "Grant Sanderson (3Blue1Brown)",
    tier: "personal-resonance",
    description:
      "Stereographic projection, topology, and dimensional intuition rendered with such clarity that mathematics becomes a felt sense.",
    whyItMatters:
      "Demonstrated that the highest level of mathematical beauty can be made viscerally understandable. A model for how the observatory should communicate curvature and transport.",
    influencedXPRIME:
      "Curved field visualization language, dimensional projection thinking, and the belief that elegant visuals can carry deep understanding.",
    href: "https://www.youtube.com/@3blue1brown",
    val: 4,
  },
  {
    id: "nasa-apollo",
    name: "Apollo / NASA",
    tier: "personal-resonance",
    description:
      "Mission control rituals, black-sky instrumentation, and the engineering courage to send signals into nothing and read what comes back.",
    whyItMatters:
      "The gold standard of diagnostic culture under extreme uncertainty. Every pixel and every packet mattered.",
    influencedXPRIME:
      "Field validation philosophy, diagnostic instrumentation rigor, and the aesthetic of serious remote observation.",
    val: 4,
  },
  {
    id: "interstellar",
    name: "Interstellar (Gargantua)",
    tier: "personal-resonance",
    description:
      "Curved spacetime as cinema. Black hole lensing, temporal perception, and the cosmology of love rendered as physical phenomena.",
    whyItMatters:
      "Made the emotional and visual weight of extreme curvature unforgettable. Showed that transport distortion can carry profound human meaning.",
    influencedXPRIME:
      "Null geodesic rendering, the visual language of gravitational lensing, and the emotional register of curved transport.",
    val: 4,
  },
];

// ── Mapping function from existing INSPIRATIONS ────────────────
function mapInspirationToGraphNode(node: InspirationNode): AtlasGraphNode {
  let tier: AtlasGraphTier;

  switch (node.tier) {
    case "primary":
      tier = "primary-signal";
      break;
    case "foundational":
      tier = "technical-lineage";
      break;
    case "observer":
      // Rough heuristic — can be refined
      if (node.category.includes("Visual") || node.name.includes("Carmack") || node.name.includes("Quilez") || node.name.includes("Perlin")) {
        tier = "visual-inspiration";
      } else if (node.category.includes("Cultural") || node.category.includes("Mythic")) {
        tier = "mythic-symbol";
      } else {
        tier = "technical-lineage";
      }
      break;
    case "mirror":
      tier = "mythic-symbol";
      break;
    default:
      tier = "technical-lineage";
  }

  return {
    id: node.id,
    name: node.name,
    tier,
    description: node.signal,
    whyItMatters: undefined, // populated manually or via curation pass
    influencedXPRIME: undefined,
    tags: node.tags,
    href: node.href,
    val: node.tier === "primary" ? 4 : node.tier === "foundational" ? 3.5 : 2.5,
  };
}

// ── Initial Graph Data Builder ─────────────────────────────────
export function getAtlasGraphData() {
  const nodes: AtlasGraphNode[] = [CORE_NODE, ...PERSONAL_RESONANCE_NODES];

  // Add mapped inspirations (we can filter or dedupe later)
  const mapped = INSPIRATIONS.map(mapInspirationToGraphNode);
  nodes.push(...mapped);

  // ── Seed Links (elegant convergence into xPRIMEray) ─────────
  const links: AtlasGraphLink[] = [];

  // Everything converges on the core
  nodes.forEach((n) => {
    if (n.id !== "xprime") {
      links.push({
        source: n.id,
        target: "xprime",
        relation: "resonance",
        strength: n.tier === "personal-resonance" ? 1.2 : 0.8,
      });
    }
  });

  // Strong personal resonance connections (Bell Labs especially prominent)
  links.push(
    { source: "bell-labs", target: "xprime", relation: "personal seed", strength: 2 },
    { source: "quake3", target: "xprime", relation: "personal seed", strength: 1.5 },
    { source: "three-blue-one-brown", target: "xprime", relation: "personal seed", strength: 1.5 },
    { source: "nasa-apollo", target: "xprime", relation: "personal seed", strength: 1.3 },
    { source: "interstellar", target: "xprime", relation: "personal seed", strength: 1.3 }
  );

  // Example technical lineage connections (can be greatly expanded)
  links.push(
    { source: "james-clerk-maxwell", target: "xprime", relation: "formal ancestor", strength: 1.8 },
    { source: "gauss-riemann", target: "xprime", relation: "formal ancestor", strength: 1.6 },
    { source: "gordon-metric", target: "xprime", relation: "formal ancestor", strength: 1.7 }
  );

  // Deduplicate links
  const uniqueLinks = Array.from(
    new Map(links.map((l) => [`${l.source}->${l.target}`, l])).values()
  );

  return { nodes, links: uniqueLinks };
}

export const ATLAS_GRAPH_TIERS: Record<AtlasGraphTier, { label: string; color: string }> = {
  core: { label: "The Observatory", color: "#67e8f9" },           // bright cyan
  "primary-signal": { label: "Primary Signal", color: "#fbbf24" }, // amber
  "technical-lineage": { label: "Technical Lineage", color: "#67e8f9" },
  "visual-inspiration": { label: "Visual Inspiration", color: "#c084fc" },
  "mythic-symbol": { label: "Mythic Symbol", color: "#f472b6" },
  "personal-resonance": { label: "Personal Resonance", color: "#a5f3fc" }, // soft cyan-white
};
