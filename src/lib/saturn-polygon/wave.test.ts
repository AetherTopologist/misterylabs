import { describe, it, expect } from "vitest";
import { analogLabel, jetRadius, vertexAngles } from "./wave";

describe("Saturn polygon reduced wave mode", () => {
  it("m=6 has six maxima", () => {
    expect(vertexAngles(6, 0)).toHaveLength(6);
    expect(analogLabel(6)?.name).toBe("HEXAGON");
  });

  it("m=10 has ten maxima", () => {
    expect(vertexAngles(10, 0)).toHaveLength(10);
    expect(analogLabel(10)?.name).toBe("DECAGON");
  });

  it("A=0 recovers a circle", () => {
    for (let i = 0; i < 8; i++) {
      const th = (i / 8) * Math.PI * 2;
      expect(jetRadius(th, 6, 0, 0, 100)).toBeCloseTo(100, 8);
    }
  });

  it("perturbation is continuous in theta", () => {
    const a = jetRadius(0, 6, 12, 0, 100);
    const b = jetRadius(0.0001, 6, 12, 0, 100);
    expect(Math.abs(a - b)).toBeLessThan(0.01);
  });
});
