/**
 * Target frame. Positive θ (degrees) is SVG-clockwise about the apple
 * center — the same transform the MIND group uses.
 *
 * Lab → local: R(−θ). Geometry and n are defined once, in local.
 * The UI bounds θ to [THETA_MIN, THETA_MAX]; the transform itself does not.
 */

import { APPLE, type Pt } from "./types";

export const THETA_MIN = -90;
export const THETA_MAX = 90;

export function clampTheta(deg: number): number {
  if (!Number.isFinite(deg)) return 0;
  return Math.max(THETA_MIN, Math.min(THETA_MAX, deg));
}

/** Inverse rotate a lab point into the unrotated target. */
export function toLocal(x: number, y: number, thetaDeg: number): Pt {
  const th = Number.isFinite(thetaDeg) ? thetaDeg : 0;
  if (Math.abs(th) < 1e-12) return { x, y };
  const rad = (th * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const dx = x - APPLE.cx;
  const dy = y - APPLE.cy;
  return {
    x: APPLE.cx + dx * c + dy * s,
    y: APPLE.cy - dx * s + dy * c,
  };
}

/** Rotate a target-local point into the lab. Matches SVG rotate(θ, cx, cy). */
export function toLab(x: number, y: number, thetaDeg: number): Pt {
  const th = Number.isFinite(thetaDeg) ? thetaDeg : 0;
  if (Math.abs(th) < 1e-12) return { x, y };
  const rad = (th * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const dx = x - APPLE.cx;
  const dy = y - APPLE.cy;
  return {
    x: APPLE.cx + dx * c - dy * s,
    y: APPLE.cy + dx * s + dy * c,
  };
}
