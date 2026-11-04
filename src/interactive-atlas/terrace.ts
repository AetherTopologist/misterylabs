import { northRouteOpen } from "./north-passage";

/**
 * Exterior plinth of the full-resolution Cenotaph.
 *
 * Seated mesh, November 2026. Up-faces at y = 6.275 are continuous from
 * r = 96 through r = 108 all the way around, and on to about r = 121
 * except the south flight. Chest- and head-height rays on r = 98, 102,
 * 106, 110, and 114 (every 3°) found no wall within 0.85 m. The only
 * misses are the south stair, where the treads have already dropped.
 * The drum face is inside r ≈ 95. The lip is gone by r = 124.
 *
 * The walk uses r = 96 to 116: a metre clear of the drum, and about
 * five metres short of the lip. Both arcs are open. The south flight is
 * not paved. At z ≥ 109 the centerline is the historic stair, and the
 * real plinth beside it resumes near |x| = 17.5. The gap between the
 * stair cheek and that plinth is left empty.
 * Production leaves this shut.
 */

export const TERRACE_Y = 6.275;
export const TERRACE_IN = 96;
export const TERRACE_OUT = 116;
/** The landing is still 6.275 through z = 108. The flight drops by z = 109. */
const SOUTH_FLIGHT_Z = 108.15;
/** Plinth beside the flight. Inside this the cheek is not a floor. */
const SOUTH_FLIGHT_HALF = 17.2;
/** First measured standing on that plinth. */
const SOUTH_SIDE = 18;

export function terraceOpen() {
  return northRouteOpen();
}

export function inTerrace(x: number, z: number, inset = 0) {
  if (!terraceOpen()) return false;
  const r = Math.hypot(x, z);
  if (r < TERRACE_IN + inset - 0.02 || r > TERRACE_OUT - inset + 0.02) return false;
  if (z > SOUTH_FLIGHT_Z && Math.abs(x) <= SOUTH_FLIGHT_HALF - inset) return false;
  return true;
}

export function terraceHeight(x: number, z: number) {
  return inTerrace(x, z) ? TERRACE_Y : 0;
}

/** Nearest standing on the ring, or null when the route is shut. */
export function clampToTerrace(x: number, z: number) {
  if (!terraceOpen()) return null;
  let px = x;
  let pz = z;
  let r = Math.hypot(px, pz);
  if (r < 1e-4) {
    px = 0;
    pz = -((TERRACE_IN + TERRACE_OUT) / 2);
    r = -pz;
  }
  if (r < TERRACE_IN) {
    px = (px / r) * TERRACE_IN;
    pz = (pz / r) * TERRACE_IN;
  } else if (r > TERRACE_OUT) {
    px = (px / r) * TERRACE_OUT;
    pz = (pz / r) * TERRACE_OUT;
  }
  if (pz > SOUTH_FLIGHT_Z && Math.abs(px) <= SOUTH_FLIGHT_HALF) {
    const side = Math.sign(px || x || 1) * SOUTH_SIDE;
    let sz = pz;
    const sr = Math.hypot(side, sz);
    if (sr > TERRACE_OUT) sz = Math.sign(sz || 1) * Math.sqrt(TERRACE_OUT * TERRACE_OUT - side * side);
    else if (sr < TERRACE_IN) sz = Math.sign(sz || 1) * Math.sqrt(TERRACE_IN * TERRACE_IN - side * side);
    px = side;
    pz = sz;
  }
  if (!inTerrace(px, pz)) return null;
  return { x: px, z: pz };
}
