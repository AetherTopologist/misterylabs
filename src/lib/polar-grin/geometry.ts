/**
 * Polar GRIN Apple — occupancy geometry.
 *
 * Body is the landed polar silhouette. Stem and leaf are the same cubic
 * Beziers the SVG draws. Classification is hit-testing this geometry only.
 *
 * Feature scale enlarges/shrinks stem+leaf from the pole.
 * Recess depth scales the gaussian polar dent only. 1× is the design
 * silhouette. The stem anchor follows the recessed polar surface.
 */

import { APPLE, type HitClass, type Pt } from "./types";
import { toLocal } from "./frame";

export const FEATURE_SCALE_MIN = 0.5;
export const FEATURE_SCALE_MAX = 1.5;
export const FEATURE_SCALE_DEFAULT = 1;

export const RECESS_MIN = 1;
export const RECESS_MAX = 3;
export const RECESS_DEFAULT = 1;

/** Design gaussian dent amplitude (fraction of APPLE.r) at recess = 1. */
export const DENT_AMP = 0.24;
/** Dent angular width. σ² in radians². */
export const DENT_SIG2 = 0.042;
/** 2-fold waist. Not scaled by recess. */
export const WAIST_AMP = 0.05;
/**
 * Angular cup cutoff as a fraction of the dent kernel.
 * Matches the original dentAmount > 0.07 test at recess = 1
 * (0.07 / 0.24). Independent of world-space pixels.
 */
export const DIVOT_KERNEL_MIN = 0.07 / DENT_AMP;

export function clampFeatureScale(s: number): number {
  if (!Number.isFinite(s)) return FEATURE_SCALE_DEFAULT;
  return Math.max(FEATURE_SCALE_MIN, Math.min(FEATURE_SCALE_MAX, s));
}

export function clampRecess(r: number): number {
  if (!Number.isFinite(r)) return RECESS_DEFAULT;
  return Math.max(RECESS_MIN, Math.min(RECESS_MAX, r));
}

function wrapPi(a: number): number {
  let x = a;
  while (x > Math.PI) x -= Math.PI * 2;
  while (x < -Math.PI) x += Math.PI * 2;
  return x;
}

/** Polar-dent kernel. 1 at the north pole, independent of recess. */
export function dentKernel(theta: number): number {
  const d = wrapPi(theta + Math.PI / 2);
  return Math.exp(-(d * d) / DENT_SIG2);
}

export function dentAmount(theta: number, recess = RECESS_DEFAULT): number {
  return DENT_AMP * clampRecess(recess) * dentKernel(theta);
}

/** Apple silhouette radius. θ = 0 at +x, canvas y-down, pole near −π/2. */
export function appleRadius(theta: number, recess = RECESS_DEFAULT): number {
  const dent = dentAmount(theta, recess);
  const waist = WAIST_AMP * Math.cos(2 * theta);
  return APPLE.r * (1 - dent + waist);
}

/** Polar surface point (on the silhouette, not the stem seat). */
export function polarSurface(recess = RECESS_DEFAULT): Pt {
  const R = appleRadius(-Math.PI / 2, recess);
  return { x: APPLE.cx, y: APPLE.cy - R };
}

/**
 * Stem / field pole. Recess = 1 reproduces the design seat
 * (cx, cy − r + 10). Deeper recess translates that seat with the
 * polar surface, keeping a constant outward offset into the cup.
 */
export function polePos(recess = RECESS_DEFAULT): Pt {
  const rec = clampRecess(recess);
  const surfaceR = appleRadius(-Math.PI / 2, rec);
  const designSurfaceR = appleRadius(-Math.PI / 2, RECESS_DEFAULT);
  const designPoleR = APPLE.r - 10;
  const outward = designPoleR - designSurfaceR;
  const poleR = surfaceR + outward;
  return { x: APPLE.cx, y: APPLE.cy - poleR };
}

export function insideApple(x: number, y: number, recess = RECESS_DEFAULT): boolean {
  const dx = x - APPLE.cx;
  const dy = y - APPLE.cy;
  const theta = Math.atan2(dy, dx);
  return Math.hypot(dx, dy) < appleRadius(theta, recess) - 0.6;
}

/**
 * Polar-cup test on the current recessed surface.
 * Angular width from the dent kernel; radial shell = local dent depth.
 * Not a fixed world-space disk.
 */
export function insideDivot(x: number, y: number, recess = RECESS_DEFAULT): boolean {
  const rec = clampRecess(recess);
  if (!insideApple(x, y, rec)) return false;
  const dx = x - APPLE.cx;
  const dy = y - APPLE.cy;
  const theta = Math.atan2(dy, dx);
  const k = dentKernel(theta);
  if (k < DIVOT_KERNEL_MIN) return false;
  const r = Math.hypot(dx, dy);
  const R = appleRadius(theta, rec);
  const dentPx = APPLE.r * DENT_AMP * rec * k;
  return r > R - dentPx;
}

function scalePt(pt: Pt, anchor: Pt, s: number): Pt {
  return {
    x: anchor.x + (pt.x - anchor.x) * s,
    y: anchor.y + (pt.y - anchor.y) * s,
  };
}

/* -------------------------------------------------------------------------- */
/* Stem / leaf — identical cubics to the SVG paint                            */
/* -------------------------------------------------------------------------- */

export interface Cubic {
  p0: Pt;
  p1: Pt;
  p2: Pt;
  p3: Pt;
}

function designStemCubic(recess: number): Cubic {
  const p = polePos(recess);
  return {
    p0: { x: p.x, y: p.y + 6 },
    p1: { x: p.x - 2, y: p.y - 18 },
    p2: { x: p.x + 6, y: p.y - 36 },
    p3: { x: p.x + 10, y: p.y - 48 },
  };
}

function designLeafCubic(recess: number): Cubic {
  const p = polePos(recess);
  return {
    p0: { x: p.x + 8, y: p.y - 36 },
    p1: { x: p.x + 28, y: p.y - 48 },
    p2: { x: p.x + 36, y: p.y - 28 },
    p3: { x: p.x + 14, y: p.y - 24 },
  };
}

export function stemCubic(
  featureScale = FEATURE_SCALE_DEFAULT,
  recess = RECESS_DEFAULT,
): Cubic {
  const s = clampFeatureScale(featureScale);
  const rec = clampRecess(recess);
  const c = designStemCubic(rec);
  if (Math.abs(s - 1) < 1e-12) return c;
  const a = polePos(rec);
  return {
    p0: scalePt(c.p0, a, s),
    p1: scalePt(c.p1, a, s),
    p2: scalePt(c.p2, a, s),
    p3: scalePt(c.p3, a, s),
  };
}

export function leafCubic(
  featureScale = FEATURE_SCALE_DEFAULT,
  recess = RECESS_DEFAULT,
): Cubic {
  const s = clampFeatureScale(featureScale);
  const rec = clampRecess(recess);
  const c = designLeafCubic(rec);
  if (Math.abs(s - 1) < 1e-12) return c;
  const a = polePos(rec);
  return {
    p0: scalePt(c.p0, a, s),
    p1: scalePt(c.p1, a, s),
    p2: scalePt(c.p2, a, s),
    p3: scalePt(c.p3, a, s),
  };
}

export function cubicPoint(c: Cubic, t: number): Pt {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const d = 3 * u * t * t;
  const e = t * t * t;
  return {
    x: a * c.p0.x + b * c.p1.x + d * c.p2.x + e * c.p3.x,
    y: a * c.p0.y + b * c.p1.y + d * c.p2.y + e * c.p3.y,
  };
}

export function sampleCubic(c: Cubic, n = 28): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) pts.push(cubicPoint(c, i / n));
  return pts;
}

export function stemPathD(
  featureScale = FEATURE_SCALE_DEFAULT,
  recess = RECESS_DEFAULT,
): string {
  const c = stemCubic(featureScale, recess);
  return `M ${c.p0.x} ${c.p0.y} C ${c.p1.x} ${c.p1.y}, ${c.p2.x} ${c.p2.y}, ${c.p3.x} ${c.p3.y}`;
}

export function leafPathD(
  featureScale = FEATURE_SCALE_DEFAULT,
  recess = RECESS_DEFAULT,
): string {
  const c = leafCubic(featureScale, recess);
  return `M ${c.p0.x} ${c.p0.y} C ${c.p1.x} ${c.p1.y}, ${c.p2.x} ${c.p2.y}, ${c.p3.x} ${c.p3.y} Z`;
}

const STEM_HALF0 = 3.2;
const LEAF_FRINGE0 = 1.4;

const sampleCache = new Map<number, { stem: Pt[]; leaf: Pt[] }>();

function cacheKey(s: number, rec: number): number {
  return Math.round(clampFeatureScale(s) * 100) * 1000 + Math.round(clampRecess(rec) * 100);
}

function featureSamples(
  featureScale: number,
  recess: number,
): { stem: Pt[]; leaf: Pt[] } {
  const key = cacheKey(featureScale, recess);
  let hit = sampleCache.get(key);
  if (hit) return hit;
  hit = {
    stem: sampleCubic(stemCubic(featureScale, recess), 32),
    leaf: sampleCubic(leafCubic(featureScale, recess), 24),
  };
  sampleCache.set(key, hit);
  return hit;
}

function distToSegments(x: number, y: number, pts: Pt[]): number {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy || 1;
    let t = ((x - a.x) * dx + (y - a.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const px = a.x + t * dx;
    const py = a.y + t * dy;
    const d = Math.hypot(x - px, y - py);
    if (d < best) best = d;
  }
  return best;
}

export function onStem(
  x: number,
  y: number,
  featureScale = FEATURE_SCALE_DEFAULT,
  recess = RECESS_DEFAULT,
): boolean {
  const s = clampFeatureScale(featureScale);
  const rec = clampRecess(recess);
  return distToSegments(x, y, featureSamples(s, rec).stem) <= STEM_HALF0 * s;
}

export function insideLeaf(
  x: number,
  y: number,
  featureScale = FEATURE_SCALE_DEFAULT,
  recess = RECESS_DEFAULT,
): boolean {
  const s = clampFeatureScale(featureScale);
  const rec = clampRecess(recess);
  const poly = featureSamples(s, rec).leaf;
  if (distToSegments(x, y, [...poly, poly[0]]) <= LEAF_FRINGE0 * s) return true;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const yi = poly[i].y;
    const yj = poly[j].y;
    const xi = poly[i].x;
    const xj = poly[j].x;
    const hit =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi;
    if (hit) inside = !inside;
  }
  return inside;
}

export function classifyHit(
  x: number,
  y: number,
  thetaDeg = 0,
  featureScale = FEATURE_SCALE_DEFAULT,
  recess = RECESS_DEFAULT,
): HitClass {
  const p = toLocal(x, y, thetaDeg);
  if (insideLeaf(p.x, p.y, featureScale, recess)) return "leaf";
  if (onStem(p.x, p.y, featureScale, recess)) return "stem";
  if (insideApple(p.x, p.y, recess)) return insideDivot(p.x, p.y, recess) ? "divot" : "red";
  return "outside";
}

export function appleSamples(count = 72, recess = RECESS_DEFAULT): Pt[] {
  const rec = clampRecess(recess);
  const pts: Pt[] = [];
  for (let i = 0; i <= count; i++) {
    const th = -Math.PI + (2 * Math.PI * i) / count;
    const r = appleRadius(th, rec);
    pts.push({ x: APPLE.cx + r * Math.cos(th), y: APPLE.cy + r * Math.sin(th) });
  }
  return pts;
}

export function applePathD(recess = RECESS_DEFAULT): string {
  const body = appleSamples(72, recess);
  return (
    body
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(" ") + " Z"
  );
}
