import * as THREE from "three";

/**
 * First walkable floor inside the seated Cenotaph dome.
 *
 * This is new MisterY Labs stone. It is not part of cenotaph.glb.
 *
 * Survey after the same seating as cenotaph.ts (Unir sphere fit, SketchUp
 * bounds on y = 0): shell center (0, 60.928, 0), radius 52.148, crown
 * y = 113.08, bowl bottom y = 8.78. The inner copy of the shell faces
 * inward, so the historic dome is already visible from inside.
 *
 * The measured ramp is masonry up to z = 21 (y = 12.937, half-width 6.75)
 * and is gone by z = 20.6. That end is the south opening of the shell,
 * not a wall. Past it the bowl is empty: no floor, no piers, a void down
 * to the shell. The star cavity in scene.ts is a fly-mode skin just inside
 * the same shell and is hidden while walking, so this floor shows the stone.
 *
 * The slab sits on the arrival level, inside the chord where the shell
 * meets y = 12.937 (horizontal radius 20.4). A pier under the center
 * stops above the bowl. A narrower neck crosses the opening to the ramp.
 */

export const DOME_CY = 60.928;
export const DOME_R = 52.148;
/** Last historic tread. The neck overlaps it by a few centimeters. */
export const STONE_END_Z = 20.7;
export const DOME_FLOOR_Y = 12.937;
export const SLAB_R = 15.2;
export const WALK_R = 13.35;
export const NECK_HALF = 3.15;
export const NECK_Z0 = 12.4;
export const NECK_Z1 = 20.9;
export const PIER_R = 2.2;
export const PIER_BOTTOM_Y = 9.2;

const _neck = { z0: NECK_Z0, z1: NECK_Z1, half: NECK_HALF };

export function shellLowerY(radial: number) {
  const h2 = DOME_R * DOME_R - radial * radial;
  if (h2 <= 0) return DOME_CY;
  return DOME_CY - Math.sqrt(h2);
}

export function shellUpperY(radial: number) {
  const h2 = DOME_R * DOME_R - radial * radial;
  if (h2 <= 0) return DOME_CY;
  return DOME_CY + Math.sqrt(h2);
}

/** Walkable new stone: the disc, plus the neck back to the historic ramp. */
export function onObservationFloor(x: number, z: number, inset = 0) {
  const limit = WALK_R - inset;
  if (z <= STONE_END_Z + 0.08 && Math.hypot(x, z) <= limit + 0.02) return true;
  if (z >= _neck.z0 && z <= _neck.z1 && Math.abs(x) <= _neck.half - inset + 0.02) return true;
  return false;
}

export type ObservationFloor = {
  group: THREE.Group;
  triangles: number;
  lights: number;
};

/**
 * Slab, curb, neck, pier, and two unshadowed spots.
 * The group is in world space. Nothing here is parented under the GLB.
 */
export function buildObservationFloor(): ObservationFloor {
  const group = new THREE.Group();
  group.name = "mistery-observation-floor";
  group.userData.addition = "mistery-labs";

  const stone = new THREE.MeshStandardMaterial({
    color: 0x7e776c,
    roughness: 0.88,
    metalness: 0.04,
  });
  // Only the neck overlaps the last historic tread. Offset that one, not the slab.
  const joint = new THREE.MeshStandardMaterial({
    color: 0x7e776c,
    roughness: 0.88,
    metalness: 0.04,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const bronze = new THREE.MeshStandardMaterial({
    color: 0x8d6436,
    roughness: 0.42,
    metalness: 0.62,
  });
  const fasciaMat = new THREE.MeshStandardMaterial({
    color: 0x6f685e,
    roughness: 0.92,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });

  const slab = new THREE.Mesh(new THREE.CircleGeometry(SLAB_R, 48), stone);
  slab.rotation.x = -Math.PI / 2;
  slab.position.y = DOME_FLOOR_Y;
  slab.name = "observation-slab";

  // Ring theta 0 is +X. After Rx(-π/2), theta −π/2 is world +Z, the neck.
  const curbGap = 0.78;
  const curb = new THREE.Mesh(
    new THREE.RingGeometry(WALK_R + 0.08, SLAB_R, 48, 1, -Math.PI / 2 + curbGap / 2, Math.PI * 2 - curbGap),
    stone,
  );
  curb.rotation.x = -Math.PI / 2;
  curb.position.y = DOME_FLOOR_Y + 0.16;
  curb.name = "observation-curb";

  // Cylinder theta 0 is +Z. That sector stays open so the neck is not walled.
  const fasciaGap = 0.7;
  const fasciaH = 1.28;
  const fascia = new THREE.Mesh(
    new THREE.CylinderGeometry(SLAB_R, SLAB_R - 0.22, fasciaH, 48, 1, true, fasciaGap / 2, Math.PI * 2 - fasciaGap),
    fasciaMat,
  );
  fascia.position.y = DOME_FLOOR_Y - fasciaH / 2 + 0.02;
  fascia.name = "observation-fascia";

  const inlay = new THREE.Mesh(new THREE.RingGeometry(2.35, 2.68, 32), bronze);
  inlay.rotation.x = -Math.PI / 2;
  inlay.position.y = DOME_FLOOR_Y + 0.012;
  inlay.name = "observation-inlay";

  // Lands on the historic ramp. Survey: a neck of ±3.15 at the opening misses the shell.
  const neckZ0 = 14.35;
  const neckZ1 = 20.65;
  const neckLen = neckZ1 - neckZ0;
  const neck = new THREE.Mesh(new THREE.BoxGeometry(NECK_HALF * 2, 0.2, neckLen), joint);
  neck.position.set(0, DOME_FLOOR_Y - 0.1, neckZ0 + neckLen / 2);
  neck.name = "observation-neck";

  // Keel under the span, bottom held above the bowl. The pier carries the disc.
  const keelZ0 = 15.2;
  const keelZ1 = 17.15;
  const keelBottom = 12.02;
  const keelTop = DOME_FLOOR_Y - 0.18;
  const keelH = keelTop - keelBottom;
  const keel = new THREE.Mesh(new THREE.BoxGeometry(1.28, keelH, keelZ1 - keelZ0), stone);
  keel.position.set(0, keelBottom + keelH / 2, (keelZ0 + keelZ1) / 2);
  keel.name = "observation-keel";

  const pierTop = DOME_FLOOR_Y - 0.02;
  const pierH = pierTop - PIER_BOTTOM_Y;
  const pier = new THREE.Mesh(new THREE.CylinderGeometry(PIER_R * 0.92, PIER_R, pierH, 16), stone);
  pier.position.y = PIER_BOTTOM_Y + pierH / 2;
  pier.name = "observation-pier";

  const band = new THREE.Mesh(new THREE.TorusGeometry(PIER_R * 0.96, 0.055, 6, 24), bronze);
  band.rotation.x = Math.PI / 2;
  band.position.y = DOME_FLOOR_Y - 0.42;
  band.name = "observation-pier-band";

  // Torus arc starts at +X and the gap is the missing tail. Lay it flat, then yaw the gap to +Z.
  const railGap = 0.82;
  const rail = new THREE.Mesh(new THREE.TorusGeometry(WALK_R + 0.1, 0.04, 5, 56, Math.PI * 2 - railGap), bronze);
  rail.rotation.x = Math.PI / 2;
  rail.name = "observation-rail";
  const railPivot = new THREE.Group();
  railPivot.name = "observation-rail-pivot";
  railPivot.rotation.y = -Math.PI / 2 + railGap / 2;
  railPivot.position.y = DOME_FLOOR_Y + 0.72;
  railPivot.add(rail);

  group.add(slab, curb, fascia, inlay, neck, keel, pier, band, railPivot);

  const pool = new THREE.SpotLight(0xffe6c4, 480, 38, 1.02, 0.62, 2);
  pool.position.set(0, 22.4, 0.6);
  pool.target.position.set(0, DOME_FLOOR_Y, 0);
  pool.castShadow = false;
  pool.name = "observation-pool";

  // One upward wash. Physical decay, so the crown stays dim and the floor is outside the cone.
  const vault = new THREE.SpotLight(0xfff1d6, 6400, 140, 0.58, 0.92, 2);
  vault.position.set(0, 19.4, -0.4);
  vault.target.position.set(0, 108, 0);
  vault.castShadow = false;
  vault.name = "observation-vault";

  group.add(pool, pool.target, vault, vault.target);

  let triangles = 0;
  group.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const geo = mesh.geometry;
    triangles += geo.index ? geo.index.count / 3 : geo.getAttribute("position").count / 3;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.userData.addition = "mistery-labs";
  });

  return { group, triangles, lights: 2 };
}
