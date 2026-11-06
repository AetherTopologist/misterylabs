import * as THREE from "three";
import { afterEach, describe, expect, it } from "vitest";
import { buildCenotaphLamps, cenotaphLampLayout, passageLampFits } from "./cenotaph-lamps";
import { setMonumentCap } from "./monument-cap";

afterEach(() => setMonumentCap(null));

describe("cenotaph lamps", () => {
  it("keeps fixtures on stone and lights out of the south flight", () => {
    setMonumentCap({
      x0: 0,
      z0: 0,
      step: 1,
      cols: 1,
      rows: 1,
      heights: new Float32Array([1]),
      cells: 1,
      yMin: 1,
      yMax: 1,
    });
    const layout = cenotaphLampLayout();
    const names = new Set(layout.map((lamp) => lamp.name));
    expect(names.has("south-hall")).toBe(true);
    expect(names.has("north-hall")).toBe(true);
    expect(names.has("south-arch")).toBe(true);
    expect(names.has("north-arch")).toBe(true);
    for (const lamp of layout) {
      expect(lamp.gain).toBeGreaterThan(0);
      expect(lamp.distance).toBeGreaterThan(4);
      if (lamp.fixture === "bollard") {
        const r = Math.hypot(lamp.fx, lamp.fz);
        expect(r).toBeGreaterThan(100);
        expect(r).toBeLessThan(112);
        expect(lamp.fz > 108.15 && Math.abs(lamp.fx) <= 17.2).toBe(false);
        expect(lamp.fy).toBeCloseTo(6.275, 3);
      }
      if (lamp.fixture === "grazer") {
        const r = Math.hypot(lamp.fx, lamp.fz);
        expect(r).toBeGreaterThan(95);
        expect(r).toBeLessThan(96);
        expect(Math.abs(lamp.fx) > 14 || Math.abs(lamp.fz) < 70).toBe(true);
      }
      if (lamp.fixture !== "grazer" && lamp.fixture !== "bollard") {
        expect(passageLampFits(lamp)).toBe(true);
      }
    }
  });

  it("builds one unshadowed rig", () => {
    const rig = buildCenotaphLamps();
    expect(rig.shadows).toBe(0);
    expect(rig.lights.length).toBe(rig.layout.length);
    expect(rig.lights.length).toBeLessThan(24);
    for (const light of rig.lights) expect(light.castShadow).toBe(false);
    rig.apply(2200, 0xffe6c4);
    const hall = rig.lights.find((light) => light.name === "south-hall");
    expect(hall?.intensity).toBeCloseTo(2200 * 0.4, 4);
    let emissive = 0;
    rig.group.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      expect(mesh.castShadow).toBe(false);
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat.emissiveIntensity > 1) emissive += 1;
    });
    expect(emissive).toBeGreaterThan(0);
  });
});
