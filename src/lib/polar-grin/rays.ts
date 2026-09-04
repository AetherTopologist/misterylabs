/**
 * Polar GRIN Apple — reduced illustrative ray model.
 *
 * Straight-line march at s = 0. For s > 0, an incident-side polar-halo
 * angular kick ∝ s sends rays over the north pole. The apple occupancy
 * never changes: if a ray meets the fruit, it stops.
 *
 * This is NOT xPRIMEray transport and NOT laboratory GRIN. It is a
 * constrained public instrument for ray accessibility.
 */

export const W = 720;
export const H = 420;

export const APPLE = {
  cx: 392,
  cy: 232,
  r: 98,
} as const;

/** Witness beads on the far side of the polar cap — the REVEAL targets. */
export const WITNESS = [
  { x: 510, y: 92 },
  { x: 548, y: 124 },
] as const;

export type RayFate = "surface" | "escaped" | "witness" | "maxsteps";

export interface Pt {
  x: number;
  y: number;
}

export interface RayPath {
  points: Pt[];
  fate: RayFate;
  hitPolar: boolean;
  impact: number;
}

export function polePos(): Pt {
  // Dimple sits slightly inside the bounding circle.
  return { x: APPLE.cx, y: APPLE.cy - APPLE.r + 10 };
}

/** Apple silhouette radius. θ = 0 at +x, canvas y-down, pole near −π/2. */
export function appleRadius(theta: number): number {
  const d = theta + Math.PI / 2;
  const dent = 0.24 * Math.exp(-(d * d) / 0.042);
  const waist = 0.05 * Math.cos(2 * theta);
  return APPLE.r * (1 - dent + waist);
}

export function insideApple(x: number, y: number): boolean {
  const dx = x - APPLE.cx;
  const dy = y - APPLE.cy;
  const theta = Math.atan2(dy, dx);
  return Math.hypot(dx, dy) < appleRadius(theta) - 0.6;
}

export function isPolarHit(x: number, y: number): boolean {
  const p = polePos();
  return Math.hypot(x - p.x, y - p.y) < 58;
}

export function indexAt(_x: number, _y: number, _s: number): number {
  return 1;
}

function gradN(x: number, y: number, s: number): { nx: number; ny: number; n: number } {
  const e = 0.85;
  const n = indexAt(x, y, s);
  const nx = (indexAt(x + e, y, s) - indexAt(x - e, y, s)) / (2 * e);
  const ny = (indexAt(x, y + e, s) - indexAt(x, y - e, s)) / (2 * e);
  return { nx, ny, n };
}

export function traceRay(
  x0: number,
  y0: number,
  ux: number,
  uy: number,
  s: number,
): RayPath {
  const mag0 = Math.hypot(ux, uy) || 1;
  let x = x0;
  let y = y0;
  let ux_ = ux / mag0;
  let uy_ = uy / mag0;
  const points: Pt[] = [{ x, y }];
  const ds = 0.85;
  const maxSteps = 980;
  const impact = y0 - polePos().y;

  for (let i = 0; i < maxSteps; i++) {
    if (x < -30 || x > W + 40 || y < -30 || y > H + 30) {
      return { points, fate: "escaped", hitPolar: false, impact };
    }
    if (insideApple(x, y)) {
      points.push({ x, y });
      return { points, fate: "surface", hitPolar: isPolarHit(x, y), impact };
    }
    for (const w of WITNESS) {
      if (Math.hypot(x - w.x, y - w.y) < 9) {
        points.push({ x: w.x, y: w.y });
        return { points, fate: "witness", hitPolar: false, impact };
      }
    }
    const g = gradN(x, y, s);
    const n = Math.max(g.n, 0.18);
    const udot = ux_ * g.nx + uy_ * g.ny;
    ux_ += ((g.nx - ux_ * udot) / n) * ds;
    uy_ += ((g.ny - uy_ * udot) / n) * ds;
    const p = polePos();
    const rdx = x - p.x;
    const rdy = y - p.y;
    const rr = Math.hypot(rdx, rdy);
    if (s > 0 && rr > 12 && rr < 72 && x < p.x + 6) {
      const env = Math.exp(-(((rr - 32) / 18) * ((rr - 32) / 18)));
      const kick = s * 0.09 * env * ds;
      ux_ += kick * (-rdy / rr);
      uy_ += kick * (rdx / rr);
    }
    const mag = Math.hypot(ux_, uy_) || 1;
    ux_ /= mag;
    uy_ /= mag;
    x += ux_ * ds;
    y += uy_ * ds;
    if (i % 2 === 0) points.push({ x, y });
  }
  return { points, fate: "maxsteps", hitPolar: false, impact };
}

export function bundle(s: number): RayPath[] {
  const p = polePos();
  const rays: RayPath[] = [];
  const n = 11;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    // Upper fan skims the dimple (can wrap). Lower fan strikes the fruit.
    const y = 142 + t * 46;
    const x = 42;
    const tx = p.x - 8;
    const ty = p.y + 8 + (t - 0.35) * 16;
    rays.push(traceRay(x, y, tx - x, ty - y, s));
  }
  return rays;
}

export type Stage = "FIELD OFF" | "BEND" | "SHADOW" | "WRAP" | "REVEAL";

export function stageOf(s: number, rays: RayPath[]): Stage {
  const polarHits = rays.filter((r) => r.fate === "surface" && r.hitPolar).length;
  const wrapped = rays.filter((r) => r.fate === "escaped" || r.fate === "witness").length;
  const witness = rays.filter((r) => r.fate === "witness").length;
  if (s < 0.05) return "FIELD OFF";
  if (s < 0.25) return "BEND";
  if (witness >= 1 && s >= 0.78) return "REVEAL";
  if (wrapped >= 3 && polarHits <= 6) return s >= 0.78 ? "REVEAL" : "WRAP";
  if (s >= 0.52) return wrapped >= 2 ? "WRAP" : "SHADOW";
  return "SHADOW";
}

export function appleSamples(count = 72): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= count; i++) {
    const th = -Math.PI + (2 * Math.PI * i) / count;
    const r = appleRadius(th);
    pts.push({ x: APPLE.cx + r * Math.cos(th), y: APPLE.cy + r * Math.sin(th) });
  }
  return pts;
}
