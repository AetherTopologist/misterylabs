// 4D hypercube projection used by the tesseract instrument.
// Rotation order for XW → YZ → XY matches TesseractExplorer. Extra planes
// are applied after those three and are identity when their angles are 0.

export type Vec4 = [number, number, number, number];
export type Vec3 = [number, number, number];
export type EdgeKind = "outer" | "inner" | "bridge";

export const T_VERTS: Vec4[] = Array.from({ length: 16 }, (_, i) => [
  i & 8 ? 1 : -1,
  i & 4 ? 1 : -1,
  i & 2 ? 1 : -1,
  i & 1 ? 1 : -1,
]);

export const T_EDGES: [number, number, EdgeKind][] = (() => {
  const edges: [number, number, EdgeKind][] = [];
  for (let i = 0; i < 16; i++) {
    for (let j = i + 1; j < 16; j++) {
      let diff = 0;
      for (let k = 0; k < 4; k++) if (T_VERTS[i][k] !== T_VERTS[j][k]) diff++;
      if (diff === 1) {
        const wi = T_VERTS[i][3], wj = T_VERTS[j][3];
        const kind: EdgeKind = wi === 1 && wj === 1 ? "outer"
                             : wi === -1 && wj === -1 ? "inner"
                             : "bridge";
        edges.push([i, j, kind]);
      }
    }
  }
  return edges;
})();

function vertIndex(coords: number[]): number {
  let i = 0;
  if (coords[0] > 0) i |= 8;
  if (coords[1] > 0) i |= 4;
  if (coords[2] > 0) i |= 2;
  if (coords[3] > 0) i |= 1;
  return i;
}

/** 24 square faces. Each entry is four vertex indices in boundary order. */
export const T_FACES: number[][] = (() => {
  const faces: number[][] = [];
  const axes = [0, 1, 2, 3];
  for (let a = 0; a < 4; a++) {
    for (let b = a + 1; b < 4; b++) {
      const fixed = axes.filter((k) => k !== a && k !== b);
      for (const s0 of [-1, 1]) {
        for (const s1 of [-1, 1]) {
          const quad: number[] = [];
          for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
            const coords = [0, 0, 0, 0];
            coords[fixed[0]] = s0;
            coords[fixed[1]] = s1;
            coords[a] = u;
            coords[b] = v;
            quad.push(vertIndex(coords));
          }
          faces.push(quad);
        }
      }
    }
  }
  return faces;
})();

export type PlaneAngles = {
  xw: number;
  yz: number;
  xy: number;
  xz: number;
  yw: number;
  zw: number;
};

export const ZERO_PLANES: PlaneAngles = { xw: 0, yz: 0, xy: 0, xz: 0, yw: 0, zw: 0 };

/** Legacy auto rates, radians per frame at 60 fps and speed 1. */
export const LEGACY_PLANE_RATES: PlaneAngles = {
  xw: 0.006,
  yz: 0.004,
  xy: 0.0018,
  xz: 0,
  yw: 0,
  zw: 0,
};

export function rot4D(v: Vec4, a: number, b: number, angle: number): Vec4 {
  const r = [...v] as Vec4;
  const c = Math.cos(angle), s = Math.sin(angle);
  r[a] = v[a] * c - v[b] * s;
  r[b] = v[a] * s + v[b] * c;
  return r;
}

export function applyPlanes(v: Vec4, angles: PlaneAngles): Vec4 {
  let r = rot4D(v, 0, 3, angles.xw);
  r = rot4D(r, 1, 2, angles.yz);
  r = rot4D(r, 0, 1, angles.xy);
  r = rot4D(r, 0, 2, angles.xz);
  r = rot4D(r, 1, 3, angles.yw);
  r = rot4D(r, 2, 3, angles.zw);
  return r;
}

export function proj4to3(v: Vec4, d4: number): Vec3 {
  const w = d4 - v[3];
  const s = Math.abs(w) > 0.01 ? 1 / w : 50;
  return [v[0] * s, v[1] * s, v[2] * s];
}

export function proj3to2(
  v: Vec3, d3: number, scale: number, cx: number, cy: number,
): [number, number, number] {
  const z = d3 - v[2];
  const s = Math.abs(z) > 0.01 ? scale / z : scale * 50;
  return [cx + v[0] * s, cy - v[1] * s, v[2]];
}

export function projectionDistance(perspective: boolean, distance: number): number {
  return perspective ? distance : 999;
}
