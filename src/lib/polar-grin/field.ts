/**
 * Bounded positive-index field.
 *
 * n(x,y) = 1 + A · g(x,y; w), A ≥ 0, g ∈ [0, 1]
 * so n stays in [1, 1 + A_MAX].
 *
 * CENTER HIGH — Gaussian lobe on the polar cap (vacuum side).
 * ANNULAR HIGH — ring of high-n around the pole.
 *
 * Width w is a real spatial support scale, not a visual halo:
 *   σx = 36 w, σy = 30 w, ring thickness = 14 w, ring peak r0 = 40 (fixed).
 *
 * The pole follows the recessed polar seat (field locked to target).
 * Recess does not change A or w.
 *
 * Rays bend toward increasing n. The two profiles reverse the
 * near-axis radial gradient without ever taking n below 1.
 */

import { RECESS_DEFAULT, clampRecess, polePos } from "./geometry";
import { toLocal } from "./frame";
import type { FieldConfig, FieldProfile, FieldSample } from "./types";

export const A_MAX = 1.5;
export const N_MIN = 1.0;
export const N_MAX = 1 + A_MAX;

export const WIDTH_MIN = 0.4;
export const WIDTH_MAX = 2.4;
export const WIDTH_DEFAULT = 1.0;

/** Design-width Gaussian lobe scales (px) at w = 1. */
export const CENTER_SX0 = 36;
export const CENTER_SY0 = 30;

/** Design-width annulus peak radius (fixed) and thickness (scales). */
export const ANNULUS_R0 = 40;
export const ANNULUS_W0 = 14;

export function clampStrength(s: number): number {
  if (!Number.isFinite(s)) return 0;
  return Math.max(0, Math.min(A_MAX, s));
}

export function clampWidth(w: number): number {
  if (!Number.isFinite(w)) return WIDTH_DEFAULT;
  return Math.max(WIDTH_MIN, Math.min(WIDTH_MAX, w));
}

export function widthOf(cfg: FieldConfig): number {
  if (cfg.profile === "off") return WIDTH_DEFAULT;
  return clampWidth(cfg.width);
}

export function recessOf(cfg: FieldConfig): number {
  return clampRecess(Number.isFinite(cfg.recessDepth) ? cfg.recessDepth : RECESS_DEFAULT);
}

export function spatial(cfg: FieldConfig): {
  sx: number;
  sy: number;
  r0: number;
  ringW: number;
  scale: number;
} {
  const scale = widthOf(cfg);
  return {
    sx: CENTER_SX0 * scale,
    sy: CENTER_SY0 * scale,
    r0: ANNULUS_R0,
    ringW: ANNULUS_W0 * scale,
    scale,
  };
}

export function gaussianG(
  x: number,
  y: number,
  scale = WIDTH_DEFAULT,
  recess = RECESS_DEFAULT,
): number {
  const s = clampWidth(scale);
  const p = polePos(recess);
  const dx = (x - p.x) / (CENTER_SX0 * s);
  const dy = (y - p.y) / (CENTER_SY0 * s);
  return Math.exp(-(dx * dx + dy * dy));
}

export function annularG(
  x: number,
  y: number,
  scale = WIDTH_DEFAULT,
  recess = RECESS_DEFAULT,
): number {
  const s = clampWidth(scale);
  const p = polePos(recess);
  const r = Math.hypot(x - p.x, y - p.y);
  const u = (r - ANNULUS_R0) / (ANNULUS_W0 * s);
  return Math.exp(-(u * u));
}

export function envelope(
  x: number,
  y: number,
  profile: FieldProfile,
  scale = WIDTH_DEFAULT,
  recess = RECESS_DEFAULT,
): number {
  if (profile === "off") return 0;
  if (profile === "center-high") return gaussianG(x, y, scale, recess);
  return annularG(x, y, scale, recess);
}

export function indexAt(x: number, y: number, cfg: FieldConfig): number {
  if (cfg.profile === "off") return 1;
  const A = clampStrength(cfg.strength);
  if (A <= 0) return 1;
  const local = toLocal(x, y, cfg.theta ?? 0);
  const n = 1 + A * envelope(local.x, local.y, cfg.profile, widthOf(cfg), recessOf(cfg));
  return Math.max(N_MIN, Math.min(N_MAX, n));
}

export function sampleField(x: number, y: number, cfg: FieldConfig): FieldSample {
  const e = 0.85;
  const n = indexAt(x, y, cfg);
  const nx = (indexAt(x + e, y, cfg) - indexAt(x - e, y, cfg)) / (2 * e);
  const ny = (indexAt(x, y + e, cfg) - indexAt(x, y - e, cfg)) / (2 * e);
  return { n, nx, ny };
}

/** Isoline radii for drawing. Values are n-1 relative to A (g levels). */
export function isolineGs(): number[] {
  return [0.75, 0.4, 0.15];
}

export function centerHighRadius(
  g: number,
  scale = WIDTH_DEFAULT,
): { rx: number; ry: number } {
  const s = clampWidth(scale);
  const k = Math.sqrt(-Math.log(Math.max(g, 1e-6)));
  return { rx: CENTER_SX0 * s * k, ry: CENTER_SY0 * s * k };
}

export function annularRadii(
  g: number,
  scale = WIDTH_DEFAULT,
): { inner: number; outer: number } {
  const s = clampWidth(scale);
  const d = ANNULUS_W0 * s * Math.sqrt(-Math.log(Math.max(g, 1e-6)));
  return { inner: Math.max(0, ANNULUS_R0 - d), outer: ANNULUS_R0 + d };
}

function fmtLen(n: number): string {
  return Math.abs(n - Math.round(n)) < 0.05 ? n.toFixed(0) : n.toFixed(1);
}

export function describeField(cfg: FieldConfig): string {
  if (cfg.profile === "off" || cfg.strength <= 0) {
    return "n = 1  (vacuum)";
  }
  const A = clampStrength(cfg.strength).toFixed(2);
  const sp = spatial(cfg);
  if (cfg.profile === "center-high") {
    return `n = 1 + ${A} · exp(−(Δx/${fmtLen(sp.sx)})² − (Δy/${fmtLen(sp.sy)})²)`;
  }
  return `n = 1 + ${A} · exp(−((r − ${sp.r0})/${fmtLen(sp.ringW)})²)`;
}
