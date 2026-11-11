import { describe, expect, it } from "vitest";
import { EXHIBITS } from "./destinations";
import { CEN_BLOCK, FOOT, PLACES, projectOut } from "./world";

describe("prime court", () => {
  it("stands west of the walk, clear of the cenotaph and of Prometheus", () => {
    const place = PLACES.prime;
    const flame = PLACES.prometheus;
    expect(place).toEqual({ x: -11, y: 0, z: 176, block: 3.4, reach: 16 });
    expect(place.x).toBeLessThan(0);
    expect(flame.x).toBeGreaterThan(0);
    expect(Math.hypot(place.x, place.z) - place.block).toBeGreaterThan(CEN_BLOCK);
    expect(Math.hypot(place.x - flame.x, place.z - flame.z)).toBeGreaterThan(place.block + flame.block + 4);
    expect(Math.hypot(place.x - FOOT.x, place.z - FOOT.z)).toBeGreaterThan(place.block + 4);
  });

  it("does not push a walker off the centerline", () => {
    for (let z = FOOT.z; z <= 210; z += 0.5) {
      const stayed = projectOut(0, z, 0, -1);
      expect(Math.abs(stayed.x)).toBeLessThan(0.05);
    }
  });

  it("is a released instrument with a returnable route", () => {
    expect(EXHIBITS.prime.href).toBe("/observatory/prime");
    expect(EXHIBITS.prime.released).toBe(true);
    expect(EXHIBITS.prime.name).toBe("PRIME");
    expect(EXHIBITS.prime.hall).toBe("The Last Distance");
    expect(EXHIBITS.prime.question).toMatch(/fingertips/i);
  });
});
