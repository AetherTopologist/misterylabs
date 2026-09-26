/** Source-locus pitch versus instantaneous Hertzian structure.
 *
 * Δz120 = Lrev / 3
 * Csweep = 2R / Δz120 = 6R / Lrev
 *
 * Csweep compares the formation diameter to the axial spacing of three
 * 120° emitter samples. It is a geometric sampling/overlap metric.
 * It is not a coherence threshold and it is not an input to Maxwell.
 *
 * The sweep places ideal ring sources and superposes the same Hertzian
 * dipoles used on the face. Past positions on a helix are not sources.
 * Mutual impedance is omitted. Illustrative, not a theorem.
 */

import type { Orient } from "./types.ts";
import { emagnitude, fieldAt, poynting, type Dipole, type Vec } from "./fields.ts";

const TAU = Math.PI * 2;
const RING_N = 16;

export type FacePlane = {
  e1x: number;
  e1y: number;
  e1z: number;
  e2x: number;
  e2y: number;
  e2z: number;
  nx: number;
  ny: number;
  nz: number;
};

export type SweepId = "one" | "two" | "three" | "scramble" | "locked";

export type SweepRow = {
  id: SweepId;
  label: string;
  n: number;
  phaseNote: string;
  pitch: number;
  cSweep: number;
  eCenter: number;
  eRms: number;
  contrast: number;
  sAxial: number;
};

export type SweepInput = {
  origin: Vec;
  plane: FacePlane;
  radius: number;
  freqHz: number;
  pAmp: number;
  orient: Orient;
  aimYawDeg: number;
  aimPitchDeg: number;
  lRev: number;
};

/** Axial spacing of three emitters equally phased around one revolution. */
export function triadPitch(lRev: number): number {
  if (!Number.isFinite(lRev) || lRev <= 0) return Number.POSITIVE_INFINITY;
  return lRev / 3;
}

/** Csweep = 2R / Δz = 6R / Lrev for the triad pitch. Not a coherence threshold. */
export function geometricSweep(radius: number, pitch: number): number {
  if (!Number.isFinite(pitch) || pitch <= 0 || !(radius > 0)) return Number.NaN;
  return (2 * radius) / pitch;
}

export function cSweepTriad(radius: number, lRev: number): number {
  return geometricSweep(radius, triadPitch(lRev));
}

const CASES: { id: SweepId; label: string; n: number; phaseNote: string; angles: number[]; phases: number[] }[] = [
  {
    id: "one",
    label: "One source",
    n: 1,
    phaseNote: "Single radiator. Pitch Lrev.",
    angles: [0],
    phases: [0],
  },
  {
    id: "two",
    label: "Two sources",
    n: 2,
    phaseNote: "180° apart, common phase. Pitch Lrev/2.",
    angles: [0, Math.PI],
    phases: [0, 0],
  },
  {
    id: "three",
    label: "Three sources",
    n: 3,
    phaseNote: "120° apart, common phase. Pitch Δz120.",
    angles: [0, TAU / 3, (2 * TAU) / 3],
    phases: [0, 0, 0],
  },
  {
    id: "scramble",
    label: "Three · scrambled",
    n: 3,
    phaseNote: "Same 120° seats. Fixed phases 0° / 47° / 212°. Not a new draw each frame.",
    angles: [0, TAU / 3, (2 * TAU) / 3],
    phases: [0, 0.82, 3.7],
  },
  {
    id: "locked",
    label: "Three · 120° lock",
    n: 3,
    phaseNote: "Same 120° seats. Phases 0° / 120° / 240°.",
    angles: [0, TAU / 3, (2 * TAU) / 3],
    phases: [0, TAU / 3, (2 * TAU) / 3],
  },
];

function aimVector(yawDeg: number, pitchDeg: number): Vec {
  const el = (pitchDeg * Math.PI) / 180;
  const az = (yawDeg * Math.PI) / 180;
  return {
    x: Math.cos(el) * Math.sin(az),
    y: Math.sin(el),
    z: Math.cos(el) * Math.cos(az),
  };
}

function place(origin: Vec, plane: FacePlane, angle: number, radius: number): Vec {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    x: origin.x + plane.e1x * c * radius + plane.e2x * s * radius,
    y: origin.y + plane.e1y * c * radius + plane.e2y * s * radius,
    z: origin.z + plane.e1z * c * radius + plane.e2z * s * radius,
  };
}

function orientation(orient: Orient, plane: FacePlane, radial: Vec, aim: Vec): Vec {
  if (orient === "aimed") return aim;
  if (orient === "radial") return radial;
  if (orient === "tangential") {
    const ux = plane.ny * radial.z - plane.nz * radial.y;
    const uy = plane.nz * radial.x - plane.nx * radial.z;
    const uz = plane.nx * radial.y - plane.ny * radial.x;
    const tl = Math.hypot(ux, uy, uz) || 1;
    return { x: ux / tl, y: uy / tl, z: uz / tl };
  }
  return { x: 0, y: 1, z: 0 };
}

function dipolesFor(
  input: SweepInput,
  angles: number[],
  phases: number[],
): Dipole[] {
  const aim = aimVector(input.aimYawDeg, input.aimPitchDeg);
  return angles.map((angle, i) => {
    const at = place(input.origin, input.plane, angle, input.radius);
    const rx = at.x - input.origin.x;
    const ry = at.y - input.origin.y;
    const rz = at.z - input.origin.z;
    const rl = Math.hypot(rx, ry, rz) || 1;
    const u = orientation(input.orient, input.plane, { x: rx / rl, y: ry / rl, z: rz / rl }, aim);
    return {
      x: at.x,
      y: at.y,
      z: at.z,
      ux: u.x,
      uy: u.y,
      uz: u.z,
      pAmp: input.pAmp,
      phase: phases[i] ?? 0,
      dark: !(input.pAmp > 0),
    };
  });
}

function faceMetrics(dips: Dipole[], input: SweepInput) {
  const eCenter = emagnitude(fieldAt(dips, input.origin, input.freqHz));
  const r = input.radius * 0.42;
  let sumE2 = 0;
  let eMax = 0;
  let eMin = Number.POSITIVE_INFINITY;
  let sSum = 0;
  for (let i = 0; i < RING_N; i++) {
    const a = (i / RING_N) * TAU;
    const p = place(input.origin, input.plane, a, r);
    const f = fieldAt(dips, p, input.freqHz);
    const e = emagnitude(f);
    sumE2 += e * e;
    if (e > eMax) eMax = e;
    if (e < eMin) eMin = e;
    const s = poynting(f);
    sSum += s.x * input.plane.nx + s.y * input.plane.ny + s.z * input.plane.nz;
  }
  const denom = eMax + eMin;
  return {
    eCenter,
    eRms: Math.sqrt(sumE2 / RING_N),
    contrast: denom > 0 ? (eMax - eMin) / denom : 0,
    sAxial: sSum / RING_N,
  };
}

function pitchFor(lRev: number, n: number): number {
  if (!Number.isFinite(lRev) || lRev <= 0 || !(n > 0)) return Number.POSITIVE_INFINITY;
  return lRev / n;
}

function stepSentence(name: string, a: number, b: number, c: number): string {
  const abs = [Math.abs(a), Math.abs(b), Math.abs(c)];
  if (abs.some((v) => !Number.isFinite(v))) return `${name} is undefined.`;
  const floor = Math.max(abs[0], abs[1], abs[2], 1e-30) * 1e-6;
  if (abs[0] <= floor && abs[1] <= floor && abs[2] <= floor) {
    return `${name} stays ~0 across one, two, and three sources.`;
  }
  const r12 = abs[1] / Math.max(abs[0], floor);
  const r23 = abs[2] / Math.max(abs[1], floor);
  const j12 = Math.abs(Math.log(r12));
  const j23 = Math.abs(Math.log(r23));
  const bigger = Math.max(j12, j23);
  const smaller = Math.min(j12, j23);
  const factors = `×${r12.toFixed(2)} from 1→2, then ×${r23.toFixed(2)} from 2→3`;
  if (bigger > Math.log(2.5) && bigger > smaller * 1.6 + 0.05) {
    const which = j23 > j12 ? "2→3" : "1→2";
    return `${name} changes more on the ${which} step (${factors}). Three source counts do not resolve a threshold.`;
  }
  return `${name} changes from sample to sample (${factors}), with no isolated jump and not as a step.`;
}

export function sweepVerdict(rows: SweepRow[], active: boolean): string {
  if (!active) {
    return "Delivered dipole moment is zero, so every Maxwell feature in this sweep is zero. There is nothing to compare until the reservoir can radiate.";
  }
  const [one, two, three, scramble, locked] = rows;
  if (!one || !two || !three || !scramble || !locked) return "Sweep incomplete.";
  const geom = [
    stepSentence("Center |E|", one.eCenter, two.eCenter, three.eCenter),
    stepSentence("Inner-ring contrast", one.contrast, two.contrast, three.contrast),
    stepSentence("|axial ⟨S⟩|", one.sAxial, two.sAxial, three.sAxial),
  ].join(" ");
  const phase =
    three.eCenter > 0
      ? `Holding the three seats fixed, 120° phase lock sets center |E| to ${(locked.eCenter / three.eCenter).toFixed(3)}× the common-phase triad, and the fixed scramble sets it to ${(scramble.eCenter / three.eCenter).toFixed(3)}×. Those three rows share one Δz120 and one Csweep. That difference is phasor interference, not geometric pitch.`
      : "The common-phase center |E| is ~0, so the phase rows are not reported as a ratio.";
  const sampling = Number.isFinite(three.cSweep)
    ? "Denser winding — larger Csweep, smaller Δz120 — does not move these field numbers. They are invariant under aircraft speed and spin. Csweep never enters the solver."
    : "Δz120 is undefined unless the formation is both spinning and translating, so Csweep is not a number here. The source-count comparison still does not use pitch.";
  return `${geom} ${phase} ${sampling} Csweep is not a physical coherence threshold.`;
}

export function evaluateSweep(input: SweepInput): { rows: SweepRow[]; verdict: string } {
  const active = input.pAmp > 0 && input.freqHz > 0 && input.radius > 4;
  const rows = CASES.map((c) => {
    const pitch = pitchFor(input.lRev, c.n);
    const metrics = active
      ? faceMetrics(dipolesFor(input, c.angles, c.phases), input)
      : { eCenter: 0, eRms: 0, contrast: 0, sAxial: 0 };
    return {
      id: c.id,
      label: c.label,
      n: c.n,
      phaseNote: c.phaseNote,
      pitch,
      cSweep: geometricSweep(input.radius, pitch),
      ...metrics,
    };
  });
  return { rows, verdict: sweepVerdict(rows, active) };
}
