import { describe, it, expect } from "vitest";
import { bundle, indexAt, insideApple, polePos, stageOf } from "./rays";

describe("Polar GRIN reduced eikonal model", () => {
  it("is vacuum at field zero", () => {
    const p = polePos();
    expect(indexAt(p.x - 40, p.y, 0)).toBe(1);
    expect(indexAt(p.x, p.y - 20, 0)).toBe(1);
  });

  it("does not delete the apple occupancy", () => {
    expect(insideApple(392, 232)).toBe(true);
    expect(insideApple(36, 140)).toBe(false);
  });

  it("at s=0 the polar-aimed bundle intersects the fruit", () => {
    const rays = bundle(0);
    const hits = rays.filter((r) => r.fate === "surface");
    expect(hits.length).toBeGreaterThanOrEqual(6);
    expect(hits.some((r) => r.hitPolar)).toBe(true);
    expect(stageOf(0, rays)).toBe("FIELD OFF");
  });

  it("at s=1 some rays miss the polar cap (wrap/reveal, not alpha)", () => {
    const rays = bundle(1);
    const missed = rays.filter((r) => r.fate === "escaped" || r.fate === "witness");
    expect(missed.length).toBeGreaterThanOrEqual(2);
    const stage = stageOf(1, rays);
    expect(["WRAP", "REVEAL"]).toContain(stage);
  });
});
