import { describe, expect, it } from "vitest";
import {
  CELLS,
  W_PLANES,
  ZERO_ANGLES,
  allAdjacentPairs,
  applyRotation,
  areAdjacent,
  buildWormModel,
  canonicalVertices,
  cubeEdges,
  cubeFaces,
  edgeLength,
  oppositeId,
  pairCells,
  pairwiseDistances,
  projectPoint,
  resolveViewAxis,
  safe4DDistance,
  type CellId,
  type PlaneAngles,
  type V4,
} from "./cubic-worm-math";

const EPS = 1e-6;

function close(a: number, b: number, eps = EPS) {
  expect(Math.abs(a - b)).toBeLessThan(eps);
}

describe("cubic worm boundary", () => {
  it("has eight cells and four opposite pairs that do not meet", () => {
    expect(CELLS).toHaveLength(8);
    expect(new Set(CELLS.map((cell) => cell.id)).size).toBe(8);
    const pairs = ["x", "y", "z", "w"] as const;
    for (const pair of pairs) {
      const [neg, pos] = pairCells(pair);
      expect(areAdjacent(neg, pos)).toBe(false);
      expect(oppositeId(neg)).toBe(pos);
      expect(oppositeId(pos)).toBe(neg);
    }
    expect(allAdjacentPairs()).toHaveLength(24);
  });

  it("gives every adjacent pair one shared square of side 2", () => {
    for (const [a, b] of allAdjacentPairs()) {
      const specA = CELLS.find((cell) => cell.id === a)!;
      const specB = CELLS.find((cell) => cell.id === b)!;
      const face = canonicalVertices(specA).filter((vertex) => Math.abs(vertex[specB.axis] - specB.sign) < EPS);
      const other = canonicalVertices(specB).filter((vertex) => Math.abs(vertex[specA.axis] - specA.sign) < EPS);
      expect(face).toHaveLength(4);
      expect(other).toHaveLength(4);
      const origin = face[0];
      const lengths = face.slice(1).map((vertex) => edgeLength(origin, vertex)).sort((p, q) => p - q);
      close(lengths[0], 2);
      close(lengths[1], 2);
      close(lengths[2], 2 * Math.SQRT2);
    }
  });

  it("builds six squares and twelve edges on each cell", () => {
    for (const cell of CELLS) {
      expect(canonicalVertices(cell)).toHaveLength(8);
      expect(cubeFaces(cell)).toHaveLength(6);
      expect(cubeEdges()).toHaveLength(12);
      for (const [i, j] of cubeEdges()) {
        close(edgeLength(canonicalVertices(cell)[i], canonicalVertices(cell)[j]), 2);
      }
    }
  });

  it("preserves edge lengths under every plane rotation", () => {
    const samples = [0, 0.4, Math.PI / 2, 2.2];
    for (const plane of W_PLANES) {
      for (const angle of samples) {
        const angles: PlaneAngles = { ...ZERO_ANGLES, [plane]: angle };
        for (const cell of CELLS) {
          const canonical = canonicalVertices(cell);
          const turned = canonical.map((vertex) => applyRotation(vertex, angles));
          const before = pairwiseDistances(canonical);
          const after = pairwiseDistances(turned);
          after.forEach((value, index) => close(value, before[index], 1e-5));
        }
      }
    }
  });

  it("turns XW by a right angle without moving y or z", () => {
    const angles: PlaneAngles = { ...ZERO_ANGLES, xw: Math.PI / 2 };
    const turned = applyRotation([1, -1, 1, -1], angles);
    close(turned[0], 1);
    close(turned[1], -1);
    close(turned[2], 1);
    close(turned[3], 1);
  });
});

describe("cubic worm projection", () => {
  it("makes W− the larger near cell when the pair is face-on", () => {
    const model = buildWormModel(ZERO_ANGLES, "w", 2, 3.2, false);
    expect(model.near).toBe("w-");
    expect(model.far).toBe("w+");
    expect(model.wallIds.slice().sort()).toEqual(["x+", "x-", "y+", "y-"].sort());
    expect(model.capIds.slice().sort()).toEqual(["z+", "z-"].sort());
    expect(model.artisticBridge).toBe(false);
    expect(model.projectAxis).toBe(3);
    expect(model.viewAxis).toBe(2);
    const near = model.cells.find((cell) => cell.id === "w-")!;
    const far = model.cells.find((cell) => cell.id === "w+")!;
    const spread = (id: CellId) => {
      const cell = model.cells.find((item) => item.id === id)!;
      const xs = cell.projected.map((point) => point[0]);
      return Math.max(...xs) - Math.min(...xs);
    };
    expect(spread("w-")).toBeGreaterThan(spread("w+") * 1.4);
    expect(near.faces.some((face) => face.role === "entrance")).toBe(true);
    expect(far.faces.some((face) => face.role === "far-mouth")).toBe(true);
    expect(near.along).toBeLessThan(far.along);
  });

  it("keeps the projection finite when a vertex swings toward the camera", () => {
    for (let step = 0; step <= 16; step++) {
      const angles: PlaneAngles = { ...ZERO_ANGLES, xw: (step / 16) * Math.PI };
      const cloud = CELLS.flatMap((cell) => canonicalVertices(cell).map((vertex) => applyRotation(vertex, angles)));
      const distance = safe4DDistance(cloud, 3, 2.2);
      const center = cloud.reduce((sum, p) => [sum[0] + p[0], sum[1] + p[1], sum[2] + p[2], sum[3] + p[3]] as V4, [0, 0, 0, 0] as V4)
        .map((value) => value / cloud.length) as V4;
      for (const point of cloud) {
        expect(distance + (point[3] - center[3])).toBeGreaterThan(1);
        const projected = projectPoint(point, center, distance, "w", 2, false);
        expect(projected.every((value) => Number.isFinite(value))).toBe(true);
      }
      const model = buildWormModel(angles, "w", 2, 2.2, false);
      expect(model.distance).toBeGreaterThanOrEqual(2.2);
      expect(model.cells).toHaveLength(8);
    }
  });

  it("swaps near and far after a half turn in XW and does not reset under the view axis", () => {
    const turned = buildWormModel({ ...ZERO_ANGLES, xw: Math.PI }, "w", 2, 3.2, false);
    expect(turned.near).toBe("w+");
    expect(turned.far).toBe("w-");
    const otherView = buildWormModel(ZERO_ANGLES, "w", 1, 3.2, false);
    expect(otherView.near).toBe("w-");
    expect(otherView.viewAxis).toBe(1);
    expect(otherView.wallIds.slice().sort()).toEqual(["x+", "x-", "z+", "z-"].sort());
    expect(resolveViewAxis("z", 2)).toBe(1);
  });

  it("collapses opposite cells under a parallel projection", () => {
    const model = buildWormModel(ZERO_ANGLES, "w", 2, 3.2, true);
    const near = model.cells.find((cell) => cell.id === "w-")!.projected;
    const far = model.cells.find((cell) => cell.id === "w+")!.projected;
    near.forEach((point, index) => {
      close(point[0], far[index][0], 1e-6);
      close(point[1], far[index][1], 1e-6);
      close(point[2], far[index][2], 1e-6);
    });
  });

  it("is the same model when the same angles are applied again", () => {
    const angles: PlaneAngles = { ...ZERO_ANGLES, xw: 0.7, yw: -0.2, xy: 0.15 };
    const a = buildWormModel(angles, "w", 2, 3.4, false);
    const b = buildWormModel(angles, "w", 2, 3.4, false);
    expect(a.near).toBe(b.near);
    a.cells.forEach((cell, index) => {
      cell.vertices.forEach((vertex, k) => {
        vertex.forEach((value, axis) => close(value, b.cells[index].vertices[k][axis], 1e-8));
      });
    });
  });
});
