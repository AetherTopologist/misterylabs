/**
 * Reduced 2D geometric-optics marcher.
 *
 * Euler step of d/ds (n û) = ∇n. Not xPRIMEray. Fruit occupancy is opaque:
 * the first non-outside classification terminates the ray.
 */

import {
  FEATURE_SCALE_DEFAULT,
  RECESS_DEFAULT,
  classifyHit,
  polePos,
} from "./geometry";
import { WIDTH_DEFAULT, sampleField } from "./field";
import {
  H,
  RAY_COUNT,
  W,
  type FieldConfig,
  type LaunchGeom,
  type MaterialClass,
  type Pt,
  type RayPath,
} from "./types";

const DS = 0.85;
const MAX_STEPS = 980;

/**
 * Fixed launch. Aimed fan from the west-northwest, slightly
 * compressed onto the stem / leaf / divot corridor.
 * One graze (ray 01) clears the cap at A=0; the field captures it.
 */
export const LAUNCH: LaunchGeom = {
  x: 80,
  y0: 8,
  ySpan: 190,
  tx0: 440,
  ty0: 100,
  tx1: 362,
  ty1: 232,
};

/** Measured best zero-escape in the declared (A, w, profile) range at θ=0, scale=1, recess=1. */
export const BEST_ZERO_ESCAPE: FieldConfig = {
  profile: "annular-high",
  strength: 0.3,
  width: 0.7,
  theta: 0,
  featureScale: FEATURE_SCALE_DEFAULT,
  recessDepth: RECESS_DEFAULT,
};

/**
 * Frozen extreme snapshot (θ=0, scale=0.5, recess=3, annular A=1.2 w=2.4).
 * ESC 0. Not 11/11 red: ray 04 terminates on the recessed cup (DIVOT).
 * FIELD OFF at this same target has no stem/leaf/divot.
 */
export const SNAPSHOT_EXTREME: FieldConfig = {
  profile: "annular-high",
  strength: 1.2,
  width: 2.4,
  theta: 0,
  featureScale: 0.5,
  recessDepth: 3,
};

export function fieldOff(
  width = WIDTH_DEFAULT,
  theta = 0,
  featureScale = FEATURE_SCALE_DEFAULT,
  recessDepth = RECESS_DEFAULT,
): FieldConfig {
  return { profile: "off", strength: 0, width, theta, featureScale, recessDepth };
}

function hitToMaterial(hit: ReturnType<typeof classifyHit>): MaterialClass | null {
  if (hit === "outside") return null;
  return hit;
}

function thetaOf(cfg: FieldConfig): number {
  return Number.isFinite(cfg.theta) ? cfg.theta : 0;
}

function scaleOf(cfg: FieldConfig): number {
  return Number.isFinite(cfg.featureScale) ? cfg.featureScale : FEATURE_SCALE_DEFAULT;
}

function recessOf(cfg: FieldConfig): number {
  return Number.isFinite(cfg.recessDepth) ? cfg.recessDepth : RECESS_DEFAULT;
}

export function traceRay(
  id: number,
  x0: number,
  y0: number,
  ux0: number,
  uy0: number,
  cfg: FieldConfig,
): RayPath {
  const mag0 = Math.hypot(ux0, uy0) || 1;
  let x = x0;
  let y = y0;
  let ux = ux0 / mag0;
  let uy = uy0 / mag0;
  const launch: Pt = { x, y };
  const direction: Pt = { x: ux, y: uy };
  const points: Pt[] = [{ x, y }];
  let maxCurvature = 0;
  const theta = thetaOf(cfg);
  const featureScale = scaleOf(cfg);
  const recess = recessOf(cfg);

  for (let i = 0; i < MAX_STEPS; i++) {
    if (x < -30 || x > W + 40 || y < -30 || y > H + 30) {
      const terminal = { x, y };
      return {
        id,
        launch,
        direction,
        points,
        terminal,
        material: "escaped",
        escaped: true,
        maxCurvature,
      };
    }

    const cls = hitToMaterial(classifyHit(x, y, theta, featureScale, recess));
    if (cls) {
      const terminal = { x, y };
      points.push(terminal);
      return {
        id,
        launch,
        direction,
        points,
        terminal,
        material: cls,
        escaped: false,
        maxCurvature,
      };
    }

    const g = sampleField(x, y, cfg);
    const n = Math.max(g.n, 1);
    const udot = ux * g.nx + uy * g.ny;
    const dux = ((g.nx - ux * udot) / n) * DS;
    const duy = ((g.ny - uy * udot) / n) * DS;
    const curv = Math.hypot(dux, duy) / DS;
    if (curv > maxCurvature) maxCurvature = curv;
    ux += dux;
    uy += duy;
    const mag = Math.hypot(ux, uy) || 1;
    ux /= mag;
    uy /= mag;
    x += ux * DS;
    y += uy * DS;
    if (i % 2 === 0) points.push({ x, y });
  }

  const terminal = { x, y };
  return {
    id,
    launch,
    direction,
    points,
    terminal,
    material: "escaped",
    escaped: true,
    maxCurvature,
  };
}

export function bundleAt(launch: LaunchGeom, cfg: FieldConfig): RayPath[] {
  const rays: RayPath[] = [];
  const n = RAY_COUNT;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const y = launch.y0 + t * launch.ySpan;
    const tx = launch.tx0 + t * (launch.tx1 - launch.tx0);
    const ty = launch.ty0 + t * (launch.ty1 - launch.ty0);
    rays.push(traceRay(i + 1, launch.x, y, tx - launch.x, ty - y, cfg));
  }
  return rays;
}

export function bundle(cfg: FieldConfig): RayPath[] {
  return bundleAt(LAUNCH, cfg);
}

export function countMaterials(rays: RayPath[]): Record<MaterialClass, number> {
  const c: Record<MaterialClass, number> = {
    red: 0,
    stem: 0,
    leaf: 0,
    divot: 0,
    escaped: 0,
  };
  for (const r of rays) c[r.material] += 1;
  return c;
}

export function redCoverage(rays: RayPath[]): number {
  if (!rays.length) return 0;
  return countMaterials(rays).red / rays.length;
}

/** Strength samples used for the persistence sweep at current width / pose. */
export const SWEEP_STRENGTHS = [0, 0.3, 0.6, 0.9, 1.2] as const;

export interface PersistentChannel {
  id: number;
  materials: MaterialClass[];
}

export function persistentChannels(
  width = WIDTH_DEFAULT,
  theta = 0,
  featureScale = FEATURE_SCALE_DEFAULT,
  recessDepth = RECESS_DEFAULT,
): PersistentChannel[] {
  const profiles: FieldConfig[] = [
    { profile: "off", strength: 0, width, theta, featureScale, recessDepth },
    ...SWEEP_STRENGTHS.filter((s) => s > 0).flatMap((s) => [
      {
        profile: "center-high" as const,
        strength: s,
        width,
        theta,
        featureScale,
        recessDepth,
      },
      {
        profile: "annular-high" as const,
        strength: s,
        width,
        theta,
        featureScale,
        recessDepth,
      },
    ]),
  ];
  const byRay = new Map<number, Set<MaterialClass>>();
  for (const cfg of profiles) {
    for (const ray of bundle(cfg)) {
      let set = byRay.get(ray.id);
      if (!set) {
        set = new Set();
        byRay.set(ray.id, set);
      }
      set.add(ray.material);
    }
  }
  const out: PersistentChannel[] = [];
  for (const [id, set] of byRay) {
    if (!set.has("red")) {
      out.push({ id, materials: [...set] });
    }
  }
  return out.sort((a, b) => a.id - b.id);
}

export function pole(recess = RECESS_DEFAULT): Pt {
  return polePos(recess);
}
