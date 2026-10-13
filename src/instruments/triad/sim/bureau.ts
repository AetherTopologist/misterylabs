/**
 * Field bureau state. Reads engine.sources() and topology.survey.
 * Never writes a hypothesis flag into the solver.
 */

import { create } from "zustand";
import { engine } from "./engine";
import { fieldAt } from "./fields";
import type { Dipole, Vec } from "./fields";
import { sampleStrongField } from "./qed";
import type { QedReadout } from "./types";
import {
  instantOf,
  searchNulls,
  survey,
  symmetryScore,
  type NullHit,
  type SliceGrid,
  type SurveyResult,
  type SurveySettings,
} from "./topology";

export type BureauSettings = SurveySettings & {
  showLines: boolean;
  showSlice: boolean;
  showExclusion: boolean;
  showSymmetry: boolean;
  showArrows: boolean;
  auto: boolean;
  advanced: boolean;
  obsDeg: number;
};

export type FieldShot = {
  which: "a" | "b";
  dipoles: Dipole[];
  params: Record<string, string | number | boolean>;
  qed: QedReadout;
};

export type CompareView = {
  changed: string[];
  text: string;
  meanAbsLog: number;
  rgba: Uint8Array;
  n: number;
  nullA: string;
  nullB: string;
  symmetryA: string;
  symmetryB: string;
  invariants: string;
  ratioLine: string;
};

export type ViewGeom = {
  lines: { pts: Vec[]; mag: number[] }[];
  arrows: { p: Vec; d: Vec }[];
  nulls: (NullHit & { view: Vec })[];
  slice: SliceGrid;
  perp: SliceGrid | null;
};

const PARAM_KEYS = [
  "orient",
  "phaseA",
  "phaseB",
  "phaseC",
  "eRef",
  "activeCount",
  "freqHz",
  "orbitRadius",
  "orbitRate",
  "speed",
  "seatBendDeg",
  "frame",
  "mode",
  "simulateAmplitude",
  "spacing",
] as const;

export const DEFAULT_BUREAU: BureauSettings = {
  showLines: true,
  showSlice: true,
  showExclusion: true,
  showSymmetry: true,
  showArrows: true,
  auto: true,
  advanced: false,
  seeds: 8,
  steps: 16,
  stepM: 0,
  direction: "both",
  offsetM: 0,
  plane: "orbit",
  quantity: "b",
  perp: false,
  nullDetail: "light",
  obsDeg: 0,
};

type BureauStore = {
  settings: BureauSettings;
  probeM: number | null;
  rev: number;
  computing: boolean;
  result: SurveyResult | null;
  view: ViewGeom | null;
  shotA: FieldShot | null;
  shotB: FieldShot | null;
  compare: CompareView | null;
  ride: string | null;
  note: string;
  setSettings: (partial: Partial<BureauSettings>) => void;
  setProbe: (probeM: number | null) => void;
  setRide: (ride: string | null) => void;
  recompute: (detail?: SurveySettings["nullDetail"]) => void;
  compareShots: () => void;
};

function paramSnap(): Record<string, string | number | boolean> {
  const p = engine.params;
  const out: Record<string, string | number | boolean> = {};
  for (const key of PARAM_KEYS) out[key] = p[key] as string | number | boolean;
  return out;
}

function toViewGeom(result: SurveyResult): ViewGeom {
  return {
    lines: result.lines.map((line) => ({ mag: line.mag, pts: line.pts.map((p) => engine.toView(p)) })),
    arrows: result.arrows.map((a) => ({ p: engine.toView(a.p), d: a.d })),
    nulls: result.nulls.map((n) => ({ ...n, view: engine.toView(n.p) })),
    slice: result.slice,
    perp: result.perp,
  };
}

export function noteFieldFreeze(which: "a" | "b", qed: QedReadout) {
  const shot: FieldShot = { which, dipoles: engine.sources(), params: paramSnap(), qed };
  if (which === "a") useBureau.setState({ shotA: shot, compare: null });
  else useBureau.setState({ shotB: shot, compare: null });
}

function diffGrid(a: Dipole[], b: Dipole[], freqA: number, freqB: number, phase: number) {
  const form = engine.formation();
  const n = 16;
  const span = Math.max(80, form.radius * 3.1);
  const rgba = new Uint8Array(n * n * 4);
  let acc = 0;
  let count = 0;
  const eps = 1e-18;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const u = (i / (n - 1) - 0.5) * span;
      const v = (j / (n - 1) - 0.5) * span;
      const p = {
        x: form.origin.x + form.e1.x * u + form.e2.x * v,
        y: form.origin.y + form.e1.y * u + form.e2.y * v,
        z: form.origin.z + form.e1.z * u + form.e2.z * v,
      };
      const fa = instantOf(fieldAt(a, p, freqA), phase);
      const fb = instantOf(fieldAt(b, p, freqB), phase);
      const o = (j * n + i) * 4;
      if (fa.invalid || fb.invalid) {
        rgba[o] = 90;
        rgba[o + 1] = 28;
        rgba[o + 2] = 36;
        rgba[o + 3] = 200;
        continue;
      }
      const ba = Math.hypot(fa.B.x, fa.B.y, fa.B.z);
      const bb = Math.hypot(fb.B.x, fb.B.y, fb.B.z);
      const d = Math.log10(bb + eps) - Math.log10(ba + eps);
      acc += Math.abs(d);
      count++;
      const t = Math.max(-1, Math.min(1, d / 1.5));
      const mag = Math.abs(t);
      if (t >= 0) {
        rgba[o] = Math.round(40 + 190 * mag);
        rgba[o + 1] = Math.round(90 - 40 * mag);
        rgba[o + 2] = Math.round(160 - 90 * mag);
      } else {
        rgba[o] = Math.round(40 + 20 * mag);
        rgba[o + 1] = Math.round(110 + 40 * mag);
        rgba[o + 2] = Math.round(170 + 40 * mag);
      }
      rgba[o + 3] = 220;
    }
  }
  return { rgba, n, meanAbsLog: count ? acc / count : 0 };
}

export const useBureau = create<BureauStore>((set, get) => ({
  settings: { ...DEFAULT_BUREAU },
  probeM: null,
  rev: 0,
  computing: false,
  result: null,
  view: null,
  shotA: null,
  shotB: null,
  compare: null,
  ride: null,
  note: "The drawing has not been sampled yet.",
  setSettings: (partial) => set({ settings: { ...get().settings, ...partial } }),
  setProbe: (probeM) => set({ probeM }),
  setRide: (ride) => set({ ride }),
  recompute: (detail) => {
    const prev = get().settings;
    const settings = detail && detail !== prev.nullDetail ? { ...prev, nullDetail: detail } : prev;
    const form = engine.formation();
    const dipoles = engine.sources();
    const result = survey({
      dipoles,
      freqHz: form.freqHz,
      obsPhaseRad: (settings.obsDeg || 0) * (Math.PI / 180),
      axes: { origin: form.origin, e1: form.e1, e2: form.e2, n: form.n },
      radius: form.radius,
      settings,
      probeM: get().probeM,
      speed: form.speed,
      orbitRate: form.orbitRate,
    });
    const slow = result.elapsedMs > 90 ? " Sampling ran long. Lower seed density if the frame stutters." : "";
    set({
      settings,
      result,
      view: toViewGeom(result),
      rev: get().rev + 1,
      computing: false,
      note: `${result.nullNote} ${result.symmetry.text}${slow}`,
    });
  },
  compareShots: () => {
    const { shotA, shotB, settings } = get();
    if (!shotA || !shotB) return;
    const form = engine.formation();
    const phase = (settings.obsDeg || 0) * (Math.PI / 180);
    const axes = { origin: form.origin, e1: form.e1, e2: form.e2, n: form.n };
    const symA = symmetryScore(shotA.dipoles, shotA.params.freqHz as number, phase, axes, form.radius);
    const symB = symmetryScore(shotB.dipoles, shotB.params.freqHz as number, phase, axes, form.radius);
    const nullA = searchNulls(shotA.dipoles, shotA.params.freqHz as number, phase, axes, form.radius, "light");
    const nullB = searchNulls(shotB.dipoles, shotB.params.freqHz as number, phase, axes, form.radius, "light");
    const changed = PARAM_KEYS.filter((key) => shotA.params[key] !== shotB.params[key]).map(
      (key) => `${key}: ${String(shotA.params[key])} → ${String(shotB.params[key])}`,
    );
    const qA = sampleStrongField(shotA.dipoles, shotA.params.freqHz as number);
    const qB = sampleStrongField(shotB.dipoles, shotB.params.freqHz as number);
    const grid = diffGrid(shotA.dipoles, shotB.dipoles, shotA.params.freqHz as number, shotB.params.freqHz as number, phase);
    const one = changed.length === 1;
    const ratio = (e: number, eps: number) => (e > 0 ? (eps / e).toFixed(3) : "—");
    const ratioLine = `ε/|E| ${ratio(qA.ePeak, qA.eps)} → ${ratio(qB.ePeak, qB.eps)}`;
    const invariants = `Peak |E| ${qA.ePeak.toExponential(3)} → ${qB.ePeak.toExponential(3)} V/m. ε ${qA.eps.toExponential(3)} → ${qB.eps.toExponential(3)} V/m. ${ratioLine}. The constant-field series takes ε, not peak |E|. Dipole moment is recalibrated when frequency changes, because E0 is defined at the reference range.`;
    const text = [
      one ? `One stored control differs. ${changed[0]}.` : `${changed.length} stored controls differ. Coupled changes are listed, not collapsed into a single cause.`,
      changed.join("; ") || "No stored control differs. The dipole positions can still differ if the aircraft moved between freezes.",
      invariants,
      `ℱ ${qA.F.toExponential(3)} → ${qB.F.toExponential(3)}. 𝒢 ${qA.G.toExponential(3)} → ${qB.G.toExponential(3)}.`,
      `Mean |Δ log10 |B|| on the shared slice = ${grid.meanAbsLog.toFixed(3)}. Amber means |B| grew from A to B. Blue means it fell. Excluded cells stay dark.`,
      "ε is the invariant the constant-field series uses. It is not peak |E|. Neither number arms a bore, a metric, or a transport.",
    ].join(" ");
    set({
      compare: {
        changed,
        text,
        meanAbsLog: grid.meanAbsLog,
        rgba: grid.rgba,
        n: grid.n,
        nullA: nullA.note,
        nullB: nullB.note,
        symmetryA: symA.text,
        symmetryB: symB.text,
        invariants,
        ratioLine,
      },
    });
  },
}));

export function wavelengthTurns(freqHz: number, radius: number) {
  const lambda = 299792458 / Math.max(freqHz, 1);
  return { lambda, turns: (2 * radius) / lambda };
}

const scheduled: number[] = [];

export function schedule(ms: number, fn: () => void) {
  const id = window.setTimeout(fn, ms);
  scheduled.push(id);
  return id;
}

export function stopScheduled() {
  while (scheduled.length) {
    const id = scheduled.pop();
    if (id != null) window.clearTimeout(id);
  }
  useBureau.setState({ ride: null });
}
