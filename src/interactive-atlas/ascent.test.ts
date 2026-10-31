import * as THREE from "three";
import { describe, expect, it } from "vitest";
import {
  CENOTAPH_ENTRY,
  HALL_END_Y,
  HALL_END_Z,
  STAIR_DOOR_Z,
  STAIR_LAND_Y,
  STAIR_THROAT,
  atCenotaphDoor,
  constrainCenotaph,
  inStairMouth,
  placeCenotaphCamera,
  stairHalf,
  stairHeight,
} from "./ascent";
import { WALK_BACK, WALK_CLEARANCE, WALK_EYE, WALK_LOOK, WALK_LOOK_MIN } from "./framing";
import { createWalker } from "./mister-why";
import { ATLAS_RESUME_KEY, captureAtlasResume, takeAtlasResume } from "./resume";
import { sampleGround } from "./terrain";
import { CEN_BLOCK, PLACES, projectOut } from "./world";
import { DOME_FLOOR_Y, APRON_HALF, WALK_R } from "./dome-floor";

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
    expect(stairHeight(0, 70)).toBeCloseTo(STAIR_LAND_Y, 3);
    expect(stairHeight(4, 60)).toBeCloseTo(STAIR_LAND_Y, 3);
    expect(stairHeight(7, 60)).toBe(0);
    expect(stairHeight(0, 42)).toBeCloseTo(STAIR_LAND_Y, 3);
    expect(stairHeight(0, 40)).toBeCloseTo(6.941, 3);
    expect(stairHeight(0, 39.5)).toBeCloseTo(7.274, 3);
    expect(stairHeight(0, 36)).toBeCloseTo(8.607, 3);
    expect(stairHeight(0, 34)).toBeCloseTo(8.607, 3);
    expect(stairHeight(0, HALL_END_Z)).toBeCloseTo(HALL_END_Y, 3);
    expect(stairHeight(0, 28)).toBeCloseTo(10.938, 2);
    expect(13.08 - stairHeight(0, 28)).toBeGreaterThan(1.9);
    expect(stairHeight(0, 21)).toBeCloseTo(12.937, 2);
    expect(stairHeight(0, 20)).toBeCloseTo(12.937, 2);
    expect(stairHeight(0, 0)).toBeCloseTo(DOME_FLOOR_Y, 2);
    expect(stairHeight(14, 0)).toBe(0);
    expect(stairHeight(0, 16)).toBeCloseTo(DOME_FLOOR_Y, 2);
    expect(stairHeight(6.2, 18)).toBeCloseTo(DOME_FLOOR_Y, 2);
    const wing = constrainCenotaph(8, 18, 2, 0);
    expect(wing.x).toBeCloseTo(APRON_HALF, 1);
    expect(wing.z).toBeCloseTo(18, 1);
    expect(sampleGround(0, 0)).toBeCloseTo(DOME_FLOOR_Y, 2);
    expect(stairHalf(80)).toBe(STAIR_THROAT);
    expect(stairHalf(STAIR_DOOR_Z)).toBe(STAIR_THROAT);
    expect(sampleGround(0, 115)).toBeCloseTo(stairHeight(0, 115), 5);
    expect(sampleGround(0, 60)).toBeCloseTo(STAIR_LAND_Y, 2);
    expect(sampleGround(0, HALL_END_Z)).toBeCloseTo(HALL_END_Y, 2);
  });

  it("climbs from the forecourt through the hall and comes back down", () => {
    const walker = walkerAt(0, 150);
    march(walker, 40);
    const up = walker.pose();
    expect(up.z).toBeLessThan(130);
    expect(up.z).toBeGreaterThan(100);
    expect(sampleGround(up.x, up.z)).toBeGreaterThan(1);
    expect(walker.group.position.y).toBeCloseTo(sampleGround(up.x, up.z), 4);
    expect(inStairMouth(up.x, up.z)).toBe(true);

    march(walker, 50);
    const door = walker.pose();
    expect(door.z).toBeLessThan(STAIR_DOOR_Z);
    expect(door.z).toBeGreaterThan(42);
    expect(Math.abs(door.x)).toBeLessThan(2);
    expect(walker.group.position.y).toBeCloseTo(STAIR_LAND_Y, 2);
    expect(atCenotaphDoor(0, 82)).toBe(true);

    march(walker, 220);
    const top = walker.pose();
    expect(top.z).toBeLessThan(-10);
    expect(top.z).toBeGreaterThan(-14);
    expect(Math.abs(top.x)).toBeLessThan(1.2);
    expect(walker.group.position.y).toBeCloseTo(DOME_FLOOR_Y, 2);
    expect(atCenotaphDoor(top.x, top.z)).toBe(false);

    march(walker, 360, BACK);
    const down = walker.pose();
    expect(down.z).toBeGreaterThan(118);
    expect(walker.group.position.y).toBeLessThan(2);
    expect(walker.group.position.y).toBeCloseTo(sampleGround(down.x, down.z), 4);
  });

  it("blocks the round wall, the door, and a diagonal shortcut", () => {
    const east = projectOut(100, 10, -1, 0);
    expect(Math.hypot(east.x, east.z)).toBeGreaterThanOrEqual(CEN_BLOCK - 1e-3);
    expect(inStairMouth(east.x, east.z)).toBe(false);

    const through = projectOut(0, -20, 0, -24);
    expect(through.z).toBeGreaterThanOrEqual(-WALK_R - 0.05);
    expect(through.z).toBeLessThan(-WALK_R + 0.35);
    expect(Math.abs(through.x)).toBeLessThan(0.2);
    expect(through.vz).toBeGreaterThanOrEqual(-1e-6);

    const onFloor = projectOut(0, 8, 0, -4);
    expect(onFloor.z).toBeCloseTo(8, 3);
    expect(onFloor.vz).toBeCloseTo(-4, 3);

    const hall = projectOut(0, 50, 0, -4);
    expect(hall.z).toBeCloseTo(50, 3);
    expect(hall.vz).toBeCloseTo(-4, 3);

    const side = constrainCenotaph(9, 60, 6, 0, CEN_BLOCK);
    expect(Math.abs(side.x)).toBeLessThanOrEqual(6.1);
    expect(side.z).toBeCloseTo(60, 3);
    expect(side.vx).toBeLessThanOrEqual(0.05);

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
    expect(home.pose().z).toBeCloseTo(0, 4);
    expect(home.group.position.y).toBeCloseTo(DOME_FLOOR_Y, 2);

    const offSlab = createWalker(new THREE.Scene());
    offSlab.enter(new THREE.Vector3(40, 40, 40), camera);
    expect(offSlab.pose().z).toBeCloseTo(158, 4);

    const boom = placeCenotaphCamera(0, STAIR_DOOR_Z, { x: 0, y: 10, z: STAIR_DOOR_Z - 8 });
    expect(boom.z).toBeGreaterThan(HALL_END_Z);
    expect(boom.z).toBeLessThan(STAIR_DOOR_Z + 0.2);
    expect(boom.y).toBeLessThan(8.6);
    expect(boom.y).toBeGreaterThan(8.2);
    expect(CENOTAPH_ENTRY.y).toBe(STAIR_LAND_Y);
    expect(CENOTAPH_ENTRY.z).toBe(STAIR_DOOR_Z);
  });

  it("fits the arch and keeps the camera segment out of the stone", () => {
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
    expect(deep.z).toBeGreaterThan(HALL_END_Z);
    expect(deep.z).toBeLessThan(85);
    expect(Math.abs(deep.x)).toBeLessThan(1.3);
    expect(deep.y).toBeLessThan(8.6);

    const cheekCam = placeCenotaphCamera(0, 80, { x: 6, y: 8, z: 80 });
    expect(Math.abs(cheekCam.x)).toBeLessThanOrEqual(1.2);

    const flight = placeCenotaphCamera(0, 115, { x: 0, y: 9, z: 70 });
    expect(flight.z).toBeGreaterThan(86);
    expect(flight.z).toBeLessThan(116);
    expect(flight.y).toBeCloseTo(9, 1);
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const x = 0 + (flight.x - 0) * t;
      const z = 115 + (flight.z - 115) * t;
      if (Math.hypot(x, z) < 132) expect(inStairMouth(x, z) || Math.abs(x) <= stairHalf(z) + 0.2).toBe(true);
    }

    const walled = placeCenotaphCamera(0, 60, { x: 14, y: 9, z: 60 });
    expect(Math.abs(walled.x)).toBeLessThanOrEqual(6.4);
    expect(walled.z).toBeGreaterThan(50);
    expect(walled.z).toBeLessThan(70);

    const past = placeCenotaphCamera(0, HALL_END_Z, { x: 0, y: 12.4, z: HALL_END_Z - 8 });
    expect(past.z).toBeCloseTo(HALL_END_Z - 8, 1);
    expect(past.y).toBeLessThanOrEqual(12.78);
    expect(past.y).toBeGreaterThan(11.5);
    expect(inStairMouth(past.x, past.z)).toBe(true);

    const pinch = placeCenotaphCamera(0, 28, { x: 0, y: 10.938 + 2.42, z: 34 });
    expect(pinch.y).toBeLessThanOrEqual(13.08 - 0.32 + 0.02);
    expect(pinch.y).toBeGreaterThan(10.938 + 1.7);

    const ducked = placeCenotaphCamera(0, 24, { x: 0, y: 16.2, z: 31 });
    expect(ducked.z).toBeLessThan(26.6);
    expect(ducked.z).toBeGreaterThan(24);
    expect(ducked.y).toBeGreaterThan(15);
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

  it("recovers repeated vertical orbits in the arch, the hall, and on the rise", () => {
    const camera = new THREE.PerspectiveCamera();
    for (const z of [115, 80, 60, 36, HALL_END_Z, 0]) {
      const walker = walkerAt(0, z);
      for (let cycle = 0; cycle < 4; cycle++) {
        walker.orbit(0, -700);
        expect(walker.snapshot().lookLift).toBeGreaterThan(40);
        walker.orbit(0, 6000);
        expect(walker.snapshot().lookLift).toBe(WALK_LOOK_MIN);
        walker.orbit(0, -20);
        expect(walker.snapshot().lookLift).toBeGreaterThan(2);
        expect(walker.snapshot().lookLift).toBeLessThan(4);
        walker.orbit(cycle % 2 === 0 ? 40 : -40, cycle % 2 === 0 ? 12 : -12);
        walker.update(0.05, cycle, { ...AHEAD, orbiting: true }, false);
        expect(walker.active).toBe(true);
      }
      walker.orbit(0, 400);
      expect(walker.snapshot().lookLift).toBe(WALK_LOOK_MIN);
      walker.orbit(0, -30);
      expect(walker.snapshot().lookLift).toBeGreaterThan(WALK_LOOK_MIN);
      expect(walker.snapshot().lookLift).toBeLessThan(WALK_LOOK + 2);
      walker.applyCamera(camera, 1, true);
      expect(walker.active).toBe(true);
      const dist = Math.hypot(camera.position.x - walker.pose().x, camera.position.z - walker.pose().z);
      expect(dist).toBeGreaterThan(0.5);
      expect(dist).toBeLessThanOrEqual(WALK_BACK + 0.2);
      expect(camera.position.y).toBeGreaterThan(sampleGround(walker.pose().x, walker.pose().z) + 0.4);
    }

    const rimZ = -(WALK_R - 0.2);
    const jammed = walkerAt(0, rimZ, Math.PI);
    jammed.applyCamera(camera, 1, true);
    expect(camera.position.z).toBeGreaterThan(rimZ - 1.9);
    expect(Math.hypot(camera.position.x, camera.position.z)).toBeLessThan(WALK_R + 1.7);
    jammed.orbit(-680, 0);
    jammed.applyCamera(camera, 1, true);
    const restored = Math.hypot(camera.position.x - jammed.pose().x, camera.position.z - jammed.pose().z);
    expect(restored).toBeGreaterThan(4);
    expect(jammed.active).toBe(true);

    const reduced = walkerAt(0, 60);
    reduced.orbit(0, -200);
    expect(reduced.snapshot().lookLift).toBeGreaterThan(15);
    reduced.orbit(0, 2000);
    expect(reduced.snapshot().lookLift).toBe(WALK_LOOK_MIN);
    reduced.applyCamera(camera, 1, true);
    expect(reduced.active).toBe(true);
    expect(reduced.snapshot().camYaw).toBeCloseTo(0, 5);
  });

  it("resumes an interior pose and stays in Walk there", () => {
    sessionStorage.removeItem(ATLAS_RESUME_KEY);
    const walker = walkerAt(1.2, 48);
    expect(walker.group.position.y).toBeCloseTo(STAIR_LAND_Y, 2);
    const now = 1_700_000_000_000;
    captureAtlasResume({
      v: 1,
      t: now,
      mode: "walk",
      focus: [1.2, STAIR_LAND_Y + 2, 48],
      radius: 12,
      yaw: 0.4,
      pitch: 0.6,
      selected: null,
      walker: walker.snapshot(),
    });
    const saved = takeAtlasResume(now + 1000);
    expect(saved?.mode).toBe("walk");
    expect(saved?.walker?.z).toBeCloseTo(48, 3);
    expect(saved?.walker?.x).toBeCloseTo(1.2, 3);
    const again = createWalker(new THREE.Scene());
    again.restore(saved!.walker!);
    expect(again.group.position.y).toBeCloseTo(STAIR_LAND_Y, 2);
    expect(again.active).toBe(true);

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);
    camera.position.set(1.2, 12, 54);
    const stayed = createWalker(new THREE.Scene());
    stayed.enter(new THREE.Vector3(1.2, 9, 48), camera);
    expect(stayed.pose().z).toBeGreaterThan(40);
    expect(stayed.pose().z).toBeLessThan(60);
    expect(stayed.group.position.y).toBeCloseTo(STAIR_LAND_Y, 2);

    const outside = createWalker(new THREE.Scene());
    outside.enter(new THREE.Vector3(0, 20, -24), camera);
    expect(outside.pose().z).toBeCloseTo(158, 4);

    const center = walkerAt(0, 0);
    expect(center.group.position.y).toBeCloseTo(DOME_FLOOR_Y, 2);
    captureAtlasResume({
      v: 1,
      t: now + 2000,
      mode: "walk",
      focus: [0, DOME_FLOOR_Y + 2, 0],
      radius: 12,
      yaw: 0.2,
      pitch: 0.4,
      selected: null,
      walker: center.snapshot(),
    });
    const fromFloor = takeAtlasResume(now + 3000);
    expect(fromFloor?.walker?.x).toBeCloseTo(0, 3);
    expect(fromFloor?.walker?.z).toBeCloseTo(0, 3);
    const stood = createWalker(new THREE.Scene());
    stood.restore(fromFloor!.walker!);
    expect(stood.group.position.y).toBeCloseTo(DOME_FLOOR_Y, 2);
    expect(stood.active).toBe(true);
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
