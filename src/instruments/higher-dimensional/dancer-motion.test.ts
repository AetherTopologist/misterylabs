import { describe, expect, it } from "vitest";
import { DANCER_OMEGA, physicalAngle } from "./dancer-motion";

describe("dancer physical yaw", () => {
  it("is a deterministic function of elapsed time", () => {
    const a = physicalAngle({ elapsed: 2, speed: 1, direction: 1, offset: 0.4 });
    const b = physicalAngle({ elapsed: 2, speed: 1, direction: 1, offset: 0.4 });
    expect(a).toBe(b);
    expect(a).toBeCloseTo(0.4 + DANCER_OMEGA * 2, 8);
  });

  it("reverses with direction and does not invent a perceived angle", () => {
    const cw = physicalAngle({ elapsed: 1.5, speed: 0.5, direction: 1 });
    const ccw = physicalAngle({ elapsed: 1.5, speed: 0.5, direction: -1 });
    expect(ccw).toBeCloseTo(-cw, 8);
  });
});
