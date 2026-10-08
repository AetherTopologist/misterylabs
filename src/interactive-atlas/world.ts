import type { ExhibitId } from "./destinations";

/** One coordinate record for the fair. The scene, the walker, and the map all read this. */
export const LAYOUT = 6.6;
export const GROUND_R = 96 * LAYOUT;

/** Circular plinth of the native Cenotaph. The map draws this. */
export const CEN_FOOT = 122;

/** Walker stays outside the stair and plinth. */
export const CEN_BLOCK = 130;

export const GROUND_WALK = GROUND_R * 0.92;

/** Front court, just beyond the stair, facing the sphere. */
export const FOOT = { x: 0, z: 158 };

export type Place = {
  x: number;
  y: number;
  z: number;
  /** Cylinder the walker cannot enter. */
  block: number;
  /** Distance at which the name and question appear. */
  reach: number;
};

export const PLACES: Record<ExhibitId, Place> = {
  hydrogen: { x: 36 * LAYOUT, y: 2.4, z: 18 * LAYOUT, block: 4.4, reach: 18 },
  triad: { x: -48 * LAYOUT, y: 2.2, z: 12 * LAYOUT, block: 5.4, reach: 20 },
  optics: { x: 38 * LAYOUT, y: 2.2, z: -28 * LAYOUT, block: 5.8, reach: 20 },
  xprimeray: { x: 8 * LAYOUT, y: 2.4, z: -42 * LAYOUT, block: 4.6, reach: 18 },
  bell: { x: -26 * LAYOUT, y: 4.2, z: -56 * LAYOUT, block: 5.4, reach: 20 },
};

const at = (x: number, z: number): [number, number, number] => [x * LAYOUT, 0, z * LAYOUT];

/** The same control points the ground paths are built from. */
export const PATHS: Array<{ pts: Array<[number, number, number]>; samples: number; walk: number; glow: number }> = [
  { pts: [[0, 0, 196], [0, 0, 230], at(3.2, 36.4)], samples: 16, walk: 1.35, glow: 0.34 },
  { pts: [at(3.2, 36.4), at(16, 32), at(28, 24), at(36, 18)], samples: 24, walk: 1.15, glow: 0.28 },
  { pts: [at(3.2, 36.4), at(-14, 34), at(-26, 26)], samples: 18, walk: 1.15, glow: 0.28 },
  { pts: [at(-26, 26), at(-36, 18), at(-48, 12)], samples: 18, walk: 1.05, glow: 0.24 },
  { pts: [at(-26, 26), at(-34, 16), at(-36, 4)], samples: 14, walk: 0.8, glow: 0.14 },
  { pts: [at(3.2, 36.4), at(22, 30), at(34, 12), at(34, -8)], samples: 24, walk: 1.15, glow: 0.26 },
  { pts: [at(34, -8), at(38, -16), at(38, -28)], samples: 16, walk: 1.05, glow: 0.22 },
  { pts: [at(34, -8), at(22, -28), at(8, -42)], samples: 18, walk: 1.0, glow: 0.22 },
  { pts: [at(22, -28), at(-4, -36), at(-26, -56)], samples: 20, walk: 1.0, glow: 0.22 },
];

export function projectOut(x: number, z: number, vx: number, vz: number) {
  if (Math.hypot(x, z) < 1e-3) {
    x = 0;
    z = CEN_BLOCK;
  }
  const push = (cx: number, cz: number, rad: number) => {
    const dx = x - cx;
    const dz = z - cz;
    const d = Math.hypot(dx, dz);
    if (d >= rad || d < 1e-4) return;
    const nx = dx / d;
    const nz = dz / d;
    x = cx + nx * rad;
    z = cz + nz * rad;
    const vn = vx * nx + vz * nz;
    if (vn < 0) {
      vx -= vn * nx;
      vz -= vn * nz;
    }
  };
  push(0, 0, CEN_BLOCK);
  for (const id of Object.keys(PLACES) as ExhibitId[]) {
    const p = PLACES[id];
    push(p.x, p.z, p.block);
  }
  const lim = GROUND_WALK;
  const r = Math.hypot(x, z);
  if (r > lim) {
    const nx = x / r;
    const nz = z / r;
    x = nx * lim;
    z = nz * lim;
    const vn = vx * nx + vz * nz;
    if (vn > 0) {
      vx -= vn * nx;
      vz -= vn * nz;
    }
  }
  return { x, z, vx, vz };
}
