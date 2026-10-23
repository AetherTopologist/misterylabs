/**
 * Cubic Worm — projection of a tesseract boundary.
 *
 * The model is the eight cubic cells of the hypercube with vertices
 * {−1, +1}⁴. A cell fixes one coordinate. Opposite cells fix the same
 * axis with opposite signs. They do not share a face, so there is no
 * unique throat between them. A square passage is a choice of which
 * projected cells to emphasize, not an extra object in the boundary.
 *
 * Projection axis
 * ---------------
 * The selected opposite pair defines the 4D projection axis. The camera
 * sits on the negative side of that axis. Perspective scale is
 * k = distance / (distance + coordinate). The more negative cell is the
 * near opening and projects larger. Parallel projection uses k = 1, so
 * the opposite cells land on the same cube and the passage collapses.
 *
 * View axis
 * ---------
 * After the divide, one of the other three axes is the 3D depth the
 * observer looks along. The four cells on the remaining two axes are
 * the wall cells. The two cells on the view axis are end caps. This
 * split is a rendering choice. It is recomputed from the pair and the
 * view axis. It is not a topological throat.
 *
 * Rotations are ordinary plane rotations, spatial planes first
 * (xy, xz, yz), then the planes that move w (xw, yw, zw). Angle 0 is
 * face-on. This module does not call the Hypercross fold or the
 * Inside-Out projector.
 */

export type V4 = [number, number, number, number];
export type V3 = [number, number, number];

export type CellId = "x+" | "x-" | "y+" | "y-" | "z+" | "z-" | "w+" | "w-";
export type PairId = "x" | "y" | "z" | "w";
export type Axis = 0 | 1 | 2 | 3;
export type PlaneId = "xy" | "xz" | "yz" | "xw" | "yw" | "zw";
export type FaceKind = "pair" | "depth" | "lateral";
export type CellRole = "near" | "far" | "wall" | "cap";

export type CellSpec = {
  id: CellId;
  axis: Axis;
  sign: 1 | -1;
  label: string;
  pair: PairId;
};

export type PlaneAngles = Record<PlaneId, number>;

export const ZERO_ANGLES: PlaneAngles = { xy: 0, xz: 0, yz: 0, xw: 0, yw: 0, zw: 0 };

export const PLANE_ORDER: readonly PlaneId[] = ["xy", "xz", "yz", "xw", "yw", "zw"];

export const W_PLANES: readonly PlaneId[] = ["xw", "yw", "zw"];

const PLANE_AXES: Record<PlaneId, [Axis, Axis]> = {
  xy: [0, 1],
  xz: [0, 2],
  yz: [1, 2],
  xw: [0, 3],
  yw: [1, 3],
  zw: [2, 3],
};

export const CELLS: readonly CellSpec[] = [
  { id: "x+", axis: 0, sign: 1, label: "X+", pair: "x" },
  { id: "x-", axis: 0, sign: -1, label: "X−", pair: "x" },
  { id: "y+", axis: 1, sign: 1, label: "Y+", pair: "y" },
  { id: "y-", axis: 1, sign: -1, label: "Y−", pair: "y" },
  { id: "z+", axis: 2, sign: 1, label: "Z+", pair: "z" },
  { id: "z-", axis: 2, sign: -1, label: "Z−", pair: "z" },
  { id: "w+", axis: 3, sign: 1, label: "W+", pair: "w" },
  { id: "w-", axis: 3, sign: -1, label: "W−", pair: "w" },
];

const PAIR_AXIS: Record<PairId, Axis> = { x: 0, y: 1, z: 2, w: 3 };

const CELL_INDEX = new Map(CELLS.map((cell, index) => [cell.id, index]));

export type CubeFace = {
  indices: number[];
  /** World axis this face fixes, before any rotation. */
  axis: Axis;
  sign: 1 | -1;
};

export function cellById(id: CellId): CellSpec {
  return CELLS[CELL_INDEX.get(id)!];
}

export function pairAxis(pair: PairId): Axis {
  return PAIR_AXIS[pair];
}

/** If the requested view axis is the projection axis, use another one. */
export function resolveViewAxis(pair: PairId, requested: Axis): Axis {
  const project = PAIR_AXIS[pair];
  if (requested !== project) return requested;
  return project === 2 ? 1 : 2;
}

function freeAxes(axis: Axis): Axis[] {
  return [0, 1, 2, 3].filter((candidate) => candidate !== axis) as Axis[];
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

export function cubeFaces(cell: CellSpec): CubeFace[] {
  const free = freeAxes(cell.axis);
  const faces: CubeFace[] = [];
  for (let bit = 0; bit < 3; bit++) {
    const others = [0, 1, 2].filter((candidate) => candidate !== bit);
    for (const value of [0, 1] as const) {
      const indices = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([u, v]) => {
        let index = value << bit;
        index |= u << others[0];
        index |= v << others[1];
        return index;
      });
      faces.push({ indices, axis: free[bit], sign: value === 1 ? 1 : -1 });
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

export function oppositeId(id: CellId): CellId {
  const cell = cellById(id);
  const other = CELLS.find((candidate) => candidate.axis === cell.axis && candidate.sign !== cell.sign);
  return other!.id;
}

export function pairCells(pair: PairId): [CellId, CellId] {
  const neg = CELLS.find((cell) => cell.pair === pair && cell.sign === -1)!;
  const pos = CELLS.find((cell) => cell.pair === pair && cell.sign === 1)!;
  return [neg.id, pos.id];
}

/** Cells on different axes share one square. Opposite cells do not. */
export function areAdjacent(a: CellId, b: CellId): boolean {
  return cellById(a).axis !== cellById(b).axis;
}

export function allAdjacentPairs(): [CellId, CellId][] {
  const pairs: [CellId, CellId][] = [];
  for (let i = 0; i < CELLS.length; i++) {
    for (let j = i + 1; j < CELLS.length; j++) {
      if (areAdjacent(CELLS[i].id, CELLS[j].id)) pairs.push([CELLS[i].id, CELLS[j].id]);
    }
  }
  return pairs;
}

function clone(p: V4): V4 {
  return [p[0], p[1], p[2], p[3]];
}

export function rotatePlane(p: V4, a: Axis, b: Axis, angle: number): V4 {
  const r = clone(p);
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  r[a] = p[a] * c - p[b] * s;
  r[b] = p[a] * s + p[b] * c;
  return r;
}

/** Spatial planes, then the three planes that move w. Pure. */
export function applyRotation(p: V4, angles: PlaneAngles): V4 {
  let r = clone(p);
  for (const plane of PLANE_ORDER) {
    const angle = angles[plane];
    if (Math.abs(angle) < 1e-12) continue;
    const [a, b] = PLANE_AXES[plane];
    r = rotatePlane(r, a, b, angle);
  }
  return r;
}

function centroid(points: V4[]): V4 {
  const c: V4 = [0, 0, 0, 0];
  for (const p of points) for (let k = 0; k < 4; k++) c[k] += p[k];
  return [c[0] / points.length, c[1] / points.length, c[2] / points.length, c[3] / points.length];
}

export function modelCenter(points: V4[]): V4 {
  return centroid(points);
}

/**
 * Perspective distance along the pair axis, raised if a vertex would
 * cross the camera on the negative side. denom = distance + (coord − center).
 */
export function safe4DDistance(points: V4[], axis: Axis, requested: number): number {
  const center = centroid(points);
  let nearest = 0;
  for (const p of points) nearest = Math.max(nearest, -(p[axis] - center[axis]));
  return Math.max(requested, nearest + 1.4);
}

export function projectPoint(
  p: V4,
  center: V4,
  distance: number,
  pair: PairId,
  view: Axis,
  parallel: boolean,
): V3 {
  const project = PAIR_AXIS[pair];
  const depthAxis = resolveViewAxis(pair, view);
  const along = p[project] - center[project];
  const denom = distance + along;
  const k = parallel || Math.abs(denom) < 1e-8 ? (parallel ? 1 : distance / (denom || 1e-8)) : distance / denom;
  const rest = [0, 1, 2, 3].filter((axis) => axis !== project && axis !== depthAxis) as Axis[];
  return [
    (p[rest[0]] - center[rest[0]]) * k,
    (p[rest[1]] - center[rest[1]]) * k,
    (p[depthAxis] - center[depthAxis]) * k,
  ];
}

export type FaceRole = "entrance" | "far-mouth" | "wall" | "rim" | "cell" | "cap";

export type ProjectedFace = {
  indices: number[];
  kind: FaceKind;
  /** Mean depth in the 3D frame. Larger is closer to a camera on +depth. */
  depth: number;
  role: FaceRole;
};

export type ProjectedCell = {
  id: CellId;
  label: string;
  axis: Axis;
  sign: 1 | -1;
  role: CellRole;
  vertices: V4[];
  projected: V3[];
  faces: ProjectedFace[];
  edges: [number, number][];
  /** Mean coordinate on the projection axis, after rotation. */
  along: number;
};

export type WormModel = {
  pair: PairId;
  viewAxis: Axis;
  projectAxis: Axis;
  angles: PlaneAngles;
  parallel: boolean;
  requested: number;
  distance: number;
  center: V4;
  near: CellId;
  far: CellId;
  wallIds: CellId[];
  capIds: CellId[];
  cells: ProjectedCell[];
  /** False. Cubic Worm does not add a substitute surface. */
  artisticBridge: false;
};

function faceKind(faceAxis: Axis, project: Axis, depth: Axis): FaceKind {
  if (faceAxis === project) return "pair";
  if (faceAxis === depth) return "depth";
  return "lateral";
}

export function buildWormModel(
  angles: PlaneAngles,
  pair: PairId,
  requestedView: Axis,
  requestedDistance: number,
  parallel = false,
): WormModel {
  const viewAxis = resolveViewAxis(pair, requestedView);
  const project = PAIR_AXIS[pair];
  const rotated = CELLS.map((cell) => canonicalVertices(cell).map((vertex) => applyRotation(vertex, angles)));
  const cloud = rotated.flat();
  const center = centroid(cloud);
  const distance = parallel ? requestedDistance : safe4DDistance(cloud, project, requestedDistance);

  const alongOf = rotated.map((verts) => verts.reduce((sum, p) => sum + (p[project] - center[project]), 0) / verts.length);
  const [negId, posId] = pairCells(pair);
  const negAlong = alongOf[CELL_INDEX.get(negId)!];
  const posAlong = alongOf[CELL_INDEX.get(posId)!];
  const negIsNear = negAlong < posAlong - 1e-6 || Math.abs(negAlong - posAlong) <= 1e-6;
  const near = negIsNear ? negId : posId;
  const far = negIsNear ? posId : negId;

  const wallIds = CELLS.filter((cell) => cell.axis !== project && cell.axis !== viewAxis).map((cell) => cell.id);
  const capIds = CELLS.filter((cell) => cell.axis === viewAxis).map((cell) => cell.id);

  const cells: ProjectedCell[] = CELLS.map((cell, index) => {
    const role: CellRole = cell.id === near ? "near" : cell.id === far ? "far" : cell.axis === viewAxis ? "cap" : "wall";
    const projected = rotated[index].map((vertex) => projectPoint(vertex, center, distance, pair, viewAxis, parallel));
    const faces = cubeFaces(cell).map((face) => {
      const depth = face.indices.reduce((sum, vertex) => sum + projected[vertex][2], 0) / face.indices.length;
      const kind = faceKind(face.axis, project, viewAxis);
      return { indices: face.indices, kind, depth, role: "cell" as FaceRole };
    });
    return {
      id: cell.id,
      label: cell.label,
      axis: cell.axis,
      sign: cell.sign,
      role,
      vertices: rotated[index],
      projected,
      faces,
      edges: cubeEdges(),
      along: alongOf[index],
    };
  });

  for (const cell of cells) {
    if (cell.role === "cap") {
      for (const face of cell.faces) face.role = "cap";
      continue;
    }
    if (cell.role === "wall") {
      const depthFaces = cell.faces.filter((face) => face.kind === "depth");
      const front = Math.max(...depthFaces.map((face) => face.depth));
      for (const face of cell.faces) {
        if (face.kind === "depth" && face.depth >= front - 1e-6) face.role = "rim";
        else face.role = "wall";
      }
      continue;
    }
    const depthFaces = cell.faces.filter((face) => face.kind === "depth");
    const front = Math.max(...depthFaces.map((face) => face.depth));
    for (const face of cell.faces) {
      if (face.kind === "depth" && face.depth >= front - 1e-6) {
        face.role = cell.role === "near" ? "entrance" : "far-mouth";
      } else {
        face.role = "cell";
      }
    }
  }

  return {
    pair,
    viewAxis,
    projectAxis: project,
    angles: { ...angles },
    parallel,
    requested: requestedDistance,
    distance,
    center,
    near,
    far,
    wallIds,
    capIds,
    cells,
    artisticBridge: false,
  };
}

export function edgeLength(a: V4, b: V4): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2], a[3] - b[3]);
}

export function pairwiseDistances(points: V4[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) out.push(edgeLength(points[i], points[j]));
  }
  return out.sort((a, b) => a - b);
}
