/**
 * South stair of the seated Cenotaph.
 *
 * Seating is the same as cenotaph.ts: sphere fit of Unir, then the SketchUp
 * bounds sit on y = 0. That box starts at y = 0 (holder.y ≈ 60.93). A node
 * outside SketchUp reaches y = -1 and must not be used as the floor datum.
 *
 * GLTFLoader up-faces on the centerline, after that seating:
 * z=121 y=0.415, z=118 y=1.797, z=115 y=3.195, z=112 y=4.595,
 * z=109 y=5.995, z=108 y=6.275. The landing is 6.275 from there through
 * the arch. The old ramp used 7.28, about a meter above this stone.
 *
 * The arch tightens near z=82. At chest height the opening is about ±2.0;
 * just over head height it is about ±1.4, and the soffit is y≈8.95.
 * The walk stops on the inner threshold, z=78.4, still on the landing,
 * before the unmapped hall. The camera may come a little further into the
 * opening and ducks under the soffit instead of entering the stone.
 */

export const STAIR_HALF = 13.2;
export const STAIR_THROAT = 0.95;
/** Wide flight. Inside this z the mouth narrows toward the arch. */
export const STAIR_MOUTH_Z = 92;
/** Inner threshold. The landing floor continues, the hall beyond is not a room. */
export const STAIR_DOOR_Z = 78.4;
export const STAIR_LAND_Y = 6.275;
/** Where the camera, like the old boom, stays outside the round wall. */
export const CEN_CAMERA_LIMIT = 133;

/** Pose a future interior chamber can return to. Not a scene transition. */
export const CENOTAPH_ENTRY = { x: 0, z: STAIR_DOOR_Z, heading: Math.PI, y: STAIR_LAND_Y };

const TOE_Z = 122;
const LAND_Z = 108;
/** How far the trailing camera may sit past the walker stop, still in the opening. */
const CAMERA_INNER_Z = 76.4;
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

/** Half-width of the authorized mouth. Narrows through the measured arch. */
export function stairHalf(z: number) {
  if (z >= STAIR_MOUTH_Z) return STAIR_HALF;
  if (z >= 85) {
    const t = (STAIR_MOUTH_Z - z) / (STAIR_MOUTH_Z - 85);
    return STAIR_HALF + (4.4 - STAIR_HALF) * t;
  }
  if (z >= 82) {
    const t = (85 - z) / (85 - 82);
    return 4.4 + (STAIR_THROAT - 4.4) * t;
  }
  return STAIR_THROAT;
}

/** Inside the round blocker, but on the south stair or its threshold. */
export function inStairMouth(x: number, z: number, inset = 0) {
  if (z < STAIR_DOOR_Z - 1e-3 || z > 131) return false;
  const span = Math.max(0.45, stairHalf(Math.max(z, STAIR_DOOR_Z)) - inset);
  return Math.abs(x) <= span + 0.03;
}

/** Piecewise ramp through the measured tread line. 0 off the stair. */
export function stairHeight(x: number, z: number) {
  if (!inStairMouth(x, z)) return 0;
  let y = STAIR_LAND_Y;
  if (z >= TOE_Z) y = 0;
  else if (z > LAND_Z) {
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
  if (z > LAND_Z && y > 0) {
    const edge = Math.min(1, (Math.abs(x) / 10) * (Math.abs(x) / 10));
    y = Math.max(0, y - 0.26 * edge);
  }
  return y;
}

/** Standing in the arch, not merely on the flight. */
export function atCenotaphDoor(x: number, z: number) {
  return z <= 86.5 && z >= STAIR_DOOR_Z - 0.05 && Math.abs(x) <= 2.4 && stairHeight(x, z) > 6;
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

/** Opening half-width the camera may use. Inside the stone, outside the coat. */
function doorHalf(z: number) {
  if (z >= 88) return 6;
  if (z >= 84) {
    const t = (88 - z) / 4;
    return 6 + (4.2 - 6) * t;
  }
  if (z >= 81.6) {
    const t = (84 - z) / (84 - 81.6);
    return 4.2 + (1.15 - 4.2) * t;
  }
  return 1.15;
}

/** Underside of the arch. High on the landing, low through the doorway, open in the hall. */
function doorSoffit(z: number) {
  if (z >= 86) return 13.5;
  if (z >= 82) {
    const t = (86 - z) / 4;
    return 12.69 + (8.95 - 12.69) * t;
  }
  if (z >= CAMERA_INNER_Z) return 8.75;
  return 13;
}

function cameraSpan(x: number, z: number, nearDoor: boolean) {
  if (inStairMouth(x, z, 0.35)) return true;
  if (!nearDoor || z < CAMERA_INNER_Z || z > 90) return false;
  return Math.abs(x) <= doorHalf(z);
}

type Boom = { x: number; y: number; z: number };

/**
 * The boom may enter the round blocker only along the stair mouth, and a
 * little further into the doorway when the walker is already there.
 * A boom that would cross the arch crown is lowered under the soffit.
 * Elsewhere it stays outside CEN_CAMERA_LIMIT, as it did before the stair.
 */
export function placeCenotaphCamera(avatarX: number, avatarZ: number, boom: Boom): Boom {
  const r = Math.hypot(boom.x, boom.z);
  const avatarIn = inStairMouth(avatarX, avatarZ);
  if (!avatarIn) {
    if (r > 0.01 && r < CEN_CAMERA_LIMIT) {
      const s = CEN_CAMERA_LIMIT / r;
      return { x: boom.x * s, y: boom.y, z: boom.z * s };
    }
    return boom;
  }
  const nearDoor = avatarZ <= 91;
  let x = boom.x;
  let y = boom.y;
  let z = boom.z;
  if (!(cameraSpan(x, z, nearDoor) || r >= CEN_CAMERA_LIMIT)) {
    for (let i = 0; i < 12; i++) {
      if (cameraSpan(x, z, nearDoor) || Math.hypot(x, z) >= CEN_CAMERA_LIMIT) break;
      x += (avatarX - x) * 0.42;
      z += (avatarZ - z) * 0.42;
    }
    if (!cameraSpan(x, z, nearDoor) && Math.hypot(x, z) < CEN_CAMERA_LIMIT) {
      const fixed = constrainCenotaph(x, z, 0, 0);
      x = fixed.x;
      z = fixed.z;
    }
  }
  if (nearDoor && z <= 86 && z >= CAMERA_INNER_Z) {
    const cap = doorSoffit(z) - SOFFIT_MARGIN;
    if (y > cap) y = cap;
  }
  return { x, y, z };
}
