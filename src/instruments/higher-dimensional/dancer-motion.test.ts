import { describe, expect, it } from "vitest";
import { DANCER_OMEGA, DANCER_SPEED_MAX, physicalAngle } from "./dancer-motion";

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

  it("keeps phase when the multiplier becomes 6×", () => {
    expect(DANCER_OMEGA).toBeCloseTo(0.84, 8);
    const rate = DANCER_SPEED_MAX * DANCER_OMEGA;
    expect(DANCER_SPEED_MAX).toBe(6);
    expect(rate).toBeCloseTo(5.04, 8);
    expect((2 * Math.PI) / rate).toBeCloseTo(1.25, 2);

    const phase = physicalAngle({ elapsed: 1.2, speed: 1, direction: 1, offset: 0.4 });
    const continued = physicalAngle({ elapsed: 0.2, speed: 6, direction: 1, offset: phase });
    const paused = physicalAngle({ elapsed: 0, speed: 6, direction: 1, offset: phase });
    const reversed = physicalAngle({ elapsed: 0.1, speed: 6, direction: -1, offset: continued });

    expect(paused).toBe(phase);
    expect(continued).toBeCloseTo(phase + 6 * DANCER_OMEGA * 0.2, 8);
    expect(continued).not.toBeCloseTo(0.4, 4);
    expect(reversed).toBeCloseTo(continued - 6 * DANCER_OMEGA * 0.1, 8);
  });
});
