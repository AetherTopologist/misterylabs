import { monumentCapActive } from "./monument-cap";

/**
 * Northern passage of the full-resolution Cenotaph. Closed on production.
 *
 * Re-measured on the seated full-resolution mesh, November 2026:
 * the cap holds 13.103 through z = -20.5 and the historic tread is
 * 12.937 by z = -20.8. That is the same 166 mm step as the south.
 * From there the treads mirror the south rise: 12.604 at -22, 10.938
 * at -26 and -28, 6.275 at -42. The hall stays at 6.275 with soffit
 * 13.075 through z = -83. Chest walls are ±6.68, so the walk uses the
 * same 6.05 inset as the south hall.
 *
 * The inner throat closes between z = -26.2 and -27.2. At z = -27 to
 * -28 the head opening is about ±3.33 at y = 12.2, inside the 2.38 m
 * clearance named in the survey, with headroom 13.075 - 10.938 = 2.137.
 * The walk narrows to 2.05 so the point stays inside that stone.
 *
 * The outer arch is not a mirror of the south door. Masonry pinches at
 * z = -84: chest ±2.18, head ±1.81, soffit 8.775 (headroom 2.50). It
 * holds through z = -87 and opens by z = -94. The walk uses a 0.95
 * throat, matching the south arch.
 *
 * Outside, the floor continues at 6.275 with no walls from z = -96.
 * It is the plinth, not a stair: still 6.275 at z = -122, then nothing.
 * There is no tread down to grade. The walk stops at z = -96.2, on the
 * last verified landing, and does not enter the ring.
 */

/** Where the northern corridor leaves the cap disc. */
export const NORTH_JOIN_Z = -19.45;
/** Last verified standing on the outer landing. */
export const NORTH_END_Z = -96.2;
/** Cap surface along the northern tongue, before the step. */
export const NORTH_CAP_Y = 13.103;
/** Historic tread just past the step. */
export const NORTH_TREAD_Y = 12.937;
export const NORTH_HALL_Y = 6.275;
/** Hall ceiling, seated. */
export const NORTH_SOFFIT_Y = 13.075;
/** Outer-arch soffit through the pinch. */
export const NORTH_ARCH_SOFFIT = 8.775;

const NORTH_RISE: ReadonlyArray<readonly [number, number]> = [
  [-20.7, NORTH_TREAD_Y],
  [-21, NORTH_TREAD_Y],
  [-22, 12.604],
  [-22.5, 12.27],
  [-25.5, 11.271],
  [-26, 10.938],
  [-28, 10.938],
  [-29, 10.605],
  [-29.5, 10.272],
  [-30.5, 9.939],
  [-32.5, 9.273],
  [-33, 8.94],
  [-33.5, 8.773],
  [-34, 8.607],
  [-36, 8.607],
  [-36.5, 8.274],
  [-39.5, 7.274],
  [-40, 6.941],
  [-42, NORTH_HALL_Y],
];

function lerp(z: number, z0: number, y0: number, z1: number, y1: number) {
  const t = (z0 - z) / (z0 - z1);
  return y0 + (y1 - y0) * t;
}

function piece(z: number, rows: ReadonlyArray<readonly [number, number]>, fallback: number) {
  if (z >= rows[0][0]) return rows[0][1];
  if (z <= rows[rows.length - 1][0]) return rows[rows.length - 1][1];
  for (let i = 0; i < rows.length - 1; i++) {
    const [z0, y0] = rows[i];
    const [z1, y1] = rows[i + 1];
    if (z <= z0 && z >= z1) return lerp(z, z0, y0, z1, y1);
  }
  return fallback;
}

export function northRouteOpen() {
  return monumentCapActive();
}

/** Half-width of the walk. Inset from the measured stone, not the ring. */
export function northHalf(z: number) {
  if (z > -26.2) return 6.05;
  if (z > -27.15) return lerp(z, -26.2, 6.05, -27.15, 2.05);
  if (z > -28.6) return 2.05;
  if (z > -32) return lerp(z, -28.6, 2.05, -32, 4.55);
  if (z > -36) return lerp(z, -32, 4.55, -36, 5.15);
  if (z > -42) return lerp(z, -36, 5.15, -42, 6.05);
  if (z > -82.5) return 6.05;
  if (z > -83.85) return lerp(z, -82.5, 6.05, -83.85, 0.95);
  if (z > -87.2) return 0.95;
  if (z > -90) return lerp(z, -87.2, 0.95, -90, 4.4);
  if (z > -93.2) return lerp(z, -90, 4.4, -93.2, 6.05);
  return 6.05;
}

/** Camera may sit slightly wider than the coat, still inside the stone. */
export function northCameraHalf(z: number) {
  return Math.max(0.8, northHalf(z) - 0.12);
}

export function inNorthMouth(x: number, z: number, inset = 0) {
  if (!northRouteOpen()) return false;
  if (z > NORTH_JOIN_Z || z < NORTH_END_Z) return false;
  const span = Math.max(0.45, northHalf(z) - inset);
  return Math.abs(x) <= span + 0.03;
}

/** Boom corridor. A few metres past the porch so Follow can sit behind a visitor facing home. */
export function inNorthCamera(x: number, z: number) {
  if (!northRouteOpen()) return false;
  if (z > NORTH_JOIN_Z + 0.3 || z < NORTH_END_Z - 3.8) return false;
  const clamped = Math.min(NORTH_JOIN_Z, Math.max(NORTH_END_Z, z));
  return Math.abs(x) <= northCameraHalf(clamped) + 0.2;
}

/** Measured tread. 13.103 on the tongue, then the step, then the mirrored rise, then the hall. */
export function northHeight(x: number, z: number) {
  if (!inNorthMouth(x, z)) return 0;
  if (z > -20.7) return NORTH_CAP_Y;
  if (z <= -42) return NORTH_HALL_Y;
  return piece(z, NORTH_RISE, NORTH_TREAD_Y);
}

/**
 * Soffit above the northern route, or null where the vault is the open shell.
 * Past the arch the landing is open air.
 */
export function northSoffit(z: number) {
  if (!northRouteOpen()) return null;
  if (z > NORTH_JOIN_Z + 0.2) return null;
  if (z < -95.2) return 48;
  if (z < -93) return lerp(z, -93, 13.06, -95.2, 48);
  if (z < -90) return lerp(z, -90, 11.577, -93, 13.06);
  if (z < -87.4) return lerp(z, -87.4, NORTH_ARCH_SOFFIT, -90, 11.577);
  if (z < -83.7) return NORTH_ARCH_SOFFIT;
  if (z < -82.4) return lerp(z, -82.4, NORTH_SOFFIT_Y, -83.7, NORTH_ARCH_SOFFIT);
  if (z < -26.55) return NORTH_SOFFIT_Y;
  return null;
}
