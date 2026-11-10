import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { fallbackInsideMonument, placeCenotaphCamera, stairHeight, constrainCenotaph } from "./ascent";
import { WALK_BACK, WALK_LOOK } from "./framing";
import { flatDiscCap, setMonumentCap, type CapGrid } from "./monument-cap";
import { createWalker } from "./mister-why";
import { NORTH_ARCH_SOFFIT, NORTH_END_Z, NORTH_HALL_Y, inNorthMouth, northHalf, northHeight } from "./north-passage";
import { TERRACE_OUT } from "./terrace";
import { sampleGround, setObservationDisc } from "./terrain";
import { projectOut } from "./world";
import { WALK_R } from "./dome-floor";

function capDisc(): CapGrid {
  const step = 0.5;
  const x0 = -20;
  const z0 = -20;
  const cols = 81;
  const rows = 81;
  const heights = new Float32Array(cols * rows);
  heights.fill(Number.NaN);
  let cells = 0;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = x0 + i * step;
      const z = z0 + j * step;
      if (Math.hypot(x, z) <= 19.5) {
        heights[j * cols + i] = 13.103;
        cells++;
      }
    }
  }
  return { x0, z0, step, cols, rows, heights, cells, yMin: 13.103, yMax: 13.103 };
}

describe("northern passage", () => {
  it("stays shut on production and matches the measured treads when the cap is on", () => {
    setMonumentCap(null);
    expect(northHeight(0, -28)).toBe(0);
    expect(stairHeight(0, 21)).toBeCloseTo(12.937, 3);
    expect(stairHeight(0, 60)).toBeCloseTo(6.275, 3);
    const blocked = projectOut(0, -20, 0, -8);
    expect(blocked.z).toBeGreaterThanOrEqual(-WALK_R - 0.05);
    expect(blocked.z).toBeLessThan(-WALK_R + 0.35);

    setMonumentCap(capDisc());
    expect(sampleGround(0, -16)).toBeCloseTo(13.103, 2);
    expect(sampleGround(0, -19.6)).toBeCloseTo(13.103, 2);
    expect(sampleGround(0, -20.8)).toBeCloseTo(12.937, 2);
    expect(sampleGround(0, -22)).toBeCloseTo(12.604, 2);
    expect(sampleGround(0, -26)).toBeCloseTo(10.938, 2);
    expect(sampleGround(0, -42)).toBeCloseTo(NORTH_HALL_Y, 2);
    expect(sampleGround(0, -60)).toBeCloseTo(NORTH_HALL_Y, 2);
    expect(sampleGround(0, -85)).toBeCloseTo(NORTH_HALL_Y, 2);
    expect(sampleGround(0, -96)).toBeCloseTo(NORTH_HALL_Y, 2);
    expect(sampleGround(0, 21)).toBeCloseTo(12.937, 2);
    expect(sampleGround(0, 108)).toBeCloseTo(6.275, 2);
    expect(northHalf(-28)).toBeLessThan(2.2);
    expect(northHalf(-85)).toBeLessThan(1.1);
    expect(northHalf(-60)).toBeCloseTo(6.05, 2);

    const side = projectOut(12, -60, 4, 0);
    expect(Math.abs(side.x)).toBeLessThanOrEqual(6.1);
    expect(side.z).toBeCloseTo(-60, 2);
    const arch = projectOut(4, -85, 2, 0);
    expect(Math.abs(arch.x)).toBeLessThanOrEqual(1.05);
    const cliff = projectOut(0, -110, 0, -6);
    expect(cliff.z).toBeCloseTo(-110, 1);
    expect(sampleGround(cliff.x, cliff.z)).toBeCloseTo(NORTH_HALL_Y, 2);
    const rim = projectOut(0, -120, 0, -6);
    expect(rim.z).toBeCloseTo(-TERRACE_OUT, 1);
    expect(rim.z).toBeLessThan(NORTH_END_Z);
    const east = projectOut(22, -4, 3, 0);
    expect(Math.hypot(east.x, east.z)).toBeLessThanOrEqual(19.6);

    const ducked = placeCenotaphCamera(0, -85, { x: 0, y: 24, z: -79 });
    expect(ducked.y).toBeLessThan(NORTH_ARCH_SOFFIT);
    expect(ducked.y).toBeGreaterThan(NORTH_HALL_Y + 0.4);
    const hallCam = placeCenotaphCamera(0, -60, { x: 0.2, y: 30, z: -54 });
    expect(hallCam.y).toBeLessThan(13.075 - 0.2);
    const dome = placeCenotaphCamera(0, 0, { x: 2, y: 36, z: 6 });
    expect(dome.y).toBeGreaterThan(20);

    const home = fallbackInsideMonument(0, -70);
    expect(home).toBeNull();
    setMonumentCap(null);
    const back = fallbackInsideMonument(0, -70);
    expect(back?.z).toBeCloseTo(-WALK_R + 0.05, 2);
    expect(Math.abs(back?.x ?? 1)).toBeLessThan(0.05);
    expect(fallbackInsideMonument(0, 60)).toBeNull();
  });

  it("walks south to the northern landing and back through the south hall", () => {
    setMonumentCap(capDisc());
    const walker = createWalker(new THREE.Scene());
    walker.restore({ x: 0, z: 8, heading: Math.PI, camYaw: 0, back: WALK_BACK, lookLift: WALK_LOOK });
    const ahead = { x: 0, y: 1, orbiting: false };
    for (let i = 0; i < 500; i++) walker.update(0.05, i * 0.05, ahead, true);
    const north = walker.pose();
    expect(north.z).toBeLessThan(-110);
    expect(north.z).toBeGreaterThanOrEqual(-TERRACE_OUT - 0.2);
    expect(walker.group.position.y).toBeCloseTo(NORTH_HALL_Y, 2);
    expect(walker.group.position.y).toBeCloseTo(sampleGround(north.x, north.z), 3);
    expect(Math.abs(north.x)).toBeLessThan(1.2);

    walker.restore({ x: north.x, z: north.z, heading: 0, camYaw: Math.PI, back: WALK_BACK, lookLift: WALK_LOOK });
    let hall = false;
    let rise = false;
    let dome = false;
    for (let i = 0; i < 900; i++) {
      walker.update(0.05, i * 0.05, ahead, true);
      const pose = walker.pose();
      const y = walker.group.position.y;
      expect(y).toBeCloseTo(sampleGround(pose.x, pose.z), 2);
      if (pose.z < -10 && pose.z > -20 && y > 13) dome = true;
      if (pose.z > 24 && pose.z < 34 && y > 8.4 && y < 12) rise = true;
      if (pose.z > 50 && pose.z < 75 && Math.abs(y - 6.275) < 0.05) hall = true;
    }
    const south = walker.pose();
    expect(dome).toBe(true);
    expect(rise).toBe(true);
    expect(hall).toBe(true);
    expect(south.z).toBeGreaterThan(118);
    expect(walker.group.position.y).toBeLessThan(2);
    setMonumentCap(null);
  });

  it("walks the floor tongue out to the rim and back without a teleport", () => {
    // The cap is a circle. The mesh tongue is not. A step just outside that
    // circle at (7, -18.6) used to miss the rim cell and snap to r = 13.35,
    // six metres back into the dome. The throat used to jump sideways.
    setObservationDisc(13.103);
    setMonumentCap(flatDiscCap(13.103));
    expect(inNorthMouth(6, -18.5)).toBe(true);
    expect(inNorthMouth(6.05, -18.4)).toBe(true);
    expect(sampleGround(6, -19.2)).toBeCloseTo(13.103, 2);
    expect(sampleGround(6, -20.8)).toBeCloseTo(12.937, 2);

    const flung = constrainCenotaph(7, -18.6, 0, -8, 130, 7, -18.2);
    expect(Math.hypot(flung.x, flung.z)).toBeGreaterThan(18);
    expect(Math.hypot(flung.x - 7, flung.z - (-18.2))).toBeLessThan(0.7);

    const throat = projectOut(4, -27.2, 0, -8, 4, -26.2);
    // The pinch used to jump this step to x ≈ 2.05. Ride the wall instead.
    expect(throat.x).toBeGreaterThan(2.9);
    expect(throat.x).toBeLessThan(3.2);
    expect(throat.z).toBeLessThan(-26.5);
    expect(throat.z).toBeGreaterThan(-27.2);

    const dt = 1 / 60;
    const ahead = { x: 0, y: 1, orbiting: false };
    for (const x0 of [0, 4, 7]) {
      const walker = createWalker(new THREE.Scene());
      walker.restore({ x: x0, z: 2, heading: Math.PI, camYaw: 0, back: WALK_BACK, lookLift: WALK_LOOK });
      let prev = walker.pose();
      let prevY = walker.group.position.y;
      for (let i = 0; i < 900; i++) {
        walker.update(dt, i * dt, ahead, true);
        const pose = walker.pose();
        const y = walker.group.position.y;
        expect(Math.hypot(pose.x - prev.x, pose.z - prev.z)).toBeLessThan(0.7);
        expect(Math.abs(y - prevY)).toBeLessThan(0.4);
        expect(y).toBeCloseTo(sampleGround(pose.x, pose.z), 2);
        prev = pose;
        prevY = y;
        if (pose.z < -110) break;
      }
      const north = walker.pose();
      expect(north.z).toBeLessThan(-110);
      expect(north.z).toBeGreaterThanOrEqual(-TERRACE_OUT - 0.2);
      expect(walker.group.position.y).toBeCloseTo(NORTH_HALL_Y, 2);

      walker.restore({
        x: north.x,
        z: north.z,
        heading: 0,
        camYaw: Math.PI,
        back: WALK_BACK,
        lookLift: WALK_LOOK,
      });
      let dome = false;
      prev = walker.pose();
      prevY = walker.group.position.y;
      for (let i = 0; i < 900; i++) {
        walker.update(dt, i * dt, ahead, true);
        const pose = walker.pose();
        const y = walker.group.position.y;
        expect(Math.hypot(pose.x - prev.x, pose.z - prev.z)).toBeLessThan(0.7);
        expect(Math.abs(y - prevY)).toBeLessThan(0.4);
        expect(y).toBeCloseTo(sampleGround(pose.x, pose.z), 2);
        if (pose.z > -16 && pose.z < 2 && y > 12.9) dome = true;
        prev = pose;
        prevY = y;
        if (dome && pose.z > -1) break;
      }
      expect(dome).toBe(true);
      expect(walker.pose().z).toBeGreaterThan(-1);
    }

    setMonumentCap(null);
    setObservationDisc(null);
    expect(inNorthMouth(0, -28)).toBe(false);
    expect(sampleGround(0, -28)).toBe(0);
    expect(sampleGround(0, 21)).toBeCloseTo(12.937, 2);
    expect(sampleGround(0, 60)).toBeCloseTo(6.275, 2);
    const shut = createWalker(new THREE.Scene());
    shut.restore({ x: 7, z: 2, heading: Math.PI, camYaw: 0, back: WALK_BACK, lookLift: WALK_LOOK });
    for (let i = 0; i < 240; i++) shut.update(dt, i * dt, ahead, true);
    expect(shut.pose().z).toBeGreaterThanOrEqual(-WALK_R - 0.05);
    expect(Math.hypot(shut.pose().x, shut.pose().z)).toBeLessThanOrEqual(WALK_R + 0.05);
  });
});
