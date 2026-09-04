/**
 * Saturn Polygon Lab — reduced azimuthal wave-mode analogy.
 *
 *   r(θ) = R + A cos(m θ + φ)
 *
 * This is NOT a Saturn atmospheric simulation and NOT a GRIN-optics claim.
 * It is a polar-view visualization of how a single integer azimuthal mode
 * on a continuous circular jet can read as a polygon.
 *
 * Empirical bridges (observation, not this model):
 *   m = 6  north-polar hexagon (Voyager / Cassini)
 *   m = 10 south-polar decagon (Hubble, Sánchez-Lavega et al. 2026)
 */

export const MODE_MIN = 2;
export const MODE_MAX = 10;

export interface JetSample {
  theta: number;
  r: number;
  x: number;
  y: number;
}

export function jetRadius(theta: number, m: number, amp: number, phase: number, R: number): number {
  return R + amp * Math.cos(m * theta + phase);
}

export function sampleJet(
  m: number,
  amp: number,
  phase: number,
  R: number,
  cx: number,
  cy: number,
  steps = 360,
): JetSample[] {
  const out: JetSample[] = [];
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * Math.PI * 2;
    const r = jetRadius(theta, m, amp, phase, R);
    out.push({
      theta,
      r,
      x: cx + r * Math.cos(theta),
      y: cy + r * Math.sin(theta),
    });
  }
  return out;
}

/** Local maxima of cos(mθ + φ) — the "corners" of the organized mode. */
export function vertexAngles(m: number, phase: number): number[] {
  const n = Math.max(1, Math.round(m));
  const out: number[] = [];
  for (let k = 0; k < n; k++) {
    out.push((2 * Math.PI * k - phase) / n);
  }
  return out;
}

export function analogLabel(m: number): { kicker: string; name: string } | null {
  if (m === 6) return { kicker: "North-pole analog", name: "HEXAGON" };
  if (m === 10) return { kicker: "South-pole analog", name: "DECAGON" };
  return null;
}

export function organization(amp: number, ampMax: number): "CIRCLE" | "UNDULATION" | "ORGANIZED MODE" | "POLYGON-LIKE" {
  const t = ampMax <= 0 ? 0 : amp / ampMax;
  if (t < 0.12) return "CIRCLE";
  if (t < 0.4) return "UNDULATION";
  if (t < 0.72) return "ORGANIZED MODE";
  return "POLYGON-LIKE";
}
