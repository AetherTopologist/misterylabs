/** Illustrative Hertzian point dipoles.
 *
 * Engineering phasors, implicit exp(+j ω t), retardation exp(−j k r).
 * Full near + intermediate + far field (Staelin / Balanis short-dipole form).
 * Mutual impedance is omitted: fields superpose, powers add.
 * Invalid inside the exclusion radius — the 1/r³ singularity is not physical
 * inside a real emitter.
 *
 * Time-average energy density used by the instrument:
 *   ⟨u⟩ = ε0 |Ẽ|² / 4 + μ0 |H̃|² / 4
 * which is the cycle average of
 *   u = ½ ε0 E² + B² / (2 μ0).
 * Time-average Poynting: ⟨S⟩ = ½ Re(Ẽ × H̃*).
 */

export const C = 299792458;
export const MU0 = 1.25663706212e-6;
export const EPS0 = 8.854187817e-12;
export const Z0 = Math.sqrt(MU0 / EPS0);
export const ES = 1.32e18;
export const R_MIN = 4;

type C2 = { re: number; im: number };

export type Vec = { x: number; y: number; z: number };

export type Dipole = {
  x: number;
  y: number;
  z: number;
  ux: number;
  uy: number;
  uz: number;
  pAmp: number;
  phase: number;
  dark: boolean;
};

const TAU = Math.PI * 2;

function cmul(a: C2, b: C2): C2 {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}

function cscale(a: C2, s: number): C2 {
  return { re: a.re * s, im: a.im * s };
}

function cabssq(a: C2): number {
  return a.re * a.re + a.im * a.im;
}

export function wrapPi(a: number): number {
  const w = ((a + Math.PI) % TAU + TAU) % TAU;
  return w - Math.PI;
}

export function radiatedPower(pAmp: number, omega: number): number {
  if (pAmp <= 0 || omega <= 0) return 0;
  return (MU0 * pAmp * pAmp * omega ** 4) / (12 * Math.PI * C);
}

/** |Ẽ| at range r, equator, for a unit dipole. Used to map the E_ref dial onto |p|. */
export function equatorFieldPerCoulombMeter(freqHz: number, r: number): number {
  const omega = TAU * freqHz;
  const k = omega / C;
  const kr = Math.max(k * r, 1e-8);
  const zetaRe = 1 - 1 / (kr * kr);
  const zetaIm = -1 / kr;
  const zeta = Math.hypot(zetaRe, zetaIm);
  return (k * omega * Z0 * zeta) / (4 * Math.PI * r);
}

export function solveDipoleMoment(eRef: number, freqHz: number, rRef: number): number {
  const per = equatorFieldPerCoulombMeter(freqHz, Math.max(1, rRef));
  if (!Number.isFinite(per) || per <= 0) return 0;
  return Math.max(0, eRef) / per;
}

type FieldAcc = {
  exR: number;
  exI: number;
  eyR: number;
  eyI: number;
  ezR: number;
  ezI: number;
  hxR: number;
  hxI: number;
  hyR: number;
  hyI: number;
  hzR: number;
  hzI: number;
  invalid: boolean;
};

function addDipole(acc: FieldAcc, d: Dipole, px: number, py: number, pz: number, omega: number) {
  if (d.dark || d.pAmp <= 0) return;
  const rx = px - d.x;
  const ry = py - d.y;
  const rz = pz - d.z;
  const r = Math.hypot(rx, ry, rz);
  if (r < R_MIN) {
    acc.invalid = true;
    return;
  }
  const nx = rx / r;
  const ny = ry / r;
  const nz = rz / r;
  const k = omega / C;
  const kr = k * r;
  const ckr = Math.cos(kr);
  const skr = Math.sin(kr);
  const expM: C2 = { re: ckr, im: -skr };

  const s = Math.sin(d.phase);
  const c = Math.cos(d.phase);
  const idRe = omega * d.pAmp * -s;
  const idIm = omega * d.pAmp * c;
  const idxR = idRe * d.ux;
  const idyR = idRe * d.uy;
  const idzR = idRe * d.uz;
  const idxI = idIm * d.ux;
  const idyI = idIm * d.uy;
  const idzI = idIm * d.uz;

  const cross = (ax: number, ay: number, az: number) => ({
    x: ay * nz - az * ny,
    y: az * nx - ax * nz,
    z: ax * ny - ay * nx,
  });
  const cR = cross(idxR, idyR, idzR);
  const cI = cross(idxI, idyI, idzI);

  const onePlus: C2 = { re: 1, im: -1 / kr };
  const jC: C2 = { re: 0, im: 1 };
  let hScale = cmul(cmul(jC, onePlus), expM);
  hScale = cscale(hScale, k / (4 * Math.PI * r));

  acc.hxR += hScale.re * cR.x - hScale.im * cI.x;
  acc.hxI += hScale.re * cI.x + hScale.im * cR.x;
  acc.hyR += hScale.re * cR.y - hScale.im * cI.y;
  acc.hyI += hScale.re * cI.y + hScale.im * cR.y;
  acc.hzR += hScale.re * cR.z - hScale.im * cI.z;
  acc.hzI += hScale.re * cI.z + hScale.im * cR.z;

  const invJkr: C2 = { re: 0, im: -1 / kr };
  const invJkr2: C2 = { re: -1 / (kr * kr), im: 0 };
  const bracketT: C2 = { re: 1 + invJkr.re + invJkr2.re, im: invJkr.im + invJkr2.im };
  const bracketR: C2 = { re: invJkr.re + invJkr2.re, im: invJkr.im + invJkr2.im };
  let common = cmul(jC, expM);
  common = cscale(common, (k * Z0) / (4 * Math.PI * r));
  const coeffT = cmul(common, bracketT);
  const coeffR = cscale(cmul(common, bracketR), 2);

  const dotR = idxR * nx + idyR * ny + idzR * nz;
  const dotI = idxI * nx + idyI * ny + idzI * nz;
  const pxR = idxR - dotR * nx;
  const pyR = idyR - dotR * ny;
  const pzR = idzR - dotR * nz;
  const pxI = idxI - dotI * nx;
  const pyI = idyI - dotI * ny;
  const pzI = idzI - dotI * nz;

  const addTrans = (vxR: number, vxI: number, sign: number, axis: "x" | "y" | "z") => {
    const pr = sign * (coeffT.re * vxR - coeffT.im * vxI);
    const pi = sign * (coeffT.re * vxI + coeffT.im * vxR);
    if (axis === "x") {
      acc.exR += pr;
      acc.exI += pi;
    } else if (axis === "y") {
      acc.eyR += pr;
      acc.eyI += pi;
    } else {
      acc.ezR += pr;
      acc.ezI += pi;
    }
  };
  addTrans(pxR, pxI, -1, "x");
  addTrans(pyR, pyI, -1, "y");
  addTrans(pzR, pzI, -1, "z");

  const erR = coeffR.re * dotR - coeffR.im * dotI;
  const erI = coeffR.re * dotI + coeffR.im * dotR;
  acc.exR += erR * nx;
  acc.exI += erI * nx;
  acc.eyR += erR * ny;
  acc.eyI += erI * ny;
  acc.ezR += erR * nz;
  acc.ezI += erI * nz;
}

function blank(): FieldAcc {
  return {
    exR: 0,
    exI: 0,
    eyR: 0,
    eyI: 0,
    ezR: 0,
    ezI: 0,
    hxR: 0,
    hxI: 0,
    hyR: 0,
    hyI: 0,
    hzR: 0,
    hzI: 0,
    invalid: false,
  };
}

export function fieldAt(dipoles: Dipole[], p: Vec, freqHz: number): FieldAcc {
  const acc = blank();
  const omega = TAU * freqHz;
  for (let i = 0; i < dipoles.length; i++) addDipole(acc, dipoles[i], p.x, p.y, p.z, omega);
  return acc;
}

export function emagnitude(f: FieldAcc): number {
  if (f.invalid) return 0;
  return Math.sqrt(cabssq({ re: f.exR, im: f.exI }) + cabssq({ re: f.eyR, im: f.eyI }) + cabssq({ re: f.ezR, im: f.ezI }));
}

export function bmagnitude(f: FieldAcc): number {
  if (f.invalid) return 0;
  const h = Math.sqrt(
    cabssq({ re: f.hxR, im: f.hxI }) + cabssq({ re: f.hyR, im: f.hyI }) + cabssq({ re: f.hzR, im: f.hzI }),
  );
  return MU0 * h;
}

export function energyDensity(f: FieldAcc): number {
  if (f.invalid) return 0;
  const e2 =
    cabssq({ re: f.exR, im: f.exI }) + cabssq({ re: f.eyR, im: f.eyI }) + cabssq({ re: f.ezR, im: f.ezI });
  const h2 =
    cabssq({ re: f.hxR, im: f.hxI }) + cabssq({ re: f.hyR, im: f.hyI }) + cabssq({ re: f.hzR, im: f.hzI });
  return (EPS0 * e2) / 4 + (MU0 * h2) / 4;
}

/** Time-average Poynting, SI W/m². */
export function poynting(f: FieldAcc): Vec {
  if (f.invalid) return { x: 0, y: 0, z: 0 };
  const crossRe = (eyR: number, eyI: number, ezR: number, ezI: number, hyR: number, hyI: number, hzR: number, hzI: number) => {
    const hzCr = hzR;
    const hzCi = -hzI;
    const hyCr = hyR;
    const hyCi = -hyI;
    const re = eyR * hzCr - eyI * hzCi - (ezR * hyCr - ezI * hyCi);
    return 0.5 * re;
  };
  return {
    x: crossRe(f.eyR, f.eyI, f.ezR, f.ezI, f.hyR, f.hyI, f.hzR, f.hzI),
    y: crossRe(f.ezR, f.ezI, f.exR, f.exI, f.hzR, f.hzI, f.hxR, f.hxI),
    z: crossRe(f.exR, f.exI, f.eyR, f.eyI, f.hxR, f.hxI, f.hyR, f.hyI),
  };
}

export function cyclePeakNearDipoles(dipoles: Dipole[], freqHz: number): { ePeak: number; bPeak: number; where: string } {
  let ePeak = 0;
  let bPeak = 0;
  for (const d of dipoles) {
    if (d.dark || d.pAmp <= 0) continue;
    const ux = d.ux;
    const uy = d.uy;
    const uz = d.uz;
    let tx = 0;
    let ty = 1;
    let tz = 0;
    if (Math.abs(ux * tx + uy * ty + uz * tz) > 0.9) {
      tx = 1;
      ty = 0;
      tz = 0;
    }
    let rx = uy * tz - uz * ty;
    let ry = uz * tx - ux * tz;
    let rz = ux * ty - uy * tx;
    const rl = Math.hypot(rx, ry, rz) || 1;
    rx /= rl;
    ry /= rl;
    rz /= rl;
    const qx = ry * uz - rz * uy;
    const qy = rz * ux - rx * uz;
    const qz = rx * uy - ry * ux;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU;
      const f = fieldAt(
        dipoles,
        {
          x: d.x + R_MIN * (Math.cos(a) * rx + Math.sin(a) * qx),
          y: d.y + R_MIN * (Math.cos(a) * ry + Math.sin(a) * qy),
          z: d.z + R_MIN * (Math.cos(a) * rz + Math.sin(a) * qz),
        },
        freqHz,
      );
      const e = emagnitude(f);
      const b = bmagnitude(f);
      if (e > ePeak) ePeak = e;
      if (b > bPeak) bPeak = b;
    }
  }
  return {
    ePeak,
    bPeak,
    where: "cycle-amplitude |Ẽ| and |B| on the r = 4 m exclusion surface (point-dipole idealization ends here)",
  };
}
