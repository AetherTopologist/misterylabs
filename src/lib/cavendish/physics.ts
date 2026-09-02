/**
 * Normalized Cavendish torsion-balance model.
 *
 *   I θ¨ + c θ˙ + k θ = τg
 *
 * Three hypothesis modes (the teaching distinction):
 *
 *   ordinary  I = I0,      τg = τ0      same destination, ordinary journey
 *   inertia   I = α I0,    τg = τ0      SAME destination, different journey
 *   gravity   I = I0,      τg = β τ0    DIFFERENT destination
 *
 * α, β run 1.0 → 0.1 as effect strength runs 0 → 1.
 * Constants are normalized for visualization, not laboratory scale.
 */

export type PaisMode = "ordinary" | "inertia" | "gravity";

export const I0 = 1;
export const K = 4;
export const TAU0 = 0.5;

/** Floor so I never hits 0 (ωn would diverge). */
export const EFFECT_FLOOR = 0.1;

export interface SimParams {
  mode: PaisMode;
  /** 0 → 1, maps to α/β = 1.0 → 0.1 */
  strength: number;
  /** Viscous damping coefficient c */
  damping: number;
}

export interface Oscillator {
  theta: number;
  omega: number;
}

export interface HistoryPoint {
  t: number;
  baseline: number;
  active: number;
}

export interface SimState {
  t: number;
  baseline: Oscillator;
  active: Oscillator;
  history: HistoryPoint[];
}

export const HISTORY_WINDOW = 8;
const HISTORY_CAP = 480;

export function effectFactor(strength: number): number {
  const s = clamp(strength, 0, 1);
  return 1 - (1 - EFFECT_FLOOR) * s;
}

export function derive(params: SimParams) {
  const factor = effectFactor(params.strength);
  const alpha = params.mode === "inertia" ? factor : 1;
  const beta = params.mode === "gravity" ? factor : 1;
  const I = alpha * I0;
  const tau = beta * TAU0;
  const c = params.damping;
  const thetaEq = tau / K;
  const thetaEqBaseline = TAU0 / K;
  const omegaN = Math.sqrt(K / I);
  const omegaNBaseline = Math.sqrt(K / I0);
  return {
    alpha,
    beta,
    I,
    tau,
    c,
    k: K,
    thetaEq,
    thetaEqBaseline,
    omegaN,
    omegaNBaseline,
    deflectionRatio: thetaEq / thetaEqBaseline,
    frequencyRatio: omegaN / omegaNBaseline,
  };
}

export type Derived = ReturnType<typeof derive>;

export function initialState(): SimState {
  return {
    t: 0,
    baseline: { theta: 0, omega: 0 },
    active: { theta: 0, omega: 0 },
    history: [{ t: 0, baseline: 0, active: 0 }],
  };
}

export function step(state: SimState, params: SimParams, dt: number): SimState {
  const d = derive(params);
  const baseline = integrate(state.baseline, I0, params.damping, TAU0, dt);
  const active = integrate(state.active, d.I, d.c, d.tau, dt);
  const t = state.t + dt;
  const point: HistoryPoint = {
    t,
    baseline: baseline.theta,
    active: active.theta,
  };
  const history = [...state.history, point];
  const cutoff = t - HISTORY_WINDOW;
  const trimmed =
    history.length > HISTORY_CAP || (history[0] && history[0].t < cutoff)
      ? history.filter((p) => p.t >= cutoff)
      : history;
  return { t, baseline, active, history: trimmed };
}

/** Semi-implicit Euler — stable enough for this damped oscillator. */
function integrate(
  o: Oscillator,
  I: number,
  c: number,
  tau: number,
  dt: number,
): Oscillator {
  const accel = (tau - c * o.omega - K * o.theta) / I;
  const omega = o.omega + accel * dt;
  const theta = o.theta + omega * dt;
  return { theta, omega };
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export const MODE_META: Record<
  PaisMode,
  { label: string; short: string; insight: string; journey: string }
> = {
  ordinary: {
    label: "Ordinary mass",
    short: "Ordinary",
    insight: "Standard Cavendish behavior. Inertia and gravitational coupling are the same mass.",
    journey: "Same destination · ordinary journey",
  },
  inertia: {
    label: "Inertia reduction only",
    short: "Inertia only",
    insight:
      "Reducing inertia does not move the static equilibrium. It changes how quickly the balance accelerates and oscillates. Same destination, different journey.",
    journey: "Same destination · different journey",
  },
  gravity: {
    label: "Gravity coupling change",
    short: "Gravity coupling",
    insight:
      "A change in gravitational coupling scales the torque itself, so the equilibrium angle moves. Different destination.",
    journey: "Different destination",
  },
};
