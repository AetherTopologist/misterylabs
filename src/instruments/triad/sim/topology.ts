/**
 * Field topology readouts. Samples the existing Hertzian solver.
 * Does not modify dipoles, Maxwell, QED, the controller, or the integrator.
 *
 * Instantaneous B is μ0 Re(H̃ exp(+j φ)), the same real-part convention as qed.ts.
 * Streamlines are integral curves of that snapshot. They are not plasma lines.
 * A numerical null is not reconnection.
 */

import { C, MU0, R_MIN, energyDensity, fieldAt, poynting, radiatedPower, type Dipole, type Vec } from "./fields.ts";
import { invariantsOf, pairRate, sampleStrongField } from "./qed.ts";

export const EXCLUSION_HALO = R_MIN * 1.75;
export const NULL_RATIO_VERIFIED = 0.02;
export const NULL_RATIO_CANDIDATE = 0.2;
export const DIV_STEP_M = 0.2;
export const DIV_WITHIN = 0.08;
export const DIV_CAUTION = 0.25;
export const SYMMETRY_QUIET = 0.03;

export type ValidityState = "WITHIN TESTED MODEL" | "APPROXIMATION CAUTION" | "OUTSIDE VALIDATED DOMAIN" | "NOT EVALUATED";

export type ValidityRow = { id: string; state: ValidityState; text: string };
export type NullClass = "verified" | "under-resolved";

export type NullHit = {
  p: Vec;
  bMag: number;
  ratio: number;
  klass: NullClass;
  label: "Verified numerical null candidate" | "Under-resolved candidate";
  note: string;
};

export type Polyline = { pts: Vec[]; mag: number[] };

export type SurveySettings = {
  seeds: number;
  steps: number;
  stepM: number;
  direction: "both" | "forward";
  offsetM: number;
  plane: "orbit" | "perp";
  quantity: "b" | "e" | "u";
  perp: boolean;
  nullDetail: "light" | "refine";
};

export type Axes = { origin: Vec; e1: Vec; e2: Vec; n: Vec };

export type SurveyInput = {
  dipoles: Dipole[];
  freqHz: number;
  obsPhaseRad: number;
  axes: Axes;
  radius: number;
  settings: SurveySettings;
  probeM: number | null;
  speed: number;
  orbitRate: number;
};

export type SliceGrid = {
  n: number;
  span: number;
  offsetM: number;
  values: Float32Array;
  invalid: Uint8Array;
  rgba: Uint8Array;
  kind: "orbit" | "perp";
};

export type ArrowSeg = { p: Vec; d: Vec };

export type QedBridge = {
  ePeak: number;
  bPeak: number;
  eps: number;
  beta: number;
  F: number;
  G: number;
  eOverEs: number;
  where: Vec;
  centroidE: number;
  centroidEps: number;
  centroidB: number;
  rate: number;
  exponent: number;
  rateApplicable: boolean;
  rateNote: string;
  seriesState: ValidityState;
  text: string;
};

export type EnergySketch = {
  fieldEnergyJ: number;
  volumeM3: number;
  holes: number;
  fluxW: number;
  radiatedW: number;
  fluxOverRadiated: number | null;
  text: string;
};

export type SurveyResult = {
  lines: Polyline[];
  arrows: ArrowSeg[];
  slice: SliceGrid;
  perp: SliceGrid | null;
  nulls: NullHit[];
  nullNote: string;
  symmetry: { residual: number; samples: number; text: string };
  divB: { residual: number; samples: number; skipped: number; state: ValidityState; text: string };
  probe: { distanceM: number; state: ValidityState; text: string } | null;
  fieldDomain: ValidityState;
  rows: ValidityRow[];
  qed: QedBridge;
  energy: EnergySketch;
  elapsedMs: number;
};

const ZERO: Vec = { x: 0, y: 0, z: 0 };

export function instantOf(f: ReturnType<typeof fieldAt>, phase: number): { E: Vec; B: Vec; invalid: boolean } {
  if (f.invalid) return { E: ZERO, B: ZERO, invalid: true };
  const c = Math.cos(phase);
  const s = Math.sin(phase);
  const pick = (re: number, im: number) => re * c - im * s;
  return {
    invalid: false,
    E: { x: pick(f.exR, f.exI), y: pick(f.eyR, f.eyI), z: pick(f.ezR, f.ezI) },
    B: {
      x: MU0 * pick(f.hxR, f.hxI),
      y: MU0 * pick(f.hyR, f.hyI),
      z: MU0 * pick(f.hzR, f.hzI),
    },
  };
}

export function sampleEB(dipoles: Dipole[], p: Vec, freqHz: number, phase: number) {
  return instantOf(fieldAt(dipoles, p, freqHz), phase);
}

function hypot3(v: Vec) {
  return Math.hypot(v.x, v.y, v.z);
}

function add(a: Vec, b: Vec, s = 1): Vec {
  return { x: a.x + b.x * s, y: a.y + b.y * s, z: a.z + b.z * s };
}

function sub(a: Vec, b: Vec): Vec {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function dot(a: Vec, b: Vec) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a: Vec, b: Vec): Vec {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}

function unit(v: Vec): Vec | null {
  const L = hypot3(v);
  if (!(L > 0)) return null;
  return { x: v.x / L, y: v.y / L, z: v.z / L };
}

function median(xs: number[]) {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : 0.5 * (s[m - 1] + s[m]);
}

export function nearestSource(p: Vec, dipoles: Dipole[]) {
  let best = Infinity;
  for (const d of dipoles) {
    if (d.dark || d.pAmp <= 0) continue;
    const r = Math.hypot(p.x - d.x, p.y - d.y, p.z - d.z);
    if (r < best) best = r;
  }
  return best;
}

function liveDipoles(dipoles: Dipole[]) {
  return dipoles.filter((d) => !d.dark && d.pAmp > 0);
}

export function transversePoint(d: Dipole, distance: number): Vec {
  let tx = 1;
  let ty = 0;
  let tz = 0;
  if (Math.abs(d.ux * tx + d.uy * ty + d.uz * tz) > 0.85) {
    tx = 0;
    ty = 1;
    tz = 0;
  }
  let rx = d.uy * tz - d.uz * ty;
  let ry = d.uz * tx - d.ux * tz;
  let rz = d.ux * ty - d.uy * tx;
  const L = Math.hypot(rx, ry, rz) || 1;
  return { x: d.x + (rx / L) * distance, y: d.y + (ry / L) * distance, z: d.z + (rz / L) * distance };
}

function sliceAxes(axes: Axes, kind: "orbit" | "perp"): Axes {
  if (kind === "orbit") return axes;
  return { origin: axes.origin, e1: axes.e1, e2: axes.n, n: axes.e2 };
}

function at(axes: Axes, u: number, v: number, offset: number): Vec {
  return {
    x: axes.origin.x + axes.e1.x * u + axes.e2.x * v + axes.n.x * offset,
    y: axes.origin.y + axes.e1.y * u + axes.e2.y * v + axes.n.y * offset,
    z: axes.origin.z + axes.e1.z * u + axes.e2.z * v + axes.n.z * offset,
  };
}

function quantityOf(sample: ReturnType<typeof sampleEB>, raw: ReturnType<typeof fieldAt>, which: SurveySettings["quantity"]) {
  if (sample.invalid) return 0;
  if (which === "e") return hypot3(sample.E);
  if (which === "u") return energyDensity(raw);
  return hypot3(sample.B);
}

function colorRamp(t: number, invalid: boolean): [number, number, number, number] {
  if (invalid) return [90, 28, 36, 180];
  const u = Math.max(0, Math.min(1, t));
  const stops: [number, number, number][] = [
    [10, 28, 64],
    [40, 110, 190],
    [232, 238, 244],
    [232, 168, 70],
  ];
  const x = u * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  const f = x - i;
  const a = stops[i];
  const b = stops[i + 1];
  return [
    Math.round(a[0] + (b[0] - a[0]) * f),
    Math.round(a[1] + (b[1] - a[1]) * f),
    Math.round(a[2] + (b[2] - a[2]) * f),
    210,
  ];
}

function paint(values: Float32Array, invalid: Uint8Array): Uint8Array {
  let lo = Infinity;
  let hi = 0;
  for (let i = 0; i < values.length; i++) {
    if (invalid[i]) continue;
    const v = values[i];
    if (v > 0 && v < lo) lo = v;
    if (v > hi) hi = v;
  }
  if (!Number.isFinite(lo)) lo = 1;
  if (!(hi > lo)) hi = lo * 10 + 1e-30;
  const logLo = Math.log10(lo);
  const logHi = Math.log10(hi);
  const rgba = new Uint8Array(values.length * 4);
  for (let i = 0; i < values.length; i++) {
    const t = invalid[i] ? 0 : (Math.log10(Math.max(values[i], lo)) - logLo) / (logHi - logLo || 1);
    const [r, g, b, a] = colorRamp(t, invalid[i] === 1);
    const o = i * 4;
    rgba[o] = r;
    rgba[o + 1] = g;
    rgba[o + 2] = b;
    rgba[o + 3] = a;
  }
  return rgba;
}

export function sampleSlice(
  dipoles: Dipole[],
  freqHz: number,
  phase: number,
  axes: Axes,
  span: number,
  offset: number,
  n: number,
  quantity: SurveySettings["quantity"],
  kind: "orbit" | "perp",
): SliceGrid {
  const values = new Float32Array(n * n);
  const invalid = new Uint8Array(n * n);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const u = (i / (n - 1) - 0.5) * span;
      const v = (j / (n - 1) - 0.5) * span;
      const p = at(axes, u, v, offset);
      const raw = fieldAt(dipoles, p, freqHz);
      const sample = instantOf(raw, phase);
      const idx = j * n + i;
      if (sample.invalid) {
        invalid[idx] = 1;
        values[idx] = 0;
      } else {
        values[idx] = quantityOf(sample, raw, quantity);
      }
    }
  }
  return { n, span, offsetM: offset, values, invalid, rgba: paint(values, invalid), kind };
}

export function traceStreamlines(
  dipoles: Dipole[],
  freqHz: number,
  phase: number,
  axes: Axes,
  radius: number,
  settings: Pick<SurveySettings, "seeds" | "steps" | "stepM" | "direction" | "offsetM" | "plane">,
): Polyline[] {
  const plane = sliceAxes(axes, settings.plane);
  const seedsN = Math.max(4, Math.min(24, Math.round(settings.seeds)));
  const steps = Math.max(4, Math.min(36, Math.round(settings.steps)));
  const lambda = C / Math.max(freqHz, 1);
  const h = settings.stepM > 0 ? settings.stepM : Math.max(0.35, Math.min(radius / 14, lambda / 6));
  const rings = [0.55, 1.05];
  const lines: Polyline[] = [];
  const signs = settings.direction === "forward" ? [1] : [1, -1];

  const dirAt = (p: Vec): { u: Vec; mag: number } | null => {
    const s = sampleEB(dipoles, p, freqHz, phase);
    if (s.invalid) return null;
    const u = unit(s.B);
    if (!u) return null;
    return { u, mag: hypot3(s.B) };
  };

  const walk = (seed: Vec, sign: number, seedMag: number) => {
    const pts: Vec[] = [];
    const mag: number[] = [];
    let p = seed;
    for (let s = 0; s < steps; s++) {
      const d1 = dirAt(p);
      if (!d1) break;
      const mid = add(p, d1.u, sign * h * 0.5);
      if (nearestSource(mid, dipoles) < R_MIN) break;
      const d2 = dirAt(mid) ?? d1;
      const next = add(p, d2.u, sign * h);
      if (nearestSource(next, dipoles) < R_MIN) break;
      const span = Math.hypot(next.x - axes.origin.x, next.y - axes.origin.y, next.z - axes.origin.z);
      if (span > radius * 3.2) break;
      const sb = sampleEB(dipoles, next, freqHz, phase);
      if (sb.invalid) break;
      const bm = hypot3(sb.B);
      if (seedMag > 0 && bm < seedMag * 1e-4) break;
      pts.push(next);
      mag.push(bm);
      p = next;
    }
    return { pts, mag };
  };

  for (const ring of rings) {
    for (let i = 0; i < seedsN; i++) {
      const a = (i / seedsN) * Math.PI * 2;
      const seed = at(plane, Math.cos(a) * radius * ring, Math.sin(a) * radius * ring, settings.offsetM);
      if (nearestSource(seed, dipoles) < R_MIN) continue;
      const b0 = sampleEB(dipoles, seed, freqHz, phase);
      if (b0.invalid || !(hypot3(b0.B) > 0)) continue;
      const seedMag = hypot3(b0.B);
      const parts = signs.map((sign) => walk(seed, sign, seedMag));
      const pts: Vec[] = [];
      const mag: number[] = [];
      if (signs.length === 2) {
        const back = parts[1];
        for (let k = back.pts.length - 1; k >= 0; k--) {
          pts.push(back.pts[k]);
          mag.push(back.mag[k]);
        }
      }
      pts.push(seed);
      mag.push(seedMag);
      for (let k = 0; k < parts[0].pts.length; k++) {
        pts.push(parts[0].pts[k]);
        mag.push(parts[0].mag[k]);
      }
      if (pts.length > 1) lines.push({ pts, mag });
    }
  }
  return lines;
}

function sliceArrows(dipoles: Dipole[], freqHz: number, phase: number, axes: Axes, span: number, offset: number): ArrowSeg[] {
  const n = 7;
  const arrows: ArrowSeg[] = [];
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const u = (i / (n - 1) - 0.5) * span * 0.86;
      const v = (j / (n - 1) - 0.5) * span * 0.86;
      const p = at(axes, u, v, offset);
      if (nearestSource(p, dipoles) < EXCLUSION_HALO) continue;
      const s = sampleEB(dipoles, p, freqHz, phase);
      if (s.invalid) continue;
      const in1 = dot(s.B, axes.e1);
      const in2 = dot(s.B, axes.e2);
      const horiz = Math.hypot(in1, in2);
      if (!(horiz > 0)) continue;
      const len = span * 0.045;
      const d = {
        x: axes.e1.x * (in1 / horiz) * len + axes.e2.x * (in2 / horiz) * len,
        y: axes.e1.y * (in1 / horiz) * len + axes.e2.y * (in2 / horiz) * len,
        z: axes.e1.z * (in1 / horiz) * len + axes.e2.z * (in2 / horiz) * len,
      };
      arrows.push({ p, d });
    }
  }
  return arrows;
}

function rodrigues(p: Vec, origin: Vec, axis: Vec, ang: number): Vec {
  const v = sub(p, origin);
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const kdot = dot(axis, v);
  const kxv = cross(axis, v);
  return {
    x: origin.x + v.x * c + kxv.x * s + axis.x * kdot * (1 - c),
    y: origin.y + v.y * c + kxv.y * s + axis.y * kdot * (1 - c),
    z: origin.z + v.z * c + kxv.z * s + axis.z * kdot * (1 - c),
  };
}

export function symmetryScore(dipoles: Dipole[], freqHz: number, phase: number, axes: Axes, radius: number) {
  const angles = 8;
  let acc = 0;
  let n = 0;
  for (const ring of [0.35, 0.7]) {
    for (let i = 0; i < angles; i++) {
      const a = (i / angles) * Math.PI * 2;
      const p = at(axes, Math.cos(a) * radius * ring, Math.sin(a) * radius * ring, 0);
      if (nearestSource(p, dipoles) < EXCLUSION_HALO) continue;
      const b0s = sampleEB(dipoles, p, freqHz, phase);
      if (b0s.invalid) continue;
      const b0 = hypot3(b0s.B);
      for (const turn of [(2 * Math.PI) / 3, (4 * Math.PI) / 3]) {
        const q = rodrigues(p, axes.origin, axes.n, turn);
        if (nearestSource(q, dipoles) < EXCLUSION_HALO) continue;
        const b1s = sampleEB(dipoles, q, freqHz, phase);
        if (b1s.invalid) continue;
        const b1 = hypot3(b1s.B);
        acc += Math.abs(b0 - b1) / Math.max(b0, b1, 1e-30);
        n++;
      }
    }
  }
  const residual = n ? acc / n : Number.NaN;
  const text = !Number.isFinite(residual)
    ? "C3 comparison was not evaluated. Too many samples fell in the exclusion halo."
    : residual < SYMMETRY_QUIET
      ? `C3 residual ${(residual * 100).toFixed(2)}%. Sampled |B| repeats under 120° rotation about the orbit normal.`
      : `C3 residual ${(residual * 100).toFixed(1)}%. This |B| snapshot is not threefold symmetric. That is a calculated result, not a failure of the solver.`;
  return { residual, samples: n, text };
}

function bComponent(dipoles: Dipole[], freqHz: number, phase: number, p: Vec, axis: "x" | "y" | "z", h: number, component: "x" | "y" | "z") {
  const q = { x: p.x, y: p.y, z: p.z, [axis]: p[axis] + h };
  if (nearestSource(q, dipoles) < R_MIN) return Number.NaN;
  const s = sampleEB(dipoles, q, freqHz, phase);
  if (s.invalid) return Number.NaN;
  return s.B[component];
}

export function divResidual(dipoles: Dipole[], freqHz: number, phase: number, axes: Axes, radius: number) {
  const spots: Vec[] = [];
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    spots.push(at(axes, Math.cos(a) * radius * 0.65, Math.sin(a) * radius * 0.65, 0));
    spots.push(at(axes, Math.cos(a) * radius * 1.25, Math.sin(a) * radius * 1.25, radius * 0.15));
  }
  const h = DIV_STEP_M;
  const prelim: { p: Vec; b: number }[] = [];
  let skipped = 0;
  for (const p of spots) {
    if (nearestSource(p, dipoles) < EXCLUSION_HALO + h) {
      skipped++;
      continue;
    }
    const s = sampleEB(dipoles, p, freqHz, phase);
    if (s.invalid) {
      skipped++;
      continue;
    }
    prelim.push({ p, b: hypot3(s.B) });
  }
  const floor = median(prelim.map((p) => p.b));
  let worst = 0;
  let samples = 0;
  for (const item of prelim) {
    if (floor > 0 && item.b < floor * 1e-3) {
      skipped++;
      continue;
    }
    const bx = (bComponent(dipoles, freqHz, phase, item.p, "x", h, "x") - bComponent(dipoles, freqHz, phase, item.p, "x", -h, "x")) / (2 * h);
    const by = (bComponent(dipoles, freqHz, phase, item.p, "y", h, "y") - bComponent(dipoles, freqHz, phase, item.p, "y", -h, "y")) / (2 * h);
    const bz = (bComponent(dipoles, freqHz, phase, item.p, "z", h, "z") - bComponent(dipoles, freqHz, phase, item.p, "z", -h, "z")) / (2 * h);
    if (![bx, by, bz].every(Number.isFinite)) {
      skipped++;
      continue;
    }
    const rel = (Math.abs(bx + by + bz) * h) / Math.max(item.b, 1e-30);
    if (rel > worst) worst = rel;
    samples++;
  }
  let state: ValidityState = "NOT EVALUATED";
  let text = "div B was not sampled.";
  if (samples === 0) text = "div B was not evaluated. Every probe sat in an exclusion halo or on a near-null.";
  else if (worst < DIV_WITHIN) {
    state = "WITHIN TESTED MODEL";
    text = `max |∇·B| Δh / |B| = ${worst.toExponential(2)} on ${samples} samples at least ${EXCLUSION_HALO.toFixed(1)} m from a source (Δh = ${h} m). Within the documented finite-difference tolerance ${DIV_WITHIN}. This is not a proof that a monopole is absent inside the excluded balls.`;
  } else if (worst < DIV_CAUTION) {
    state = "APPROXIMATION CAUTION";
    text = `max |∇·B| Δh / |B| = ${worst.toExponential(2)}. Above ${DIV_WITHIN} and below ${DIV_CAUTION}. Treat the sampling as coarse, not as a physical magnetic charge.`;
  } else {
    state = "OUTSIDE VALIDATED DOMAIN";
    text = `max |∇·B| Δh / |B| = ${worst.toExponential(2)}. Above the documented caution level ${DIV_CAUTION}. The finite difference is not reliable at this step. Do not read it as a new source term.`;
  }
  return { residual: worst, samples, skipped, state, text };
}

export function searchNulls(
  dipoles: Dipole[],
  freqHz: number,
  phase: number,
  axes: Axes,
  radius: number,
  detail: "light" | "refine",
): { nulls: NullHit[]; note: string } {
  const n = detail === "refine" ? 7 : 5;
  const half = radius * 1.2;
  const thick = radius * 0.45;
  const bAt = (p: Vec) => {
    if (nearestSource(p, dipoles) < R_MIN) return { invalid: true, b: Infinity, p };
    const s = sampleEB(dipoles, p, freqHz, phase);
    if (s.invalid) return { invalid: true, b: Infinity, p };
    return { invalid: false, b: hypot3(s.B), p };
  };
  const grid: { p: Vec; b: number; invalid: boolean }[] = [];
  for (let k = 0; k < n; k++) {
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const u = (i / (n - 1) - 0.5) * 2 * half;
        const v = (j / (n - 1) - 0.5) * 2 * half;
        const w = (k / (n - 1) - 0.5) * 2 * thick;
        const p = at(axes, u, v, w);
        const s = bAt(p);
        grid.push({ p, b: s.b, invalid: s.invalid });
      }
    }
  }
  const scale = median(grid.filter((g) => !g.invalid).map((g) => g.b));
  const cell = (2 * half) / Math.max(1, n - 1);
  const seeds: Vec[] = [{ ...axes.origin }];
  const idx = (i: number, j: number, k: number) => (k * n + j) * n + i;
  for (let k = 1; k < n - 1; k++) {
    for (let j = 1; j < n - 1; j++) {
      for (let i = 1; i < n - 1; i++) {
        const c = grid[idx(i, j, k)];
        if (c.invalid) continue;
        const neigh = [idx(i - 1, j, k), idx(i + 1, j, k), idx(i, j - 1, k), idx(i, j + 1, k), idx(i, j, k - 1), idx(i, j, k + 1)];
        let local = true;
        for (const id of neigh) {
          const g = grid[id];
          if (!g.invalid && g.b + scale * 1e-9 < c.b) local = false;
        }
        if (local && scale > 0 && c.b / scale < NULL_RATIO_CANDIDATE) seeds.push(c.p);
      }
    }
  }

  const refine = (start: Vec) => {
    let p = { ...start };
    const s0 = bAt(p);
    if (s0.invalid) return { p, b: Infinity, lastMove: Infinity, ok: false };
    let bestP = { ...p };
    let bestB = s0.b;
    let step = Math.min(4, cell * 0.45);
    let lastMove = 0;
    let guard = 0;
    while (guard < 14 && step > 0.25) {
      guard++;
      const h = Math.max(0.45, Math.min(1.25, step * 0.35));
      const xm = bAt({ x: p.x - h, y: p.y, z: p.z });
      const xp = bAt({ x: p.x + h, y: p.y, z: p.z });
      const ym = bAt({ x: p.x, y: p.y - h, z: p.z });
      const yp = bAt({ x: p.x, y: p.y + h, z: p.z });
      const zm = bAt({ x: p.x, y: p.y, z: p.z - h });
      const zp = bAt({ x: p.x, y: p.y, z: p.z + h });
      if ([xm, xp, ym, yp, zm, zp].some((s) => s.invalid)) {
        step *= 0.5;
        continue;
      }
      const gx = (xp.b - xm.b) / (2 * h);
      const gy = (yp.b - ym.b) / (2 * h);
      const gz = (zp.b - zm.b) / (2 * h);
      const gL = Math.hypot(gx, gy, gz);
      if (!(gL > 0) || !Number.isFinite(gL)) break;
      const trial = { x: p.x - (gx / gL) * step, y: p.y - (gy / gL) * step, z: p.z - (gz / gL) * step };
      const bt = bAt(trial);
      if (bt.invalid || !(bt.b < bestB * (1 - 1e-6))) {
        step *= 0.5;
        continue;
      }
      lastMove = Math.hypot(trial.x - p.x, trial.y - p.y, trial.z - p.z);
      p = trial;
      bestP = { ...trial };
      bestB = bt.b;
      if (lastMove < 0.45 && step < cell * 0.2) break;
    }
    return { p: bestP, b: bestB, lastMove, ok: Number.isFinite(bestB) };
  };

  const hits: NullHit[] = [];
  const seen: Vec[] = [];
  for (const seed of seeds) {
    const a = refine(seed);
    if (!a.ok || !Number.isFinite(a.b)) continue;
    if (seen.some((s) => Math.hypot(s.x - a.p.x, s.y - a.p.y, s.z - a.p.z) < (a.b / Math.max(scale, 1e-30) < NULL_RATIO_VERIFIED ? 16 : 7))) continue;
    const nudged = { x: a.p.x + axes.e1.x * 1.2, y: a.p.y + axes.e1.y * 1.2, z: a.p.z + axes.e1.z * 1.2 };
    const confirm = refine(nudged);
    const sep = Math.hypot(confirm.p.x - a.p.x, confirm.p.y - a.p.y, confirm.p.z - a.p.z);
    const agreePoint = confirm.ok && sep < 2.5;
    const agreeDepth = confirm.ok && scale > 0 && confirm.b / scale < NULL_RATIO_VERIFIED && a.b / scale < NULL_RATIO_VERIFIED;
    const agree = agreePoint || agreeDepth;
    const dist = nearestSource(a.p, dipoles);
    const ratio = scale > 0 ? a.b / scale : Infinity;
    if (!(ratio < NULL_RATIO_CANDIDATE)) continue;
    const outside = dist >= EXCLUSION_HALO;
    const converged = a.lastMove < Math.max(1.25, cell * 0.15) || a.b <= (scale > 0 ? scale * NULL_RATIO_VERIFIED : 0);
    const verified = outside && agree && converged && ratio < NULL_RATIO_VERIFIED;
    const centerDist = Math.hypot(a.p.x - axes.origin.x, a.p.y - axes.origin.y, a.p.z - axes.origin.z);
    const note = !outside
      ? `Inside the ${EXCLUSION_HALO.toFixed(1)} m halo. Not accepted as a source-free null. The 1/r³ point is not a physical null.`
      : verified
        ? `Refined |B| / median |B| = ${ratio.toExponential(2)}. Second start is ${sep.toFixed(2)} m away${agreeDepth && !agreePoint ? " and also below the verified ratio, so the dip is extended rather than an isolated point" : ""}. Finite grid, not a mathematical proof.${centerDist < 3 ? " Near the orbit center of this sample." : ""} Not reconnection.`
        : `Local dip did not meet the verified tests (ratio ${ratio.toExponential(2)}, source distance ${dist.toFixed(1)} m, second-start ${agree ? "agreed" : "disagreed"}). Under-resolved at this grid.`;
    if (!outside && ratio < NULL_RATIO_VERIFIED) continue;
    seen.push(a.p);
    hits.push({
      p: a.p,
      bMag: a.b,
      ratio,
      klass: verified ? "verified" : "under-resolved",
      label: verified ? "Verified numerical null candidate" : "Under-resolved candidate",
      note,
    });
  }
  hits.sort((x, y) => x.ratio - y.ratio);
  const kept = hits.slice(0, 8);
  const note = kept.length
    ? `${kept.filter((h) => h.klass === "verified").length} verified candidate(s), ${kept.filter((h) => h.klass === "under-resolved").length} under-resolved. An X in a picture is not automatically one of these.`
    : `No null detected at current resolution (${n}³ plus the orbit center). Finite sampling does not prove that no null exists.`;
  return { nulls: kept, note };
}

export function exclusionState(distanceM: number | null, sliceInvalid: number, sliceN: number): ValidityRow {
  if (distanceM != null && distanceM < R_MIN) {
    return {
      id: "exclusion",
      state: "OUTSIDE VALIDATED DOMAIN",
      text: `Probe is ${distanceM.toFixed(2)} m from a point source. The Hertzian kernel is invalid for r < ${R_MIN} m. That singularity is not a physical field singularity and not a null.`,
    };
  }
  if (distanceM != null && distanceM < EXCLUSION_HALO) {
    return {
      id: "exclusion",
      state: "APPROXIMATION CAUTION",
      text: `Probe is ${distanceM.toFixed(2)} m from a source, inside the ${EXCLUSION_HALO.toFixed(1)} m halo and outside the hard exclusion. Near-zone gradients dominate the finite difference.`,
    };
  }
  if (sliceInvalid > 0 && sliceInvalid / Math.max(1, sliceN) < 0.08) {
    return {
      id: "exclusion",
      state: "WITHIN TESTED MODEL",
      text: `${sliceInvalid} of ${sliceN} slice cells sit inside r < ${R_MIN} m and are withheld. Those texels are not field values and not nulls. The rest of the slice is in the tested exterior of the point-dipole kernel.`,
    };
  }
  return {
    id: "exclusion",
    state: "WITHIN TESTED MODEL",
    text: `Samples used for the drawing sit outside r < ${R_MIN} m. The point-dipole kernel is the tested model there. It is still not a plasma sphere or a finite loop.`,
  };
}

export function motionState(speed: number, orbitRate: number): ValidityRow {
  const moving = speed > 0.5 || Math.abs(orbitRate) > 1e-3;
  if (!moving) {
    return {
      id: "motion",
      state: "WITHIN TESTED MODEL",
      text: "Sources are at rest in the integrator. Retardation uses these fixed positions. fieldAt does not carry a source velocity.",
    };
  }
  return {
    id: "motion",
    state: "APPROXIMATION CAUTION",
    text: "Nodes or the aircraft are moving. The kernel retards from the current prescribed positions only. This is not a fully self-consistent moving-source solution, and instantaneous streamlines are not the historical locus.",
  };
}

const RANK: Record<ValidityState, number> = {
  "WITHIN TESTED MODEL": 0,
  "NOT EVALUATED": 1,
  "APPROXIMATION CAUTION": 2,
  "OUTSIDE VALIDATED DOMAIN": 3,
};

export function worstState(states: ValidityState[]): ValidityState {
  return states.reduce((a, b) => (RANK[b] > RANK[a] ? b : a), "WITHIN TESTED MODEL");
}

function qedBridge(dipoles: Dipole[], freqHz: number, phase: number, origin: Vec): QedBridge {
  const strong = liveDipoles(dipoles).length ? sampleStrongField(dipoles, freqHz) : null;
  const mid = instantOf(fieldAt(dipoles, origin, freqHz), phase);
  const midInv = mid.invalid ? null : invariantsOf(mid.E, mid.B);
  const pair = strong ? pairRate(strong.eps, strong.beta) : null;
  const seriesState: ValidityState = pair && pair.applicable ? "APPROXIMATION CAUTION" : "NOT EVALUATED";
  const ePeak = strong?.ePeak ?? 0;
  const eps = strong?.eps ?? 0;
  const text = !strong
    ? "No live source. QED invariants were not evaluated."
    : `Peak |E| ${ePeak.toExponential(3)} V/m and ε ${eps.toExponential(3)} V/m are different numbers when the sampled field is not pure electric. The Schwinger series uses ε and β, n = 1…4, constant-field. Es = 1.32e18 V/m is a scale, not a trigger. Centroid |E| ${(midInv?.e ?? 0).toExponential(3)}, centroid ε ${(midInv?.eps ?? 0).toExponential(3)}.`;
  return {
    ePeak,
    bPeak: strong?.bPeak ?? 0,
    eps,
    beta: strong?.beta ?? 0,
    F: strong?.F ?? 0,
    G: strong?.G ?? 0,
    eOverEs: strong?.eOverEs ?? 0,
    where: strong?.where ?? origin,
    centroidE: midInv?.e ?? 0,
    centroidEps: midInv?.eps ?? 0,
    centroidB: midInv?.b ?? 0,
    rate: pair?.rate ?? 0,
    exponent: pair?.exponent ?? Infinity,
    rateApplicable: !!pair?.applicable,
    rateNote: pair?.note ?? "Not evaluated.",
    seriesState,
    text,
  };
}

export function energySketch(dipoles: Dipole[], freqHz: number, axes: Axes, radius: number): EnergySketch {
  const L = Math.max(12, radius * 1.55);
  const n = 3;
  const area = ((2 * L) * (2 * L)) / (n * n);
  const faces: { nrm: Vec; origin: Vec }[] = [
    { nrm: { x: 1, y: 0, z: 0 }, origin: add(axes.origin, { x: L, y: 0, z: 0 }) },
    { nrm: { x: -1, y: 0, z: 0 }, origin: add(axes.origin, { x: -L, y: 0, z: 0 }) },
    { nrm: { x: 0, y: 1, z: 0 }, origin: add(axes.origin, { x: 0, y: L, z: 0 }) },
    { nrm: { x: 0, y: -1, z: 0 }, origin: add(axes.origin, { x: 0, y: -L, z: 0 }) },
    { nrm: { x: 0, y: 0, z: 1 }, origin: add(axes.origin, { x: 0, y: 0, z: L }) },
    { nrm: { x: 0, y: 0, z: -1 }, origin: add(axes.origin, { x: 0, y: 0, z: -L }) },
  ];
  let flux = 0;
  let fluxN = 0;
  for (const face of faces) {
    const t1 = Math.abs(face.nrm.x) > 0.5 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
    const t2 = unit(cross(face.nrm, t1)) ?? { x: 0, y: 0, z: 1 };
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const u = ((i + 0.5) / n - 0.5) * 2 * L;
        const v = ((j + 0.5) / n - 0.5) * 2 * L;
        const p = add(add(face.origin, t1, u), t2, v);
        const f = fieldAt(dipoles, p, freqHz);
        if (f.invalid || nearestSource(p, dipoles) < R_MIN) continue;
        flux += dot(poynting(f), face.nrm) * area;
        fluxN++;
      }
    }
  }
  const cells = 3;
  const dV = ((2 * L) / cells) ** 3;
  let energy = 0;
  let used = 0;
  let holes = 0;
  for (let k = 0; k < cells; k++) {
    for (let j = 0; j < cells; j++) {
      for (let i = 0; i < cells; i++) {
        const p = {
          x: axes.origin.x + ((i + 0.5) / cells - 0.5) * 2 * L,
          y: axes.origin.y + ((j + 0.5) / cells - 0.5) * 2 * L,
          z: axes.origin.z + ((k + 0.5) / cells - 0.5) * 2 * L,
        };
        const f = fieldAt(dipoles, p, freqHz);
        if (f.invalid || nearestSource(p, dipoles) < R_MIN) {
          holes++;
          continue;
        }
        energy += energyDensity(f) * dV;
        used++;
      }
    }
  }
  const omega = Math.PI * 2 * freqHz;
  let radiated = 0;
  for (const d of dipoles) {
    if (d.dark || d.pAmp <= 0) continue;
    radiated += radiatedPower(d.pAmp, omega);
  }
  const ratio = radiated > 0 && fluxN > 0 ? flux / radiated : null;
  const text = `ENERGY BALANCE NOT FULLY EVALUABLE. Partial cycle-average field energy in the cube of half-width ${L.toFixed(0)} m is ${energy.toExponential(3)} J over ${used} cells (${holes} holes withheld at exclusions). Coarse outward flux of ⟨S⟩ is ${flux.toExponential(3)} W on ${fluxN} face samples. Analytic radiated power of the prescribed dipoles is ${radiated.toExponential(3)} W. ${ratio == null ? "No ratio." : `Flux/radiated = ${ratio.toExponential(2)} is a sampling comparison, not an energy residual.`} Source work and the chemical reservoir are different ledgers. Mutual impedance is omitted.`;
  return { fieldEnergyJ: energy, volumeM3: used * dV, holes, fluxW: flux, radiatedW: radiated, fluxOverRadiated: ratio, text };
}

export function survey(input: SurveyInput): SurveyResult {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const plane = sliceAxes(input.axes, input.settings.plane);
  const span = Math.max(80, input.radius * 3.1);
  const slice = sampleSlice(input.dipoles, input.freqHz, input.obsPhaseRad, plane, span, input.settings.offsetM, 22, input.settings.quantity, input.settings.plane);
  const perp = input.settings.perp
    ? sampleSlice(input.dipoles, input.freqHz, input.obsPhaseRad, sliceAxes(input.axes, "perp"), span, 0, 14, input.settings.quantity, "perp")
    : null;
  const lines = traceStreamlines(input.dipoles, input.freqHz, input.obsPhaseRad, input.axes, input.radius, input.settings);
  const arrows = sliceArrows(input.dipoles, input.freqHz, input.obsPhaseRad, plane, span, input.settings.offsetM);
  const symmetry = symmetryScore(input.dipoles, input.freqHz, input.obsPhaseRad, input.axes, input.radius);
  const divB = divResidual(input.dipoles, input.freqHz, input.obsPhaseRad, input.axes, input.radius);
  const found = searchNulls(input.dipoles, input.freqHz, input.obsPhaseRad, input.axes, input.radius, input.settings.nullDetail);
  let probe: SurveyResult["probe"] = null;
  const first = liveDipoles(input.dipoles)[0];
  if (input.probeM != null && first) {
    const row = exclusionState(input.probeM, 0, 1);
    probe = { distanceM: input.probeM, state: row.state, text: row.text };
  }
  const invalidCount = slice.invalid.reduce((a, b) => a + b, 0);
  const exclusion = probe ? { id: "exclusion", state: probe.state, text: probe.text } : exclusionState(null, invalidCount, slice.invalid.length);
  const motion = motionState(input.speed, input.orbitRate);
  const nullState: ValidityRow =
    found.nulls.some((h) => h.klass === "under-resolved") && !found.nulls.some((h) => h.klass === "verified")
      ? { id: "null", state: "APPROXIMATION CAUTION", text: `${found.note} Under-resolved dips are not counted as verified nulls.` }
      : {
          id: "null",
          state: "WITHIN TESTED MODEL",
          text: `${found.note} Verified means the documented ratio, halo, and second-start tests passed. It does not mean reconnection. No null is a valid result.`,
        };
  const linesRow: ValidityRow = {
    id: "lines",
    state: lines.length ? "WITHIN TESTED MODEL" : "NOT EVALUATED",
    text: lines.length
      ? "Drawn curves are integral curves of instantaneous B at the observation phase. They are a snapshot of the Hertzian phasor. They are not material lines and they do not travel with a plasma."
      : "No streamline was drawn.",
  };
  const qed = qedBridge(input.dipoles, input.freqHz, input.obsPhaseRad, input.axes.origin);
  const qedRow: ValidityRow = {
    id: "schwinger",
    state: qed.seriesState,
    text:
      qed.seriesState === "NOT EVALUATED"
        ? `${qed.text} ${qed.rateNote} The rate is not evaluated.`
        : `${qed.text} ${qed.rateNote} The constant-field assumption is not validated for these 1/r³ gradients. The rate is not a prediction for this geometry. No vacuum bore, metric, or transport is armed.`,
  };
  const energy = energySketch(input.dipoles, input.freqHz, input.axes, input.radius);
  const energyRow: ValidityRow = { id: "energy", state: "NOT EVALUATED", text: energy.text };
  const fieldDomain = worstState([exclusion.state, motion.state, nullState.state, divB.state]);
  const elapsedMs = (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0;
  return {
    lines,
    arrows,
    slice,
    perp,
    nulls: found.nulls,
    nullNote: found.note,
    symmetry,
    divB,
    probe,
    fieldDomain,
    rows: [exclusion, nullState, { id: "div", state: divB.state, text: divB.text }, linesRow, motion, qedRow, energyRow],
    qed,
    energy,
    elapsedMs,
  };
}

export function wavelengthM(freqHz: number) {
  return C / Math.max(freqHz, 1);
}
