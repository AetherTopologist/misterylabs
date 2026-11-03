import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { fallbackInsideMonument, placeCenotaphCamera, stairHeight } from "./ascent";
import { WALK_BACK, WALK_LOOK } from "./framing";
import { setMonumentCap, type CapGrid } from "./monument-cap";
import { createWalker } from "./mister-why";
import { NORTH_ARCH_SOFFIT, NORTH_END_Z, NORTH_HALL_Y, northHalf, northHeight } from "./north-passage";
import { sampleGround } from "./terrain";
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
    expect(cliff.z).toBeGreaterThanOrEqual(NORTH_END_Z - 0.05);
    expect(cliff.z).toBeLessThan(NORTH_END_Z + 0.2);
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
    expect(north.z).toBeLessThan(-90);
    expect(north.z).toBeGreaterThanOrEqual(NORTH_END_Z - 0.05);
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
});
