/** Schematic of Holt, NASA-TM-80961 (1979). Not an MHD solver. */

export type SourceMode = "lasers" | "orbs";

export type Station = {
  id: string;
  name: string;
  kicker: string;
  megagauss: number;
  hertz: number;
  kind: "observed" | "illustration";
  line: string;
};

export const STATIONS: Station[] = [
  {
    id: "flare",
    name: "Solar flare",
    kicker: "2.5 kG · observed",
    megagauss: 0.0025,
    hertz: 0.4,
    kind: "observed",
    line: "Holt’s Figure 1 in the Sun. Antiparallel spot fields merge. He thought some flares released too much energy for merging alone.",
  },
  {
    id: "sheath",
    name: "Magnetopause",
    kicker: "Figure 2 · substorm",
    megagauss: 0.55,
    hertz: 0.75,
    kind: "illustration",
    line: "The same merge, solar wind against Earth’s field. Still not the spacecraft.",
  },
  {
    id: "vii",
    name: "Harmonic VII",
    kicker: "near point · illustration",
    megagauss: 1.6,
    hertz: 1.35,
    kind: "illustration",
    line: "A teaching station on Holt’s dial. Match megagauss and pulse rate. Nothing flies across the gap.",
  },
  {
    id: "xii",
    name: "Harmonic XII",
    kicker: "distant point · illustration",
    megagauss: 3.4,
    hertz: 2.05,
    kind: "illustration",
    line: "Farther harmonic. The vehicle has no trajectory. The pattern matches, or it does not.",
  },
  {
    id: "xviii",
    name: "Harmonic XVIII",
    kicker: "far point · illustration",
    megagauss: 6.5,
    hertz: 2.75,
    kind: "illustration",
    line: "Top of the teaching scale. In the memo, pulsed lasers would be carrying this strength.",
  },
];

export const MG_MIN = 0.002;
export const MG_MAX = 8;
export const HZ_MIN = 0.2;
export const HZ_MAX = 3.2;

const LOG_MIN = Math.log10(MG_MIN);
const LOG_MAX = Math.log10(MG_MAX);

export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export function mgToPos(mg: number) {
  return clamp((Math.log10(mg) - LOG_MIN) / (LOG_MAX - LOG_MIN), 0, 1);
}

export function posToMg(t: number) {
  return 10 ** (LOG_MIN + clamp(t, 0, 1) * (LOG_MAX - LOG_MIN));
}

export function hzToPos(hz: number) {
  return clamp((hz - HZ_MIN) / (HZ_MAX - HZ_MIN), 0, 1);
}

export function posToHz(t: number) {
  return HZ_MIN + clamp(t, 0, 1) * (HZ_MAX - HZ_MIN);
}

/** ± about 15% in B, ±0.12 Hz. Wide enough for a thumb, still a real match. */
export function matchOf(mg: number, hz: number, station: Station) {
  const dB = Math.abs(Math.log10(mg / station.megagauss));
  const dF = Math.abs(hz - station.hertz);
  const bOk = dB < 0.06;
  const fOk = dF < 0.12;
  return { dB, dF, bOk, fOk, locked: bOk && fOk };
}

export function mgBand(station: Station) {
  const lo = mgToPos(station.megagauss / 10 ** 0.06);
  const hi = mgToPos(station.megagauss * 10 ** 0.06);
  return { lo, hi };
}

export function hzBand(station: Station) {
  const lo = hzToPos(station.hertz - 0.12);
  const hi = hzToPos(station.hertz + 0.12);
  return { lo, hi };
}

export function formatField(mg: number) {
  if (mg < 0.1) {
    const kg = mg * 1e3;
    return `${kg < 10 ? kg.toFixed(1) : Math.round(kg)} kG`;
  }
  return `${mg.toFixed(2)} MG`;
}

export function formatGauss(mg: number) {
  const g = mg * 1e6;
  if (g < 1e4) return `${Math.round(g).toLocaleString("en-US")} G`;
  return `${g.toExponential(2)} G`;
}

function snapCurve(x: number) {
  const t = clamp((x - 0.62) / 0.22, 0, 1);
  return t * t * (3 - 2 * t);
}

export type Wave = {
  epsilon: number;
  ox: number;
  left: number;
  right: number;
};

/** Free run: the merge site walks with sin(2πft). The X opens only near each extreme — the snap. */
export function waveAt(time: number, pulseHz: number, amplitude: number): Wave {
  const s = Math.sin(2 * Math.PI * pulseHz * time);
  const mag = Math.abs(s);
  const epsilon = 0.1 + 0.9 * snapCurve(mag);
  return {
    epsilon,
    ox: amplitude * 0.78 * s,
    left: s < 0 ? Math.pow(mag, 0.55) : 0.08,
    right: s > 0 ? Math.pow(mag, 0.55) : 0.08,
  };
}

/** One teaching snap: site walks from the left laser set to the right while ε opens and closes. */
export function waveSnap(u: number, amplitude: number): Wave {
  const t = clamp(u, 0, 1);
  const env = Math.sin(Math.PI * t);
  const epsilon = 0.1 + 0.9 * Math.pow(env, 0.72);
  const walk = -1 + 2 * t;
  const side = clamp(walk, -1, 1);
  return {
    epsilon,
    ox: amplitude * 0.78 * walk,
    left: clamp(0.15 + (side < 0 ? -side : 0) * (0.2 + 0.8 * env), 0, 1),
    right: clamp(0.15 + (side > 0 ? side : 0) * (0.2 + 0.8 * env), 0, 1),
  };
}

export function phaseName(epsilon: number) {
  if (epsilon < 0.22) return "Antiparallel";
  if (epsilon < 0.48) return "X-point";
  if (epsilon < 0.78) return "Snap";
  return "Expel";
}

export function visualGain(mg: number) {
  const t = (Math.log10(mg) - LOG_MIN) / (LOG_MAX - LOG_MIN);
  return 0.28 + 0.72 * clamp(t, 0, 1);
}

export function stationIndexFromAngle(angle: number) {
  const fromTopCW = (Math.PI / 2 - angle + Math.PI * 2) % (Math.PI * 2);
  const n = STATIONS.length;
  return Math.round(fromTopCW / (Math.PI * 2) * n) % n;
}

export function angleFromStation(index: number) {
  const n = STATIONS.length;
  const fromTopCW = (index / n) * Math.PI * 2;
  return (Math.PI / 2 - fromTopCW + Math.PI * 2) % (Math.PI * 2);
}

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  kind: "flow" | "burst";
};

export function seedFlow(ox: number, rand: () => number): Particle {
  const top = rand() < 0.5;
  return {
    x: ox + (rand() - 0.5) * 1.5,
    y: top ? 1.02 : -1.02,
    vx: 0,
    vy: 0,
    life: 0.35 + rand() * 0.8,
    kind: "flow",
  };
}

export function burstFrom(ox: number, rand: () => number): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < 12; i++) {
    const dir = i < 6 ? 1 : -1;
    out.push({
      x: ox + dir * 0.03,
      y: (rand() - 0.5) * 0.1,
      vx: dir * (0.7 + rand() * 1.1),
      vy: (rand() - 0.5) * 0.28,
      life: 0.45 + rand() * 0.35,
      kind: "burst",
    });
  }
  return out;
}
