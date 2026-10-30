import { GROUND_R } from "./world";
import { WALK_CLEARANCE } from "./framing";
import { stairHeight } from "./ascent";

/**
 * One garden court on the avenue north of the House of Unfolding.
 * The last path leg there is the line x = -62 * 6.6, so the court sits east of it.
 */
export const GARDEN_COURT = {
  x: -386.5,
  z: -108,
  /** Walker cylinder. Matches the outer stone ring, plus a kerb. */
  block: 13.35,
  rings: [
    { r: 13.2, top: 0.18 },
    { r: 8.6, top: 0.48 },
    { r: 4.5, top: 0.94 },
  ],
} as const;

/** Path-facing balustrade, in court-local meters. */
export const GARDEN_RAIL = {
  x: -11.55,
  hz: 6.4,
  hx: 0.34,
  top: 1.08,
} as const;

const ABYSS = -8.4;
const ABYSS_RUN = 16;

function ringHeight(distance: number) {
  const [outer, mid, inner] = GARDEN_COURT.rings;
  if (distance > outer.r) return 0;
  if (distance > mid.r + 1.15) {
    const t = (outer.r - distance) / (outer.r - (mid.r + 1.15));
    return outer.top * Math.min(1, Math.max(0, t));
  }
  if (distance > mid.r) return outer.top;
  if (distance > inner.r + 0.9) {
    const t = (mid.r - distance) / (mid.r - (inner.r + 0.9));
    return outer.top + (mid.top - outer.top) * Math.min(1, Math.max(0, t));
  }
  if (distance > inner.r) return mid.top;
  if (distance > inner.r - 1.05) {
    const t = (inner.r - distance) / 1.05;
    return mid.top + (inner.top - mid.top) * Math.min(1, Math.max(0, t));
  }
  return inner.top;
}

function railHeight(x: number, z: number) {
  const lx = x - GARDEN_COURT.x;
  const lz = z - GARDEN_COURT.z;
  if (Math.abs(lx - GARDEN_RAIL.x) > GARDEN_RAIL.hx) return 0;
  if (Math.abs(lz) > GARDEN_RAIL.hz) return 0;
  return GARDEN_RAIL.top;
}

/**
 * Height of the surface under a point. Flat fair, the cenotaph stair,
 * the rim falling into the abyss, and the garden court.
 */
export function sampleGround(x: number, z: number) {
  const radial = Math.hypot(x, z);
  let height = 0;
  if (radial > GROUND_R) {
    const t = Math.min(1, (radial - GROUND_R) / ABYSS_RUN);
    height = ABYSS * t;
  }
  const court = Math.hypot(x - GARDEN_COURT.x, z - GARDEN_COURT.z);
  if (court <= GARDEN_COURT.rings[0].r) height = Math.max(height, ringHeight(court));
  const rail = railHeight(x, z);
  if (rail > 0) height = Math.max(height, rail);
  const stair = stairHeight(x, z);
  if (stair > 0) height = Math.max(height, stair);
  return height;
}

export type Boom = { x: number; y: number; z: number };

/**
 * Keep a camera boom above the surface. A broad terrace lifts the boom.
 * A lip the avatar is not standing on shortens the boom instead.
 */
export function clearBoom(avatarX: number, avatarZ: number, boom: Boom, margin = WALK_CLEARANCE): Boom {
  let x = boom.x;
  let y = boom.y;
  let z = boom.z;
  const feet = sampleGround(avatarX, avatarZ);
  for (let i = 0; i < 6; i++) {
    const floor = sampleGround(x, z);
    if (y >= floor + margin - 1e-4) break;
    if (feet + margin >= floor - 0.08) {
      y = floor + margin;
      break;
    }
    x += (avatarX - x) * 0.34;
    z += (avatarZ - z) * 0.34;
  }
  const floor = sampleGround(x, z);
  if (y < floor + margin) y = floor + margin;
  return { x, y, z };
}

function pushCircle(x: number, z: number, vx: number, vz: number, cx: number, cz: number, rad: number) {
  const dx = x - cx;
  const dz = z - cz;
  const d = Math.hypot(dx, dz);
  if (d >= rad || d < 1e-4) return { x, z, vx, vz };
  const nx = dx / d;
  const nz = dz / d;
  x = cx + nx * rad;
  z = cz + nz * rad;
  const vn = vx * nx + vz * nz;
  if (vn < 0) {
    vx -= vn * nx;
    vz -= vn * nz;
  }
  return { x, z, vx, vz };
}

/** The court is a planted terrace. The avenue around it stays open. */
export function keepGarden(x: number, z: number, vx: number, vz: number) {
  return pushCircle(x, z, vx, vz, GARDEN_COURT.x, GARDEN_COURT.z, GARDEN_COURT.block);
}
