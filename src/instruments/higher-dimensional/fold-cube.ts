import {
  NETS,
  computeUnfoldPath,
  type Chirality,
} from "@/components/CubeNetExplorer";

export type V3 = [number, number, number];

function corners(col: number, row: number): V3[] {
  const x0 = col * 2;
  const y0 = -row * 2;
  return [
    [x0, y0, 0],
    [x0 + 2, y0, 0],
    [x0 + 2, y0 - 2, 0],
    [x0, y0 - 2, 0],
  ];
}

function add(a: V3, b: V3): V3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}
function sub(a: V3, b: V3): V3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
function dot(a: V3, b: V3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function cross(a: V3, b: V3): V3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
function len(a: V3): number {
  return Math.hypot(a[0], a[1], a[2]);
}
function norm(a: V3): V3 {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}

export function rotateAroundAxis(p: V3, origin: V3, axis: V3, angle: number): V3 {
  const k = norm(axis);
  const v = sub(p, origin);
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const cr = cross(k, v);
  const d = dot(k, v);
  const t = 1 - c;
  return add(origin, [
    v[0] * c + cr[0] * s + k[0] * d * t,
    v[1] * c + cr[1] * s + k[1] * d * t,
    v[2] * c + cr[2] * s + k[2] * d * t,
  ]);
}

function sharedChildCorners(flatParent: V3[], flatChild: V3[]): [number, number] {
  const hits: number[] = [];
  for (let j = 0; j < 4; j++) {
    for (let i = 0; i < 4; i++) {
      if (len(sub(flatParent[i], flatChild[j])) < 1e-6) hits.push(j);
    }
  }
  if (hits.length !== 2) {
    throw new Error("fold hinge is not a shared edge");
  }
  return [hits[0], hits[1]];
}

function descendants(root: number, edges: [number, number][]): number[] {
  const kids = new Map<number, number[]>();
  for (const [p, c] of edges) {
    const list = kids.get(p);
    if (list) list.push(c);
    else kids.set(p, [c]);
  }
  const out: number[] = [];
  const stack = [root];
  while (stack.length) {
    const n = stack.pop()!;
    out.push(n);
    const children = kids.get(n);
    if (children) for (const k of children) stack.push(k);
  }
  return out;
}

function centroid(face: V3[]): V3 {
  return [
    (face[0][0] + face[1][0] + face[2][0] + face[3][0]) / 4,
    (face[0][1] + face[1][1] + face[2][1] + face[3][1]) / 4,
    (face[0][2] + face[1][2] + face[2][2] + face[3][2]) / 4,
  ];
}

const SIGN_CACHE = new Map<string, Array<1 | -1>>();

function foldWith(
  netIdx: number,
  chirality: Chirality,
  progress: number,
  signs: Array<1 | -1>,
): V3[][] {
  const net = NETS[netIdx];
  const flat = net.map(([c, r]) => corners(c, r));
  const faces: V3[][] = flat.map((face) => face.map((v) => [v[0], v[1], v[2]] as V3));
  const { edges } = computeUnfoldPath(netIdx, chirality);
  const angle = Math.max(0, Math.min(1, progress)) * (Math.PI / 2);
  edges.forEach(([p, c], hinge) => {
    const [i, j] = sharedChildCorners(flat[p], flat[c]);
    const a = faces[c][i];
    const b = faces[c][j];
    const theta = signs[hinge] * angle;
    for (const f of descendants(c, edges)) {
      faces[f] = faces[f].map((v) => rotateAroundAxis(v, a, sub(b, a), theta));
    }
  });
  return faces;
}

function quantize(n: number): number {
  if (Math.abs(n) < 1e-4) return 0;
  return Math.round(n * 1e4) / 1e4;
}

function isClosedCube(faces: V3[][]): boolean {
  const { size } = foldBounds(faces);
  if (size.some((s) => Math.abs(s - 2) > 1e-3)) return false;
  const verts = new Set<string>();
  const facesKey = new Set<string>();
  for (const face of faces) {
    const keys = face.map((p) => `${quantize(p[0])},${quantize(p[1])},${quantize(p[2])}`);
    facesKey.add(keys.slice().sort().join("|"));
    for (const k of keys) verts.add(k);
  }
  return verts.size === 8 && facesKey.size === 6;
}

function foldScore(faces: V3[][]): number {
  const { size } = foldBounds(faces);
  const verts = new Set<string>();
  for (const face of faces) {
    for (const p of face) verts.add(`${quantize(p[0])},${quantize(p[1])},${quantize(p[2])}`);
  }
  return Math.abs(size[0] - 2) + Math.abs(size[1] - 2) + Math.abs(size[2] - 2) + Math.abs(verts.size - 8);
}

function signsFor(netIdx: number, chirality: Chirality): Array<1 | -1> {
  const key = `${netIdx}:${chirality}`;
  const cached = SIGN_CACHE.get(key);
  if (cached) return cached;
  const { edges } = computeUnfoldPath(netIdx, chirality);
  let best: Array<1 | -1> | null = null;
  let bestZ = -Infinity;
  let bestScore = Infinity;
  const span = 1 << edges.length;
  for (let mask = 0; mask < span; mask++) {
    const signs = edges.map((_, i) => ((mask >> i) & 1 ? 1 : -1)) as Array<1 | -1>;
    const faces = foldWith(netIdx, chirality, 1, signs);
    const closed = isClosedCube(faces);
    const score = closed ? 0 : foldScore(faces);
    let z = 0;
    let n = 0;
    for (const face of faces) for (const p of face) { z += p[2]; n++; }
    const avg = z / n;
    if (score < bestScore || (score === bestScore && avg > bestZ)) {
      bestScore = score;
      bestZ = avg;
      best = signs;
    }
  }
  SIGN_CACHE.set(key, best ?? edges.map(() => 1 as const));
  return SIGN_CACHE.get(key)!;
}

/**
 * Hinge-fold one of the 11 nets.
 * progress 0 is the flat net. progress 1 is a cube of side 2.
 * Chirality uses the same spanning-tree order as the net explorer.
 * Hinge signs are the rigid folds of that tree that close into a cube.
 */
export function foldCube(netIdx: number, progress: number, chirality: Chirality): V3[][] {
  return foldWith(netIdx, chirality, progress, signsFor(netIdx, chirality));
}

export function netFoldCloses(netIdx: number, chirality: Chirality): boolean {
  return isClosedCube(foldCube(netIdx, 1, chirality));
}

export function foldBounds(faces: V3[][]): { size: V3; min: V3; max: V3 } {
  const min: V3 = [Infinity, Infinity, Infinity];
  const max: V3 = [-Infinity, -Infinity, -Infinity];
  for (const face of faces) {
    for (const p of face) {
      for (let k = 0; k < 3; k++) {
        if (p[k] < min[k]) min[k] = p[k];
        if (p[k] > max[k]) max[k] = p[k];
      }
    }
  }
  return {
    min,
    max,
    size: [max[0] - min[0], max[1] - min[1], max[2] - min[2]],
  };
}
