import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { NETS, computeUnfoldPath } from "@/components/CubeNetExplorer";
import { foldBounds, foldCube } from "@/instruments/higher-dimensional/fold-cube";
import { EXHIBITS, isDestinationId, isExhibitId } from "./destinations";
import { HOUSE_HOLD, HOUSE_NET, buildHouseOfUnfolding } from "./house-of-unfolding";
import { ATLAS_RESUME_KEY, captureAtlasResume, takeAtlasResume } from "./resume";
import { GROUND_WALK, PATHS, PLACES, projectOut } from "./world";

const PRIOR = ["hydrogen", "triad", "optics", "bell", "xprimeray", "photon", "hollow-genius", "ambiguous-dancer"] as const;

describe("house of unfolding", () => {
  it("registers the cube laboratory without moving the older halls", () => {
    for (const id of PRIOR) {
      expect(EXHIBITS[id].placed).toBe(true);
      expect(PLACES[id]).toBeDefined();
    }
    expect(PLACES["hollow-genius"].x).toBeCloseTo(-36 * 6.6, 5);
    expect(PLACES["hollow-genius"].z).toBeCloseTo(4 * 6.6, 5);
    expect(PLACES["ambiguous-dancer"].x).toBeCloseTo(-50 * 6.6, 5);
    expect(PLACES["ambiguous-dancer"].z).toBeCloseTo(-8 * 6.6, 5);
    const house = EXHIBITS["inside-out"];
    expect(house.kind).toBe("exhibit");
    expect(house.name).toBe("Inside-Out Universe");
    expect(house.hall).toBe("House of Unfolding");
    expect(house.question).toBe("How does a flat net become a solid?");
    expect(house.href).toBe("/observatory/higher-dimensional/inside-out");
    expect(house.released).toBe(true);
    expect(house.placed).toBe(true);
    expect(isExhibitId("inside-out")).toBe(true);
    expect(isDestinationId("inside-out")).toBe(true);
    expect(Object.keys(PLACES).sort()).toEqual(Object.keys(EXHIBITS).sort());
  });

  it("stands south-west of Turning Shadows, on a path that leaves that court", () => {
    const place = PLACES["inside-out"];
    expect(place.x).toBeCloseTo(-62 * 6.6, 5);
    expect(place.z).toBeCloseTo(-20 * 6.6, 5);
    expect(place.block).toBe(5.2);
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
    const dancer = PLACES["ambiguous-dancer"];
    expect(spur!.pts.some(([x, , z]) => Math.hypot(x - dancer.x, z - dancer.z) < 0.01)).toBe(true);
  });

  it("blocks the walker from the plinth without trapping them", () => {
    const place = PLACES["inside-out"];
    const inside = projectOut(place.x, place.z + 1, 0, -1);
    expect(Math.hypot(inside.x - place.x, inside.z - place.z)).toBeGreaterThanOrEqual(place.block - 1e-4);
    const outside = projectOut(place.x, place.z + place.block + 4, 0, 0);
    expect(outside.x).toBeCloseTo(place.x, 4);
    expect(outside.z).toBeCloseTo(place.z + place.block + 4, 4);
    expect(Math.hypot(outside.x, outside.z)).toBeLessThan(GROUND_WALK);
  });

  it("folds the classic cross on the existing renderer", () => {
    expect(NETS[HOUSE_NET]).toEqual([
      [1, 0],
      [1, 3],
      [1, 1],
      [1, 2],
      [0, 1],
      [2, 1],
    ]);
    expect(computeUnfoldPath(HOUSE_NET, "cw").edges).toHaveLength(5);
    const closed = foldBounds(foldCube(HOUSE_NET, 1, "cw")).size;
    expect(closed[0]).toBeCloseTo(2, 2);
    expect(closed[1]).toBeCloseTo(2, 2);
    expect(closed[2]).toBeCloseTo(2, 2);
    const mid = foldBounds(foldCube(HOUSE_NET, HOUSE_HOLD, "cw")).size;
    expect(mid[2]).toBeGreaterThan(0.2);
    const unfinished =
      Math.abs(mid[0] - closed[0]) + Math.abs(mid[1] - closed[1]) + Math.abs(mid[2] - closed[2]);
    expect(unfinished).toBeGreaterThan(0.4);

    const scene = readFileSync("src/interactive-atlas/scene.ts", "utf8");
    const house = readFileSync("src/interactive-atlas/house-of-unfolding.ts", "utf8");
    const atlas = readFileSync("src/interactive-atlas/InteractiveAtlas.tsx", "utf8");
    expect(scene.match(/new THREE\.WebGLRenderer/g)).toHaveLength(1);
    expect(scene).toContain("buildHouseOfUnfolding");
    expect(scene).not.toContain("InsideOutStage");
    expect(house).not.toContain("WebGLRenderer");
    expect(house).not.toContain("InsideOutStage");
    expect(house).not.toContain(".glb");
    expect(house).toContain("foldCube(HOUSE_NET");
    expect(house).toContain("reduced ? HOUSE_HOLD");
    expect(atlas).toContain('exhibit.id === "inside-out"');
    const built = buildHouseOfUnfolding();
    expect(built.group.name).toBe("inside-out-house");
    expect(built.hinges).toBe(5);
    expect(built.lights).toBeLessThanOrEqual(2);
    expect(built.meshes).toBeGreaterThan(12);
    expect(built.meshes).toBeLessThan(80);
    expect(built.triangles).toBeGreaterThan(40);
    expect(built.triangles).toBeLessThan(1200);
    for (let i = 0; i < 6; i++) {
      expect(built.group.getObjectByName(`unfold-net-${i}`)).toBeTruthy();
      expect(built.group.getObjectByName(`unfold-fold-${i}`)).toBeTruthy();
    }
    expect(built.group.getObjectByName("unfold-hinge-net-4")).toBeTruthy();
    expect(built.group.getObjectByName("unfold-hinge-fold-4")).toBeTruthy();
    expect(built.group.getObjectByName("unfold-hinge-fold-5")).toBeFalsy();
    built.dispose();
  });

  it("stores one walk pose at the house and will not replay it", () => {
    const now = 1_800_000_000_000;
    const p = PLACES["inside-out"];
    sessionStorage.removeItem(ATLAS_RESUME_KEY);
    captureAtlasResume({
      v: 1,
      t: now,
      mode: "walk",
      focus: [p.x, p.y, p.z],
      radius: 28,
      yaw: 0.2,
      pitch: 0.5,
      selected: "inside-out",
      walker: { x: p.x, z: p.z + p.block + 3, heading: Math.PI, camYaw: 0, back: 11, lookLift: 4 },
    });
    const first = takeAtlasResume(now + 1000);
    expect(first?.selected).toBe("inside-out");
    expect(first?.walker?.z).toBeCloseTo(p.z + p.block + 3, 4);
    expect(takeAtlasResume(now + 1000)).toBeNull();
  });
});
