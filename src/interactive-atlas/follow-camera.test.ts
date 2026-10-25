import { readFileSync } from "node:fs";
import * as THREE from "three";
import { describe, expect, it } from "vitest";
import {
  FOLLOW_FAST_AT,
  FOLLOW_GRACE,
  FOLLOW_SUSTAIN,
  angDelta,
  stepHeadingFollow,
  trailingYaw,
  type FollowState,
} from "./follow-camera";
import { createWalker, type WalkInput, type Walker, type WalkerSnapshot } from "./mister-why";

const ZERO: WalkInput = { x: 0, y: 0, orbiting: false };
const AHEAD: WalkInput = { x: 0, y: 1, orbiting: false };
const STRAFE: WalkInput = { x: 1, y: 0, orbiting: false };
const BACKPEDAL: WalkInput = { x: 0, y: -1, orbiting: false };
const DIAGONAL: WalkInput = { x: 1, y: 1, orbiting: false };

function step(state: FollowState, dt: number, over: Partial<Parameters<typeof stepHeadingFollow>[2]> = {}) {
  return stepHeadingFollow(state, dt, {
    reduced: false,
    orbiting: false,
    moving: true,
    heading: 0,
    ...over,
  });
}

function integrate(dt: number, seconds: number, yaw: number, heading: number) {
  let state: FollowState = { yaw, grace: 0, sustained: FOLLOW_SUSTAIN };
  const n = Math.round(seconds / dt);
  for (let i = 0; i < n; i++) state = step(state, dt, { heading });
  return state.yaw;
}

function boot(over: Partial<WalkerSnapshot> = {}): Walker {
  const walker = createWalker(new THREE.Scene());
  walker.restore({
    x: 400,
    z: 80,
    heading: Math.PI,
    camYaw: 0,
    back: 12,
    lookLift: 6,
    ...over,
  });
  return walker;
}

function frames(walker: Walker, n: number, dt: number, input: WalkInput, reduced = false) {
  for (let i = 0; i < n; i++) walker.update(dt, i * dt, input, reduced);
}

describe("heading follow", () => {
  it("keeps the shortest step across ±π", () => {
    const from = -Math.PI + 0.05;
    const to = trailingYaw(0);
    const delta = angDelta(from, to);
    expect(Math.abs(delta)).toBeCloseTo(0.05, 5);
    expect(delta).toBeLessThan(0);
    expect(Math.abs(delta)).toBeLessThan(0.2);

    let state: FollowState = { yaw: from, grace: 0, sustained: FOLLOW_SUSTAIN };
    state = step(state, 1 / 60, { heading: 0 });
    const moved = angDelta(from, state.yaw);
    expect(moved).toBeLessThan(0);
    expect(Math.abs(moved)).toBeLessThan(0.05);
    expect(Math.abs(angDelta(state.yaw, to))).toBeLessThan(Math.abs(delta));
  });

  it("does not rotate while idle, orbiting, in grace, or before the stride counts", () => {
    const parked = step({ yaw: 0.4, grace: 0, sustained: 3 }, 1 / 60, { moving: false });
    expect(parked).toEqual({ yaw: 0.4, grace: 0, sustained: 0 });

    const dragged = step({ yaw: 0.2, grace: 0.2, sustained: 3 }, 1 / 60, { orbiting: true });
    expect(dragged.yaw).toBe(0.2);
    expect(dragged.grace).toBe(FOLLOW_GRACE);
    expect(dragged.sustained).toBe(0);

    let grace: FollowState = { yaw: 1, grace: FOLLOW_GRACE, sustained: 0 };
    for (let i = 0; i < 30; i++) grace = step(grace, 0.05);
    expect(grace.yaw).toBe(1);
    expect(grace.grace).toBe(0);
    expect(grace.sustained).toBe(0);

    for (let i = 0; i < 6; i++) grace = step(grace, 0.05);
    expect(grace.yaw).toBe(1);
    expect(grace.sustained).toBeCloseTo(0.3, 5);

    grace = step(grace, 0.05);
    expect(grace.sustained).toBeCloseTo(FOLLOW_SUSTAIN, 5);
    expect(grace.yaw).not.toBe(1);
    expect(Math.abs(angDelta(1, grace.yaw))).toBeLessThan(0.25);
  });

  it("closes a large gap faster, and agrees at 30, 60, and 120 fps", () => {
    const heading = 0;
    const target = trailingYaw(heading);
    const wide0 = target - 1.5;
    const narrow0 = target - 0.4;
    expect(Math.abs(angDelta(wide0, target))).toBeGreaterThan(FOLLOW_FAST_AT);
    expect(Math.abs(angDelta(narrow0, target))).toBeLessThan(FOLLOW_FAST_AT);

    const wide = integrate(1 / 60, 0.5, wide0, heading);
    const narrow = integrate(1 / 60, 0.5, narrow0, heading);
    expect(Math.abs(angDelta(wide0, wide))).toBeGreaterThan(Math.abs(angDelta(narrow0, narrow)));

    const yaw30 = integrate(1 / 30, 2, wide0, heading);
    const yaw60 = integrate(1 / 60, 2, wide0, heading);
    const yaw120 = integrate(1 / 120, 2, wide0, heading);
    expect(Math.abs(angDelta(yaw30, yaw60))).toBeLessThan(0.02);
    expect(Math.abs(angDelta(yaw60, yaw120))).toBeLessThan(0.02);
    expect(Math.abs(angDelta(yaw60, target))).toBeLessThan(0.15);
  });

  it("leaves the azimuth alone under reduced motion", () => {
    const next = step({ yaw: -0.8, grace: 0.4, sustained: 2 }, 0.5, { reduced: true, heading: 1 });
    expect(next.yaw).toBe(-0.8);
    expect(next.sustained).toBe(0);
    expect(next.grace).toBe(0);
  });
});

describe("mister why trailing camera", () => {
  it("holds an idle orbit and does not recenter after a restore", () => {
    const walker = boot({ camYaw: 0.7 });
    frames(walker, 180, 1 / 60, ZERO);
    expect(walker.pose().camYaw).toBeCloseTo(0.7, 5);
    expect(walker.pose().heading).toBeCloseTo(Math.PI, 5);

    walker.orbit(-200, 0);
    expect(walker.pose().camYaw).toBeCloseTo(1.7, 5);
    frames(walker, 180, 1 / 60, ZERO);
    expect(walker.pose().camYaw).toBeCloseTo(1.7, 5);
    expect(walker.snapshot().lookLift).toBeCloseTo(6, 5);
    expect(walker.snapshot().back).toBeCloseTo(12, 5);

    const saved = walker.snapshot();
    expect(Object.keys(saved).sort()).toEqual(["back", "camYaw", "heading", "lookLift", "x", "z"]);
    walker.orbit(80, -20);
    walker.restore(saved);
    frames(walker, 180, 1 / 60, ZERO);
    expect(walker.pose().camYaw).toBeCloseTo(saved.camYaw, 5);
    expect(walker.pose().x).toBeCloseTo(saved.x, 5);
    expect(walker.pose().z).toBeCloseTo(saved.z, 5);
    expect(walker.snapshot().back).toBeCloseTo(saved.back, 5);
    expect(walker.snapshot().lookLift).toBeCloseTo(saved.lookLift, 5);
  });

  it("waits through grace and a sustained stride, then eases behind without steering", () => {
    const walker = boot();
    frames(walker, 30, 1 / 60, AHEAD);
    const latched = walker.pose();
    expect(latched.camYaw).toBeCloseTo(0, 4);
    expect(Math.abs(latched.x - 400)).toBeLessThan(0.05);

    walker.orbit(-200, 0);
    const turned = walker.pose().camYaw;
    expect(turned).toBeCloseTo(1, 5);

    frames(walker, 80, 1 / 60, AHEAD);
    expect(walker.pose().camYaw).toBeCloseTo(turned, 5);

    let movedAt = -1;
    for (let i = 0; i < 80; i++) {
      frames(walker, 1, 1 / 60, AHEAD);
      if (Math.abs(angDelta(walker.pose().camYaw, turned)) > 1e-6) {
        movedAt = 81 + i;
        break;
      }
    }
    expect(movedAt).toBeGreaterThan(100);
    expect(movedAt).toBeLessThan(130);
    expect(Math.abs(angDelta(walker.pose().camYaw, turned))).toBeLessThan(0.05);

    frames(walker, 180, 1 / 60, AHEAD);
    const done = walker.pose();
    expect(Math.abs(angDelta(done.camYaw, trailingYaw(done.heading)))).toBeLessThan(0.2);
    expect(Math.abs(done.x - 400)).toBeLessThan(0.5);
    expect(done.z).toBeLessThan(0);
    expect(Math.abs(angDelta(done.heading, Math.PI))).toBeLessThan(0.15);
    expect(walker.snapshot().back).toBeCloseTo(12, 5);
    expect(walker.snapshot().lookLift).toBeCloseTo(6, 5);
  });

  it("keeps a manual orbit while the gesture is held, and reduced motion never catches up", () => {
    const free = boot();
    frames(free, 40, 1 / 60, AHEAD);
    free.orbit(-200, 0);
    const held = free.pose().camYaw;
    frames(free, 90, 1 / 60, { ...AHEAD, orbiting: true });
    expect(free.pose().camYaw).toBeCloseTo(held, 5);

    const reduced = boot();
    frames(reduced, 40, 1 / 60, AHEAD, true);
    reduced.orbit(-200, 0);
    const parked = reduced.pose().camYaw;
    frames(reduced, 300, 1 / 60, AHEAD, true);
    expect(reduced.pose().camYaw).toBeCloseTo(parked, 5);
    expect(reduced.pose().z).toBeLessThan(40);
  });

  it("does not feed the camera back into forward, strafe, diagonal, or reverse", () => {
    const ahead = boot({ camYaw: 0.4, heading: 0.4 + Math.PI });
    frames(ahead, 180, 1 / 60, AHEAD);
    expect(Math.abs(angDelta(ahead.pose().camYaw, 0.4))).toBeLessThan(0.08);
    expect(Math.abs(angDelta(ahead.pose().heading, 0.4 + Math.PI))).toBeLessThan(0.08);

    const side = boot();
    frames(side, 240, 1 / 60, STRAFE);
    expect(side.pose().x).toBeGreaterThan(460);
    expect(Math.abs(side.pose().z - 80)).toBeLessThan(1.5);
    expect(Math.abs(angDelta(side.pose().heading, Math.PI / 2))).toBeLessThan(0.12);
    expect(Math.abs(angDelta(side.pose().camYaw, -Math.PI / 2))).toBeLessThan(0.15);

    const reverse = boot();
    frames(reverse, 200, 1 / 60, BACKPEDAL);
    expect(reverse.pose().z).toBeGreaterThan(130);
    expect(Math.abs(reverse.pose().x - 400)).toBeLessThan(1.5);
    expect(Math.abs(angDelta(reverse.pose().heading, 0))).toBeLessThan(0.12);
    expect(Math.abs(angDelta(reverse.pose().camYaw, Math.PI))).toBeLessThan(0.2);

    const diagonal = boot();
    frames(diagonal, 90, 1 / 60, DIAGONAL);
    const mid = diagonal.pose();
    frames(diagonal, 90, 1 / 60, DIAGONAL);
    const end = diagonal.pose();
    const first = Math.atan2(mid.x - 400, mid.z - 80);
    const second = Math.atan2(end.x - mid.x, end.z - mid.z);
    expect(Math.abs(angDelta(first, second))).toBeLessThan(0.05);
    expect(Math.abs(end.x - 400)).toBeGreaterThan(15);
    expect(80 - end.z).toBeGreaterThan(15);
  });

  it("treats a hard stick change as a new command without snapping the camera", () => {
    const walker = boot();
    frames(walker, 60, 1 / 60, AHEAD);
    const yaw = walker.pose().camYaw;
    const z = walker.pose().z;
    frames(walker, 1, 1 / 60, STRAFE);
    expect(Math.abs(angDelta(walker.pose().camYaw, yaw))).toBeLessThan(0.05);
    frames(walker, 90, 1 / 60, STRAFE);
    expect(walker.pose().x).toBeGreaterThan(420);
    expect(Math.abs(walker.pose().z - z)).toBeLessThan(8);
  });

  it("matches a 30 fps and 60 fps trailing yaw on the same walk", () => {
    const run = (dt: number) => {
      const walker = boot();
      frames(walker, Math.round(0.5 / dt), dt, AHEAD);
      walker.orbit(-160, 0);
      frames(walker, Math.round(3 / dt), dt, AHEAD);
      return walker.pose().camYaw;
    };
    expect(Math.abs(angDelta(run(1 / 30), run(1 / 60)))).toBeLessThan(0.02);
  });

  it("still routes walk gestures through orbit and leaves fly mode alone", () => {
    const scene = readFileSync("src/interactive-atlas/scene.ts", "utf8");
    expect(scene).toContain('orbiting: gesture !== "none" && ptrs.size > 0');
    expect(scene).toContain("walker.orbit(dx, dy)");
    expect(scene).toContain("walker.orbit(cdx, cdy)");
    expect(scene).toContain("if (walking) {");
    expect(scene).not.toContain("stepHeadingFollow");
  });
});
