/**
 * Deterministic experiment scripts.
 * Each frame is a function of integrator time. Nothing here samples Math.random
 * or plays back a recorded field. The runner writes these partials through
 * experimentHost.setControls, which is the same patch path as the sliders.
 */
import type { Params, Snapshot } from "./types";

export type PresetId = "cliff" | "break120" | "breakPhase" | "schwinger" | "null";
export type NullVar = "amplitude" | "phase" | "count";

export type ScriptCtx = {
  eAtUnity: number;
  nullVar: NullVar;
};

export type ScriptFrame = {
  controls: Partial<Params>;
  /** Plot / card label. The same label is recorded once. */
  mark?: string;
  /** "a" is captured before this frame's controls are applied. "b" is captured after the step. */
  freeze?: "a" | "b";
};

export type PresetDef = {
  id: PresetId;
  index: string;
  title: string;
  purpose: string;
  changing: string;
  held: string;
  watch: string;
  prediction: string;
  duration: number;
  hot: (ctx: ScriptCtx) => string[];
  baseline: (ctx: ScriptCtx) => Partial<Params>;
  at: (elapsed: number, ctx: ScriptCtx) => ScriptFrame;
  observe: (params: Params, snap: Snapshot) => string;
};

const CLIFF_R = 48;
const CLIFF_A = 80;
const CLIFF_W0 = 0.45;
const CLIFF_W1 = 2.6;
const CLIFF_T = 10;

export function cliffCrit(radius = CLIFF_R, aMax = CLIFF_A) {
  return Math.sqrt(aMax / Math.max(radius, 1e-9));
}

export function cliffOmega(elapsed: number) {
  const u = clamp01(elapsed / CLIFF_T);
  return CLIFF_W0 + (CLIFF_W1 - CLIFF_W0) * u;
}

const QUIET_AIR: Partial<Params> = {
  perturb: 0,
  bankDeg: 0,
  pitchDeg: 0,
  alphaDeg: 0,
  betaDeg: 0,
  yawRateDeg: 0,
  vacuumBore: false,
  anchor: false,
  ashton: false,
  spacing: "equal",
  seatBendDeg: 0,
  freqHz: 1e8,
  orient: "vertical",
  showField: true,
  showPoynting: true,
  rayMode: false,
  constitutive: "vacuum",
};

function clamp01(u: number) {
  return Math.min(1, Math.max(0, u));
}

function lerp(a: number, b: number, u: number) {
  return a + (b - a) * u;
}

const cliff: PresetDef = {
  id: "cliff",
  index: "01",
  title: "Control cliff",
  purpose: "Required centripetal acceleration crosses the controller acceleration cap. One variable moves: orbit rate.",
  changing: "Orbit rate ω only",
  held: "Aircraft speed, geometry frame, source amplitude, source phase, frequency, airframe attitude, seat, R, a_max",
  watch: "Actual node radius, commanded radius, tracking error, gap error, acquisition. CONTROL SATURATED is not airframe clearance.",
  prediction: `ωcrit = sqrt(a_max / R) = sqrt(${CLIFF_A}/${CLIFF_R}) = ${cliffCrit().toFixed(3)} rad/s. Tracking should hold below that and leave the ring after ω²R / a_max crosses 1.`,
  duration: CLIFF_T,
  hot: () => ["orbitRate"],
  baseline: () => ({
    ...QUIET_AIR,
    running: true,
    mode: "tracking",
    latencyMs: 0,
    orbitRadius: CLIFF_R,
    aMax: CLIFF_A,
    orbitRate: CLIFF_W0,
    speed: 85,
    frame: "bore",
    eRef: 100,
    simulateAmplitude: false,
    enforceBudget: true,
    phasePreset: "triad",
    phaseA: 0,
    phaseB: 120,
    phaseC: 240,
    activeCount: 3,
  }),
  at(elapsed) {
    const w = cliffOmega(elapsed);
    const ratio = (w * w * CLIFF_R) / CLIFF_A;
    return {
      controls: { orbitRate: w },
      mark: ratio >= 1 ? "CONTROL SATURATION" : undefined,
    };
  },
  observe(params, snap) {
    return [
      `ω ${params.orbitRate.toFixed(3)} rad/s`,
      `ωcrit ${cliffCrit().toFixed(3)}`,
      `ω²R/a_max ${snap.demandRatio.toFixed(2)}`,
      `track ${snap.trackErr.toFixed(2)} m`,
      `actual R ${snap.clearance.actualR.toFixed(1)} m`,
      `commanded R ${snap.clearance.commandedR.toFixed(1)} m`,
      `gap ${snap.gapErrDeg.toFixed(1)}°`,
      snap.acquisition,
      snap.saturated ? "CONTROL SATURATED" : "inside cap",
    ].join(" · ");
  },
};

const BREAK_T = 8;

const break120: PresetDef = {
  id: "break120",
  index: "02",
  title: "Break 120°",
  purpose: "Geometric coherence leaves the equal triad. Emitter phase stays put. Amplitude stays put.",
  changing: "Geometric seat of node 2 only",
  held: "Source amplitude, frequency, emitter phase, aircraft state, orbit rate, R, a_max",
  watch: "Gap error, tracking error, Maxwell face, field telemetry. Maxwell may change because the sources moved, not because phase or amplitude changed.",
  prediction: "Gap versus 120° rises with the seat bend and returns when the seat is restored. Emitter phases stay 0° / 120° / 240°. Tracking error can stay small because the slot itself moved.",
  duration: BREAK_T,
  hot: () => ["seatBend"],
  baseline: () => ({
    ...QUIET_AIR,
    running: true,
    mode: "tracking",
    latencyMs: 0,
    orbitRadius: 48,
    aMax: 400,
    orbitRate: 1.2,
    speed: 80,
    frame: "bore",
    eRef: 100,
    simulateAmplitude: false,
    enforceBudget: true,
    phasePreset: "triad",
    phaseA: 0,
    phaseB: 120,
    phaseC: 240,
    activeCount: 3,
    seatBendDeg: 0,
  }),
  at(elapsed) {
    let bend = 0;
    if (elapsed < 1) bend = 0;
    else if (elapsed < 3) bend = lerp(0, 45, (elapsed - 1) / 2);
    else if (elapsed < 5.5) bend = 45;
    else if (elapsed < 7.5) bend = lerp(45, 0, (elapsed - 5.5) / 2);
    else bend = 0;
    return {
      controls: { seatBendDeg: bend },
      mark: bend > 0.5 ? "GEOMETRY PERTURBATION" : undefined,
    };
  },
  observe(params, snap) {
    const phases = snap.nodes.map((n) => n.emDeg.toFixed(0)).join("/");
    return [
      `seat ${params.seatBendDeg.toFixed(1)}°`,
      `gap ${snap.gapErrDeg.toFixed(2)}°`,
      `track ${snap.trackErr.toFixed(2)} m`,
      `emitter phase ${phases}°`,
      `|E| ${snap.qed.ePeak.toExponential(2)} V/m`,
      `F ${snap.qed.F.toExponential(2)}`,
    ].join(" · ");
  },
};

const PHASE_T = 9;
const SCRAMBLE = { a: 17, b: 203, c: 291 };

const breakPhase: PresetDef = {
  id: "breakPhase",
  index: "03",
  title: "Break phase",
  purpose: "Emitter phase moves. The triangle does not. Amplitude, R, and ω stay put.",
  changing: "Emitter phase only",
  held: "Node seats, 120° spacing, R, ω, aircraft state, source amplitude, active emitter count",
  watch: "Maxwell face, Poynting arrows, peak |E|, peak |B|, F, G, electric-like ε, pair estimate. Geometry stays on the equal ring.",
  prediction: "The triangle stays on the 120° seats. The Maxwell face changes only because source phase changed. The fixed scramble is 17° / 203° / 291°, not a fresh random draw. No transport equation appears.",
  duration: PHASE_T,
  hot: () => ["phaseA", "phaseB", "phaseC"],
  baseline: () => ({
    ...QUIET_AIR,
    running: true,
    mode: "scripted",
    latencyMs: 0,
    orbitRadius: 48,
    aMax: 80,
    orbitRate: 1.2,
    speed: 80,
    frame: "bore",
    eRef: 100,
    simulateAmplitude: false,
    enforceBudget: true,
    phasePreset: "manual",
    phaseA: 0,
    phaseB: 120,
    phaseC: 240,
    activeCount: 3,
    seatBendDeg: 0,
  }),
  at(elapsed) {
    let phaseA = 0;
    let phaseB = 120;
    let phaseC = 240;
    let mark: string | undefined;
    if (elapsed < 1.5) {
      phaseA = 0;
      phaseB = 120;
      phaseC = 240;
    } else if (elapsed < 3.5) {
      const u = (elapsed - 1.5) / 2;
      phaseB = lerp(120, 190, u);
      mark = "PHASE PERTURBATION";
    } else if (elapsed < 6) {
      phaseA = SCRAMBLE.a;
      phaseB = SCRAMBLE.b;
      phaseC = SCRAMBLE.c;
      mark = "PHASE PERTURBATION";
    } else if (elapsed < 8) {
      const u = (elapsed - 6) / 2;
      phaseA = lerp(SCRAMBLE.a, 0, u);
      phaseB = lerp(SCRAMBLE.b, 120, u);
      phaseC = lerp(SCRAMBLE.c, 240, u);
    }
    return {
      controls: { phasePreset: "manual", phaseA, phaseB, phaseC },
      mark,
    };
  },
  observe(params, snap) {
    return [
      `phase ${params.phaseA.toFixed(0)}/${params.phaseB.toFixed(0)}/${params.phaseC.toFixed(0)}°`,
      `seat ${params.seatBendDeg.toFixed(1)}°`,
      `R ${params.orbitRadius.toFixed(0)} m`,
      `ω ${params.orbitRate.toFixed(2)}`,
      `gap ${snap.gapErrDeg.toFixed(2)}°`,
      `|E| ${snap.qed.ePeak.toExponential(2)}`,
      `|B| ${snap.qed.bPeak.toExponential(2)}`,
      `F ${snap.qed.F.toExponential(2)}`,
      `G ${snap.qed.G.toExponential(2)}`,
      `ε ${snap.qed.eps.toExponential(2)}`,
      snap.qed.rateApplicable ? `pairs ${snap.qed.rate.toExponential(2)}` : "pairs underflow",
    ].join(" · ");
  },
};

const SCHWINGER_T = 12;
const CHI0 = 1e-3;
const CHI1 = 30;
const CHI_MARKS = [0.01, 0.1, 1, 10];

export function schwingerChi(elapsed: number) {
  const u = clamp01(elapsed / SCHWINGER_T);
  return CHI0 * (CHI1 / CHI0) ** u;
}

const schwinger: PresetDef = {
  id: "schwinger",
  index: "04",
  title: "Schwinger sweep",
  purpose: "Commanded amplitude sweeps. Maxwell scales. The pair estimate does not. Nothing else moves.",
  changing: "Commanded source amplitude E0 only",
  held: "Aircraft, controller, node geometry, source phase, frequency, polarization, active count",
  watch: "Delivered E, E/Es, electric-like ε, pair exponent, pair-production approximation.",
  prediction:
    "Maxwell |E| scales with E0. The pair estimate stays negligible until near Es, then moves nonlinearly. E/Es = 1 does not arm the vacuum bore, create a metric, move the aircraft, arm the destination anchor, produce a displacement, or cross the ????? seam.",
  duration: SCHWINGER_T,
  hot: () => ["eRef"],
  baseline: () => ({
    ...QUIET_AIR,
    running: true,
    mode: "scripted",
    latencyMs: 0,
    orbitRadius: 48,
    aMax: 80,
    orbitRate: 1.2,
    speed: 0,
    frame: "bore",
    eRef: 1e4,
    simulateAmplitude: true,
    enforceBudget: true,
    phasePreset: "triad",
    phaseA: 0,
    phaseB: 120,
    phaseC: 240,
    activeCount: 3,
    seatBendDeg: 0,
  }),
  at(elapsed, ctx) {
    const chi = schwingerChi(elapsed);
    const eRef = (ctx.eAtUnity > 0 ? ctx.eAtUnity : 1) * chi;
    let mark: string | undefined;
    for (const level of CHI_MARKS) {
      if (chi >= level) mark = `E/Es = ${level}`;
    }
    return { controls: { eRef, simulateAmplitude: true, vacuumBore: false, anchor: false }, mark };
  },
  observe(params, snap) {
    const q = snap.qed;
    return [
      `E0 ${params.eRef.toExponential(2)} V/m`,
      `delivered ${q.ePeak.toExponential(2)} V/m`,
      `E/Es ${q.eOverEs.toExponential(2)}`,
      `ε ${q.eps.toExponential(2)}`,
      `exponent ${Number.isFinite(q.exponent) ? q.exponent.toExponential(2) : "—"}`,
      q.rateApplicable ? `pairs ${q.rate.toExponential(2)}` : "pairs underflow",
      `bore ${params.vacuumBore ? "ON" : "off"}`,
      `anchor ${params.anchor ? "ON" : "off"}`,
      "E/Es = 1 does not arm bore, anchor, metric, or displacement",
    ].join(" · ");
  },
};

const NULL_SETTLE = 1.2;
const NULL_DONE = 5.2;
const NULL_T = 6;

function nullChanging(v: NullVar) {
  if (v === "phase") return "Emitter phase B only";
  if (v === "count") return "Active emitter count only";
  return "Source amplitude E0 only";
}

function nullPrediction(v: NullVar) {
  const which = v === "phase" ? "phase B (+90°)" : v === "count" ? "active count (3 → 1)" : "amplitude (10³ → 10⁴ V/m)";
  return `State B changes ${which} and nothing else. Field ratio and pair-estimate ratio are comparable only if geometry and the controller match. A mismatch is flagged. No transport equation appears.`;
}

const nullAb: PresetDef = {
  id: "null",
  index: "05",
  title: "Null A/B",
  purpose: "A boring comparison. Freeze A, change exactly one source variable, freeze B.",
  changing: "One source variable — default amplitude",
  held: "Geometry, controller, aircraft, and every source variable that was not selected",
  watch: "A versus B, the changed variable, the unchanged variables, field ratio, pair-estimate ratio, geometry equality.",
  prediction: nullPrediction("amplitude"),
  duration: NULL_T,
  hot: (ctx) => (ctx.nullVar === "phase" ? ["phaseB"] : ctx.nullVar === "count" ? ["activeCount"] : ["eRef"]),
  baseline: (ctx) => ({
    ...QUIET_AIR,
    running: true,
    mode: "scripted",
    latencyMs: 0,
    orbitRadius: 48,
    aMax: 80,
    orbitRate: 1.2,
    speed: 80,
    frame: "bore",
    eRef: 1000,
    simulateAmplitude: true,
    enforceBudget: true,
    phasePreset: ctx.nullVar === "phase" ? "manual" : "triad",
    phaseA: 0,
    phaseB: 120,
    phaseC: 240,
    activeCount: 3,
    seatBendDeg: 0,
  }),
  at(elapsed, ctx) {
    const u = elapsed <= NULL_SETTLE ? 0 : clamp01((elapsed - NULL_SETTLE) / (NULL_DONE - NULL_SETTLE));
    const controls: Partial<Params> =
      ctx.nullVar === "phase"
        ? { phasePreset: "manual", phaseA: 0, phaseB: lerp(120, 210, u), phaseC: 240 }
        : ctx.nullVar === "count"
          ? { activeCount: elapsed >= NULL_SETTLE ? 1 : 3 }
          : { eRef: lerp(1000, 10000, u) };
    let freeze: "a" | "b" | undefined;
    if (elapsed >= NULL_DONE) freeze = "b";
    else if (elapsed >= NULL_SETTLE) freeze = "a";
    return { controls, freeze };
  },
  observe(params, snap) {
    return [
      `E0 ${params.eRef.toExponential(2)}`,
      `phase B ${params.phaseB.toFixed(0)}°`,
      `count ${params.activeCount}`,
      `|E| ${snap.qed.ePeak.toExponential(2)}`,
      `R ${params.orbitRadius.toFixed(1)}`,
      `ω ${params.orbitRate.toFixed(2)}`,
      `seat ${params.seatBendDeg.toFixed(1)}°`,
      `gap ${snap.gapErrDeg.toFixed(2)}°`,
    ].join(" · ");
  },
};

export const PRESETS: PresetDef[] = [cliff, break120, breakPhase, schwinger, nullAb];

export function presetById(id: PresetId): PresetDef {
  const found = PRESETS.find((p) => p.id === id);
  if (!found) throw new Error(`Unknown preset ${id}`);
  return found;
}

export function nullCopy(v: NullVar): { changing: string; prediction: string } {
  return { changing: nullChanging(v), prediction: nullPrediction(v) };
}

export const CHI_LEVELS = CHI_MARKS;
