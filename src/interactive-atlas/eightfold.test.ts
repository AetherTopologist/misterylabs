import { readFileSync } from "node:fs";
import * as THREE from "three";
import { describe, expect, it } from "vitest";
import {
  cubesOverlapXYZ,
  foldHypercross,
  pointsCoincide,
  uniqueCount,
} from "@/instruments/higher-dimensional/hypercross-math";
import { EXHIBITS, isDestinationId, isExhibitId } from "./destinations";
import { ATLAS_RESUME_KEY, captureAtlasResume, takeAtlasResume } from "./resume";
import { CROSS_INSET, CROSS_SCALE, buildEightfoldCross, placeCrossPoint } from "./eightfold-cross";
import { GROUND_WALK, PATHS, PLACES, projectOut } from "./world";

const PRIOR = [
  "hydrogen",
  "triad",
  "optics",
  "bell",
  "xprimeray",
  "photon",
  "hollow-genius",
  "ambiguous-dancer",
  "inside-out",
  "cubic-worm",
] as const;

function centerOf(points: Array<[number, number, number]>) {
  const c = [0, 0, 0];
  for (const p of points) for (let k = 0; k < 3; k++) c[k] += p[k];
  return c.map((value) => value / points.length);
}

describe("eightfold cross", () => {
  it("registers hypercross without moving the older halls", () => {
    for (const id of PRIOR) {
      expect(EXHIBITS[id].placed).toBe(true);
      expect(PLACES[id]).toBeDefined();
    }
    expect(PLACES["inside-out"].x).toBeCloseTo(-62 * 6.6, 5);
    expect(PLACES["inside-out"].z).toBeCloseTo(-20 * 6.6, 5);
    expect(PLACES["cubic-worm"].x).toBeCloseTo(-74 * 6.6, 5);
    expect(PLACES["cubic-worm"].z).toBeCloseTo(-20 * 6.6, 5);
    const cross = EXHIBITS.hypercross;
    expect(cross.kind).toBe("exhibit");
    expect(cross.name).toBe("Hypercross");
    expect(cross.hall).toBe("The Eightfold Cross");
    expect(cross.question).toBe("What does a cube become when space gains another direction?");
    expect(cross.href).toBe("/observatory/higher-dimensional/hypercross");
    expect(cross.released).toBe(true);
    expect(cross.placed).toBe(true);
    expect(isExhibitId("hypercross")).toBe(true);
    expect(isDestinationId("hypercross")).toBe(true);
    expect(Object.keys(PLACES).sort()).toEqual(Object.keys(EXHIBITS).sort());
  });

  it("stands due south of the house, on a path that leaves that court", () => {
    const place = PLACES.hypercross;
    expect(place.x).toBeCloseTo(-62 * 6.6, 5);
    expect(place.z).toBeCloseTo(-34 * 6.6, 5);
    expect(place.block).toBe(4.8);
    expect(place.reach).toBe(16);
    expect(Math.hypot(place.x, place.z)).toBeGreaterThan(130 + place.block);
    expect(Math.hypot(place.x, place.z)).toBeLessThan(GROUND_WALK);
    for (const id of PRIOR) {
      const other = PLACES[id];
      const gap = Math.hypot(place.x - other.x, place.z - other.z);
      expect(gap).toBeGreaterThan(place.block + other.block + 20);
      expect(gap).toBeGreaterThan(place.reach + other.reach);
    }
    const spur = PATHS.find((path) => path.pts.some(([x, , z]) => Math.hypot(x - place.x, z - place.z) < 0.01));
    expect(spur).toBeTruthy();
    const house = PLACES["inside-out"];
    expect(spur!.pts.some(([x, , z]) => Math.hypot(x - house.x, z - house.z) < 0.01)).toBe(true);
    expect(house.x).toBeCloseTo(place.x, 5);
    expect(house.z).toBeGreaterThan(place.z);
  });

  it("blocks the walker from the plinth without trapping them", () => {
    const place = PLACES.hypercross;
    const inside = projectOut(place.x, place.z + 1, 0, -1);
    expect(Math.hypot(inside.x - place.x, inside.z - place.z)).toBeGreaterThanOrEqual(place.block - 1e-4);
    const outside = projectOut(place.x, place.z + place.block + 4, 0, 0);
    expect(outside.x).toBeCloseTo(place.x, 4);
    expect(outside.z).toBeCloseTo(place.z + place.block + 4, 4);
    expect(Math.hypot(outside.x, outside.z)).toBeLessThan(GROUND_WALK);
  });

  it("builds the unfolded net, rigidly, on the existing renderer", () => {
    const net = foldHypercross(0);
    expect(net.cells).toHaveLength(8);
    expect(net.hinges).toHaveLength(7);
    expect(uniqueCount(net.cells.flatMap((cell) => cell.vertices))).toBe(36);
    for (const point of net.cells.flatMap((cell) => cell.vertices)) {
      expect(point[3]).toBeCloseTo(-1, 4);
    }
    for (let i = 0; i < net.cells.length; i++) {
      for (let j = i + 1; j < net.cells.length; j++) {
        expect(cubesOverlapXYZ(net.cells[i].vertices, net.cells[j].vertices)).toBe(false);
      }
    }
    for (const hinge of net.hinges) {
      expect(hinge.parentPoints).toHaveLength(4);
      expect(pointsCoincide(hinge.parentPoints, hinge.childPoints)).toBe(true);
    }

    const scene = readFileSync("src/interactive-atlas/scene.ts", "utf8");
    const pavilion = readFileSync("src/interactive-atlas/eightfold-cross.ts", "utf8");
    const atlas = readFileSync("src/interactive-atlas/InteractiveAtlas.tsx", "utf8");
    const rides = readFileSync("src/instruments/higher-dimensional/rides.ts", "utf8");
    const atlasPage = readFileSync("src/pages/Atlas.tsx", "utf8");
    expect(scene.match(/new THREE\.WebGLRenderer/g)).toHaveLength(1);
    expect(scene).toContain("buildEightfoldCross");
    expect(scene).not.toContain("HypercrossStage");
    expect(pavilion).not.toContain("WebGLRenderer");
    expect(pavilion).not.toContain("HypercrossStage");
    expect(pavilion).not.toContain(".glb");
    expect(pavilion).toContain("foldHypercross(0)");
    const calls = pavilion.match(/foldHypercross\([^)]*\)/g) ?? [];
    expect(calls.length).toBeGreaterThan(0);
    for (const call of calls) expect(call).toBe("foldHypercross(0)");
    expect(pavilion).toContain("scenery");
    expect(pavilion).toContain("reduced ? 0.34");
    expect(CROSS_INSET).toBeLessThan(1);
    expect(atlas).toContain('exhibit.id === "hypercross"');
    expect(rides).not.toContain("hypercross");
    expect(atlasPage).not.toContain("hypercross");

    const built = buildEightfoldCross();
    expect(built.group.name).toBe("hypercross-eightfold");
    expect(built.cells).toBe(8);
    expect(built.hinges).toBe(7);
    expect(built.edges).toBe(68);
    expect(built.lights).toBeLessThanOrEqual(2);
    expect(built.meshes).toBeGreaterThan(12);
    expect(built.meshes).toBeLessThan(40);
    expect(built.triangles).toBeGreaterThan(200);
    expect(built.triangles).toBeLessThan(1400);
    for (const cell of net.cells) {
      const mesh = built.group.getObjectByName(`cross-cell-${cell.id}`) as THREE.Mesh;
      expect(mesh).toBeTruthy();
      const at = centerOf(cell.vertices.map((point) => placeCrossPoint(point)));
      expect(mesh.position.x).toBeCloseTo(at[0], 4);
      expect(mesh.position.y).toBeCloseTo(at[1], 4);
      expect(mesh.position.z).toBeCloseTo(at[2], 4);
      const size = new THREE.Vector3();
      new THREE.Box3().setFromObject(mesh).getSize(size);
      expect(size.x).toBeCloseTo(2 * CROSS_SCALE * CROSS_INSET, 3);
      expect(size.y).toBeCloseTo(size.x, 3);
      expect(size.z).toBeCloseTo(size.x, 3);
    }
    const junction = built.group.getObjectByName("cross-cell-z-") as THREE.Mesh;
    const north = built.group.getObjectByName("cross-cell-w-") as THREE.Mesh;
    expect(north.position.y - junction.position.y).toBeCloseTo(2 * CROSS_SCALE, 3);
    expect(north.position.x).toBeCloseTo(junction.position.x, 3);
    const toward = built.group.getObjectByName("cross-cell-y-") as THREE.Mesh;
    expect(toward.position.z - junction.position.z).toBeCloseTo(2 * CROSS_SCALE, 3);
    for (const hinge of net.hinges) {
      const mark = built.group.getObjectByName(`cross-hinge-${hinge.parent}-${hinge.child}`) as THREE.Mesh;
      expect(mark).toBeTruthy();
      mark.geometry.computeBoundingBox();
      const face = mark.geometry.boundingBox!.getCenter(new THREE.Vector3());
      const expected = centerOf(hinge.parentPoints.map((point) => placeCrossPoint(point)));
      expect(face.x).toBeCloseTo(expected[0], 3);
      expect(face.y).toBeCloseTo(expected[1], 3);
      expect(face.z).toBeCloseTo(expected[2], 3);
    }
    built.dispose();
  });

  it("stores one walk pose at the cross and will not replay it", () => {
    const now = 1_800_000_000_000;
    const p = PLACES.hypercross;
    sessionStorage.removeItem(ATLAS_RESUME_KEY);
    captureAtlasResume({
      v: 1,
      t: now,
      mode: "walk",
      focus: [p.x, p.y, p.z],
      radius: 28,
      yaw: 0.2,
      pitch: 0.5,
      selected: "hypercross",
      walker: { x: p.x, z: p.z + p.block + 3, heading: Math.PI, camYaw: 0, back: 11, lookLift: 4 },
    });
    const first = takeAtlasResume(now + 1000);
    expect(first?.selected).toBe("hypercross");
    expect(first?.walker?.z).toBeCloseTo(p.z + p.block + 3, 4);
    expect(takeAtlasResume(now + 1000)).toBeNull();
  });
});
