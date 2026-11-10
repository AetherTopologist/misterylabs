import { CEN_BLOCK, FOOT, PLACES, projectOut } from "./world";
import { EXHIBITS } from "./destinations";

describe("prometheus court", () => {
  it("stands east of the walk and clear of the cenotaph", () => {
    const place = PLACES.prometheus;
    expect(place).toEqual({ x: 7, y: 0, z: 170, block: 3.2, reach: 14 });
    expect(Math.hypot(place.x, place.z) - place.block).toBeGreaterThan(CEN_BLOCK);
    expect(Math.hypot(place.x - FOOT.x, place.z - FOOT.z)).toBeGreaterThan(place.block + 4);
    for (let z = FOOT.z; z <= 210; z += 0.5) {
      expect(Math.hypot(place.x, z - place.z)).toBeGreaterThan(place.block);
    }
  });

  it("does not push a walker off the centerline", () => {
    const stayed = projectOut(0, 170, 0, -1);
    expect(Math.abs(stayed.x)).toBeLessThan(0.05);
    expect(stayed.z).toBeCloseTo(170, 1);
  });

  it("is a released instrument, not an arch", () => {
    expect(EXHIBITS.prometheus.href).toBe("/observatory/hollow-flame");
    expect(EXHIBITS.prometheus.released).toBe(true);
    expect(EXHIBITS.prometheus.name).toBe("Prometheus");
  });
});
