/**
 * Post-run result cards. Pure functions of integrator-time samples.
 * They do not step the solver, rewrite presets, or add a threshold the run
 * did not already use. Wall-clock time is not read.
 */
import { CHI_LEVELS, presetById, type NullVar, type PresetId } from "./presets";
import type { FrozenState, Params, Snapshot } from "./types";

export type RunSample = {
  t: number;
  omega: number;
  radius: number;
  aMax: number;
  demand: number;
  saturated: boolean;
  track: number;
  actualR: number;
  commandedR: number;
  gap: number;
  phaseSlip: number;
  seat: number;
  phaseA: number;
  phaseB: number;
  phaseC: number;
  emA: number;
  emB: number;
  emC: number;
  eRef: number;
  ePeak: number;
  bPeak: number;
  chi: number;
  F: number;
  G: number;
  exponent: number;
  rate: number;
  rateOn: boolean;
  eChem: number;
  eChem0: number;
  vacuumBore: boolean;
  anchor: boolean;
  mode: string;
  frame: string;
  speed: number;
  tas: number;
  activeCount: number;
  freq: number;
  latency: number;
  acquisition: string;
  orient: string;
  simulate: boolean;
};

export type ResultCard = {
  id: PresetId;
  index: string;
  title: string;
  build: string;
  speed: 1 | 0.25;
  flag: string;
  control: string;
  observed: string;
  interpretation: string;
  notImplied: string;
  plain: string;
};

export type ResultInput = {
  id: PresetId;
  speed: 1 | 0.25;
  nullVar: NullVar | null;
  samples: RunSample[];
  marks: { t: number; label: string }[];
  geometryFlag: string;
  captureA: FrozenState | null;
  captureB: FrozenState | null;
};

/** Same phase tolerance already used by the null A/B geometry check. Not a new cutoff. */
const PHASE_DEG = 0.51;
/** Same airspeed tolerance already used by that check. */
const TAS_MPS = 0.25;

const DENIAL =
  "This run does not support Pais, Ponder, Puthoff, transport, metric engineering, or any claim about MH370.";

export function sampleOf(params: Params, snap: Snapshot): RunSample {
  const n = snap.nodes;
  const q = snap.qed;
  return {
    t: snap.t,
    omega: params.orbitRate,
    radius: params.orbitRadius,
    aMax: params.aMax,
    demand: snap.demandRatio,
    saturated: snap.saturated,
    track: snap.trackErr,
    actualR: snap.clearance.actualR,
    commandedR: snap.clearance.commandedR,
    gap: snap.gapErrDeg,
    phaseSlip: snap.phaseErrDeg,
    seat: params.seatBendDeg,
    phaseA: params.phaseA,
    phaseB: params.phaseB,
    phaseC: params.phaseC,
    emA: n[0]?.emDeg ?? Number.NaN,
    emB: n[1]?.emDeg ?? Number.NaN,
    emC: n[2]?.emDeg ?? Number.NaN,
    eRef: params.eRef,
    ePeak: q.ePeak,
    bPeak: q.bPeak,
    chi: q.eOverEs,
    F: q.F,
    G: q.G,
    exponent: q.exponent,
    rate: q.rate,
    rateOn: q.rateApplicable,
    eChem: snap.eChem,
    eChem0: snap.eChem0,
    vacuumBore: params.vacuumBore,
    anchor: params.anchor,
    mode: params.mode,
    frame: params.frame,
    speed: params.speed,
    tas: snap.tas,
    activeCount: params.activeCount,
    freq: params.freqHz,
    latency: params.latencyMs,
    acquisition: snap.acquisition,
    orient: params.orient,
    simulate: params.simulateAmplitude,
  };
}

export function triadBuildId(): string {
  const value = import.meta.env.VITE_TRIAD_BUILD;
  if (typeof value === "string" && value.trim()) return value.trim();
  return "unavailable";
}

export function buildResult(input: ResultInput): ResultCard {
  const def = presetById(input.id);
  const built = fromSamples(input);
  const card: ResultCard = {
    id: input.id,
    index: def.index,
    title: def.title,
    build: triadBuildId(),
    speed: input.speed,
    flag: built.flag,
    control: built.control,
    observed: built.observed,
    interpretation: built.interpretation,
    notImplied: built.notImplied,
    plain: "",
  };
  card.plain = plainText(card);
  return card;
}

function fromSamples(input: ResultInput): Pick<ResultCard, "flag" | "control" | "observed" | "interpretation" | "notImplied"> {
  const { samples } = input;
  if (samples.length === 0) {
    return {
      flag: "",
      control: "No integrator samples were recorded.",
      observed: "The run stopped before an integrator step, so there is no result telemetry.",
      interpretation: "No conclusion. The card does not invent one.",
      notImplied: DENIAL,
    };
  }
  if (input.id === "cliff") return cliffCard(samples, input.marks);
  if (input.id === "break120") return break120Card(samples, input.marks);
  if (input.id === "breakPhase") return breakPhaseCard(samples, input.marks);
  if (input.id === "schwinger") return schwingerCard(samples, input.marks);
  return nullCard(input);
}

function cliffCard(samples: RunSample[], marks: ResultInput["marks"]) {
  const s0 = samples[0];
  const sN = samples[samples.length - 1];
  const wCrit = Math.sqrt(s0.aMax / Math.max(s0.radius, 1e-9));
  const cross = samples.find((s) => s.demand > 1);
  const before = cross ? samples[Math.max(0, samples.indexOf(cross) - 1)] : undefined;
  const after = cross ? samples.slice(samples.indexOf(cross)) : [];
  const demandHi = extreme(samples, (s) => s.demand, "max");
  const trackHi = after.length ? extreme(after, (s) => s.track, "max") : undefined;
  const actualHi = extreme(samples, (s) => s.actualR, "max");
  const sat = samples.find((s) => s.saturated);
  const mark = marks.find((m) => m.label === "CONTROL SATURATION");
  const bore = samples.some((s) => s.vacuumBore);
  const speedDrift = Math.abs(sN.speed - s0.speed) > 1e-6;
  const lines = [
    `integrator t ${t(s0)} → ${t(sN)} s`,
    `predicted ωcrit = sqrt(a_max / R) = sqrt(${num(s0.aMax, 1)} / ${num(s0.radius, 1)}) = ${num(wCrit, 3)} rad/s`,
    cross
      ? `first ω with ω²R/a_max > 1: ω ${num(cross.omega, 3)} rad/s at t ${t(cross)} s (demand/cap ${num(cross.demand, 3)})`
      : "first ω with ω²R/a_max > 1: not recorded",
    mark ? `command mark CONTROL SATURATION at integrator t ${num(mark.t, 3)} s (script uses demand ≥ 1)` : "command mark CONTROL SATURATION: not recorded",
    `demand/cap max ${num(demandHi.sample.demand, 3)} at t ${t(demandHi.sample)} s (ω ${num(demandHi.sample.omega, 3)} rad/s)`,
    before
      ? `tracking error before that crossing: ${num(before.track, 2)} m at t ${t(before)} s`
      : `tracking error at start: ${num(s0.track, 2)} m`,
    trackHi
      ? `tracking error after: final ${num(sN.track, 2)} m, max ${num(trackHi.sample.track, 2)} m at t ${t(trackHi.sample)} s`
      : `tracking error final ${num(sN.track, 2)} m`,
    `actual R initial ${num(s0.actualR, 2)} m, at crossing ${cross ? num(cross.actualR, 2) : "—"} m, final ${num(sN.actualR, 2)} m, max ${num(actualHi.sample.actualR, 2)} m`,
    `commanded R ${num(s0.commandedR, 2)} → ${num(sN.commandedR, 2)} m`,
    `node-radius departure (actual − commanded) final ${num(sN.actualR - sN.commandedR, 2)} m, max ${num(actualHi.sample.actualR - actualHi.sample.commandedR, 2)} m`,
    sat
      ? `existing CONTROL SATURATED flag (demand/cap > 1.05) first true at t ${t(sat)} s`
      : "existing CONTROL SATURATED flag: not true in this trace",
    `acquisition ${s0.acquisition} → ${sN.acquisition}`,
    `speed command ${num(s0.speed, 1)} → ${num(sN.speed, 1)} m/s`,
    `vacuum bore ${bore ? "ON during the trace" : "off for the whole trace"}`,
    "This record is controller saturation. It is not a field, QED, or aircraft-interaction measurement.",
  ];
  const crossed = !!cross;
  const interpretation = crossed
    ? "Commanded centripetal demand ω²R crossed the controller acceleration cap. Tracking error and actual node radius are the loop's response to that cap. This is controller saturation, not a field, QED, or aircraft interaction."
    : "This trace never recorded ω²R/a_max > 1, so it does not show the control cliff.";
  const flag = [bore ? "FLAG — vacuum bore came on." : "", speedDrift ? "FLAG — speed command changed." : ""].filter(Boolean).join(" ");
  return {
    flag,
    control: controlBlock(samples),
    observed: lines.join("\n"),
    interpretation,
    notImplied: `Loss of tracking here is not evidence that a Maxwell field, a strong-field effect, or the airframe caused the departure. ${DENIAL}`,
  };
}

function break120Card(samples: RunSample[], marks: ResultInput["marks"]) {
  const s0 = samples[0];
  const sN = samples[samples.length - 1];
  const seatHi = extreme(samples, (s) => s.seat, "max");
  const gapHi = extreme(samples, (s) => s.gap, "max");
  const trackHi = extreme(samples, (s) => s.track, "max");
  const drift = maxPhaseDrift(samples);
  const phaseHeld = drift.cmd <= PHASE_DEG && drift.em <= PHASE_DEG;
  const at = sampleAfter(samples, marks, "GEOMETRY PERTURBATION");
  const lines = [
    `integrator t ${t(s0)} → ${t(sN)} s`,
    `commanded seat initial ${num(s0.seat, 2)}°, max ${num(seatHi.sample.seat, 2)}° at t ${t(seatHi.sample)} s, final ${num(sN.seat, 2)}°`,
    `pairwise gap error (worst gap minus 120°) initial ${num(s0.gap, 2)}°, max ${num(gapHi.sample.gap, 2)}° at t ${t(gapHi.sample)} s, final ${num(sN.gap, 2)}°`,
    at ? `at GEOMETRY PERTURBATION t ${t(at)} s: seat ${num(at.seat, 2)}°, gap ${num(at.gap, 2)}°, track ${num(at.track, 2)} m` : "GEOMETRY PERTURBATION mark: not recorded",
    `tracking error initial ${num(s0.track, 2)} m, max ${num(trackHi.sample.track, 2)} m at t ${t(trackHi.sample)} s, final ${num(sN.track, 2)} m`,
    `commanded phase drift max ${num(drift.cmd, 2)}° (hold ≤ ${PHASE_DEG}°)`,
    `emitter phase readout drift max ${num(drift.em, 2)}° from the initial readout`,
    `emitter phase initial ${phaseTriple(s0.emA, s0.emB, s0.emC)}, final ${phaseTriple(sN.emA, sN.emB, sN.emC)}`,
    phaseHeld ? "Emitter phase stayed at the held values." : "FLAG — emitter phase moved.",
  ];
  return {
    flag: phaseHeld ? "" : "FLAG — emitter phase moved. Geometry was not the only change.",
    control: controlBlock(samples),
    observed: lines.join("\n"),
    interpretation: phaseHeld
      ? "Node 2's commanded seat left the equal ring and the measured pairwise gap error followed that seat. Emitter phase did not change. Tracking error is the controller following the moved slot."
      : "The seat moved, but emitter phase also moved, so this run does not isolate geometry from phase.",
    notImplied: `A change in gap error is not a field law, a phase-lock result, or a transport path. ${DENIAL}`,
  };
}

function breakPhaseCard(samples: RunSample[], marks: ResultInput["marks"]) {
  const s0 = samples[0];
  const sN = samples[samples.length - 1];
  const slipHi = extreme(samples, (s) => s.phaseSlip, "max");
  const slipLo = extreme(samples, (s) => s.phaseSlip, "min");
  const eHi = extreme(samples, (s) => s.ePeak, "max");
  const eLo = extreme(samples, (s) => s.ePeak, "min");
  const far = extreme(samples, (s) => phaseDistance(s, s0), "max");
  const at = sampleAfter(samples, marks, "PHASE PERTURBATION");
  const seatDrift = maxAbs(samples, (s) => s.seat - s0.seat);
  const rDrift = maxAbs(samples, (s) => s.radius - s0.radius);
  const geomHeld = seatDrift <= 1e-6 && rDrift <= 1e-6;
  const lines = [
    `integrator t ${t(s0)} → ${t(sN)} s`,
    `commanded phase initial ${phaseTriple(s0.phaseA, s0.phaseB, s0.phaseC)}`,
    at ? `at PHASE PERTURBATION t ${t(at)} s: commanded ${phaseTriple(at.phaseA, at.phaseB, at.phaseC)}` : "PHASE PERTURBATION mark: not recorded",
    `largest commanded phase distance from the start: ${phaseTriple(far.sample.phaseA, far.sample.phaseB, far.sample.phaseC)} at t ${t(far.sample)} s`,
    `commanded phase final ${phaseTriple(sN.phaseA, sN.phaseB, sN.phaseC)}`,
    `phase slip min ${num(slipLo.sample.phaseSlip, 2)}° at t ${t(slipLo.sample)} s, max ${num(slipHi.sample.phaseSlip, 2)}° at t ${t(slipHi.sample)} s`,
    `peak |E| initial ${sci(s0.ePeak)} V/m, at mark ${at ? sci(at.ePeak) : "—"} V/m, final ${sci(sN.ePeak)} V/m, min ${sci(eLo.sample.ePeak)} V/m, max ${sci(eHi.sample.ePeak)} V/m`,
    `peak |B| initial ${sci(s0.bPeak)} T, at mark ${at ? sci(at.bPeak) : "—"} T, final ${sci(sN.bPeak)} T`,
    `F initial ${sci(s0.F)}, at mark ${at ? sci(at.F) : "—"}, final ${sci(sN.F)}`,
    `G initial ${sci(s0.G)}, at mark ${at ? sci(at.G) : "—"}, final ${sci(sN.G)}`,
    `seat |Δ| max ${sci(seatDrift)}°, R |Δ| max ${sci(rDrift)} m`,
    geomHeld ? "Commanded seat and R stayed at the initial values." : "FLAG — seat or R changed.",
  ];
  return {
    flag: geomHeld ? "" : "FLAG — geometric seat or R changed during a phase-only run.",
    control: controlBlock(samples),
    observed: lines.join("\n"),
    interpretation: geomHeld
      ? "Emitter phase changed. Commanded seat and orbit radius did not. The recorded |E|, |B|, F, and G response is the existing Maxwell solution at those phases, not a geometry change."
      : "Phase was not the only recorded change, so the field response is not isolated from geometry.",
    notImplied: `A phase-driven change in the Maxwell telemetry is not a vacuum-bore transition, a displacement, or a metric. ${DENIAL}`,
  };
}

function schwingerCard(samples: RunSample[], marks: ResultInput["marks"]) {
  const s0 = samples[0];
  const sN = samples[samples.length - 1];
  const hold = holdReport(samples);
  const crossings = CHI_LEVELS.map((level) => {
    const hit = samples.find((s) => s.chi >= level);
    const mark = marks.find((m) => m.label === `E/Es = ${level}`);
    if (!hit) return `E/Es ≥ ${level}: not reached in delivered E/Es${mark ? ` (command mark t ${num(mark.t, 3)} s)` : ""}`;
    const pair = hit.rateOn && Number.isFinite(hit.rate) ? `pairs ${sci(hit.rate)} m⁻³ s⁻¹` : "pairs not representable";
    const exp = Number.isFinite(hit.exponent) ? `exponent ${sci(hit.exponent)}` : "exponent —";
    return `E/Es ≥ ${level}: delivered ${sci(hit.chi)} at t ${t(hit)} s, |E| ${sci(hit.ePeak)} V/m, ${exp}, ${pair}`;
  });
  const lines = [
    `integrator t ${t(s0)} → ${t(sN)} s`,
    `delivered E/Es initial ${sci(s0.chi)} at t ${t(s0)} s`,
    `delivered E/Es final ${sci(sN.chi)} at t ${t(sN)} s`,
    `E0 initial ${sci(s0.eRef)} V/m, final ${sci(sN.eRef)} V/m`,
    ...crossings,
    hold.text,
    "No transport, displacement, or vacuum-bore transition is implemented. Crossing these E/Es levels did not arm one.",
  ];
  return {
    flag: hold.ok ? "" : hold.text,
    control: controlBlock(samples),
    observed: lines.join("\n"),
    interpretation: hold.ok
      ? "Only commanded amplitude moved. Delivered E/Es followed that sweep. Pair estimates are reported only where the existing constant-field series is numerically representable. No transport, displacement, or vacuum-bore transition is implemented, and none of those flags turned on."
      : "Amplitude was not the only recorded change, so this sweep does not isolate E0.",
    notImplied: `E/Es = 1 is not a switch, a bore, a displacement, or a metric. ${DENIAL}`,
  };
}

function nullCard(input: ResultInput) {
  const which = input.nullVar ?? "amplitude";
  const name = which === "phase" ? "phase B" : which === "count" ? "active count" : "amplitude E0";
  const a = input.captureA;
  const b = input.captureB;
  if (!a || !b) {
    return {
      flag: "FLAG — Freeze A and Freeze B did not both land.",
      control: controlBlock(input.samples),
      observed: "A/B captures are missing, so differences are not reported.",
      interpretation: "No single-variable comparison. The card does not fill in the missing side.",
      notImplied: DENIAL,
    };
  }
  const sa = nearest(input.samples, a.t);
  const sb = nearest(input.samples, b.t);
  const flag = input.geometryFlag.startsWith("FLAG") ? input.geometryFlag : "";
  const reservoir = reservoirLine(sa, sb);
  const lines = [
    flag || input.geometryFlag || "Geometry flag was not recorded.",
    `single changed variable: ${name}`,
    `A at integrator t ${num(a.t, 3)} s`,
    sideLine("A", a, sa),
    `B at integrator t ${num(b.t, 3)} s`,
    sideLine("B", b, sb),
    `Δ peak |E| ${sci(b.qed.ePeak - a.qed.ePeak)} V/m (B/A ${ratio(b.qed.ePeak, a.qed.ePeak)})`,
    `Δ peak |B| ${sci(b.qed.bPeak - a.qed.bPeak)} T (B/A ${ratio(b.qed.bPeak, a.qed.bPeak)})`,
    `Δ F ${sci(b.qed.F - a.qed.F)} (B/A ${ratio(b.qed.F, a.qed.F)})`,
    `Δ G ${sci(b.qed.G - a.qed.G)} (B/A ${ratio(b.qed.G, a.qed.G)})`,
    pairLine(a, b),
    reservoir,
    `geometry R ${num(a.radius, 2)} → ${num(b.radius, 2)} m, ω ${num(a.omega, 3)} → ${num(b.omega, 3)} rad/s, speed ${num(a.speed, 1)} → ${num(b.speed, 1)} m/s`,
    `controller mode ${a.mode} → ${b.mode}, frame ${a.frame} → ${b.frame}, a_max ${num(a.aMax, 1)} → ${num(b.aMax, 1)}, latency ${num(a.latencyMs, 1)} → ${num(b.latencyMs, 1)} ms`,
    `phase ${phaseTriple(a.phaseA, a.phaseB, a.phaseC)} → ${phaseTriple(b.phaseA, b.phaseB, b.phaseC)}, count ${a.activeCount} → ${b.activeCount}`,
    sa && sb ? `gap ${num(sa.gap, 2)}° → ${num(sb.gap, 2)}°, seat ${num(sa.seat, 2)}° → ${num(sb.seat, 2)}°` : "gap and seat at the capture times were not in the trace",
  ];
  const clean = !flag;
  return {
    flag,
    control: controlBlock(input.samples),
    observed: lines.join("\n"),
    interpretation: clean
      ? `State B changed ${name} and the held geometry and controller telemetry matched. Field and pair differences are the existing solver's response to that one variable.`
      : `The run was supposed to change only ${name}. A held quantity changed, so this is not a clean single-variable comparison.`,
    notImplied: `An A/B field ratio is not a transport result and not evidence for a mechanism. ${DENIAL}`,
  };
}

function holdReport(samples: RunSample[]) {
  const a = samples[0];
  const issues: string[] = [];
  if (maxAbs(samples, (s) => s.radius - a.radius) > 1e-6) issues.push("R");
  if (maxAbs(samples, (s) => s.omega - a.omega) > 1e-6) issues.push("ω");
  if (maxAbs(samples, (s) => s.seat - a.seat) > 1e-6) issues.push("seat");
  if (maxAbs(samples, (s) => s.speed - a.speed) > 1e-6) issues.push("speed command");
  if (maxAbs(samples, (s) => s.tas - a.tas) > TAS_MPS) issues.push("airspeed");
  if (maxAbs(samples, (s) => s.aMax - a.aMax) > 1e-6) issues.push("a_max");
  if (maxAbs(samples, (s) => s.latency - a.latency) > 1e-6) issues.push("latency");
  if (maxAbs(samples, (s) => s.freq - a.freq) > 1e-6) issues.push("frequency");
  if (samples.some((s) => s.mode !== a.mode)) issues.push("mode");
  if (samples.some((s) => s.frame !== a.frame)) issues.push("frame");
  if (samples.some((s) => s.orient !== a.orient)) issues.push("polarization");
  if (samples.some((s) => s.activeCount !== a.activeCount)) issues.push("active count");
  if (maxPhaseDrift(samples).cmd > PHASE_DEG) issues.push("phase");
  if (samples.some((s) => s.vacuumBore)) issues.push("vacuum bore");
  if (samples.some((s) => s.anchor)) issues.push("anchor");
  if (issues.length) return { ok: false, text: `FLAG — held aircraft, controller, or geometry changed: ${issues.join(", ")}.` };
  return {
    ok: true,
    text: "Aircraft, controller, and geometry stayed at the recorded initial values. Vacuum bore stayed off. Anchor stayed off.",
  };
}

function controlBlock(samples: RunSample[]) {
  if (samples.length === 0) return "No integrator samples.";
  const a = samples[0];
  const b = samples[samples.length - 1];
  return [
    `integrator t ${t(a)} s → ${t(b)} s`,
    `mode ${a.mode} → ${b.mode}`,
    `frame ${a.frame} → ${b.frame}`,
    `R ${num(a.radius, 2)} → ${num(b.radius, 2)} m`,
    `ω ${num(a.omega, 3)} → ${num(b.omega, 3)} rad/s`,
    `a_max ${num(a.aMax, 1)} → ${num(b.aMax, 1)} m/s²`,
    `latency ${num(a.latency, 1)} → ${num(b.latency, 1)} ms`,
    `speed command ${num(a.speed, 1)} → ${num(b.speed, 1)} m/s`,
    `airspeed ${num(a.tas, 2)} → ${num(b.tas, 2)} m/s`,
    `seat ${num(a.seat, 2)} → ${num(b.seat, 2)} °`,
    `phase ${phaseTriple(a.phaseA, a.phaseB, a.phaseC)} → ${phaseTriple(b.phaseA, b.phaseB, b.phaseC)}`,
    `E0 ${sci(a.eRef)} → ${sci(b.eRef)} V/m`,
    `count ${a.activeCount} → ${b.activeCount}`,
    `frequency ${sci(a.freq)} Hz`,
    `polarization ${a.orient} → ${b.orient}`,
    `simulate ${a.simulate ? "on" : "off"} → ${b.simulate ? "on" : "off"}`,
    `vacuum bore ${a.vacuumBore ? "on" : "off"} → ${b.vacuumBore ? "on" : "off"}`,
    `anchor ${a.anchor ? "on" : "off"} → ${b.anchor ? "on" : "off"}`,
  ].join("\n");
}

function sideLine(label: string, cap: FrozenState, sample: RunSample | undefined) {
  const q = cap.qed;
  const pair = q.rateApplicable ? `pairs ${sci(q.rate)}` : "pairs not representable";
  const chem = sample ? `reservoir ${sci(sample.eChem)} / ${sci(sample.eChem0)} J` : "reservoir not in trace";
  return `${label} E0 ${sci(cap.eRef)} V/m, |E| ${sci(q.ePeak)} V/m, |B| ${sci(q.bPeak)} T, F ${sci(q.F)}, G ${sci(q.G)}, E/Es ${sci(q.eOverEs)}, ${pair}, exponent ${Number.isFinite(q.exponent) ? sci(q.exponent) : "—"}, ${chem}`;
}

function pairLine(a: FrozenState, b: FrozenState) {
  const left = a.qed.rateApplicable ? sci(a.qed.rate) : "not representable";
  const right = b.qed.rateApplicable ? sci(b.qed.rate) : "not representable";
  return `pair estimate A ${left}, B ${right}`;
}

function reservoirLine(a: RunSample | undefined, b: RunSample | undefined) {
  if (!a || !b) return "reservoir: capture times were not in the integrator trace";
  const same = a.eChem === b.eChem && a.eChem0 === b.eChem0;
  return `reservoir A ${sci(a.eChem)} J, B ${sci(b.eChem)} J, tank ${sci(a.eChem0)} J${same ? " (unchanged)" : " (DIFFERS)"}`;
}

function plainText(card: ResultCard) {
  return [
    "TRIAD EXPERIMENT RUN",
    `experiment: ${card.index} ${card.title}`,
    `preset: ${card.id}`,
    `build: ${card.build}`,
    `time scale: ${card.speed}×`,
    "integrator step: 1/60 s",
    "wall clock is not used",
    card.flag ? `flag: ${card.flag}` : "flag: none",
    "",
    "CONTROL STATE",
    card.control,
    "",
    "OBSERVED IN MODEL",
    card.observed,
    "",
    "INTERPRETATION",
    card.interpretation,
    "",
    "NOT IMPLIED",
    card.notImplied,
    "",
  ].join("\n");
}

function sampleAfter(samples: RunSample[], marks: ResultInput["marks"], label: string) {
  const mark = marks.find((m) => m.label === label);
  if (!mark) return undefined;
  return samples.find((s) => s.t > mark.t + 1e-9);
}

function nearest(samples: RunSample[], time: number) {
  let best: RunSample | undefined;
  let bestD = Infinity;
  for (const s of samples) {
    const d = Math.abs(s.t - time);
    if (d < bestD) {
      best = s;
      bestD = d;
    }
  }
  return best;
}

function extreme(samples: RunSample[], pick: (s: RunSample) => number, which: "min" | "max") {
  let sample = samples[0];
  let value = pick(sample);
  for (const s of samples) {
    const v = pick(s);
    if (which === "max" ? v > value : v < value) {
      value = v;
      sample = s;
    }
  }
  return { sample, value };
}

function maxAbs(samples: RunSample[], pick: (s: RunSample) => number) {
  let m = 0;
  for (const s of samples) m = Math.max(m, Math.abs(pick(s)));
  return m;
}

function maxPhaseDrift(samples: RunSample[]) {
  const a = samples[0];
  let cmd = 0;
  let em = 0;
  for (const s of samples) {
    cmd = Math.max(cmd, angDiff(s.phaseA, a.phaseA), angDiff(s.phaseB, a.phaseB), angDiff(s.phaseC, a.phaseC));
    em = Math.max(em, angDiff(s.emA, a.emA), angDiff(s.emB, a.emB), angDiff(s.emC, a.emC));
  }
  return { cmd, em };
}

function phaseDistance(s: RunSample, origin: RunSample) {
  return Math.max(angDiff(s.phaseA, origin.phaseA), angDiff(s.phaseB, origin.phaseB), angDiff(s.phaseC, origin.phaseC));
}

function angDiff(a: number, b: number) {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
}

function phaseTriple(a: number, b: number, c: number) {
  return `${num(a, 1)}/${num(b, 1)}/${num(c, 1)} °`;
}

function ratio(b: number, a: number) {
  if (!(a !== 0) || !Number.isFinite(a) || !Number.isFinite(b)) return "n/a";
  return sci(b / a);
}

function t(s: RunSample) {
  return num(s.t, 3);
}

function num(n: number, digits: number) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

function sci(n: number) {
  if (!Number.isFinite(n)) return "—";
  if (n === 0) return "0";
  return n.toExponential(2);
}
