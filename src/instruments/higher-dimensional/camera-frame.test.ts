import { describe, expect, it } from "vitest";
import {
  MASK_HEIGHT,
  orthographicVisibleHeight,
  orthographicZoomFor,
  perspectiveStandOff,
} from "./camera-frame";

describe("front camera framing", () => {
  it("fits the relief in a short mobile pane and a desktop pane", () => {
    for (const height of [320, 420, 844]) {
      const zoom = orthographicZoomFor(height);
      expect(orthographicVisibleHeight(height, zoom)).toBeGreaterThan(MASK_HEIGHT);
    }
  });

  it("places a perspective camera far enough to see the whole face", () => {
    const distance = perspectiveStandOff(32);
    const visible = 2 * distance * Math.tan((32 * Math.PI) / 360);
    expect(visible).toBeGreaterThan(MASK_HEIGHT);
    expect(distance).toBeGreaterThan(2.7);
  });
});
