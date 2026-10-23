import { describe, expect, it } from "vitest";
import {
  CELLS,
  PROGRESS_SAMPLES,
  ROOT_ID,
  TREE_EDGES,
  allAdjacentPairs,
  canonicalVertices,
  cubesOverlapXYZ,
  foldHypercross,
  isTreeEdge,
  pairwiseDistances,
  pointsCoincide,
  project4to3,
  safe4DDistance,
  uniqueCount,
  type CellId,
  type V4,
} from "./hypercross-math";

const EPS = 1e-5;

function dist(a: V4, b: V4): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2], a[3] - b[3]);
}

function close(a: number, b: number, eps = EPS) {
  expect(Math.abs(a - b)).toBeLessThan(eps);
}

describe("hypercross net", () => {
  it("has eight cubic cells and seven tree hinges", () => {
    expect(CELLS).toHaveLength(8);
    expect(new Set(CELLS.map((cell) => cell.id)).size).toBe(8);
    expect(TREE_EDGES).toHaveLength(7);
    expect(CELLS.find((cell) => cell.id === ROOT_ID)?.label).toBe("W−");
    for (const cell of CELLS) {
      expect(canonicalVertices(cell)).toHaveLength(8);
      expect(cell.axis).toBeGreaterThanOrEqual(0);
      expect(Math.abs(cell.sign)).toBe(1);
    }
  });

  it("is a connected acyclic spanning tree of real square faces", () => {
    const parent = new Map<CellId, CellId>();
    for (const [from, to] of TREE_EDGES) {
      expect(parent.has(to)).toBe(false);
      parent.set(to, from);
      const a = CELLS.find((cell) => cell.id === from)!;
      const b = CELLS.find((cell) => cell.id === to)!;
      expect(a.axis).not.toBe(b.axis);
    }
    const seen = new Set<CellId>([ROOT_ID]);
    const queue: CellId[] = [ROOT_ID];
    while (queue.length) {
      const id = queue.shift()!;
      for (const [from, to] of TREE_EDGES) {
        if (from === id && !seen.has(to)) {
          seen.add(to);
          queue.push(to);
        }
      }
    }
    expect([...seen].sort()).toEqual(CELLS.map((cell) => cell.id).sort());

    const folded = foldHypercross(1);
    for (const hinge of folded.hinges) {
      expect(hinge.parentPoints).toHaveLength(4);
      expect(pointsCoincide(hinge.parentPoints, hinge.childPoints)).toBe(true);
      const origin = hinge.parentPoints[0];
      const lengths = hinge.parentPoints.slice(1).map((p) => dist(origin, p)).sort((a, b) => a - b);
      close(lengths[0], 2);
      close(lengths[1], 2);
      close(lengths[2], 2 * Math.SQRT2);
    }
  });

  it("matches the canonical tesseract at progress 1, including non-tree faces", () => {
    const state = foldHypercross(1);
    expect(uniqueCount(state.cells.flatMap((cell) => cell.vertices))).toBe(16);
    for (const cell of state.cells) {
      const spec = CELLS.find((item) => item.id === cell.id)!;
      for (const vertex of cell.vertices) {
        close(vertex[spec.axis], spec.sign, 1e-6);
        for (const value of vertex) expect(Math.abs(Math.abs(value) - 1)).toBeLessThan(1e-6);
      }
    }
    for (const hinge of state.hinges) expect(hinge.angle).toBeCloseTo(0, 8);
    for (const [a, b] of allAdjacentPairs()) {
      const ca = state.cells.find((cell) => cell.id === a)!;
      const cb = state.cells.find((cell) => cell.id === b)!;
      const specA = CELLS.find((cell) => cell.id === a)!;
      const specB = CELLS.find((cell) => cell.id === b)!;
      const faceA = ca.vertices.filter((p) => Math.abs(p[specB.axis] - specB.sign) < 1e-6);
      const faceB = cb.vertices.filter((p) => Math.abs(p[specA.axis] - specA.sign) < 1e-6);
      expect(faceA).toHaveLength(4);
      expect(pointsCoincide(faceA, faceB)).toBe(true);
    }
  });

  it("unfolds into one 3D hyperplane without interior overlap", () => {
    const state = foldHypercross(0);
    const points = state.cells.flatMap((cell) => cell.vertices);
    for (const point of points) close(point[3], -1, 1e-5);
    expect(uniqueCount(points)).toBe(36);
    for (let i = 0; i < state.cells.length; i++) {
      for (let j = i + 1; j < state.cells.length; j++) {
        expect(cubesOverlapXYZ(state.cells[i].vertices, state.cells[j].vertices)).toBe(false);
      }
    }
    for (const [a, b] of allAdjacentPairs()) {
      if (isTreeEdge(a, b)) continue;
      const ca = state.cells.find((cell) => cell.id === a)!;
      const cb = state.cells.find((cell) => cell.id === b)!;
      const specA = CELLS.find((cell) => cell.id === a)!;
      const specB = CELLS.find((cell) => cell.id === b)!;
      const faceA = ca.vertices.filter((_, index) => {
        const folded = canonicalVertices(specA)[index];
        return Math.abs(folded[specB.axis] - specB.sign) < 1e-6;
      });
      const faceB = cb.vertices.filter((_, index) => {
        const folded = canonicalVertices(specB)[index];
        return Math.abs(folded[specA.axis] - specA.sign) < 1e-6;
      });
      expect(faceA).toHaveLength(4);
      expect(pointsCoincide(faceA, faceB)).toBe(false);
      const mean = (points: V4[]) => points.reduce(
        (s, p) => [s[0] + p[0], s[1] + p[1], s[2] + p[2], s[3] + p[3]] as V4,
        [0, 0, 0, 0] as V4,
      ).map((n) => n / points.length) as V4;
      expect(dist(mean(faceA), mean(faceB))).toBeGreaterThan(1);
    }
  });

  it("keeps every cell rigid and every hinge shut while folding", () => {
    const rigid = new Map(foldHypercross(1).cells.map((cell) => [cell.id, pairwiseDistances(cell.vertices)]));
    for (const progress of PROGRESS_SAMPLES) {
      const state = foldHypercross(progress);
      expect(state.cells).toHaveLength(8);
      expect(state.hinges).toHaveLength(7);
      for (const cell of state.cells) {
        const distances = pairwiseDistances(cell.vertices);
        const reference = rigid.get(cell.id)!;
        expect(distances).toHaveLength(reference.length);
        distances.forEach((value, index) => close(value, reference[index], 1e-5));
        for (const [i, j] of cell.edges) close(dist(cell.vertices[i], cell.vertices[j]), 2, 1e-5);
      }
      for (const hinge of state.hinges) {
        expect(pointsCoincide(hinge.parentPoints, hinge.childPoints)).toBe(true);
        close(Math.abs(hinge.angle), (1 - progress) * Math.PI / 2, 1e-8);
      }
    }
  });

  it("leaves the root hyperplane during the fold, so the motion is not a 3D rotation", () => {
    const mid = foldHypercross(0.5);
    const ws = mid.cells.flatMap((cell) => cell.vertices.map((vertex) => vertex[3]));
    const spread = Math.max(...ws) - Math.min(...ws);
    expect(spread).toBeGreaterThan(0.5);
  });

  it("returns the same model when the slider reverses", () => {
    for (const progress of PROGRESS_SAMPLES) {
      const a = foldHypercross(progress);
      const b = foldHypercross(progress);
      for (let i = 0; i < a.cells.length; i++) {
        a.cells[i].vertices.forEach((vertex, k) => {
          vertex.forEach((value, axis) => close(value, b.cells[i].vertices[k][axis], 1e-8));
        });
      }
    }
    const there = foldHypercross(0.25);
    const back = foldHypercross(0);
    const again = foldHypercross(0.25);
    there.cells.forEach((cell, i) => {
      cell.vertices.forEach((vertex, k) => {
        vertex.forEach((value, axis) => close(value, again.cells[i].vertices[k][axis], 1e-8));
      });
    });
    back.cells.forEach((cell, i) => {
      cell.vertices.forEach((vertex, k) => {
        vertex.forEach((value, axis) => close(value, foldHypercross(0).cells[i].vertices[k][axis], 1e-8));
      });
    });
  });

  it("moves continuously and keeps the 4D camera off the model", () => {
    let previous = foldHypercross(0);
    for (let step = 1; step <= 20; step++) {
      const progress = step / 20;
      const next = foldHypercross(progress);
      for (let i = 0; i < next.cells.length; i++) {
        for (let k = 0; k < 8; k++) {
          expect(dist(previous.cells[i].vertices[k], next.cells[i].vertices[k])).toBeLessThan(2.5);
        }
      }
      const points = next.cells.flatMap((cell) => cell.vertices);
      const distance = safe4DDistance(points, 3.5);
      const center = points.reduce((s, p) => [s[0] + p[0], s[1] + p[1], s[2] + p[2], s[3] + p[3]] as V4, [0, 0, 0, 0] as V4)
        .map((n) => n / points.length) as V4;
      for (const point of points) {
        expect(distance - (point[3] - center[3])).toBeGreaterThan(2);
        const projected = project4to3(point, center, distance, false);
        expect(projected.every((value) => Number.isFinite(value))).toBe(true);
      }
      previous = next;
    }
  });
});
