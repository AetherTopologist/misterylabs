import * as THREE from "three";
import { describe, expect, it } from "vitest";
import {
  CENOTAPH_ENTRY,
  STAIR_DOOR_Z,
  STAIR_LAND_Y,
  atCenotaphDoor,
  constrainCenotaph,
  inStairMouth,
  placeCenotaphCamera,
  stairHeight,
} from "./ascent";
import { WALK_BACK, WALK_CLEARANCE, WALK_EYE, WALK_LOOK, WALK_LOOK_MIN } from "./framing";
import { createWalker } from "./mister-why";
import { sampleGround } from "./terrain";
import { CEN_BLOCK, PLACES, projectOut } from "./world";

const AHEAD = { x: 0, y: 1, orbiting: false };
const BACK = { x: 0, y: -1, orbiting: false };

function walkerAt(x: number, z: number, camYaw = 0) {
  const walker = createWalker(new THREE.Scene());
  walker.restore({ x, z, heading: Math.PI, camYaw, back: WALK_BACK, lookLift: WALK_LOOK });
  return walker;
}

function march(walker: ReturnType<typeof createWalker>, frames: number, input = AHEAD, reduced = false) {
  for (let i = 0; i < frames; i++) walker.update(0.05, i * 0.05, input, reduced);
}

describe("cenotaph stair", () => {
  it("matches the measured tread line and stays on the fair beside it", () => {
    expect(stairHeight(0, 150)).toBe(0);
    expect(stairHeight(0, 121)).toBeCloseTo(0.415, 2);
    expect(stairHeight(0, 115)).toBeCloseTo(3.195, 2);
    expect(stairHeight(0, 109)).toBeCloseTo(5.995, 2);
    expect(stairHeight(10, 115)).toBeCloseTo(2.935, 2);
    expect(stairHeight(10, 115)).toBeLessThan(stairHeight(0, 115));
    expect(stairHeight(0, 100)).toBeCloseTo(STAIR_LAND_Y, 2);
    expect(stairHeight(0, 82)).toBeCloseTo(STAIR_LAND_Y, 2);
    expect(stairHeight(0, STAIR_DOOR_Z)).toBeCloseTo(STAIR_LAND_Y, 2);
    expect(STAIR_LAND_Y).toBeCloseTo(6.275, 3);
    expect(stairHeight(0, 70)).toBe(0);
    expect(sampleGround(0, 115)).toBeCloseTo(stairHeight(0, 115), 5);
    expect(sampleGround(0, 100)).toBeCloseTo(STAIR_LAND_Y, 2);
  });

  it("climbs from the forecourt to the threshold and comes back down", () => {
    const walker = walkerAt(0, 150);
    march(walker, 120);
    const up = walker.pose();
    expect(up.z).toBeLessThan(110);
    expect(up.z).toBeGreaterThan(STAIR_DOOR_Z - 0.05);
    expect(sampleGround(up.x, up.z)).toBeGreaterThan(4);
    expect(walker.group.position.y).toBeCloseTo(sampleGround(up.x, up.z), 4);
    expect(inStairMouth(up.x, up.z)).toBe(true);

    march(walker, 220);
    const top = walker.pose();
    expect(top.z).toBeGreaterThan(STAIR_DOOR_Z - 0.05);
    expect(top.z).toBeLessThan(STAIR_DOOR_Z + 0.4);
    expect(Math.abs(top.x)).toBeLessThan(2);
    expect(walker.group.position.y).toBeCloseTo(STAIR_LAND_Y, 2);
    expect(atCenotaphDoor(top.x, top.z)).toBe(true);
    expect(top.z).toBeGreaterThan(70);

    march(walker, 160, BACK);
    const down = walker.pose();
    expect(down.z).toBeGreaterThan(118);
    expect(walker.group.position.y).toBeLessThan(2);
    expect(walker.group.position.y).toBeCloseTo(sampleGround(down.x, down.z), 4);
  });

  it("blocks the round wall, the door, and a diagonal shortcut", () => {
    const east = projectOut(100, 10, -1, 0);
    expect(Math.hypot(east.x, east.z)).toBeGreaterThanOrEqual(CEN_BLOCK - 1e-3);
    expect(inStairMouth(east.x, east.z)).toBe(false);

    const through = projectOut(0, 40, 0, -24);
    expect(through.z).toBeGreaterThanOrEqual(STAIR_DOOR_Z - 1e-3);
    expect(Math.abs(through.x)).toBeLessThanOrEqual(2);
    expect(through.vz).toBeGreaterThanOrEqual(-1e-6);

    let x = 70;
    let z = 150;
    let vx = 0;
    let vz = -24;
    for (let i = 0; i < 100; i++) {
      x += vx * 0.05;
      z += vz * 0.05;
      const step = projectOut(x, z, vx, vz);
      x = step.x;
      z = step.z;
      vx = step.vx;
      vz = step.vz;
      const inside = Math.hypot(x, z) < CEN_BLOCK - 0.05;
      expect(inside && !inStairMouth(x, z)).toBe(false);
    }
    expect(Math.hypot(x, z)).toBeGreaterThanOrEqual(CEN_BLOCK - 0.05);

    const cheek = constrainCenotaph(20, 110, 4, 0, CEN_BLOCK);
    expect(Math.abs(cheek.x)).toBeLessThanOrEqual(13.3);
    expect(cheek.z).toBeGreaterThan(100);
    expect(inStairMouth(cheek.x, cheek.z)).toBe(true);
  });

  it("lets an angled approach enter only through the mouth", () => {
    const walker = walkerAt(8, 156);
    march(walker, 80);
    const pose = walker.pose();
    expect(pose.z).toBeLessThan(130);
    expect(inStairMouth(pose.x, pose.z)).toBe(true);
    expect(walker.group.position.y).toBeCloseTo(sampleGround(pose.x, pose.z), 4);
    expect(Math.abs(pose.x)).toBeLessThan(14);
  });

  it("keeps the camera on the stair, including orbit, descent, and reduced motion", () => {
    const walker = walkerAt(0, 140);
    const camera = new THREE.PerspectiveCamera();
    march(walker, 36);
    walker.applyCamera(camera, 0.2, true);
    const mid = walker.pose();
    expect(mid.z).toBeLessThan(125);
    expect(mid.z).toBeGreaterThan(100);
    expect(walker.group.position.y).toBeGreaterThan(1);
    expect(camera.position.y).toBeGreaterThan(sampleGround(camera.position.x, camera.position.z) + WALK_CLEARANCE - 0.05);
    expect(camera.position.y).toBeLessThan(walker.group.position.y + WALK_EYE + 1.2);
    expect(inStairMouth(camera.position.x, camera.position.z) || Math.hypot(camera.position.x, camera.position.z) >= 132).toBe(true);

    const before = walker.snapshot().camYaw;
    walker.orbit(-80, -40);
    walker.update(0.05, 1, { ...AHEAD, orbiting: true }, false);
    walker.applyCamera(camera, 0.05, false);
    expect(walker.snapshot().camYaw).not.toBeCloseTo(before, 2);
    expect(walker.snapshot().lookLift).toBeGreaterThan(WALK_LOOK);
    const orbited = camera.position;
    expect(inStairMouth(orbited.x, orbited.z, 0.5) || Math.hypot(orbited.x, orbited.z) >= 132).toBe(true);
    expect(orbited.y).toBeGreaterThan(sampleGround(orbited.x, orbited.z) + WALK_CLEARANCE - 0.05);

    const reduced = walkerAt(0, 150, 0.4);
    march(reduced, 40, AHEAD, true);
    expect(reduced.snapshot().camYaw).toBeCloseTo(0.4, 5);
    expect(reduced.pose().z).toBeLessThan(140);
    expect(reduced.group.position.y).toBeCloseTo(sampleGround(reduced.pose().x, reduced.pose().z), 4);
  });

  it("returns to a saved landing and does not reset Fly/Walk there", () => {
    const walker = walkerAt(0, 100);
    const saved = walker.snapshot();
    expect(saved.z).toBeCloseTo(100, 4);
    expect(walker.group.position.y).toBeCloseTo(STAIR_LAND_Y, 2);
    march(walker, 5, { x: 0, y: 0, orbiting: false });
    expect(walker.pose().z).toBeCloseTo(100, 1);

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);
    camera.position.set(0, 12, 108);
    walker.enter(new THREE.Vector3(0, 8, 102), camera);
    expect(walker.pose().z).toBeGreaterThan(90);
    expect(walker.pose().z).toBeLessThan(120);
    expect(Math.hypot(walker.pose().x, walker.pose().z)).toBeLessThan(CEN_BLOCK);

    const home = createWalker(new THREE.Scene());
    home.enter(new THREE.Vector3(0, 40, 0), camera);
    expect(home.pose().x).toBeCloseTo(0, 4);
    expect(home.pose().z).toBeCloseTo(158, 4);

    const boom = placeCenotaphCamera(0, STAIR_DOOR_Z, { x: 0, y: 10, z: STAIR_DOOR_Z - 8 });
    expect(boom.z).toBeGreaterThan(76);
    expect(boom.z).toBeLessThan(STAIR_DOOR_Z + 0.2);
    expect(boom.y).toBeLessThan(9);
    expect(CENOTAPH_ENTRY.y).toBe(STAIR_LAND_Y);
    expect(CENOTAPH_ENTRY.z).toBe(STAIR_DOOR_Z);
  });

  it("fits the arch and lets the camera into the opening, not the stone", () => {
    const jamb = constrainCenotaph(3.2, 82, 2, 0, CEN_BLOCK);
    expect(Math.abs(jamb.x)).toBeLessThanOrEqual(1.3);
    expect(inStairMouth(jamb.x, jamb.z)).toBe(true);
    expect(stairHeight(jamb.x, jamb.z)).toBeCloseTo(STAIR_LAND_Y, 2);

    const under = placeCenotaphCamera(0, 80, { x: 0, y: 10, z: 79.2 });
    expect(under.z).toBeGreaterThan(78);
    expect(under.z).toBeLessThan(81);
    expect(under.y).toBeLessThan(8.6);
    expect(under.y).toBeGreaterThan(8.2);

    const deep = placeCenotaphCamera(0, 84, { x: 0, y: 8.2, z: 70 });
    expect(deep.z).toBeGreaterThan(76);
    expect(deep.z).toBeLessThan(82);
    expect(Math.abs(deep.x)).toBeLessThan(1.3);

    const cheekCam = placeCenotaphCamera(0, 80, { x: 6, y: 8, z: 80 });
    expect(Math.abs(cheekCam.x)).toBeLessThanOrEqual(1.2);

    const flight = placeCenotaphCamera(0, 115, { x: 0, y: 9, z: 70 });
    expect(flight.z).toBeGreaterThan(85);
    expect(flight.z).toBeLessThan(116);
    expect(inStairMouth(flight.x, flight.z, 0.2)).toBe(true);
  });

  it("recovers extreme pitch at the threshold without leaving the walk", () => {
    const walker = walkerAt(0, 80);
    const camera = new THREE.PerspectiveCamera();
    expect(walker.active).toBe(true);
    walker.orbit(120, 0);
    expect(Math.abs(walker.snapshot().camYaw)).toBeGreaterThan(0.4);
    walker.orbit(0, -700);
    expect(walker.snapshot().lookLift).toBeGreaterThan(40);
    walker.orbit(0, 6000);
    expect(walker.snapshot().lookLift).toBe(WALK_LOOK_MIN);
    walker.orbit(0, -20);
    expect(walker.snapshot().lookLift).toBeGreaterThan(2);
    expect(walker.snapshot().lookLift).toBeLessThan(4);
    walker.applyCamera(camera, 1, true);
    expect(walker.active).toBe(true);
    expect(walker.group.position.y).toBeCloseTo(STAIR_LAND_Y, 2);
    expect(camera.position.y).toBeGreaterThan(STAIR_LAND_Y + 0.4);
    expect(camera.position.y).toBeLessThan(STAIR_LAND_Y + WALK_EYE + 0.5);

    const returned = createWalker(new THREE.Scene());
    returned.enter(new THREE.Vector3(0, 9, 80), camera);
    expect(returned.active).toBe(true);
    expect(returned.pose().z).toBeGreaterThan(STAIR_DOOR_Z - 0.2);
    expect(returned.pose().z).toBeLessThan(90);
  });

  it("does not move the western halls", () => {
    for (const id of ["hollow-genius", "ambiguous-dancer", "inside-out", "cubic-worm", "hypercross"] as const) {
      const place = PLACES[id];
      const blocked = projectOut(place.x, place.z + 1, 0, -1);
      expect(Math.hypot(blocked.x - place.x, blocked.z - place.z)).toBeGreaterThanOrEqual(place.block - 1e-3);
      expect(sampleGround(place.x, place.z + place.block + 3)).toBe(0);
    }
  });
});
