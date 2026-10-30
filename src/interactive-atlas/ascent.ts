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
 * From z=42 the floor rises (measured knots below) and the walls close in.
 * Headroom is still 3.14 m at z=30.5 (floor 9.939, walls ±4.75). By z=28
 * it is 2.14 m and the passage is ±3.4. The floor continues to about
 * z=20.7 and then ends. Nothing beyond that reaches the inner sphere
 * (center at the origin, r≈52.15) as a walkable room.
 *
 * The walk stops at z=30.5. The doorway is not widened.
 */

export const STAIR_HALF = 13.2;
export const STAIR_THROAT = 0.95;
/** Wide flight. Inside this z the mouth narrows toward the arch. */
export const STAIR_MOUTH_Z = 92;
/** Inner face of the arch. The hall continues past it. The plate stays here. */
export const STAIR_DOOR_Z = 78.4;
export const STAIR_LAND_Y = 6.275;
/**
 * Last stand where the floor is continuous and headroom still clears
 * a person plus the eye. Deeper stone exists; it is not a route.
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
  [HALL_END_Z, HALL_END_Y],
];

function lerp(z: number, z0: number, y0: number, z1: number, y1: number) {
  const t = (z0 - z) / (z0 - z1);
  return y0 + (y1 - y0) * t;
}

/** Half-width of the authorized route. The arch stays at the throat. */
export function stairHalf(z: number) {
  if (z >= STAIR_MOUTH_Z) return STAIR_HALF;
  if (z >= 85) return lerp(z, STAIR_MOUTH_Z, STAIR_HALF, 85, 4.4);
  if (z >= 82) return lerp(z, 85, 4.4, 82, STAIR_THROAT);
  if (z >= ARCH_KEEP_Z) return STAIR_THROAT;
  if (z >= HALL_WIDE_Z) return lerp(z, ARCH_KEEP_Z, STAIR_THROAT, HALL_WIDE_Z, 6.05);
  if (z >= RISE_Z) return 6.05;
  if (z >= 36) return lerp(z, RISE_Z, 6.05, 36, 5.15);
  if (z >= 32) return lerp(z, 36, 5.15, 32, 4.55);
  if (z >= HALL_END_Z) return lerp(z, 32, 4.55, HALL_END_Z, 4.15);
  return 4.15;
}

/** Camera may sit a little wider than the coat, still inside the stone. */
function cameraHalf(z: number) {
  if (z >= 82) return Math.max(1.15, stairHalf(z) - 0.15);
  if (z >= ARCH_KEEP_Z) return 1.15;
  if (z >= HALL_WIDE_Z) return lerp(z, ARCH_KEEP_Z, 1.15, HALL_WIDE_Z, 6.25);
  if (z >= RISE_Z) return 6.25;
  if (z >= 36) return lerp(z, RISE_Z, 6.25, 36, 5.2);
  if (z >= 32) return lerp(z, 36, 5.2, 32, 4.4);
  if (z >= HALL_END_Z) return lerp(z, 32, 4.4, HALL_END_Z, 3.8);
  return 3.8;
}

/** Inside the round blocker, on the stair, the arch, or the measured hall. */
export function inStairMouth(x: number, z: number, inset = 0) {
  if (z < HALL_END_Z - 1e-3 || z > 131) return false;
  const span = Math.max(0.45, stairHalf(z) - inset);
  return Math.abs(x) <= span + 0.03;
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

/** Piecewise ramp through the measured tread line. 0 off the route. */
export function stairHeight(x: number, z: number) {
  if (!inStairMouth(x, z)) return 0;
  let y = STAIR_LAND_Y;
  if (z >= TOE_Z) y = 0;
  else if (z > LAND_Z) y = pieceHeight(z, PROFILE, STAIR_LAND_Y);
  else if (z < RISE_Z) y = pieceHeight(z, RISE, HALL_END_Y);
  if (z > LAND_Z && y > 0) {
    const edge = Math.min(1, (Math.abs(x) / 10) * (Math.abs(x) / 10));
    y = Math.max(0, y - 0.26 * edge);
  }
  return y;
}

/** Standing in the arch, not on the flight and not deep in the hall. */
export function atCenotaphDoor(x: number, z: number) {
  return z <= 86.5 && z >= STAIR_DOOR_Z - 0.05 && Math.abs(x) <= 2.4 && stairHeight(x, z) > 6;
}

type Move = { x: number; z: number; vx: number; vz: number };

/**
 * Keep the circular Cenotaph exclusion, with a south route cut out of it.
 * A point already outside the circle is unchanged. Inside, the nearest
 * legal boundary wins: the rim, the passage wall, or the inner stop.
 */
export function constrainCenotaph(x: number, z: number, vx: number, vz: number, block = 130): Move {
  const radial = Math.hypot(x, z);
  if (radial >= block - 1e-4 || inStairMouth(x, z)) return { x, z, vx, vz };
  const ox = x;
  const oz = z;
  let bestD = Infinity;
  let bx = x;
  let bz = z;
  const consider = (px: number, pz: number) => {
    const d = (px - ox) * (px - ox) + (pz - oz) * (pz - oz);
    if (d < bestD) {
      bestD = d;
      bx = px;
      bz = pz;
    }
  };
  if (radial > 1e-4) consider((x / radial) * block, (z / radial) * block);
  else consider(0, block);
  if (z >= HALL_END_Z && z <= block + 1 && Math.abs(x) > stairHalf(z)) {
    const half = stairHalf(z);
    const px = Math.sign(x || 1) * half;
    if (Math.hypot(px, z) <= block + 0.2) consider(px, z);
  }
  if (z < HALL_END_Z) {
    const half = stairHalf(HALL_END_Z);
    const px = Math.max(-half, Math.min(half, x));
    consider(px, HALL_END_Z);
  }
  const dx = bx - ox;
  const dz = bz - oz;
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
  return { x: bx, z: bz, vx, vz };
}

/** Underside of the arch, then the hall ceiling. Open sky on the flight. */
function passageSoffit(z: number) {
  if (z >= 86) return 13.5;
  if (z >= 82) return lerp(z, 86, 12.69, 82, 8.95);
  if (z >= ARCH_KEEP_Z) return 8.75;
  if (z >= HALL_END_Z) return 13.08;
  return 8.75;
}

/** Inside the drum, the sample has to be in the passage. Outside is open air. */
function corridorXZ(x: number, z: number) {
  if (Math.hypot(x, z) >= CEN_CAMERA_LIMIT - 0.05) return true;
  if (z < HALL_END_Z - 1e-3 || z > 131) return false;
  if (inStairMouth(x, z)) return true;
  return Math.abs(x) <= cameraHalf(z) + 0.04;
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

/**
 * The boom may enter the drum only along the measured route.
 * The whole segment is tested, not just the endpoint: a wall or the arch
 * crown between Mister Why and the camera pulls the boom back along its
 * original direction, then lowers it under the soffit of what remains.
 * Elsewhere it stays outside CEN_CAMERA_LIMIT, as it did before the stair.
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
  let cap = Infinity;
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const px = avatarX + (x - avatarX) * t;
    const pz = avatarZ + (z - avatarZ) * t;
    if (Math.hypot(px, pz) >= CEN_CAMERA_LIMIT - 0.05) continue;
    cap = Math.min(cap, passageSoffit(pz) - SOFFIT_MARGIN);
  }
  if (y > cap) y = cap;
  return { x, y, z };
}
