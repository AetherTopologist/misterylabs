/**
 * PRIME / The Last Distance.
 *
 * A teaching ladder for one air gap between two surfaces.
 * Rates and the Zeno partition are illustrative. They are not a fit to a nerve,
 * and they are not a claim that matter fuses when the gap reaches zero.
 */

export const MACRO_GAP_M = 0.015;
export const LAST_DISTANCE_M = 238e-6;
/** Local loading of roughness peaks. Above this, the corpuscles stay quiet. */
export const INDENT_GAP_M = 1e-6;

export type BoundaryId =
  | "embodiment"
  | "proprioception"
  | "electromagnetic"
  | "deformation"
  | "transduction"
  | "perception";

export type Milestone = {
  id: string;
  kicker: string;
  title: string;
  meters: number;
  layer: BoundaryId;
  /** What this frame is allowed to say. */
  note: string;
};

export const MILESTONES: readonly Milestone[] = [
  {
    id: "witness",
    kicker: "WITNESS",
    title: "The blessing hand",
    meters: 2.4,
    layer: "embodiment",
    note: "You are in front of a sculpture. Seeing it is not touching it.",
  },
  {
    id: "reach",
    kicker: "REACH",
    title: "A hand’s reach",
    meters: 0.2,
    layer: "proprioception",
    note: "Your arm can report where it is. That report is not contact with the marble.",
  },
  {
    id: "macro",
    kicker: "MACRO",
    title: "Approaching fingertips",
    meters: MACRO_GAP_M,
    layer: "embodiment",
    note: "1.50 cm of air. Vision resolves the gap. Skin is not indented.",
  },
  {
    id: "ridge",
    kicker: "RIDGE",
    title: "One epidermal ridge",
    meters: 5e-4,
    layer: "embodiment",
    note: "About 500 μm, the span of a fingerprint ridge. Still an open gap.",
  },
  {
    id: "last",
    kicker: "MESO",
    title: "The Last Distance",
    meters: LAST_DISTANCE_M,
    layer: "electromagnetic",
    note: "238 μm. The gap is still air. No mechanoreceptor has been loaded by this approach.",
  },
  {
    id: "cell",
    kicker: "CELL",
    title: "A cell’s width",
    meters: 1e-5,
    layer: "electromagnetic",
    note: "10 μm. Electrostatic and capillary forces can tug on asperities. A tug is not a percept.",
  },
  {
    id: "asperity",
    kicker: "ASPERITY",
    title: "Roughness meets",
    meters: INDENT_GAP_M,
    layer: "deformation",
    note: "1 μm. Peaks begin to load. Deformation is local. The corpuscles can be asked from here.",
  },
  {
    id: "film",
    kicker: "FILM",
    title: "The surface film",
    meters: 1e-8,
    layer: "electromagnetic",
    note: "10 nm of adsorbed water and oil. What people call contact is still a force across a gap.",
  },
  {
    id: "cloud",
    kicker: "CLOUD",
    title: "Electron clouds",
    meters: 1e-9,
    layer: "electromagnetic",
    note: "1 nm. Van der Waals attraction and the start of overlap repulsion. Atoms do not share one place.",
  },
  {
    id: "wall",
    kicker: "WALL",
    title: "The repulsion wall",
    meters: 3e-10,
    layer: "deformation",
    note: "0.3 nm, a bond-length scale. Further approach compresses electron clouds and then tissue. Compression is not yet an experience.",
  },
] as const;

export type Boundary = {
  id: BoundaryId;
  title: string;
  body: string;
};

export const BOUNDARIES: readonly Boundary[] = [
  {
    id: "embodiment",
    title: "Embodiment",
    body: "The body is present in front of the work. Presence is not a measurement of the gap, and it is not a receptor spike.",
  },
  {
    id: "electromagnetic",
    title: "Electromagnetic contact",
    body: "Charge, the Pauli repulsion of electron clouds, van der Waals forces, and capillary bridges. These are forces. They are not the feeling of touch.",
  },
  {
    id: "deformation",
    title: "Mechanical deformation",
    body: "Skin and asperities strain after those forces load the tissue. Strain is a change of shape. It is not a nerve impulse.",
  },
  {
    id: "transduction",
    title: "Sensory transduction",
    body: "Merkel, Meissner, Pacinian, and Ruffini endings can turn strain or vibration into spikes. A spike is not the experience, and this ride’s curves are not a recording.",
  },
  {
    id: "proprioception",
    title: "Proprioception",
    body: "Where the finger is, from joints, muscles, and skin stretch. Ruffini endings contribute at the skin. They are not the whole of position sense, and this ride does not stretch the skin.",
  },
  {
    id: "perception",
    title: "Perception",
    body: "The nervous system constructs “I am touching.” That construction is not the force, not the dent, and not the spike train shown here.",
  },
];

export const RECEPTORS = ["merkel", "meissner", "pacinian", "ruffini"] as const;
export type ReceptorId = (typeof RECEPTORS)[number];

export type ReceptorCard = {
  id: ReceptorId;
  name: string;
  adapt: string;
  prefers: string;
  limit: string;
};

export const RECEPTOR_CARDS: readonly ReceptorCard[] = [
  {
    id: "merkel",
    name: "Merkel",
    adapt: "Slow",
    prefers: "Sustained pressure and edges",
    limit: "A steady poke. Not flutter, and not the feeling itself.",
  },
  {
    id: "meissner",
    name: "Meissner",
    adapt: "Fast",
    prefers: "Light flutter, near 30–50 Hz",
    limit: "Change in the skin. Silent when nothing is moving.",
  },
  {
    id: "pacinian",
    name: "Pacinian",
    adapt: "Very fast",
    prefers: "High-frequency vibration, near 200–300 Hz",
    limit: "Deep, brief vibration. A poor answer to a slow press.",
  },
  {
    id: "ruffini",
    name: "Ruffini",
    adapt: "Slow",
    prefers: "Skin stretch",
    limit: "This control is pressure, not stretch. The rate stays modest on purpose.",
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const LOG_START = Math.log(MILESTONES[0].meters);
const LOG_END = Math.log(MILESTONES[MILESTONES.length - 1].meters);

/** Continuous log descent. t = 0 is the sculpture. t = 1 is the repulsion wall. */
export function gapAt(t: number) {
  const u = clamp(t, 0, 1);
  return Math.exp(LOG_START + (LOG_END - LOG_START) * u);
}

export function journeyTFor(meters: number) {
  return clamp((Math.log(meters) - LOG_START) / (LOG_END - LOG_START), 0, 1);
}

export function nearestMilestone(meters: number) {
  let best: Milestone = MILESTONES[0];
  let score = Infinity;
  for (const milestone of MILESTONES) {
    const next = Math.abs(Math.log(milestone.meters) - Math.log(meters));
    if (next < score) {
      best = milestone;
      score = next;
    }
  }
  return best;
}

export function indented(meters: number) {
  return meters <= INDENT_GAP_M * 1.001;
}

function gauss(frequency: number, center: number, width: number) {
  const z = (frequency - center) / width;
  return Math.exp(-0.5 * z * z);
}

/**
 * Illustrative spikes per second.
 * Zero until the gap is small enough to load the skin.
 */
export function firingRate(id: ReceptorId, pressure: number, frequencyHz: number, isIndented: boolean) {
  if (!isIndented) return 0;
  const p = clamp(pressure, 0, 1);
  const f = Math.max(0, frequencyHz);
  if (p <= 0) return 0;
  switch (id) {
    case "merkel":
      return 80 * p * Math.exp(-((f / 12) ** 2));
    case "meissner":
      return 90 * p * gauss(f, 40, 16);
    case "pacinian":
      return 110 * Math.max(0, p - 0.05) * gauss(f, 250, 55);
    case "ruffini":
      return 28 * p * Math.exp(-((f / 6) ** 2));
    default:
      return 0;
  }
}

export function dominantReceptor(pressure: number, frequencyHz: number, isIndented: boolean): ReceptorId | null {
  let best: ReceptorId | null = null;
  let rate = 1;
  for (const id of RECEPTORS) {
    const next = firingRate(id, pressure, frequencyHz, isIndented);
    if (next > rate) {
      best = id;
      rate = next;
    }
  }
  return best;
}

/** Infinite halving still arrives. The sum of the series is the finite gap. */
export function zenoPartition(gap: number, steps: number) {
  const n = Math.max(0, Math.min(48, Math.floor(steps)));
  const remainder = gap * 2 ** -n;
  const traveled = gap - remainder;
  return { steps: n, traveled, remainder, finite: gap };
}

export function formatGap(meters: number) {
  if (Math.abs(meters - MACRO_GAP_M) / MACRO_GAP_M < 1e-6) return "1.50 cm";
  if (Math.abs(meters - LAST_DISTANCE_M) / LAST_DISTANCE_M < 1e-6) return "238 μm";
  const abs = Math.abs(meters);
  const trim = (value: number, digits: number) => {
    const text = value.toFixed(digits);
    return text.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
  };
  if (abs >= 1) return `${trim(abs, 2)} m`;
  if (abs >= 1e-2) return `${trim(abs * 100, 2)} cm`;
  if (abs >= 1e-3) return `${trim(abs * 1e3, 2)} mm`;
  if (abs >= 1e-6) return `${trim(abs * 1e6, 0)} μm`;
  if (abs >= 1e-9) return `${trim(abs * 1e9, 2)} nm`;
  return `${trim(abs * 1e12, 0)} pm`;
}

export function hapticPattern(id: ReceptorId): number | number[] {
  switch (id) {
    case "merkel":
      return 18;
    case "meissner":
      return [12, 18, 12, 18, 12];
    case "pacinian":
      return [6, 8, 6, 8, 6, 8, 6];
    case "ruffini":
      return 42;
    default:
      return 0;
  }
}

export type HapticResult = "off" | "unavailable" | "sent";

export function pulseHaptic(
  id: ReceptorId,
  enabled: boolean,
  vibrate?: (pattern: number | number[]) => boolean,
): HapticResult {
  if (!enabled) return "off";
  const send =
    vibrate ??
    (typeof navigator !== "undefined" && typeof navigator.vibrate === "function"
      ? navigator.vibrate.bind(navigator)
      : null);
  if (!send) return "unavailable";
  const ok = send(hapticPattern(id));
  return ok === false ? "unavailable" : "sent";
}

export function boundaryById(id: BoundaryId) {
  const found = BOUNDARIES.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown boundary ${id}`);
  return found;
}
