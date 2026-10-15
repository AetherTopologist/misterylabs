import { describe, expect, it } from "vitest";
import {
  LEGACY_PLANE_RATES,
  T_EDGES,
  T_FACES,
  T_VERTS,
  ZERO_PLANES,
  applyPlanes,
  proj4to3,
  projectionDistance,
  rot4D,
} from "./tesseract-math";

describe("tesseract projection", () => {
  it("keeps the hypercube census", () => {
    expect(T_VERTS).toHaveLength(16);
    expect(T_EDGES).toHaveLength(32);
    expect(T_FACES).toHaveLength(24);
    for (const face of T_FACES) {
      expect(new Set(face).size).toBe(4);
    }
  });

  it("matches the legacy perspective sample", () => {
    const v = T_VERTS[15];
    expect(v).toEqual([1, 1, 1, 1]);
    const p = proj4to3(v, projectionDistance(true, 2.2));
    expect(p[0]).toBeCloseTo(1 / 1.2, 8);
    expect(p[1]).toBeCloseTo(1 / 1.2, 8);
    expect(p[2]).toBeCloseTo(1 / 1.2, 8);
    const flat = proj4to3(v, projectionDistance(false, 2.2));
    expect(flat[0]).toBeCloseTo(1 / (999 - 1), 8);
  });

  it("leaves the legacy plane order unchanged when extra angles are zero", () => {
    const angles = { ...ZERO_PLANES, xw: 0.4, yz: -0.2, xy: 0.15 };
    const viaHelper = applyPlanes(T_VERTS[9], angles);
    let r = rot4D(T_VERTS[9], 0, 3, angles.xw);
    r = rot4D(r, 1, 2, angles.yz);
    r = rot4D(r, 0, 1, angles.xy);
    expect(viaHelper[0]).toBeCloseTo(r[0], 10);
    expect(viaHelper[1]).toBeCloseTo(r[1], 10);
    expect(viaHelper[2]).toBeCloseTo(r[2], 10);
    expect(viaHelper[3]).toBeCloseTo(r[3], 10);
  });

  it("does not spin the unused planes in the legacy rates", () => {
    expect(LEGACY_PLANE_RATES.xz).toBe(0);
    expect(LEGACY_PLANE_RATES.yw).toBe(0);
    expect(LEGACY_PLANE_RATES.zw).toBe(0);
    expect(LEGACY_PLANE_RATES.xw).toBeCloseTo(0.006);
  });
});
