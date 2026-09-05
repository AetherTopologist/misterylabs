import { describe, it, expect } from "vitest";
import { APPLE } from "./types";
import {
  appleRadius,
  classifyHit,
  clampRecess,
  insideApple,
  insideDivot,
  insideLeaf,
  onStem,
  polePos,
  polarSurface,
  stemCubic,
  stemPathD,
  leafCubic,
  leafPathD,
  cubicPoint,
} from "./geometry";

describe("polar-grin geometry (shared SVG + hit-test)", () => {
  it("keeps apple occupancy", () => {
    expect(insideApple(392, 232)).toBe(true);
    expect(insideApple(36, 140)).toBe(false);
    expect(classifyHit(392, 232)).toBe("red");
    expect(classifyHit(36, 140)).toBe("outside");
  });

  it("scale=1 SVG path and hit-test share the same cubic", () => {
    const c = stemCubic(1);
    const mid = cubicPoint(c, 0.5);
    expect(classifyHit(mid.x, mid.y, 0, 1)).toBe("stem");
    expect(stemPathD(1)).toContain(`${c.p3.x} ${c.p3.y}`);
    const leaf = leafCubic(1);
    const leafMid = cubicPoint(leaf, 0.4);
    expect(classifyHit(leafMid.x, leafMid.y, 0, 1)).toBe("leaf");
    expect(leafPathD(1)).toContain(`${leaf.p1.x} ${leaf.p1.y}`);
  });

  it("feature scale is from the pole, not paint-only", () => {
    expect(onStem(402, 96, 1)).toBe(true);
    expect(onStem(402, 96, 0.5)).toBe(false);
  });

  it("recess=1 is the design seat; deeper recess follows the cup", () => {
    expect(polePos(1)).toEqual({ x: 392, y: 144 });
    expect(Math.abs(appleRadius(-Math.PI / 2, 1) - 98 * 0.71)).toBeLessThan(1e-9);
    expect(clampRecess(0)).toBe(1);
    const s1 = polarSurface(1);
    const s3 = polarSurface(3);
    expect(s3.y).toBeGreaterThan(s1.y + 20);
    const p1 = polePos(1);
    const p3 = polePos(3);
    expect(Math.abs(s1.y - p1.y - (s3.y - p3.y))).toBeLessThan(1e-9);
  });

  it("DIVOT is the current recessed cup, not a fixed disk", () => {
    expect(insideDivot(392, 165, 1)).toBe(true);
    expect(insideDivot(392, 232, 1)).toBe(false);
    const surf3 = polarSurface(3);
    const justInside = { x: APPLE.cx, y: surf3.y + 2 };
    expect(insideApple(justInside.x, justInside.y, 3)).toBe(true);
    expect(insideDivot(justInside.x, justInside.y, 3)).toBe(true);
    expect(classifyHit(justInside.x, justInside.y, 0, 1, 3)).toBe("divot");
  });

  it("leaf is a shared cubic polygon", () => {
    expect(insideLeaf(418, 108)).toBe(true);
    expect(classifyHit(418, 108)).toBe("leaf");
  });
});
