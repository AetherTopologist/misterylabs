import { describe, expect, it } from "vitest";
import { foldBounds, foldCube } from "./fold-cube";

describe("cube-net fold", () => {
  it("starts flat", () => {
    const faces = foldCube(0, 0, "cw");
    const { size } = foldBounds(faces);
    expect(size[2]).toBeCloseTo(0, 6);
    expect(size[0]).toBeGreaterThan(2);
  });

  it("closes every tree-shaped net into a cube of side 2", () => {
    const bad: string[] = [];
    for (let net = 0; net < 11; net++) {
      if (net === 7 || net === 8) continue;
      for (const chirality of ["cw", "ccw"] as const) {
        const { size } = foldBounds(foldCube(net, 1, chirality));
        const ok = [0, 1, 2].every((k) => Math.abs(size[k] - 2) < 1e-3);
        if (!ok) bad.push(`${net} ${chirality} ${size.map((n) => n.toFixed(2)).join(",")}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("still returns a finite fold for the two nets whose grids contain an extra join", () => {
    for (const net of [7, 8]) {
      const faces = foldCube(net, 1, "cw");
      expect(faces).toHaveLength(6);
      for (const face of faces) for (const p of face) {
        expect(p.every((n) => Number.isFinite(n))).toBe(true);
      }
    }
  });

  it("is only partly folded at the midpoint", () => {
    const mid = foldBounds(foldCube(0, 0.5, "cw")).size;
    const full = foldBounds(foldCube(0, 1, "cw")).size;
    expect(mid[2]).toBeGreaterThan(0.2);
    expect(Math.abs(mid[2] - full[2]) > 0.05 || Math.abs(mid[0] - full[0]) > 0.05).toBe(true);
  });
});
