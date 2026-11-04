import * as THREE from "three";
import { afterEach, describe, expect, it } from "vitest";
import { fallbackInsideMonument, fitBoom, placeCenotaphCamera, stairHeight } from "./ascent";
import { WALK_R } from "./dome-floor";
import { EYE_HEIGHT, WALK_BACK, WALK_LOOK } from "./framing";
import { setMonumentCap, type CapGrid } from "./monument-cap";
import { createWalker } from "./mister-why";
import { NORTH_ARCH_SOFFIT, NORTH_END_Z } from "./north-passage";
import { sampleGround } from "./terrain";
import { TERRACE_OUT, TERRACE_Y, inTerrace, terraceHeight } from "./terrace";
import { CEN_BLOCK, projectOut } from "./world";

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

afterEach(() => setMonumentCap(null));

describe("exterior terrace", () => {
  it("stays shut on production", () => {
    setMonumentCap(null);
    expect(terraceHeight(106, 0)).toBe(0);
    expect(inTerrace(0, -110)).toBe(false);
    expect(stairHeight(0, 115)).toBeCloseTo(3.195, 2);
    const out = projectOut(100, 0, 4, 0);
    expect(Math.hypot(out.x, out.z)).toBeGreaterThanOrEqual(CEN_BLOCK - 0.2);
    expect(fallbackInsideMonument(106, 0)?.z ?? 1).toBeCloseTo(0, 1);
  });

  it("walks both arcs at the measured plinth and keeps the south flight", () => {
    setMonumentCap(capDisc());
    expect(sampleGround(106, 0)).toBeCloseTo(TERRACE_Y, 3);
    expect(sampleGround(-106, 0)).toBeCloseTo(TERRACE_Y, 3);
    expect(sampleGround(0, -106)).toBeCloseTo(TERRACE_Y, 3);
    expect(sampleGround(0, 106)).toBeCloseTo(TERRACE_Y, 3);
    expect(inTerrace(0, 115)).toBe(false);
    expect(stairHeight(0, 115)).toBeCloseTo(3.195, 2);
    expect(stairHeight(0, 120)).toBeCloseTo(0.829, 2);
    expect(projectOut(0, 120, 0, 4).z).toBeCloseTo(120, 2);

    const east = projectOut(106, 0, 0, 0);
    expect(east.x).toBeCloseTo(106, 1);
    expect(sampleGround(east.x, east.z)).toBeCloseTo(TERRACE_Y, 3);
    const rim = projectOut(0, -120, 0, -4);
    expect(rim.z).toBeCloseTo(-TERRACE_OUT, 1);
    expect(rim.z).toBeLessThan(NORTH_END_Z);
    const cheek = projectOut(14, 120, 0, 2);
    expect(Math.abs(cheek.x)).toBeCloseTo(13.2, 1);
    expect(sampleGround(cheek.x, cheek.z)).toBeGreaterThan(0.4);
    expect(sampleGround(cheek.x, cheek.z)).toBeLessThan(1.2);
    const plinth = projectOut(20, 112, 0, 0);
    expect(Math.abs(plinth.x)).toBeGreaterThan(17.5);
    expect(Math.hypot(plinth.x, plinth.z)).toBeLessThanOrEqual(TERRACE_OUT + 0.2);
    expect(sampleGround(plinth.x, plinth.z)).toBeCloseTo(TERRACE_Y, 2);
    expect(inTerrace(15, 112)).toBe(false);
    expect(inTerrace(18, 112)).toBe(true);
    const gap = projectOut(15, 112, 0, 0);
    expect(Math.abs(gap.x) < 14 || Math.abs(gap.x) > 17).toBe(true);
    expect(sampleGround(gap.x, gap.z)).toBeGreaterThan(3);

    const open = placeCenotaphCamera(0, -106, { x: 0, y: 30, z: -92 });
    expect(open.y).toBeGreaterThan(20);
    const arch = placeCenotaphCamera(0, -85, { x: 0, y: 24, z: -79 });
    expect(arch.y).toBeLessThan(NORTH_ARCH_SOFFIT);
    expect(arch.y).toBeGreaterThan(TERRACE_Y + 0.4);
    const vistaArch = fitBoom(0, -85, { x: 0, y: 24, z: -71 });
    expect(vistaArch.y).toBeLessThan(NORTH_ARCH_SOFFIT);
    expect(Math.abs(vistaArch.z + 85)).toBeGreaterThan(6);

    const walker = createWalker(new THREE.Scene());
    walker.restore({ x: 0, z: 106, heading: Math.PI, camYaw: 0, back: WALK_BACK, lookLift: WALK_LOOK });
    walker.setView("overhead");
    let eastArc = false;
    let northPorch = false;
    let westArc = false;
    let southReturn = false;
    const seen = (pose: { x: number; z: number }, y: number) => {
      expect(y).toBeCloseTo(TERRACE_Y, 2);
      expect(Math.hypot(pose.x, pose.z)).toBeGreaterThan(95);
      expect(Math.hypot(pose.x, pose.z)).toBeLessThanOrEqual(TERRACE_OUT + 0.2);
      if (pose.x > 90) eastArc = true;
      if (pose.z < -90) northPorch = true;
      if (pose.x < -90) westArc = true;
      if (northPorch && pose.z > 100 && Math.abs(pose.x) < 25) southReturn = true;
    };
    const stick = (x: number, z: number, turn: number) => {
      const r = Math.hypot(x, z) || 1;
      const err = r - 106;
      const tx = (z / r) * turn;
      const tz = (-x / r) * turn;
      let wx = tx - (x / r) * err * 0.2;
      let wz = tz - (z / r) * err * 0.2;
      const m = Math.hypot(wx, wz) || 1;
      wx /= m;
      wz /= m;
      return { x: wx, y: -wz, orbiting: false };
    };
    for (let i = 0; i < 900; i++) {
      const pose = walker.pose();
      walker.update(0.05, i * 0.05, stick(pose.x, pose.z, 1), true);
      const next = walker.pose();
      seen(next, walker.group.position.y);
    }
    expect(eastArc && northPorch && westArc && southReturn).toBe(true);

    eastArc = northPorch = westArc = southReturn = false;
    for (let i = 0; i < 900; i++) {
      const pose = walker.pose();
      walker.update(0.05, i * 0.05, stick(pose.x, pose.z, -1), true);
      const next = walker.pose();
      seen(next, walker.group.position.y);
    }
    expect(eastArc && northPorch && westArc && southReturn).toBe(true);

    const camera = new THREE.PerspectiveCamera();
    walker.restore({ x: 0, z: -106, heading: 0, camYaw: Math.PI, back: WALK_BACK, lookLift: WALK_LOOK });
    walker.setView("eyes");
    walker.setView("vista");
    walker.applyCamera(camera, 1, true);
    expect(camera.position.y).toBeGreaterThan(walker.group.position.y + 6);
    walker.setView("eyes");
    walker.applyCamera(camera, 1, true);
    expect(camera.position.y).toBeCloseTo(walker.group.position.y + EYE_HEIGHT, 2);
    expect(Math.hypot(camera.position.x, camera.position.z + 106)).toBeLessThan(0.2);

    setMonumentCap(null);
    const home = fallbackInsideMonument(0, -106);
    expect(home).not.toBeNull();
    expect(Math.hypot(home!.x, home!.z)).toBeLessThan(WALK_R);
    expect(home!.z).toBeLessThan(0);
  });
});
