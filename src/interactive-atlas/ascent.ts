/**
 * South stair and the first interior passage of the seated Cenotaph.
 *
 * Seating is the same as cenotaph.ts: sphere fit of Unir, then the SketchUp
 * bounds sit on y = 0. That box starts at y = 0 (holder.y ≈ 60.93). A node
 * outside SketchUp reaches y = -1 and must not be used as the floor datum.
 *
 * GLTFLoader up-faces on the centerline, after that seating:
 * z=121 y=0.415, z=118 y=1.797, z=115 y=3.195, z=112 y=4.595,
 * z=109 y=5.995, z=108 y=6.275. The landing is 6.275 from there through
 * the arch and the hall, until the inner rise at z=42.
 *
 * The arch tightens near z=82 and holds through z=77.5: chest opening about
 * ±2.19, head about ±1.83, soffit y≈8.78. It opens at z=77 into a hall
 * ±6.69 wide, floor 6.275, soffit 13.08, clear to z=42. No piers.
 * From z=42 the floor rises. Headroom is 3.14 m at z=30.5. A low throat
 * follows: at z=28 the soffit is still 13.08, headroom 2.14 m, walls about
 * ±3.44. The ceiling mesh ends near z=26.5. The ramp then opens to ±6.75
 * and finishes at z=21, y=12.937. By z=20.6 the historic floor is gone.
 * That end is the south opening of the dome. New stone continues the walk
 * (dome-floor.ts). The doorway is not widened.
 *
 * Scale stays put. Seated, the terrace cutout is 1.275 m and the arch
 * figures read 1.587 m. His head is at 1.75. The throat at z=28 still
 * clears that body: headroom 2.14 m, half-width at the head 2.60 m.
 * The eye at 2.42 does not, so the boom ducks there. Past z=26.7 the
 * ceiling mesh is gone and the shell is open, so the boom comes forward
 * instead of kneeling for a segment that only clips the lintel.
 */

import {
  APRON_HALF,
  APRON_Z0,
  APRON_Z1,
  DOME_R,
  NECK_HALF,
  NECK_Z0,
  NECK_Z1,
  STONE_END_Z,
  WALK_R,
  onObservationFloor,
  shellUpperY,
} from "./dome-floor";
import { CAP_WALK_R, monumentCapActive, onCapDisc } from "./monument-cap";
import {
  NORTH_END_Z,
  NORTH_JOIN_Z,
  inNorthCamera,
  inNorthMouth,
  northCameraHalf,
  northHalf,
  northHeight,
  northRouteOpen,
  northSoffit,
} from "./north-passage";
import { TERRACE_IN, clampToTerrace, inTerrace, terraceHeight, terraceOpen } from "./terrace";

export const STAIR_HALF = 13.2;
export const STAIR_THROAT = 0.95;
/** Wide flight. Inside this z the mouth narrows toward the arch. */
export const STAIR_MOUTH_Z = 92;
/** Inner face of the arch. The hall continues past it. The plate stays here. */
export const STAIR_DOOR_Z = 78.4;
export const STAIR_LAND_Y = 6.275;
/**
 * Where headroom is still 3.14 m. The historic ramp continues through a
 * lower throat; this is no longer the end of the walk.
 */
export const HALL_END_Z = 30.5;
export const HALL_END_Y = 9.939;
/** Where the camera, like the old boom, stays outside the round wall. */
export const CEN_CAMERA_LIMIT = 133;

/** Pose at the arch. Not a scene transition, and not the end of the walk. */
export const CENOTAPH_ENTRY = { x: 0, z: STAIR_DOOR_Z, heading: Math.PI, y: STAIR_LAND_Y };

const TOE_Z = 122;
const LAND_Z = 108;
/** Arch masonry still closes the passage here. The hall is open by z=77. */
const ARCH_KEEP_Z = 77.15;
const HALL_WIDE_Z = 76.4;
const RISE_Z = 42;
/** Historic ceiling mesh is gone below this z. The vault is the shell. */
const CEILING_END_Z = 26.55;
const SOFFIT_MARGIN = 0.32;

const PROFILE: ReadonlyArray<readonly [number, number]> = [
  [122, 0],
  [121.5, 0.138],
  [121, 0.415],
  [120, 0.829],
  [119, 1.382],
  [118, 1.797],
  [117, 2.212],
  [116, 2.775],
  [115, 3.195],
  [114, 3.615],
  [113, 4.035],
  [112, 4.595],
  [111, 5.015],
  [110, 5.435],
  [109, 5.995],
  [108, STAIR_LAND_Y],
];

/** Inner rise, high z to low z. Linear between these up-faces stays within a few cm. */
const RISE: ReadonlyArray<readonly [number, number]> = [
  [42, STAIR_LAND_Y],
  [40, 6.941],
  [39.5, 7.274],
  [36.5, 8.274],
  [36, 8.607],
  [34, 8.607],
  [33.5, 8.773],
  [33, 8.94],
  [32.5, 9.273],
  [30.5, 9.939],
  [29.5, 10.272],
  [29, 10.605],
  [28, 10.938],
  [26, 10.938],
  [25.5, 11.271],
  [22.5, 12.27],
  [22, 12.604],
  [21, 12.937],
];

function lerp(z: number, z0: number, y0: number, z1: number, y1: number) {
  const t = (z0 - z) / (z0 - z1);
  return y0 + (y1 - y0) * t;
}

/** Half-width of the authorized historic route. The arch stays at the throat. */
export function stairHalf(z: number) {
  if (z >= STAIR_MOUTH_Z) return STAIR_HALF;
  if (z >= 85) return lerp(z, STAIR_MOUTH_Z, STAIR_HALF, 85, 4.4);
  if (z >= 82) return lerp(z, 85, 4.4, 82, STAIR_THROAT);
  if (z >= ARCH_KEEP_Z) return STAIR_THROAT;
  if (z >= HALL_WIDE_Z) return lerp(z, ARCH_KEEP_Z, STAIR_THROAT, HALL_WIDE_Z, 6.05);
  if (z >= RISE_Z) return 6.05;
  if (z >= 36) return lerp(z, RISE_Z, 6.05, 36, 5.15);
  if (z >= 32) return lerp(z, 36, 5.15, 32, 4.55);
  if (z >= 28) return lerp(z, 32, 4.55, 28, 2.95);
  if (z >= CEILING_END_Z) return lerp(z, 28, 2.95, CEILING_END_Z, 6.05);
  if (z >= STONE_END_Z) return 6.05;
  return NECK_HALF;
}

/** Camera may sit a little wider than the coat, still inside the stone. */
function cameraHalf(z: number) {
  if (z >= 82) return Math.max(1.15, stairHalf(z) - 0.15);
  if (z >= ARCH_KEEP_Z) return 1.15;
  if (z >= HALL_WIDE_Z) return lerp(z, ARCH_KEEP_Z, 1.15, HALL_WIDE_Z, 6.25);
  if (z >= RISE_Z) return 6.25;
  if (z >= 36) return lerp(z, RISE_Z, 6.25, 36, 5.2);
  if (z >= 32) return lerp(z, 36, 5.2, 32, 4.4);
  if (z >= 28) return lerp(z, 32, 4.4, 28, 2.05);
  if (z >= CEILING_END_Z) return lerp(z, 28, 2.05, CEILING_END_Z, 6.2);
  if (z >= STONE_END_Z) return 6.2;
  return NECK_HALF + 0.35;
}

/** Historic ramp, arch, and hall. The new floor is separate. */
function inHistoricMouth(x: number, z: number, inset = 0) {
  if (z < STONE_END_Z - 1e-3 || z > 131) return false;
  const span = Math.max(0.45, stairHalf(z) - inset);
  return Math.abs(x) <= span + 0.03;
}

/** Inside the round blocker, on the measured route, the new floor, the cap, the north passage, or the terrace. */
export function inStairMouth(x: number, z: number, inset = 0) {
  if (inHistoricMouth(x, z, inset)) return true;
  if (onObservationFloor(x, z, inset)) return true;
  if (inNorthMouth(x, z, inset)) return true;
  if (inTerrace(x, z, inset)) return true;
  // The full-resolution annulus. Empty on production, so this stays false.
  return onCapDisc(x, z, inset);
}

function pieceHeight(z: number, rows: ReadonlyArray<readonly [number, number]>, fallback: number) {
  if (z <= rows[rows.length - 1][0]) return rows[rows.length - 1][1];
  for (let i = 0; i < rows.length - 1; i++) {
    const [z0, y0] = rows[i];
    const [z1, y1] = rows[i + 1];
    if (z <= z0 && z >= z1) return lerp(z, z0, y0, z1, y1);
  }
  return fallback;
}

/** Piecewise ramp through the measured tread line. Dome floor past the stone. */
export function stairHeight(x: number, z: number) {
  if (inHistoricMouth(x, z)) {
    let y = STAIR_LAND_Y;
    if (z >= TOE_Z) y = 0;
    else if (z > LAND_Z) y = pieceHeight(z, PROFILE, STAIR_LAND_Y);
    else if (z < RISE_Z) y = pieceHeight(z, RISE, 12.937);
    if (z > LAND_Z && y > 0) {
      const edge = Math.min(1, (Math.abs(x) / 10) * (Math.abs(x) / 10));
      y = Math.max(0, y - 0.26 * edge);
    }
    return y;
  }
  if (onObservationFloor(x, z)) return 12.937;
  const north = northHeight(x, z);
  if (north > 0) return north;
  const terrace = terraceHeight(x, z);
  if (terrace > 0) return terrace;
  return 0;
}

/** Standing in the arch, not on the flight and not deep in the hall. */
export function atCenotaphDoor(x: number, z: number) {
  return z <= 86.5 && z >= STAIR_DOOR_Z - 0.05 && Math.abs(x) <= 2.4 && stairHeight(x, z) > 6;
}

type Move = { x: number; z: number; vx: number; vz: number };

/**
 * The step left the northern opening. Ride the measured wall instead of
 * jumping to the far side of the pinch. Sideways travel this frame stays
 * within the length of the step.
 */
function slideNorth(ox: number, oz: number, x: number, z: number, vx: number, vz: number): Move {
  const budget = Math.max(Math.hypot(x - ox, z - oz), 1e-3);
  const placed = (t: number) => {
    const nz = oz + (z - oz) * t;
    const half = Math.max(0.45, northHalf(nz));
    const nx = ox + (x - ox) * t;
    const cx = Math.max(-half, Math.min(half, nx));
    return { cx, nz, half };
  };
  const legal = (t: number) => {
    const p = placed(t);
    return Math.abs(p.cx - ox) <= budget + 1e-6 && inStairMouth(p.cx, p.nz);
  };
  if (!legal(0)) return { x: ox, z: oz, vx: 0, vz: 0 };
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    if (legal(mid)) lo = mid;
    else hi = mid;
  }
  const p = placed(lo);
  if (Math.abs(p.cx) >= p.half - 0.04) {
    if (p.cx > 0 && vx > 0) vx = 0;
    if (p.cx < 0 && vx < 0) vx = 0;
  }
  return { x: p.cx, z: p.nz, vx, vz };
}

function considerInto(
  best: { d: number; x: number; z: number },
  ox: number,
  oz: number,
  px: number,
  pz: number,
) {
  const d = (px - ox) * (px - ox) + (pz - oz) * (pz - oz);
  if (d < best.d) {
    best.d = d;
    best.x = px;
    best.z = pz;
  }
}

/**
 * Keep the circular Cenotaph exclusion, with the south route and the
 * observation floor cut out of it. A point already on that route is unchanged.
 */
export function constrainCenotaph(
  x: number,
  z: number,
  vx: number,
  vz: number,
  block = 130,
  ox = x,
  oz = z,
): Move {
  const radial = Math.hypot(x, z);
  if (radial >= block - 1e-4 || inStairMouth(x, z)) return { x, z, vx, vz };
  // Started in the northern opening and landed outside it. The nearest
  // legal point jumps the throat and the outer arch.
  if (inNorthMouth(ox, oz)) return slideNorth(ox, oz, x, z, vx, vz);
  const best = { d: Infinity, x, z };
  if (radial > 1e-4) considerInto(best, x, z, (x / radial) * block, (z / radial) * block);
  else considerInto(best, x, z, 0, block);
  if (z >= STONE_END_Z && z <= block + 1 && Math.abs(x) > stairHalf(z)) {
    const half = stairHalf(z);
    const px = Math.sign(x || 1) * half;
    if (Math.hypot(px, z) <= block + 0.2) considerInto(best, x, z, px, z);
  }
  if (z < STONE_END_Z + 0.2) {
    const d = Math.hypot(x, z);
    if (d > WALK_R && d > 1e-4) considerInto(best, x, z, (x / d) * WALK_R, (z / d) * WALK_R);
    const nx = Math.max(-NECK_HALF, Math.min(NECK_HALF, x));
    const nz = Math.max(NECK_Z0, Math.min(STONE_END_Z, z));
    considerInto(best, x, z, nx, nz);
    const ax = Math.max(-APRON_HALF, Math.min(APRON_HALF, x));
    const az = Math.max(APRON_Z0, Math.min(APRON_Z1, z));
    considerInto(best, x, z, ax, az);
    const hx = Math.max(-stairHalf(STONE_END_Z), Math.min(stairHalf(STONE_END_Z), x));
    considerInto(best, x, z, hx, STONE_END_Z);
  }
  // Full-resolution cap only. A step past 19.5 returns to the cap, except
  // where the northern passage is the nearer measured floor.
  if (monumentCapActive()) {
    const d = Math.hypot(x, z);
    if (d > CAP_WALK_R && d > 1e-4) {
      const px = (x / d) * CAP_WALK_R;
      const pz = (z / d) * CAP_WALK_R;
      // The rim cell itself often rounds empty. onCapDisc looks one cell in.
      if (onCapDisc(px, pz)) considerInto(best, x, z, px, pz);
    }
  }
  if (northRouteOpen() && z < NORTH_JOIN_Z + 0.8) {
    const nz = Math.max(NORTH_END_Z, Math.min(NORTH_JOIN_Z, z));
    const half = northHalf(nz);
    const nx = Math.max(-half, Math.min(half, x));
    considerInto(best, x, z, nx, nz);
  }
  if (terraceOpen()) {
    const terrace = clampToTerrace(x, z);
    if (terrace) considerInto(best, x, z, terrace.x, terrace.z);
  }
  const dx = best.x - x;
  const dz = best.z - z;
  const len = Math.hypot(dx, dz);
  if (len > 1e-6) {
    const nx = dx / len;
    const nz = dz / len;
    const vn = vx * nx + vz * nz;
    if (vn < 0) {
      vx -= vn * nx;
      vz -= vn * nz;
    }
  }
  return { x: best.x, z: best.z, vx, vz };
}

/** Underside of the arch, the hall ceiling, the northern passage, then the open vault. */
function passageSoffit(x: number, z: number) {
  // The plinth is open air. A high boom must recover here instead of
  // inheriting the hall ceiling from the south approach.
  if (terraceOpen() && Math.hypot(x, z) >= TERRACE_IN - 1.5) return 72;
  if (z < -18) {
    const northern = northSoffit(z);
    if (northern != null) return northern;
    if (northRouteOpen() && z >= NORTH_END_Z - 4) {
      const radial = Math.min(Math.hypot(x, z), DOME_R - 0.8);
      return Math.min(96, shellUpperY(radial) - 0.5);
    }
  }
  if (z >= 86) return 13.5;
  if (z >= 82) return lerp(z, 86, 12.69, 82, 8.95);
  if (z >= ARCH_KEEP_Z) return 8.75;
  if (z >= CEILING_END_Z) return 13.08;
  const radial = Math.min(Math.hypot(x, z), DOME_R - 0.8);
  return Math.min(96, shellUpperY(radial) - 0.5);
}

/** Inside the drum, the sample has to be in the passage. Outside is open air. */
function corridorXZ(x: number, z: number) {
  if (Math.hypot(x, z) >= CEN_CAMERA_LIMIT - 0.05) return true;
  if (terraceOpen() && Math.hypot(x, z) >= TERRACE_IN - 1.5) return true;
  if (inStairMouth(x, z)) return true;
  if (Math.hypot(x, z) <= WALK_R + 1.5 && z <= STONE_END_Z + 0.4) return true;
  if (z >= NECK_Z0 && z <= NECK_Z1 && Math.abs(x) <= NECK_HALF + 0.45) return true;
  if (z >= APRON_Z0 && z <= APRON_Z1 && Math.abs(x) <= APRON_HALF + 0.4) return true;
  if (z >= STONE_END_Z && z <= 131 && Math.abs(x) <= cameraHalf(z) + 0.04) return true;
  if (inNorthCamera(x, z)) return true;
  if (z <= NORTH_JOIN_Z && z >= NORTH_END_Z - 3.8 && Math.abs(x) <= northCameraHalf(z) + 0.04 && northRouteOpen()) return true;
  return false;
}

function segmentBlocked(ax: number, az: number, bx: number, bz: number) {
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    if (!corridorXZ(ax + (bx - ax) * t, az + (bz - az) * t)) return true;
  }
  return false;
}

type Boom = { x: number; y: number; z: number };

function segmentSoffitCap(ax: number, az: number, bx: number, bz: number) {
  let cap = Infinity;
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const px = ax + (bx - ax) * t;
    const pz = az + (bz - az) * t;
    if (Math.hypot(px, pz) >= CEN_CAMERA_LIMIT - 0.05) continue;
    cap = Math.min(cap, passageSoffit(px, pz) - SOFFIT_MARGIN);
  }
  return cap;
}

/**
 * The boom may enter the drum only along the measured route and the new floor.
 * The whole segment is tested, not just the endpoint: a wall or the arch
 * crown between Mister Why and the camera pulls the boom back along its
 * original direction. A low soffit does the same before it ducks: the boom
 * comes forward until eye height fits, and only the remaining segment
 * lowers. Elsewhere it stays outside CEN_CAMERA_LIMIT.
 */
export function placeCenotaphCamera(avatarX: number, avatarZ: number, boom: Boom): Boom {
  const r = Math.hypot(boom.x, boom.z);
  if (!inStairMouth(avatarX, avatarZ)) {
    if (r > 0.01 && r < CEN_CAMERA_LIMIT) {
      const s = CEN_CAMERA_LIMIT / r;
      return { x: boom.x * s, y: boom.y, z: boom.z * s };
    }
    return boom;
  }
  let x = boom.x;
  let y = boom.y;
  let z = boom.z;
  for (let i = 0; i < 16 && segmentBlocked(avatarX, avatarZ, x, z); i++) {
    x += (avatarX - x) * 0.42;
    z += (avatarZ - z) * 0.42;
  }
  if (segmentBlocked(avatarX, avatarZ, x, z)) {
    const fixed = constrainCenotaph(x, z, 0, 0);
    x = fixed.x;
    z = fixed.z;
  }
  for (let i = 0; i < 16 && y > segmentSoffitCap(avatarX, avatarZ, x, z); i++) {
    const nx = x + (avatarX - x) * 0.42;
    const nz = z + (avatarZ - z) * 0.42;
    if (Math.hypot(nx - avatarX, nz - avatarZ) < 0.45) break;
    x = nx;
    z = nz;
  }
  const cap = segmentSoffitCap(avatarX, avatarZ, x, z);
  if (y > cap) y = cap;
  return { x, y, z };
}

/**
 * Vista. Same wall test as the walk boom, but a low soffit only ducks
 * the height. Pulling the whole boom onto the body left him out of frame
 * under a ceiling he can still stand in, and the elevated view never
 * came back until the saved distance was thrown away.
 */
export function fitBoom(avatarX: number, avatarZ: number, boom: Boom): Boom {
  const r = Math.hypot(boom.x, boom.z);
  if (!inStairMouth(avatarX, avatarZ)) {
    if (r > 0.01 && r < CEN_CAMERA_LIMIT) {
      const s = CEN_CAMERA_LIMIT / r;
      return { x: boom.x * s, y: boom.y, z: boom.z * s };
    }
    return boom;
  }
  let x = boom.x;
  let z = boom.z;
  for (let i = 0; i < 16 && segmentBlocked(avatarX, avatarZ, x, z); i++) {
    x += (avatarX - x) * 0.42;
    z += (avatarZ - z) * 0.42;
  }
  if (segmentBlocked(avatarX, avatarZ, x, z)) {
    const fixed = constrainCenotaph(x, z, 0, 0);
    x = fixed.x;
    z = fixed.z;
  }
  let y = boom.y;
  const cap = segmentSoffitCap(avatarX, avatarZ, x, z);
  if (y > cap) y = cap;
  return { x, y, z };
}

/**
 * Where to put a visitor who is inside the drum after a model switch
 * removed the floor they were standing on. Null when the current route
 * still holds them. The landing is the observation disc, along the same
 * bearing, which both models support.
 */
export function fallbackInsideMonument(x: number, z: number, block = 130) {
  if (inStairMouth(x, z) || Math.hypot(x, z) >= block - 0.05) return null;
  const r = Math.hypot(x, z);
  if (r < 1e-3) return { x: 0, z: 0 };
  const limit = Math.min(WALK_R - 0.05, r);
  return { x: (x / r) * limit, z: (z / r) * limit };
}
