import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { smoothShallowNormals } from "./stone-normals";

function normalAt(geo: THREE.BufferGeometry, i: number) {
  const n = geo.getAttribute("normal");
  return new THREE.Vector3(n.getX(i), n.getY(i), n.getZ(i));
}

describe("shallow stone normals", () => {
  it("averages a coplanar split quad and keeps a right-angle arris", () => {
    const quad = new THREE.BufferGeometry();
    quad.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1],
        3,
      ),
    );
    smoothShallowNormals(quad);
    for (let i = 0; i < 6; i++) {
      const n = normalAt(quad, i);
      expect(n.y).toBeCloseTo(-1, 4);
      expect(Math.hypot(n.x, n.z)).toBeLessThan(1e-4);
    }

    const crease = new THREE.BufferGeometry();
    crease.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
        3,
      ),
    );
    const before = crease.getAttribute("position").clone();
    smoothShallowNormals(crease);
    const pos = crease.getAttribute("position");
    for (let i = 0; i < pos.count; i++) {
      expect(pos.getX(i)).toBeCloseTo(before.getX(i), 6);
      expect(pos.getY(i)).toBeCloseTo(before.getY(i), 6);
      expect(pos.getZ(i)).toBeCloseTo(before.getZ(i), 6);
      const n = normalAt(crease, i);
      const axis = Math.max(Math.abs(n.x), Math.abs(n.y), Math.abs(n.z));
      expect(axis).toBeGreaterThan(0.99);
    }

    const box = new THREE.BoxGeometry(2, 2, 2);
    smoothShallowNormals(box);
    const n = box.getAttribute("normal");
    for (let i = 0; i < n.count; i++) {
      const axis = Math.max(Math.abs(n.getX(i)), Math.abs(n.getY(i)), Math.abs(n.getZ(i)));
      expect(axis).toBeGreaterThan(0.99);
    }
  });
});
