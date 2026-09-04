/**
 * White House Arcade — Dome Inversion
 *
 * Artistic optical thought experiment. Geometry of the coffered dome is
 * FIXED. What changes is the illustrated mapping from dome coordinates
 * to the observer's image plane, plus a reduced 2D eikonal through a
 * bounded radial index field between observer and ceiling.
 *
 *   ρ_img(s) = (1 − s) ρ + s (R² / ρ)
 *
 * Circle inversion is a stand-in for a strong radial GRIN, not a claim
 * about architecture, atmosphere, or any real building.
 */

export const W = 720;
export const H = 420;

export const OBS = { x: 360, y: 392 };
export const DOME_CX = 360;
export const DOME_CY = 210;
export const DOME_R = 168;

/** Hanging lantern / central boss — geometry, never alpha-faded. */
export const LANTERN = { x: 360, y: 78, r: 14 };

export interface Pt {
  x: number;
  y: number;
}

export type RayFate = "coffer" | "lantern" | "escaped";

export interface DomeRay {
  points: Pt[];
  fate: RayFate;
}

/** Image-plane radial map. s=0 identity, s=1 inversion. */
export function mapRadius(rho: number, s: number, rMax: number): number {
  const eps = 12;
  const inv = (rMax * rMax) / Math.max(rho, eps);
  return (1 - s) * rho + s * Math.min(inv, rMax * 1.08);
}

export function indexAt(x: number, y: number, s: number): number {
  if (s <= 0) return 1;
  // Bounded GRIN blob between observer and dome, stronger on axis.
  const cx = 360;
  const cy = 300;
  const dx = (x - cx) / 70;
  const dy = (y - cy) / 55;
  const env = Math.exp(-(dx * dx + dy * dy));
  // Low-n on axis (deflects around lantern), high-n flanks.
  const axis = Math.exp(-(((x - 360) / 28) ** 2));
  const dn = s * env * (1.4 * (1 - axis) - 0.85 * axis);
  return Math.max(0.2, Math.min(2.4, 1 + dn));
}

function gradN(x: number, y: number, s: number) {
  const e = 0.8;
  const n = indexAt(x, y, s);
  return {
    n,
    nx: (indexAt(x + e, y, s) - indexAt(x - e, y, s)) / (2 * e),
    ny: (indexAt(x, y + e, s) - indexAt(x, y - e, s)) / (2 * e),
  };
}

function hitLantern(x: number, y: number): boolean {
  return Math.hypot(x - LANTERN.x, y - LANTERN.y) <= LANTERN.r + 1;
}

/** Interior of the circular dome arch (the ceiling surface). */
function hitDome(x: number, y: number): boolean {
  const d = Math.hypot(x - DOME_CX, y - DOME_CY);
  // Thin surface band of the inner dome.
  return d >= DOME_R - 3.2 && d <= DOME_R + 3.2 && y < DOME_CY + 20;
}

export function traceRay(angle: number, s: number): DomeRay {
  // angle: 0 = straight up, negative = left.
  let x = OBS.x;
  let y = OBS.y - 8;
  let ux = Math.sin(angle);
  let uy = -Math.cos(angle);
  const points: Pt[] = [{ x, y }];
  const ds = 0.9;
  for (let i = 0; i < 720; i++) {
    if (x < 20 || x > W - 20 || y < 18 || y > H - 8) {
      return { points, fate: "escaped" };
    }
    if (hitLantern(x, y)) {
      points.push({ x, y });
      return { points, fate: "lantern" };
    }
    if (hitDome(x, y)) {
      points.push({ x, y });
      return { points, fate: "coffer" };
    }
    const g = gradN(x, y, s);
    const n = Math.max(g.n, 0.18);
    const udot = ux * g.nx + uy * g.ny;
    ux += ((g.nx - ux * udot) / n) * ds;
    uy += ((g.ny - uy * udot) / n) * ds;
    const mag = Math.hypot(ux, uy) || 1;
    ux /= mag;
    uy /= mag;
    x += ux * ds;
    y += uy * ds;
    if (i % 2 === 0) points.push({ x, y });
  }
  return { points, fate: "escaped" };
}

export function bundle(s: number): DomeRay[] {
  const rays: DomeRay[] = [];
  const n = 15;
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * 2 - 1;
    const angle = t * 0.72;
    rays.push(traceRay(angle, s));
  }
  return rays;
}

export type DomeStage = "REAL" | "BEND" | "INVERT" | "CLOAK CENTER";

export function stageOf(s: number, rays: DomeRay[]): DomeStage {
  const lanternHits = rays.filter((r) => r.fate === "lantern").length;
  if (s < 0.08) return "REAL";
  if (s < 0.36) return "BEND";
  if (s >= 0.82 && lanternHits <= 2) return "CLOAK CENTER";
  return "INVERT";
}

export function lanternVisibleInImage(s: number, rays: DomeRay[]): boolean {
  // Image omits the lantern only when transport no longer samples it.
  if (s < 0.72) return true;
  return rays.some((r) => r.fate === "lantern");
}
