import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ZERO_ANGLES, buildWormModel } from "@/instruments/higher-dimensional/cubic-worm-math";
import { EXHIBITS, isDestinationId, isExhibitId } from "./destinations";
import { ATLAS_RESUME_KEY, captureAtlasResume, takeAtlasResume } from "./resume";
import { buildSquareThroat } from "./square-throat-pavilion";
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
] as const;

describe("square throat", () => {
  it("registers the cubic worm without moving the older halls", () => {
    for (const id of PRIOR) {
      expect(EXHIBITS[id].placed).toBe(true);
      expect(PLACES[id]).toBeDefined();
    }
    expect(PLACES["hollow-genius"].x).toBeCloseTo(-36 * 6.6, 5);
    expect(PLACES["hollow-genius"].z).toBeCloseTo(4 * 6.6, 5);
    expect(PLACES["ambiguous-dancer"].x).toBeCloseTo(-50 * 6.6, 5);
    expect(PLACES["ambiguous-dancer"].z).toBeCloseTo(-8 * 6.6, 5);
    expect(PLACES["inside-out"].x).toBeCloseTo(-62 * 6.6, 5);
    expect(PLACES["inside-out"].z).toBeCloseTo(-20 * 6.6, 5);
    const throat = EXHIBITS["cubic-worm"];
    expect(throat.kind).toBe("exhibit");
    expect(throat.name).toBe("Cubic Worm");
    expect(throat.hall).toBe("The Square Throat");
    expect(throat.question).toBe("Is that a passage, or a projection?");
    expect(throat.href).toBe("/observatory/higher-dimensional/cubic-worm");
    expect(throat.released).toBe(true);
    expect(throat.placed).toBe(true);
    expect(isExhibitId("cubic-worm")).toBe(true);
    expect(isDestinationId("cubic-worm")).toBe(true);
    expect(Object.keys(PLACES).sort()).toEqual(Object.keys(EXHIBITS).sort());
  });

  it("stands due west of the house, on a path that leaves that court", () => {
    const place = PLACES["cubic-worm"];
    expect(place.x).toBeCloseTo(-74 * 6.6, 5);
    expect(place.z).toBeCloseTo(-20 * 6.6, 5);
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
    expect(house.z).toBeCloseTo(place.z, 5);
    expect(house.x).toBeGreaterThan(place.x);
  });

  it("blocks the walker from the doorway without trapping them", () => {
    const place = PLACES["cubic-worm"];
    const inside = projectOut(place.x, place.z + 1, 0, -1);
    expect(Math.hypot(inside.x - place.x, inside.z - place.z)).toBeGreaterThanOrEqual(place.block - 1e-4);
    const outside = projectOut(place.x, place.z + place.block + 4, 0, 0);
    expect(outside.x).toBeCloseTo(place.x, 4);
    expect(outside.z).toBeCloseTo(place.z + place.block + 4, 4);
    expect(Math.hypot(outside.x, outside.z)).toBeLessThan(GROUND_WALK);
  });

  it("builds one frozen projection on the existing renderer", () => {
    const baked = buildWormModel(ZERO_ANGLES, "w", 2, 3.2, false);
    expect(baked.artisticBridge).toBe(false);
    expect(baked.near).toBe("w-");
    expect(baked.far).toBe("w+");
    const rims = baked.cells.flatMap((cell) => cell.faces.filter((face) => face.role === "rim"));
    expect(rims).toHaveLength(4);

    const scene = readFileSync("src/interactive-atlas/scene.ts", "utf8");
    const pavilion = readFileSync("src/interactive-atlas/square-throat-pavilion.ts", "utf8");
    const atlas = readFileSync("src/interactive-atlas/InteractiveAtlas.tsx", "utf8");
    expect(scene.match(/new THREE\.WebGLRenderer/g)).toHaveLength(1);
    expect(scene).toContain("buildSquareThroat");
    expect(scene).not.toContain("CubicWormStage");
    expect(pavilion).not.toContain("WebGLRenderer");
    expect(pavilion).not.toContain("CubicWormStage");
    expect(pavilion).not.toContain(".glb");
    expect(pavilion).toContain('buildWormModel(ZERO_ANGLES, "w", 2, THROAT_DISTANCE, false)');
    expect(pavilion).toContain("reduced ? 0.22");
    expect(atlas).toContain('exhibit.id === "cubic-worm"');
    const built = buildSquareThroat();
    expect(built.group.name).toBe("cubic-worm-throat");
    expect(built.lights).toBeLessThanOrEqual(2);
    expect(built.meshes).toBeGreaterThan(8);
    expect(built.meshes).toBeLessThan(80);
    expect(built.triangles).toBeGreaterThan(40);
    expect(built.triangles).toBeLessThan(1200);
    expect(built.group.getObjectByName("throat-far")).toBeTruthy();
    expect(built.group.getObjectByName("throat-wall-x+")).toBeTruthy();
    expect(built.group.getObjectByName("throat-wall-y-")).toBeTruthy();
    expect(built.group.getObjectByName("throat-entrance-0")).toBeTruthy();
    built.dispose();
  });

  it("stores one walk pose at the doorway and will not replay it", () => {
    const now = 1_800_000_000_000;
    const p = PLACES["cubic-worm"];
    sessionStorage.removeItem(ATLAS_RESUME_KEY);
    captureAtlasResume({
      v: 1,
      t: now,
      mode: "walk",
      focus: [p.x, p.y, p.z],
      radius: 28,
      yaw: 0.2,
      pitch: 0.5,
      selected: "cubic-worm",
      walker: { x: p.x, z: p.z + p.block + 3, heading: Math.PI, camYaw: 0, back: 11, lookLift: 4 },
    });
    const first = takeAtlasResume(now + 1000);
    expect(first?.selected).toBe("cubic-worm");
    expect(first?.walker?.z).toBeCloseTo(p.z + p.block + 3, 4);
    expect(takeAtlasResume(now + 1000)).toBeNull();
  });
});
