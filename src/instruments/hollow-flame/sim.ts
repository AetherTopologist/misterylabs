import * as React from "react";
import { deathLine, evaluate, type Eval, type Subject } from "@/instruments/hollow-flame/physics";

export type { Subject };
export type Mode = "luminous" | "temperature" | "reaction" | "section";
export type Phase = "cold" | "igniting" | "stable" | "perturbed" | "extinguishing" | "out";
export type CameraCue = "" | "three" | "above" | "wide";

type Script =
  | "cue-ignite"
  | "to-stable"
  | "hold-stable"
  | "to-recover"
  | "hold-recover"
  | "to-out"
  | "done";

export type Snap = {
  subject: Subject;
  mode: Mode;
  phase: Phase;
  fuel: number;
  oxygen: number;
  airflow: number;
  amp: number;
  activity: number;
  secondary: number;
  margin: number;
  tempC: number | null;
  thickness: number;
  elapsed: number;
  caption: string;
  script: Script | null;
  epoch: number;
};

const PRESET: Record<Exclude<Subject, "manifold">, { fuel: number; oxygen: number; airflow: number }> = {
  flame: { fuel: 0.72, oxygen: 0.8, airflow: 0.18 },
  plasmoid: { fuel: 0.75, oxygen: 0.62, airflow: 0.2 },
  cell: { fuel: 0.7, oxygen: 0.84, airflow: 0.16 },
};

export const sim = {
  subject: "flame" as Subject,
  mode: "luminous" as Mode,
  phase: "cold" as Phase,
  fuel: 0.72,
  oxygen: 0.8,
  airflow: 0.18,
  amp: 0,
  activity: 0,
  secondary: 0.08,
  margin: 0,
  tempC: 22 as number | null,
  thickness: 0.08,
  size: 0.2,
  targetH: 1.2,
  airEff: 0.18,
  elapsed: 0,
  age: 0,
  gust: 0,
  gustHold: 0,
  smoke: 0,
  wound: 0,
  below: 0,
  grace: 0,
  outcome: "",
  outcomeAge: 0,
  recovered: false,
  script: null as Script | null,
  scriptHold: 0,
  touched: false,
  reduced: false,
  cameraCue: "" as CameraCue,
  epoch: 0,
};

const listeners = new Set<() => void>();
let loops = 0;
let raf = 0;
let uiAccum = 0;

function emit() {
  listeners.forEach((fn) => fn());
}

function kind() {
  return sim.subject === "manifold" ? "flame" : sim.subject;
}

function failMessage() {
  const k = kind();
  if (k === "plasmoid") return "The discharge never formed a sheath. Raise drive, or ease the disruption.";
  if (k === "cell") return "Metabolism never closed. Nutrient or membrane integrity is too low.";
  return "The kernel died. Add fuel or oxygen, or ease the crossflow, then ignite again.";
}

function collapseMessage() {
  const k = kind();
  if (k === "plasmoid") return "The double layer tore. Confinement did not recover.";
  if (k === "cell") return "The gradient ran down. Integrity was already too low to correct the insult.";
  return "The reaction sheet failed. Nothing remains to remember the flame.";
}

function recoverMessage() {
  const k = kind();
  if (k === "plasmoid") return "The sheath held. It can reform only while its driver is still on.";
  if (k === "cell") return "The cell corrected the insult. That is homeostasis, not combustion.";
  return "The flame bent and recovered. A harder crossflow will not be forgiven.";
}

export function regimeLine() {
  const k = kind();
  const death = deathLine(sim.subject);
  if (k === "plasmoid") {
    if (sim.fuel < 0.3) return "Drive is weak. The sheath is thin.";
    if (sim.oxygen < 0.22) return "Ambient density is too low to support a layer.";
    if (sim.airflow > 0.62) return "Disruption is shearing the confinement.";
    if (sim.margin < death) return "Below the confinement threshold.";
    return "Two charge layers and a potential drop. Not a flame.";
  }
  if (k === "cell") {
    if (sim.oxygen < 0.35) return "Membrane integrity is poor. Gradients leak.";
    if (sim.fuel < 0.3) return "Nutrient flux is low. Metabolism idles.";
    if (sim.airflow > 0.55) return "Insult is high. Recovery depends on the membrane.";
    if (sim.margin < death) return "The gradient cannot be maintained.";
    return "Membrane sealed. Interior gradient held on purpose.";
  }
  if (sim.airflow > 0.7) return "Crossflow is stripping the sheet.";
  if (sim.oxygen < 0.3) return "Oxygen-starved. The sheet lifts outward and cools.";
  if (sim.fuel < 0.3) return "Fuel-starved. The envelope shortens.";
  if (sim.margin < death) return "Below the maintenance threshold.";
  return "Fuel-rich core. Oxidizing shell. Nothing stored inside.";
}

function scriptCaption(script: Script | null) {
  switch (script) {
    case "cue-ignite":
    case "to-stable":
      return "Lifecycle · ignition";
    case "hold-stable":
      return "Lifecycle · stabilized";
    case "to-recover":
      return "Lifecycle · perturbation";
    case "hold-recover":
      return "Lifecycle · recovery";
    case "to-out":
      return "Lifecycle · extinction";
    default:
      return "";
  }
}

export function snapshot(): Snap {
  return {
    subject: sim.subject,
    mode: sim.mode,
    phase: sim.phase,
    fuel: sim.fuel,
    oxygen: sim.oxygen,
    airflow: sim.airflow,
    amp: sim.amp,
    activity: sim.activity,
    secondary: sim.secondary,
    margin: sim.margin,
    tempC: sim.tempC,
    thickness: sim.thickness,
    elapsed: sim.elapsed,
    caption: scriptCaption(sim.script) || sim.outcome || regimeLine(),
    script: sim.script,
    epoch: sim.epoch,
  };
}

function applyPreset() {
  const p = PRESET[kind()];
  sim.fuel = p.fuel;
  sim.oxygen = p.oxygen;
  sim.airflow = p.airflow;
  sim.epoch += 1;
}

function approach(current: number, target: number, dt: number, rate: number) {
  return current + (target - current) * (1 - Math.exp(-dt * rate));
}

function beginIgnite() {
  sim.phase = "igniting";
  sim.age = 0;
  sim.elapsed = 0;
  sim.below = 0;
  sim.outcome = "";
  sim.outcomeAge = 0;
  sim.recovered = false;
  sim.gust = 0;
  sim.gustHold = 0;
}

function beginPerturb() {
  if (sim.phase !== "stable" && sim.phase !== "igniting") return;
  sim.phase = "perturbed";
  sim.age = 0;
  sim.below = 0;
  const k = kind();
  sim.gust = k === "cell" ? 0.58 : k === "plasmoid" ? 0.38 : 0.4;
  sim.gustHold = 1.7;
}

function beginQuench() {
  if (sim.phase === "cold" || sim.phase === "out") return;
  sim.phase = "extinguishing";
  sim.age = 0;
  sim.smoke = 1;
  sim.gust = 0;
}

function cancelScript() {
  sim.script = null;
  sim.scriptHold = 0;
}

function advanceScript(dt: number) {
  const script = sim.script;
  if (!script || script === "done") return;
  if (script === "cue-ignite") {
    sim.scriptHold -= dt;
    if (sim.scriptHold <= 0) {
      beginIgnite();
      sim.script = "to-stable";
    }
    return;
  }
  if (script === "to-stable") {
    if (sim.phase === "stable") {
      sim.script = "hold-stable";
      sim.scriptHold = 2.4;
    } else if (sim.phase === "out" || sim.phase === "extinguishing") {
      sim.script = "done";
      if (!sim.outcome) sim.outcome = "The boundary never took.";
    }
    return;
  }
  if (script === "hold-stable") {
    sim.scriptHold -= dt;
    if (sim.scriptHold <= 0) {
      beginPerturb();
      sim.script = "to-recover";
    }
    return;
  }
  if (script === "to-recover") {
    if (sim.phase === "extinguishing" || sim.phase === "out") {
      sim.script = "done";
      if (!sim.outcome) sim.outcome = "Perturbation collapsed the boundary.";
    } else if (sim.phase === "stable") {
      sim.script = "hold-recover";
      sim.scriptHold = 1.7;
    }
    return;
  }
  if (script === "hold-recover") {
    sim.scriptHold -= dt;
    if (sim.scriptHold <= 0) {
      beginQuench();
      sim.script = "to-out";
    }
    return;
  }
  if (script === "to-out" && (sim.phase === "out" || sim.phase === "cold")) {
    sim.script = "done";
    sim.outcome = "Lifecycle complete. The boundary formed, held, bent, and went out.";
    sim.outcomeAge = 0;
  }
}

function applyEval(ev: Eval, dt: number) {
  sim.activity = ev.activity;
  sim.secondary = ev.secondary;
  sim.margin = ev.margin;
  sim.thickness = ev.thickness;
  sim.targetH = ev.height;
  sim.tempC = ev.tempC == null ? null : 22 + (ev.tempC - 22) * Math.max(sim.amp, 0);
  sim.size = Math.max(0.08, ev.height * (0.18 + 0.82 * sim.amp));
  const woundTarget = sim.phase === "perturbed" || sim.phase === "extinguishing" ? 1 : 0;
  sim.wound = approach(sim.wound, woundTarget, dt, 2.2);
}

export function tick(dt: number) {
  const step = Math.min(Math.max(dt, 0), 0.05);
  if (sim.grace > 0) sim.grace = Math.max(0, sim.grace - step);
  if (sim.gustHold > 0) sim.gustHold = Math.max(0, sim.gustHold - step);
  else if (sim.gust > 0) sim.gust = Math.max(0, sim.gust - step * 0.35);

  const air = Math.min(1, sim.airflow + sim.gust);
  sim.airEff = air;
  const ev = evaluate(sim.subject, sim.fuel, sim.oxygen, air);
  const death = deathLine(sim.subject);
  const targetOn = Math.min(1, 0.28 + ev.activity * 1.2);

  switch (sim.phase) {
    case "cold":
    case "out":
      sim.amp = approach(sim.amp, 0, step, 4);
      break;
    case "igniting": {
      sim.age += step;
      const target = ev.activity < 0.07 ? 0.04 : targetOn;
      sim.amp = approach(sim.amp, target, step, 1.8);
      if (ev.activity < 0.07 && sim.age > 1.05) {
        sim.phase = "extinguishing";
        sim.age = 0;
        sim.smoke = 1;
        sim.outcome = failMessage();
        sim.outcomeAge = 0;
      } else if (sim.age > 1.55 && sim.amp > 0.42 && ev.margin > death) {
        sim.phase = "stable";
        sim.age = 0;
      }
      break;
    }
    case "stable": {
      sim.age += step;
      sim.elapsed += step;
      sim.amp = approach(sim.amp, targetOn, step, 2.4);
      if (sim.grace <= 0 && ev.margin < death) {
        sim.below += step;
        if (sim.below > 0.5) {
          sim.phase = "extinguishing";
          sim.age = 0;
          sim.smoke = 1;
          sim.outcome = collapseMessage();
          sim.outcomeAge = 0;
        }
      } else sim.below = 0;
      break;
    }
    case "perturbed": {
      sim.age += step;
      sim.elapsed += step;
      sim.amp = approach(sim.amp, targetOn, step, 3);
      if (ev.margin < death) sim.below += step;
      else sim.below = Math.max(0, sim.below - step);
      if (sim.age > 2.3) {
        if (sim.below > 0.35 || ev.margin < death) {
          sim.phase = "extinguishing";
          sim.age = 0;
          sim.smoke = 1;
          sim.recovered = false;
          sim.outcome = collapseMessage();
          sim.outcomeAge = 0;
        } else {
          sim.phase = "stable";
          sim.age = 0;
          sim.recovered = true;
          sim.outcome = recoverMessage();
          sim.outcomeAge = 0;
        }
      }
      break;
    }
    case "extinguishing": {
      sim.age += step;
      const rate = kind() === "cell" ? 1.15 : 2.6;
      sim.amp = approach(sim.amp, 0, step, rate);
      if (sim.amp < 0.03 || sim.age > 3) {
        sim.amp = 0;
        sim.phase = "out";
        sim.smoke = Math.max(sim.smoke, 0.7);
      }
      break;
    }
  }

  if (sim.phase === "extinguishing") sim.smoke = Math.max(0, sim.smoke - step * 0.12);
  else sim.smoke = Math.max(0, sim.smoke - step * 0.33);

  if (sim.outcome) {
    sim.outcomeAge += step;
    if (sim.outcomeAge > 6.5) sim.outcome = "";
  }

  applyEval(ev, step);
  advanceScript(step);
}

function ensureLoop() {
  if (raf) return;
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    sim.reduced = true;
  }
  let last = performance.now();
  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (typeof document === "undefined" || !document.hidden) tick(dt);
    uiAccum += dt;
    if (uiAccum >= 0.1) {
      uiAccum = 0;
      emit();
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
}

export function useSim() {
  const [snap, setSnap] = React.useState(snapshot);
  React.useEffect(() => {
    const sub = () => setSnap(snapshot());
    listeners.add(sub);
    loops += 1;
    ensureLoop();
    return () => {
      listeners.delete(sub);
      loops -= 1;
      if (loops <= 0) {
        loops = 0;
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
  }, []);
  return snap;
}

function userTouch() {
  sim.touched = true;
  cancelScript();
}

export function userSetFuel(v: number) {
  userTouch();
  sim.fuel = v;
  sim.outcome = "";
  emit();
}
export function userSetOxygen(v: number) {
  userTouch();
  sim.oxygen = v;
  sim.outcome = "";
  emit();
}
export function userSetAirflow(v: number) {
  userTouch();
  sim.airflow = v;
  sim.outcome = "";
  emit();
}

export function userSetMode(mode: Mode) {
  sim.touched = true;
  sim.mode = mode;
  emit();
}

export function userSetSubject(subject: Subject) {
  sim.touched = true;
  cancelScript();
  sim.subject = subject;
  sim.below = 0;
  sim.grace = 0.9;
  sim.cameraCue = subject === "manifold" ? "wide" : "three";
  emit();
}

export function userIgnite() {
  userTouch();
  if (sim.phase === "stable" || sim.phase === "perturbed") return;
  beginIgnite();
  emit();
}

export function userGust() {
  userTouch();
  if (sim.phase !== "stable") return;
  beginPerturb();
  emit();
}

export function userQuench() {
  userTouch();
  beginQuench();
  emit();
}

export function userReset() {
  userTouch();
  applyPreset();
  sim.phase = "cold";
  sim.amp = 0;
  sim.age = 0;
  sim.elapsed = 0;
  sim.gust = 0;
  sim.gustHold = 0;
  sim.smoke = 0;
  sim.wound = 0;
  sim.below = 0;
  sim.outcome = "";
  sim.outcomeAge = 0;
  sim.size = 0.2;
  emit();
}

export function userPlay() {
  sim.touched = true;
  cancelScript();
  applyPreset();
  sim.phase = "cold";
  sim.amp = 0;
  sim.age = 0;
  sim.elapsed = 0;
  sim.gust = 0;
  sim.gustHold = 0;
  sim.smoke = 0;
  sim.wound = 0;
  sim.below = 0;
  sim.outcome = "";
  sim.outcomeAge = 0;
  sim.script = "cue-ignite";
  sim.scriptHold = 0.45;
  sim.cameraCue = sim.subject === "manifold" ? "wide" : "three";
  emit();
}

export function userCamera(cue: CameraCue) {
  sim.cameraCue = cue;
  emit();
}

function userPlayFromExhibit() {
  if (sim.touched) return;
  applyPreset();
  sim.phase = "cold";
  sim.amp = 0;
  sim.script = "cue-ignite";
  sim.scriptHold = 0.4;
  emit();
}

export function armExhibit() {
  const id = window.setTimeout(() => {
    if (!sim.touched && sim.phase === "cold" && !sim.script) userPlayFromExhibit();
  }, 450);
  return () => window.clearTimeout(id);
}
