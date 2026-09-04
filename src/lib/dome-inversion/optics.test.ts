import { describe, it, expect } from "vitest";
import { bundle, lanternVisibleInImage, mapRadius, stageOf } from "./optics";

describe("Dome inversion illustrated mapping", () => {
  it("s=0 is identity mapping", () => {
    expect(mapRadius(40, 0, 160)).toBeCloseTo(40, 6);
  });

  it("s=1 inverts a mid radius toward the rim", () => {
    const r = mapRadius(40, 1, 160);
    expect(r).toBeGreaterThan(100);
  });

  it("at s=0 some rays strike the lantern", () => {
    const rays = bundle(0);
    expect(rays.some((r) => r.fate === "lantern")).toBe(true);
    expect(stageOf(0, rays)).toBe("REAL");
    expect(lanternVisibleInImage(0, rays)).toBe(true);
  });

  it("at s=1 the lantern is not alpha-faded in geometry; image may omit it via transport", () => {
    const rays = bundle(1);
    const stage = stageOf(1, rays);
    expect(["INVERT", "CLOAK CENTER"]).toContain(stage);
  });
});
