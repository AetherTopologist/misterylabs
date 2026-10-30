/**
 * South stair of the seated Cenotaph.
 *
 * Measured from cenotaph.glb after the same sphere-fit seating as cenotaph.ts
 * (sphere radius 52.15, base on y=0, masonry out to about r=122).
 * CEN_BLOCK is 130, so the circular collider sits in front of the stone.
 *
 * Centerline treads: z=122 y≈1.1, z=115 y≈4.2, z=109 y=7.0.
 * Landing y=7.28 from z≈107 through the arch. The floor stays 7.28 until z≈85,
 * then an interior rise to about y=11.6. A real opening about 3.6 m wide
 * (|x|<1.8 at body height) continues past that rise into an unmapped void.
 * The walk stops on the last flat threshold. It does not enter the chamber.
 */

export const STAIR_HALF = 13.2;
export const STAIR_THROAT = 1.7;
/** Wide flight and landing. Inside this z the mouth narrows toward the door. */
export const STAIR_MOUTH_Z = 92;
/** Last walkable point. Beyond it the floor leaves the landing. */
export const STAIR_DOOR_Z = 84.8;
export const STAIR_LAND_Y = 7.28;
/** Where the camera, like the old boom, stays outside the round wall. */
export const CEN_CAMERA_LIMIT = 133;

/** Pose a future interior chamber can return to. Not a scene transition. */
export const CENOTAPH_ENTRY = { x: 0, z: STAIR_DOOR_Z, heading: Math.PI, y: STAIR_LAND_Y };

const TOE_Z = 123;
const PROFILE: ReadonlyArray<readonly [number, number]> = [
  [123, 0],
  [121.9, 1.12],
  [121.2, 1.4],
  [109, 7],
  [107.2, STAIR_LAND_Y],
];

/** Half-width of the authorized mouth. Narrows in front of the arch. */
export function stairHalf(z: number) {
  if (z >= STAIR_MOUTH_Z) return STAIR_HALF;
  if (z <= STAIR_DOOR_Z) return STAIR_THROAT;
  const t = (STAIR_MOUTH_Z - z) / (STAIR_MOUTH_Z - STAIR_DOOR_Z);
  return STAIR_HALF + (STAIR_THROAT - STAIR_HALF) * t;
}

/** Inside the round blocker, but on the south stair or its threshold. */
export function inStairMouth(x: number, z: number, inset = 0) {
  if (z < STAIR_DOOR_Z - 1e-3 || z > 131) return false;
  const span = Math.max(0.45, stairHalf(Math.max(z, STAIR_DOOR_Z)) - inset);
  return Math.abs(x) <= span + 0.03;
}

/** Piecewise ramp through the tread line. 0 off the stair, including the forecourt. */
export function stairHeight(x: number, z: number) {
  if (!inStairMouth(x, z)) return 0;
  let y = STAIR_LAND_Y;
  if (z >= TOE_Z) y = 0;
  else if (z > PROFILE[PROFILE.length - 1][0]) {
    for (let i = 0; i < PROFILE.length - 1; i++) {
      const [z0, y0] = PROFILE[i];
      const [z1, y1] = PROFILE[i + 1];
      if (z <= z0 && z >= z1) {
        const t = (z0 - z) / (z0 - z1);
        y = y0 + (y1 - y0) * t;
        break;
      }
    }
  }
  if (z > 107.2 && y > 0) {
    const edge = Math.min(1, (Math.abs(x) / 10) * (Math.abs(x) / 10));
    y = Math.max(0, y - 0.26 * edge);
  }
  return y;
}

/** Standing in the doorway, not merely on the flight. */
export function atCenotaphDoor(x: number, z: number) {
  return z <= 91 && z >= STAIR_DOOR_Z - 0.05 && Math.abs(x) <= 4.2 && stairHeight(x, z) > 6.5;
}

type Move = { x: number; z: number; vx: number; vz: number };

/**
 * Keep the circular Cenotaph exclusion, with a south mouth cut out of it.
 * A point already outside the circle is unchanged. Inside, the nearest
 * legal boundary wins: the rim, the funnel wall, or the door threshold.
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
  if (z >= STAIR_DOOR_Z && z <= block + 1 && Math.abs(x) > stairHalf(z)) {
    const half = stairHalf(z);
    const px = Math.sign(x || 1) * half;
    if (Math.hypot(px, z) <= block + 0.2) consider(px, z);
  }
  if (z < STAIR_DOOR_Z) {
    const px = Math.max(-STAIR_THROAT, Math.min(STAIR_THROAT, x));
    consider(px, STAIR_DOOR_Z);
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

type Boom = { x: number; y: number; z: number };

/**
 * The boom may enter the round blocker only along the same mouth as the walker.
 * Elsewhere it stays outside CEN_CAMERA_LIMIT, as it did before the stair existed.
 */
export function placeCenotaphCamera(avatarX: number, avatarZ: number, boom: Boom): Boom {
  const r = Math.hypot(boom.x, boom.z);
  const avatarIn = inStairMouth(avatarX, avatarZ);
  if (r >= CEN_CAMERA_LIMIT && !avatarIn) return boom;
  if (avatarIn && (inStairMouth(boom.x, boom.z, 0.35) || r >= CEN_CAMERA_LIMIT)) return boom;
  if (avatarIn) {
    let x = boom.x;
    let z = boom.z;
    for (let i = 0; i < 8; i++) {
      if (inStairMouth(x, z, 0.35) || Math.hypot(x, z) >= CEN_CAMERA_LIMIT) break;
      x += (avatarX - x) * 0.42;
      z += (avatarZ - z) * 0.42;
    }
    if (!inStairMouth(x, z, 0.35) && Math.hypot(x, z) < CEN_CAMERA_LIMIT) {
      const fixed = constrainCenotaph(x, z, 0, 0);
      x = fixed.x;
      z = fixed.z;
    }
    return { x, y: boom.y, z };
  }
  if (r > 0.01 && r < CEN_CAMERA_LIMIT) {
    const s = CEN_CAMERA_LIMIT / r;
    return { x: boom.x * s, y: boom.y, z: boom.z * s };
  }
  return boom;
}
