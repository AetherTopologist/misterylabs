import { describe, it, expect } from "vitest";
import { APPLE } from "./types";
import { THETA_MAX, THETA_MIN, toLab, toLocal } from "./frame";
import { classifyHit, polePos } from "./geometry";

describe("target frame", () => {
  it("is identity at θ = 0", () => {
    expect(toLocal(400, 200, 0)).toEqual({ x: 400, y: 200 });
    expect(toLab(400, 200, 0)).toEqual({ x: 400, y: 200 });
  });

  it("toLab and toLocal invert", () => {
    const src = { x: 418, y: 108 };
    for (const th of [-90, -45, 0]) {
      const lab = toLab(src.x, src.y, th);
      const back = toLocal(lab.x, lab.y, th);
      expect(Math.hypot(back.x - src.x, back.y - src.y)).toBeLessThan(1e-9);
    }
  });

  it("UI experimental range is [−90, 0]", () => {
    expect(THETA_MIN).toBe(-90);
    expect(THETA_MAX).toBe(0);
  });

  it("hit tests follow the same R as toLab", () => {
    expect(classifyHit(402, 96, 0)).toBe("stem");
    const lab = toLab(402, 96, 30);
    expect(classifyHit(lab.x, lab.y, 30)).toBe("stem");
    expect(classifyHit(lab.x, lab.y, 0)).not.toBe("stem");
  });

  it("90° clockwise sends the pole to the right of center", () => {
    const p = polePos();
    const lab = toLab(p.x, p.y, 90);
    expect(lab.x).toBeGreaterThan(APPLE.cx + 70);
    expect(Math.abs(lab.y - APPLE.cy)).toBeLessThan(1e-6);
  });
});
