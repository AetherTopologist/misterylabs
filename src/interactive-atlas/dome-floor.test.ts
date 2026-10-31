import * as THREE from "three";
import { describe, expect, it } from "vitest";
import {
  APRON_HALF,
  DOME_CY,
  DOME_FLOOR_Y,
  DOME_R,
  NECK_HALF,
  PIER_BOTTOM_Y,
  PIER_R,
  SLAB_R,
  WALK_R,
  buildObservationFloor,
  onObservationFloor,
  shellLowerY,
} from "./dome-floor";

describe("observation floor", () => {
  it("sits inside the chord, above the bowl, and only where the route says", () => {
    const chord = Math.sqrt(DOME_R * DOME_R - (DOME_CY - DOME_FLOOR_Y) ** 2);
    expect(chord).toBeGreaterThan(20.2);
    expect(chord).toBeLessThan(20.6);
    expect(SLAB_R).toBeLessThan(chord - 4);
    expect(WALK_R).toBeLessThan(SLAB_R - 1);
    expect(shellLowerY(PIER_R)).toBeLessThan(PIER_BOTTOM_Y - 0.25);
    expect(onObservationFloor(0, 0)).toBe(true);
    expect(onObservationFloor(0, 16)).toBe(true);
    expect(onObservationFloor(14, 0)).toBe(false);
    expect(onObservationFloor(0, -WALK_R)).toBe(true);
    expect(onObservationFloor(0, -(WALK_R + 0.2))).toBe(false);
    expect(onObservationFloor(6.2, 18)).toBe(true);
    expect(onObservationFloor(APRON_HALF + 0.4, 18)).toBe(false);
    expect(onObservationFloor(6.2, 21.4)).toBe(false);
  });

  it("is a small opaque addition, with the neck clear of the rail and the curb", () => {
    const built = buildObservationFloor();
    expect(built.group.name).toBe("mistery-observation-floor");
    expect(built.group.userData.addition).toBe("mistery-labs");
    expect(built.lights).toBe(2);
    expect(built.triangles).toBeGreaterThan(200);
    expect(built.triangles).toBeLessThan(1600);

    let transparent = 0;
    const intruders: string[] = [];
    built.group.updateMatrixWorld(true);
    built.group.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        if (mat.transparent || mat.opacity < 1) transparent += 1;
      }
      if (mesh.name !== "observation-apron" && mesh.name !== "observation-keel") {
        const pos = mesh.geometry.getAttribute("position");
        for (let i = 0; i < pos.count; i++) {
          const p = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(mesh.matrixWorld);
          const inNeck =
            Math.abs(p.x) < NECK_HALF - 0.35 &&
            p.z > 14.6 &&
            p.z < 20.2 &&
            (p.y > DOME_FLOOR_Y + 0.05 || mesh.name === "observation-fascia");
          if (inNeck) intruders.push(`${mesh.name}@${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)}`);
        }
      }
    });
    expect(transparent).toBe(0);
    expect(intruders).toEqual([]);
  });

  it("keeps the stair shader on the apron instead of a bare clone", () => {
    const masonry = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const compile = () => {};
    masonry.onBeforeCompile = compile;
    masonry.customProgramCacheKey = () => "cenotaph-stone-v6-4";
    const built = buildObservationFloor(masonry);
    let apron: THREE.Mesh | undefined;
    let slab: THREE.Mesh | undefined;
    built.group.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.name === "observation-apron") apron = mesh;
      if (mesh.name === "observation-slab") slab = mesh;
    });
    expect(slab?.material).toBe(masonry);
    const mat = apron?.material as THREE.MeshStandardMaterial;
    expect(mat).not.toBe(masonry);
    expect(mat.onBeforeCompile).toBe(compile);
    expect(mat.customProgramCacheKey()).toBe("cenotaph-stone-v6-4");
    expect(mat.polygonOffsetFactor).toBe(-2);
  });
});
