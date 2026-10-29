import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { WALK_BACK, WALK_CLEARANCE, WALK_EYE, WALK_LOOK, WALK_LOOK_MAX, WALK_LOOK_MIN, WALK_NEAR_EYE } from "./framing";
import { createWalker } from "./mister-why";
import { GARDEN_COURT, clearBoom, keepGarden, sampleGround } from "./terrain";
import { GROUND_R, GROUND_WALK, PLACES } from "./world";

function cameraAt(x: number, z: number, lookLift = WALK_LOOK, back = WALK_BACK, camYaw = 0) {
  const walker = createWalker(new THREE.Scene());
  walker.restore({ x, z, heading: Math.PI, camYaw, back, lookLift });
  const camera = new THREE.PerspectiveCamera();
  walker.applyCamera(camera, 1, true);
  return { walker, camera };
}

describe("human-scale walk camera", () => {
  it("frames Mister Why from just above eye level, not from a crane", () => {
    const { camera, walker } = cameraAt(0, 158);
    const pose = walker.pose();
    expect(camera.position.y).toBeGreaterThan(2);
    expect(camera.position.y).toBeLessThan(3.2);
    expect(Math.hypot(camera.position.x - pose.x, camera.position.z - pose.z)).toBeCloseTo(WALK_BACK, 1);
    const aim = walker.aim();
    expect(Math.hypot(aim.x - pose.x, aim.z - pose.z)).toBeLessThan(14);
    expect(aim.y).toBeCloseTo(WALK_LOOK, 1);
    expect(camera.position.y).toBeGreaterThan(sampleGround(camera.position.x, camera.position.z) + WALK_CLEARANCE - 1e-3);
  });

  it("pitches down to a near-ground view and up toward a tall monument", () => {
    const walker = createWalker(new THREE.Scene());
    walker.restore({ x: 0, z: 158, heading: Math.PI, camYaw: 0, back: WALK_BACK, lookLift: WALK_LOOK });
    walker.orbit(0, 400);
    expect(walker.snapshot().lookLift).toBe(WALK_LOOK_MIN);
    const low = new THREE.PerspectiveCamera();
    walker.applyCamera(low, 1, true);
    expect(low.position.y).toBeGreaterThan(WALK_CLEARANCE);
    expect(low.position.y).toBeLessThan(WALK_NEAR_EYE + 0.15);

    walker.orbit(0, -800);
    expect(walker.snapshot().lookLift).toBe(WALK_LOOK_MAX);
    const high = new THREE.PerspectiveCamera();
    walker.applyCamera(high, 1, true);
    expect(walker.aim().y).toBeGreaterThan(40);
    expect(high.position.y).toBeLessThan(WALK_EYE + 1.2);
  });

  it("stays above the court, the rim, and the five western doors", () => {
    const doors = ["hollow-genius", "ambiguous-dancer", "inside-out", "cubic-worm", "hypercross"] as const;
    for (const id of doors) {
      const place = PLACES[id];
      const { camera } = cameraAt(place.x, place.z + place.block + 2.6);
      const floor = sampleGround(camera.position.x, camera.position.z);
      expect(floor).toBe(0);
      expect(camera.position.y).toBeGreaterThanOrEqual(floor + WALK_CLEARANCE - 1e-3);
    }

    const rim = clearBoom(0, GROUND_WALK - 2, { x: 0, y: -4, z: GROUND_R + 6 });
    expect(rim.y).toBeGreaterThanOrEqual(sampleGround(rim.x, rim.z) + WALK_CLEARANCE - 1e-3);

    const overCourt = clearBoom(GARDEN_COURT.x - GARDEN_COURT.block - 2, GARDEN_COURT.z, {
      x: GARDEN_COURT.x,
      y: 0.2,
      z: GARDEN_COURT.z,
    });
    expect(overCourt.y).toBeGreaterThanOrEqual(sampleGround(overCourt.x, overCourt.z) + WALK_CLEARANCE - 1e-3);
    expect(Math.hypot(overCourt.x - GARDEN_COURT.x, overCourt.z - GARDEN_COURT.z)).toBeGreaterThan(1);
  });
});

describe("garden court ground", () => {
  it("rises in steps and does not cover the avenue or the house", () => {
    expect(sampleGround(GARDEN_COURT.x, GARDEN_COURT.z)).toBeGreaterThan(0.9);
    expect(sampleGround(GARDEN_COURT.x + 6, GARDEN_COURT.z)).toBeGreaterThan(0.4);
    expect(sampleGround(GARDEN_COURT.x + 11, GARDEN_COURT.z)).toBeGreaterThan(0.1);
    expect(sampleGround(GARDEN_COURT.x + 11, GARDEN_COURT.z)).toBeLessThan(0.5);

    const pathX = -62 * 6.6;
    for (let z = -96; z >= -128; z -= 4) {
      expect(sampleGround(pathX, z)).toBe(0);
    }
    const house = PLACES["inside-out"];
    expect(sampleGround(house.x, house.z)).toBe(0);
    expect(Math.hypot(pathX - GARDEN_COURT.x, 0)).toBeGreaterThan(GARDEN_COURT.block + 6);

    const inside = keepGarden(GARDEN_COURT.x, GARDEN_COURT.z + 1, 0, -1);
    expect(Math.hypot(inside.x - GARDEN_COURT.x, inside.z - GARDEN_COURT.z)).toBeGreaterThanOrEqual(GARDEN_COURT.block - 1e-4);
    const avenue = keepGarden(pathX, -110, 0, 0);
    expect(avenue.x).toBeCloseTo(pathX, 4);
    expect(avenue.z).toBeCloseTo(-110, 4);
  });

  it("drops past the rim instead of assuming the disc goes on forever", () => {
    expect(sampleGround(0, GROUND_R - 2)).toBe(0);
    expect(sampleGround(0, GROUND_R + 8)).toBeLessThan(-2);
    expect(sampleGround(0, GROUND_R + 40)).toBeCloseTo(-8.4, 1);
  });
});
