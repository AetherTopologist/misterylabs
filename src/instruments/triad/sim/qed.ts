/** Strong-field readout of a linear Hertzian solution.
 *
 * Es = 1.32e18 V/m is the Schwinger characteristic scale m²c³/(eℏ), not a switch.
 * Invariants, SI, of the instantaneous E and B:
 *   ℱ = (c² B² − E²) / 2
 *   𝒢 = c (E · B)
 *   ε = √( √(ℱ²+𝒢²) − ℱ )     electric-like eigenvalue
 *   β = √( √(ℱ²+𝒢²) + ℱ )     magnetic-like eigenvalue
 * Pure E ⇒ ε = |E|, β = 0. Pure B ⇒ ε = 0, β = c|B|.
 *
 * Pair rate is the constant-field Schwinger series (n = 1…4), not an oscillating-field
 * calculation and not a back-reaction. Geometry is not an input.
 */

import { C, ES, MU0, R_MIN, fieldAt, type Dipole, type Vec } from "./fields.ts";

const ALPHA = 7.2973525693e-3;
const LAMBDA_BAR = 3.8615926796e-13;
const PREF = (ALPHA * C) / (Math.PI * Math.PI * LAMBDA_BAR ** 4);
const TAU = Math.PI * 2;

export type RegimeName = "CLASSICAL EM" | "STRONG-FIELD QED BECOMING RELEVANT" | "SCHWINGER-SCALE FIELD";

export type Invariants = {
  e: number;
  b: number;
  F: number;
  G: number;
  eps: number;
  beta: number;
};

export type PairEstimate = {
  applicable: boolean;
  rate: number;
  exponent: number;
  note: string;
};

export type QedSample = {
  ePeak: number;
  bPeak: number;
  eOverEs: number;
  cBOverEs: number;
  F: number;
  G: number;
  eps: number;
  beta: number;
  regime: RegimeName;
  regimeNote: string;
  pair: PairEstimate;
  where: Vec;
  node: number;
  hardware: "model" | "laboratory" | "hypothetical";
};

export function invariantsOf(E: Vec, B: Vec): Invariants {
  const e2 = E.x * E.x + E.y * E.y + E.z * E.z;
  const b2 = B.x * B.x + B.y * B.y + B.z * B.z;
  const edot = E.x * B.x + E.y * B.y + E.z * B.z;
  const F = 0.5 * (C * C * b2 - e2);
  const G = C * edot;
  const disc = Math.sqrt(F * F + G * G);
  return {
    e: Math.sqrt(e2),
    b: Math.sqrt(b2),
    F,
    G,
    eps: Math.sqrt(Math.max(0, disc - F)),
    beta: Math.sqrt(Math.max(0, disc + F)),
  };
}

export function regimeOf(eOverEs: number, cBOverEs: number): { regime: RegimeName; regimeNote: string } {
  const chi = Math.max(eOverEs, cBOverEs, 0);
  const common =
    "The label is a logarithmic reading of max(|E|, c|B|) / Es. It does not change the Maxwell solution, Δz120, Csweep, or the vacuum-bore layer.";
  if (!(chi > 0) || Math.log10(chi) < -4) {
    return {
      regime: "CLASSICAL EM",
      regimeNote: `Peak field is more than four orders of magnitude below Es. ${common}`,
    };
  }
  if (chi < 1) {
    return {
      regime: "STRONG-FIELD QED BECOMING RELEVANT",
      regimeNote: `Peak field is within four orders of Es and still below it. The solver on screen is still linear. ${common}`,
    };
  }
  return {
    regime: "SCHWINGER-SCALE FIELD",
    regimeNote: `Peak |E| or c|B| is at or above the characteristic scale Es. That is not a broken limit and not a new equation. ${common}`,
  };
}

export function hardwareClass(peakVm: number): QedSample["hardware"] {
  if (peakVm > 1e15) return "hypothetical";
  if (peakVm > 1e8) return "laboratory";
  return "model";
}

export function pairRate(eps: number, beta: number): PairEstimate {
  if (!(eps > 0)) {
    return {
      applicable: false,
      rate: 0,
      exponent: Infinity,
      note: "ε = 0. The constant-field series does not produce pairs from a purely magnetic invariant. c|B|/Es can still be large.",
    };
  }
  const exponent = (Math.PI * ES) / eps;
  if (exponent > 680) {
    return {
      applicable: false,
      rate: 0,
      exponent,
      note: `The n=1 exponent is −π Es/ε = −${exponent.toExponential(2)}. That underflows IEEE double. The exponent is the readout. The rate is numerically zero, not a measured null.`,
    };
  }
  const b = Math.max(0, beta);
  let sum = 0;
  if (b < 1e-4 * eps) {
    for (let n = 1; n <= 4; n++) sum += Math.exp(-n * exponent) / (n * n);
    return {
      applicable: true,
      rate: PREF * (eps / ES) ** 2 * sum,
      exponent,
      note: "Constant-field Schwinger series for ε, β ≈ 0, n = 1…4. Pairs per cubic metre per second. Not an RF-cycle integral.",
    };
  }
  let gsum = 0;
  for (let n = 1; n <= 4; n++) {
    const x = (n * Math.PI * b) / eps;
    const coth = x > 18 ? 1 : (Math.exp(2 * x) + 1) / (Math.exp(2 * x) - 1);
    gsum += (coth / n) * Math.exp(-n * exponent);
  }
  return {
    applicable: true,
    rate: PREF * Math.PI * ((eps * b) / (ES * ES)) * gsum,
    exponent,
    note: "Constant-field series using ε and β, n = 1…4. Illustrative. No vacuum back-reaction.",
  };
}

function instant(f: ReturnType<typeof fieldAt>, phase: number): { E: Vec; B: Vec } {
  const c = Math.cos(phase);
  const s = Math.sin(phase);
  const e = (re: number, im: number) => re * c - im * s;
  return {
    E: { x: e(f.exR, f.exI), y: e(f.eyR, f.eyI), z: e(f.ezR, f.ezI) },
    B: {
      x: MU0 * e(f.hxR, f.hxI),
      y: MU0 * e(f.hyR, f.hyI),
      z: MU0 * e(f.hzR, f.hzI),
    },
  };
}

/** Peak |E|, peak |B|, and the invariants at the exclusion sample where ε is largest. */
export function sampleStrongField(dipoles: Dipole[], freqHz: number): QedSample {
  let ePeak = 0;
  let bPeak = 0;
  let bestEps = -1;
  let best: Invariants = { e: 0, b: 0, F: 0, G: 0, eps: 0, beta: 0 };
  let where: Vec = { x: 0, y: 0, z: 0 };
  let node = 0;
  const phases = 8;
  for (let i = 0; i < dipoles.length; i++) {
    const d = dipoles[i];
    if (!d || d.dark || d.pAmp <= 0) continue;
    let tx = 0;
    let ty = 1;
    let tz = 0;
    if (Math.abs(d.ux * tx + d.uy * ty + d.uz * tz) > 0.9) {
      tx = 1;
      ty = 0;
      tz = 0;
    }
    let rx = d.uy * tz - d.uz * ty;
    let ry = d.uz * tx - d.ux * tz;
    let rz = d.ux * ty - d.uy * tx;
    const rl = Math.hypot(rx, ry, rz) || 1;
    rx /= rl;
    ry /= rl;
    rz /= rl;
    const qx = ry * d.uz - rz * d.uy;
    const qy = rz * d.ux - rx * d.uz;
    const qz = rx * d.uy - ry * d.ux;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU;
      const p = {
        x: d.x + R_MIN * (Math.cos(a) * rx + Math.sin(a) * qx),
        y: d.y + R_MIN * (Math.cos(a) * ry + Math.sin(a) * qy),
        z: d.z + R_MIN * (Math.cos(a) * rz + Math.sin(a) * qz),
      };
      const f = fieldAt(dipoles, p, freqHz);
      if (f.invalid) continue;
      for (let n = 0; n < phases; n++) {
        const inst = instant(f, (n / phases) * TAU);
        const inv = invariantsOf(inst.E, inst.B);
        if (inv.e > ePeak) ePeak = inv.e;
        if (inv.b > bPeak) bPeak = inv.b;
        if (inv.eps > bestEps) {
          bestEps = inv.eps;
          best = inv;
          where = p;
          node = i;
        }
      }
    }
  }
  const eOverEs = ePeak / ES;
  const cBOverEs = (C * bPeak) / ES;
  const reg = regimeOf(eOverEs, cBOverEs);
  const pair = pairRate(best.eps, best.beta);
  return {
    ePeak,
    bPeak,
    eOverEs,
    cBOverEs,
    F: best.F,
    G: best.G,
    eps: best.eps,
    beta: best.beta,
    regime: reg.regime,
    regimeNote: reg.regimeNote,
    pair,
    where,
    node,
    hardware: hardwareClass(ePeak),
  };
}

export type AmplitudePoint = {
  e0: number;
  eOverEs: number;
  cBOverEs: number;
  rate: number;
  exponent: number;
  applicable: boolean;
  regime: RegimeName;
};

/** Linear scaling of one frozen solution. Geometry is not an input.
 * Crossing E/Es = 1 is a mark on this curve, not a change of equation.
 */
export function sweepCommanded(
  base: Pick<QedSample, "eOverEs" | "cBOverEs" | "eps" | "beta">,
  e0: number,
): { points: AmplitudePoint[]; simulatedAboveE0: number } {
  if (!(base.eOverEs > 0) || !(e0 > 0)) return { points: [], simulatedAboveE0: Infinity };
  const points: AmplitudePoint[] = [];
  for (let logChi = -6; logChi <= 2.0001; logChi += 0.5) {
    const chi = 10 ** logChi;
    const factor = chi / base.eOverEs;
    const pair = pairRate(base.eps * factor, base.beta * factor);
    const cB = base.cBOverEs * factor;
    points.push({
      e0: e0 * factor,
      eOverEs: chi,
      cBOverEs: cB,
      rate: pair.rate,
      exponent: pair.exponent,
      applicable: pair.applicable,
      regime: regimeOf(chi, cB).regime,
    });
  }
  return { points, simulatedAboveE0: (e0 * (1e15 / ES)) / base.eOverEs };
}

export type CaptureSide = {
  eRef: number;
  ePeak: number;
  bPeak: number;
  eOverEs: number;
  cBOverEs: number;
  F: number;
  G: number;
  exponent: number;
  rate: number;
  rateApplicable: boolean;
  regime: RegimeName;
  cSweep: number;
  dz120: number;
  radius: number;
  omega: number;
};

export function compareCaptures(a: CaptureSide, b: CaptureSide): string {
  const eRatio = a.ePeak > 0 && b.ePeak > 0 ? b.ePeak / a.ePeak : Number.NaN;
  const geomSame = Math.abs(a.cSweep - b.cSweep) < 1e-9 && Math.abs(a.dz120 - b.dz120) < 1e-6;
  const eLine = Number.isFinite(eRatio)
    ? `|E| changes by ×${eRatio.toExponential(2)} from A to B. In this linear solver that factor tracks source amplitude and interference, continuously.`
    : "One side has no delivered |E|, so the ratio is not a scaling.";
  let pairLine: string;
  if (!a.rateApplicable && !b.rateApplicable) {
    const de = Number.isFinite(a.exponent) && Number.isFinite(b.exponent) ? b.exponent - a.exponent : Number.NaN;
    pairLine = Number.isFinite(de)
      ? `Both pair rates underflow. The exponent −π Es/ε moves by ${de.toExponential(2)}. That exponent is linear in 1/ε, so the rate, were it representable, would move exponentially. Nothing in the instrument turns on at Es.`
      : "The pair estimate is not applicable on at least one side (ε = 0 or no field).";
  } else if (a.rateApplicable && b.rateApplicable && a.rate > 0 && b.rate > 0) {
    pairLine = `Both rates are inside double range. The rate changes by ×${(b.rate / a.rate).toExponential(2)} while |E| changes by ×${Number.isFinite(eRatio) ? eRatio.toExponential(2) : "—"}. The rate is the nonlinear quantity.`;
  } else {
    pairLine =
      "The rate estimate crosses from numerical underflow to a representable number, or the reverse. That jump is the exponential, not a switch in the Maxwell solution.";
  }
  const geom = geomSame
    ? "Δz120 and Csweep match. They did not set the regime."
    : "Δz120 or Csweep also differs. Those numbers stay geometry. The regime above is still read only from the field.";
  return `${eLine} ${pairLine} ${geom}`;
}
