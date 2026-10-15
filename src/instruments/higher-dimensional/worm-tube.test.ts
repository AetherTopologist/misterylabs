import { describe, expect, it } from "vitest";
import { WORM_TUBE_WARNING, wormRadius, wormTubeQuads } from "./worm-tube";

describe("worm tube", () => {
  it("is labeled as artistic and not an eversion", () => {
    expect(WORM_TUBE_WARNING.toLowerCase()).toContain("not a topological eversion");
    expect(WORM_TUBE_WARNING.toLowerCase()).toContain("not a 4d projection");
  });

  it("deforms continuously and stays finite", () => {
    const a = wormTubeQuads(0.2);
    const b = wormTubeQuads(1.4);
    expect(a.length).toBeGreaterThan(10);
    expect(b.length).toBe(a.length);
    for (const quad of a) {
      for (const p of quad.pts) {
        expect(Number.isFinite(p[0] + p[1] + p[2])).toBe(true);
      }
    }
    expect(wormRadius(0.2, 1)).not.toBeCloseTo(wormRadius(1.4, 1), 3);
  });
});
