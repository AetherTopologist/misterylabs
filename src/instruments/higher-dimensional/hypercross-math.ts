/**
 * Hypercross — eight-cell tesseract net.
 *
 * Coordinate convention
 * --------------------
 * The folded tesseract has the 16 vertices {−1, +1}^4. Every edge has
 * length 2. A cubic cell is named by the axis it fixes and the sign of
 * that coordinate: X+, X−, Y+, Y−, Z+, Z−, W+, W−. Opposite cells
 * (same axis, opposite sign) do not meet. Two cells on different axes
 * share exactly one square face, the four vertices that satisfy both
 * fixes.
 *
 * Spanning tree
 * -------------
 * Root is W−. The chain W− — Z− — W+ — Z+ leaves each cube through the
 * face opposite the previous hinge, so it unfolds to a straight spine.
 * Z− is the junction: its four remaining faces hinge to X−, X+, Y−, and
 * Y+. That is seven edges, connected and acyclic. In the unfolded net
 * the junction carries four side cubes and the spine continues through
 * W+ to Z+.
 *
 * Fold
 * ----
 * Progress 1 is this canonical boundary. Progress 0 is the net.
 * Each tree edge rotates the child subtree in the 2-plane orthogonal to
 * the shared square, about that square, by (1 − progress) right angles.
 * The sign is chosen once, in the folded frame, so the child lands in
 * the parent's 3-flat and does not enter the parent's cube. Descendant
 * hinge frames are carried by the same rigid motion and then apply their
 * own rotation. Vertices of a cell are never interpolated toward a
 * target; the only maps are these rotations. A rotation inside the
 * parent's 3-space would leave every intermediate state in the root
 * hyperplane. These do not.
 *
 * The module does not call the Inside-Out tesseract projector.
 */

export type V4 = [number, number, number, number];

export type CellId = "x+" | "x-" | "y+" | "y-" | "z+" | "z-" | "w+" | "w-";

export type CellSpec = {
  id: CellId;
  axis: 0 | 1 | 2 | 3;
  sign: 1 | -1;
  label: string;
  /** Reading number on the unfolded net. Spine, then arms, then tail. */
  netNumber: number;
};

export const CELLS: readonly CellSpec[] = [
  { id: "x+", axis: 0, sign: 1, label: "X+", netNumber: 5 },
  { id: "x-", axis: 0, sign: -1, label: "X−", netNumber: 3 },
  { id: "y+", axis: 1, sign: 1, label: "Y+", netNumber: 4 },
  { id: "y-", axis: 1, sign: -1, label: "Y−", netNumber: 6 },
  { id: "z+", axis: 2, sign: 1, label: "Z+", netNumber: 8 },
  { id: "z-", axis: 2, sign: -1, label: "Z−", netNumber: 2 },
  { id: "w+", axis: 3, sign: 1, label: "W+", netNumber: 7 },
  { id: "w-", axis: 3, sign: -1, label: "W−", netNumber: 1 },
];

export const ROOT_ID: CellId = "w-";

/** Parent → child. Root to leaf, so each parent is already in the tree. */
export const TREE_EDGES: readonly [CellId, CellId][] = [
  ["w-", "z-"],
  ["z-", "w+"],
  ["w+", "z+"],
  ["z-", "x-"],
  ["z-", "y+"],
  ["z-", "x+"],
  ["z-", "y-"],
];

export const PROGRESS_SAMPLES = [0, 0.25, 0.5, 0.75, 1] as const;

const CELL_INDEX = new Map(CELLS.map((cell, index) => [cell.id, index]));

type Frame = { origin: V4; t1: V4; t2: V4; n1: V4; n2: V4 };

type HingeRuntime = {
  parent: CellId;
  child: CellId;
  parentVerts: number[];
  childVerts: number[];
  sign: 1 | -1;
  frame: Frame;
};

const HINGES: HingeRuntime[] = [];
const DESCENDANTS: Set<CellId>[] = [];
let CANON: V4[][] = [];

function add(a: V4, b: V4): V4 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3]];
}
function sub(a: V4, b: V4): V4 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2], a[3] - b[3]];
}
function scale(a: V4, s: number): V4 {
  return [a[0] * s, a[1] * s, a[2] * s, a[3] * s];
}
function dot(a: V4, b: V4): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
}
function len(a: V4): number {
  return Math.hypot(a[0], a[1], a[2], a[3]);
}
function norm(a: V4): V4 {
  const l = len(a) || 1;
  return scale(a, 1 / l);
}
function clone(p: V4): V4 {
  return [p[0], p[1], p[2], p[3]];
}

export function cellById(id: CellId): CellSpec {
  return CELLS[CELL_INDEX.get(id)!];
}

function freeAxes(axis: number): number[] {
  return [0, 1, 2, 3].filter((candidate) => candidate !== axis);
}

/** Eight vertices. Bit b of the index sets free axis b to +1, else −1. */
export function canonicalVertices(cell: CellSpec): V4[] {
  const free = freeAxes(cell.axis);
  const verts: V4[] = [];
  for (let i = 0; i < 8; i++) {
    const p: V4 = [0, 0, 0, 0];
    p[cell.axis] = cell.sign;
    for (let bit = 0; bit < 3; bit++) p[free[bit]] = (i & (1 << bit)) ? 1 : -1;
    verts.push(p);
  }
  return verts;
}

export function cubeFaces(): number[][] {
  const faces: number[][] = [];
  for (let bit = 0; bit < 3; bit++) {
    const others = [0, 1, 2].filter((candidate) => candidate !== bit);
    for (const value of [0, 1]) {
      faces.push([[0, 0], [1, 0], [1, 1], [0, 1]].map(([u, v]) => {
        let index = value << bit;
        index |= u << others[0];
        index |= v << others[1];
        return index;
      }));
    }
  }
  return faces;
}

export function cubeEdges(): [number, number][] {
  const edges: [number, number][] = [];
  for (let i = 0; i < 8; i++) {
    for (let bit = 0; bit < 3; bit++) {
      const j = i ^ (1 << bit);
      if (i < j) edges.push([i, j]);
    }
  }
  return edges;
}

const FACES = cubeFaces();
const EDGES = cubeEdges();

function centroid(points: V4[]): V4 {
  const c: V4 = [0, 0, 0, 0];
  for (const p of points) for (let k = 0; k < 4; k++) c[k] += p[k];
  return scale(c, 1 / points.length);
}

function complement(t1: V4, t2: V4): [V4, V4] {
  const seeds: V4[] = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
  const normals: V4[] = [];
  for (const seed of seeds) {
    let v = sub(seed, scale(t1, dot(seed, t1)));
    v = sub(v, scale(t2, dot(v, t2)));
    for (const n of normals) v = sub(v, scale(n, dot(v, n)));
    if (len(v) > 1e-8) normals.push(norm(v));
    if (normals.length === 2) break;
  }
  if (normals.length < 2) throw new Error("hinge plane has no 4D complement");
  return [normals[0], normals[1]];
}

function frameFromSquare(points: V4[]): Frame {
  const origin = points[0];
  const ordered = points.slice(1)
    .map((p) => ({ p, d: len(sub(p, origin)) }))
    .sort((a, b) => a.d - b.d);
  const t1 = norm(sub(ordered[0].p, origin));
  const t2 = norm(sub(ordered[1].p, origin));
  const [n1, n2] = complement(t1, t2);
  return { origin: clone(origin), t1, t2, n1, n2 };
}

export function rotateAbout(p: V4, frame: Frame, angle: number): V4 {
  const d = sub(p, frame.origin);
  const a = dot(d, frame.n1);
  const b = dot(d, frame.n2);
  const parallel = add(scale(frame.t1, dot(d, frame.t1)), scale(frame.t2, dot(d, frame.t2)));
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);
  const perp = add(scale(frame.n1, ca * a - sa * b), scale(frame.n2, sa * a + ca * b));
  return add(frame.origin, add(parallel, perp));
}

function rotateFrame(frame: Frame, around: Frame, angle: number): Frame {
  const origin = rotateAbout(frame.origin, around, angle);
  const spin = (direction: V4) => sub(rotateAbout(add(frame.origin, direction), around, angle), origin);
  return { origin, t1: spin(frame.t1), t2: spin(frame.t2), n1: spin(frame.n1), n2: spin(frame.n2) };
}

function cloneFrame(frame: Frame): Frame {
  return {
    origin: clone(frame.origin),
    t1: clone(frame.t1),
    t2: clone(frame.t2),
    n1: clone(frame.n1),
    n2: clone(frame.n2),
  };
}

function indicesWhere(verts: V4[], axis: number, sign: number): number[] {
  const found: number[] = [];
  verts.forEach((p, index) => {
    if (Math.abs(p[axis] - sign) < 1e-8) found.push(index);
  });
  return found;
}

function interiorOverlap3(a: V4[], b: V4[], fixedAxis: number, eps = 1e-3): boolean {
  for (let axis = 0; axis < 4; axis++) {
    if (axis === fixedAxis) continue;
    const a0 = Math.min(...a.map((p) => p[axis]));
    const a1 = Math.max(...a.map((p) => p[axis]));
    const b0 = Math.min(...b.map((p) => p[axis]));
    const b1 = Math.max(...b.map((p) => p[axis]));
    if (Math.min(a1, b1) - Math.max(a0, b0) <= eps) return false;
  }
  return true;
}

function chooseSign(parent: CellSpec, parentPts: V4[], childPts: V4[], frame: Frame): 1 | -1 {
  const parentC = centroid(parentPts);
  const good: { sign: 1 | -1; dist: number }[] = [];
  for (const sign of [1, -1] as const) {
    const moved = childPts.map((p) => rotateAbout(p, frame, sign * Math.PI / 2));
    const flat = moved.reduce((sum, p) => sum + Math.abs(p[parent.axis] - parent.sign), 0) / moved.length;
    if (flat > 1e-4) continue;
    if (interiorOverlap3(moved, parentPts, parent.axis)) continue;
    good.push({ sign, dist: len(sub(centroid(moved), parentC)) });
  }
  if (good.length === 0) {
    throw new Error(`no rigid unfold for ${parent.id}`);
  }
  good.sort((a, b) => b.dist - a.dist);
  return good[0].sign;
}

function subtree(child: CellId): Set<CellId> {
  const set = new Set<CellId>([child]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const [parent, next] of TREE_EDGES) {
      if (set.has(parent) && !set.has(next)) {
        set.add(next);
        grew = true;
      }
    }
  }
  return set;
}

function build() {
  CANON = CELLS.map((cell) => canonicalVertices(cell));
  TREE_EDGES.forEach(([parentId, childId], index) => {
    const parent = cellById(parentId);
    const child = cellById(childId);
    const parentVerts = indicesWhere(CANON[CELL_INDEX.get(parentId)!], child.axis, child.sign);
    const childVerts = indicesWhere(CANON[CELL_INDEX.get(childId)!], parent.axis, parent.sign);
    const frame = frameFromSquare(parentVerts.map((vertex) => CANON[CELL_INDEX.get(parentId)!][vertex]));
    const sign = chooseSign(parent, CANON[CELL_INDEX.get(parentId)!], CANON[CELL_INDEX.get(childId)!], frame);
    HINGES.push({ parent: parentId, child: childId, parentVerts, childVerts, sign, frame });
    DESCENDANTS[index] = subtree(childId);
  });
}

build();

function samePoint(a: V4, b: V4, eps = 1e-6): boolean {
  return Math.abs(a[0] - b[0]) < eps && Math.abs(a[1] - b[1]) < eps
    && Math.abs(a[2] - b[2]) < eps && Math.abs(a[3] - b[3]) < eps;
}

export type HypercrossCell = {
  id: CellId;
  label: string;
  netNumber: number;
  axis: 0 | 1 | 2 | 3;
  sign: 1 | -1;
  vertices: V4[];
  faces: number[][];
  edges: [number, number][];
};

export type HypercrossHinge = {
  parent: CellId;
  child: CellId;
  parentLabel: string;
  childLabel: string;
  /** Radians applied at this progress. Zero when folded. */
  angle: number;
  parentPoints: V4[];
  childPoints: V4[];
  /** Folded-state description of the shared square. */
  face: string;
};

export type HypercrossState = {
  progress: number;
  cells: HypercrossCell[];
  hinges: HypercrossHinge[];
};

export function foldHypercross(progress: number): HypercrossState {
  const t = Math.max(0, Math.min(1, progress));
  const verts = CANON.map((cell) => cell.map(clone));
  const frames = HINGES.map((hinge) => cloneFrame(hinge.frame));
  const angles = HINGES.map((hinge) => (1 - t) * hinge.sign * (Math.PI / 2));

  for (let h = 0; h < HINGES.length; h++) {
    const angle = angles[h];
    if (Math.abs(angle) > 1e-12) {
      const frame = frames[h];
      for (const id of DESCENDANTS[h]) {
        const index = CELL_INDEX.get(id)!;
        verts[index] = verts[index].map((p) => rotateAbout(p, frame, angle));
      }
      for (let k = 0; k < HINGES.length; k++) {
        if (k !== h && DESCENDANTS[h].has(HINGES[k].parent)) {
          frames[k] = rotateFrame(frames[k], frame, angle);
        }
      }
    }
  }

  const cells: HypercrossCell[] = CELLS.map((cell, index) => ({
    id: cell.id,
    label: cell.label,
    netNumber: cell.netNumber,
    axis: cell.axis,
    sign: cell.sign,
    vertices: verts[index],
    faces: FACES,
    edges: EDGES,
  }));

  const hinges: HypercrossHinge[] = HINGES.map((hinge, index) => {
    const parent = cellById(hinge.parent);
    const child = cellById(hinge.child);
    const pi = CELL_INDEX.get(hinge.parent)!;
    const ci = CELL_INDEX.get(hinge.child)!;
    const axisName = ["x", "y", "z", "w"];
    return {
      parent: hinge.parent,
      child: hinge.child,
      parentLabel: parent.label,
      childLabel: child.label,
      angle: angles[index],
      parentPoints: hinge.parentVerts.map((vertex) => verts[pi][vertex]),
      childPoints: hinge.childVerts.map((vertex) => verts[ci][vertex]),
      face: `${axisName[parent.axis]}=${parent.sign > 0 ? "+1" : "−1"}, ${axisName[child.axis]}=${child.sign > 0 ? "+1" : "−1"}`,
    };
  });

  return { progress: t, cells, hinges };
}

export function pairwiseDistances(points: V4[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) out.push(len(sub(points[i], points[j])));
  }
  return out.sort((a, b) => a - b);
}

export function pointsCoincide(a: V4[], b: V4[], eps = 1e-5): boolean {
  if (a.length !== b.length) return false;
  const used = new Array(b.length).fill(false);
  return a.every((point) => {
    const index = b.findIndex((other, i) => !used[i] && samePoint(point, other, eps));
    if (index < 0) return false;
    used[index] = true;
    return true;
  });
}

export function uniqueCount(points: V4[], eps = 1e-5): number {
  const kept: V4[] = [];
  for (const point of points) {
    if (!kept.some((other) => samePoint(point, other, eps))) kept.push(point);
  }
  return kept.length;
}

/** True when two cubes in a common 3-flat have overlapping interiors. */
export function cubesOverlapXYZ(a: V4[], b: V4[], eps = 1e-3): boolean {
  for (let axis = 0; axis < 3; axis++) {
    const a0 = Math.min(...a.map((p) => p[axis]));
    const a1 = Math.max(...a.map((p) => p[axis]));
    const b0 = Math.min(...b.map((p) => p[axis]));
    const b1 = Math.max(...b.map((p) => p[axis]));
    if (Math.min(a1, b1) - Math.max(a0, b0) <= eps) return false;
  }
  return true;
}

export function modelCenter(points: V4[]): V4 {
  return centroid(points);
}

/** Perspective distance along w, raised if the centered model would cross the camera. */
export function safe4DDistance(points: V4[], requested: number): number {
  const center = centroid(points);
  let maxW = 0;
  for (const p of points) maxW = Math.max(maxW, p[3] - center[3]);
  return Math.max(requested, maxW + 2.25);
}

export function project4to3(p: V4, center: V4, distance: number, parallel = false): [number, number, number] {
  const x = p[0] - center[0];
  const y = p[1] - center[1];
  const z = p[2] - center[2];
  const w = p[3] - center[3];
  if (parallel) return [x, y, z];
  const denom = distance - w;
  const k = distance / denom;
  return [x * k, y * k, z * k];
}

export function isTreeEdge(a: CellId, b: CellId): boolean {
  return TREE_EDGES.some(([parent, child]) =>
    (parent === a && child === b) || (parent === b && child === a));
}

export function allAdjacentPairs(): [CellId, CellId][] {
  const pairs: [CellId, CellId][] = [];
  for (let i = 0; i < CELLS.length; i++) {
    for (let j = i + 1; j < CELLS.length; j++) {
      if (CELLS[i].axis !== CELLS[j].axis) pairs.push([CELLS[i].id, CELLS[j].id]);
    }
  }
  return pairs;
}
