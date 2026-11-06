import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { smoothFullResolutionNormals, smoothShallowNormalsAcross } from "./stone-continuity";

function geo(positions: number[]) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.computeVertexNormals();
  return g;
}

function normalAt(g: THREE.BufferGeometry, i: number) {
  const n = g.getAttribute("normal");
  return new THREE.Vector3(n.getX(i), n.getY(i), n.getZ(i));
}

function source(g: THREE.BufferGeometry) {
  return { geometry: g, matrixWorld: new THREE.Matrix4() };
}

describe("full-resolution normal continuity", () => {
  it("averages a shallow split across two meshes and keeps a right-angle arris", () => {
    const left = geo([0, 0, 0, 0.5, 0.4, 1, 1, 0, 0]);
    const right = geo([1, 0.003, 0, 0.5, -0.05, 1.002, 2, 0.003, 0]);
    const faceL = normalAt(left, 0).clone();
    const faceR = normalAt(right, 0).clone();
    const before = faceL.dot(faceR);
    smoothShallowNormalsAcross([source(left), source(right)]);
    const edgeL = normalAt(left, 2);
    const edgeR = normalAt(right, 0);
    expect(edgeL.dot(edgeR)).toBeGreaterThan(before + 0.02);
    expect(edgeL.y).toBeGreaterThan(0.95);
    expect(edgeR.y).toBeGreaterThan(0.95);
    const apex = normalAt(left, 1);
    expect(apex.dot(faceL)).toBeGreaterThan(0.999);

    const floor = geo([0, 0, 0, 0, 0, 1, 1, 0, 0]);
    const wall = geo([0.003, 0, 0, 0.003, 1, 0, 0.003, 0, 1]);
    const floorPos = floor.getAttribute("position").clone();
    smoothShallowNormalsAcross([source(floor), source(wall)]);
    const fp = floor.getAttribute("position");
    for (let i = 0; i < fp.count; i++) {
      expect(fp.getX(i)).toBeCloseTo(floorPos.getX(i), 6);
      expect(fp.getY(i)).toBeCloseTo(floorPos.getY(i), 6);
      expect(fp.getZ(i)).toBeCloseTo(floorPos.getZ(i), 6);
    }
    expect(Math.abs(normalAt(floor, 0).y)).toBeGreaterThan(0.99);
    expect(Math.abs(normalAt(wall, 1).x)).toBeGreaterThan(0.99);
    expect(Math.abs(normalAt(wall, 1).y)).toBeLessThan(0.05);
  });

  it("does not pull a seam that is wider than the weld", () => {
    const left = geo([0, 0, 0, 0.5, 0.4, 1, 1, 0, 0]);
    const far = geo([1, 0.03, 0, 0.5, -0.05, 1, 2, 0.03, 0]);
    const before = normalAt(left, 2).clone();
    smoothShallowNormalsAcross([source(left), source(far)]);
    expect(normalAt(left, 2).dot(before)).toBeGreaterThan(0.999);
  });

  it("leaves production meshes untouched", () => {
    const box = new THREE.BoxGeometry(1, 1, 1);
    const before = (box.getAttribute("normal") as THREE.BufferAttribute).clone();
    expect(smoothFullResolutionNormals([source(box)], "production")).toBe(false);
    const after = box.getAttribute("normal");
    for (let i = 0; i < before.count; i++) {
      expect(after.getX(i)).toBeCloseTo(before.getX(i), 6);
      expect(after.getY(i)).toBeCloseTo(before.getY(i), 6);
      expect(after.getZ(i)).toBeCloseTo(before.getZ(i), 6);
    }
    expect(smoothFullResolutionNormals([source(box)], "full")).toBe(true);
    for (let i = 0; i < after.count; i++) {
      const axis = Math.max(Math.abs(after.getX(i)), Math.abs(after.getY(i)), Math.abs(after.getZ(i)));
      expect(axis).toBeGreaterThan(0.99);
    }
  });
});
