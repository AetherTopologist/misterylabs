import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EXHIBITS, isDestinationId, isExhibitId } from "./destinations";
import { ATLAS_RESUME_KEY, captureAtlasResume, takeAtlasResume } from "./resume";
import { GROUND_WALK, PATHS, PLACES, projectOut } from "./world";
import { buildPavilionOfTurningShadows } from "./pavilion-of-turning-shadows";

const PRIOR = ["hydrogen", "triad", "optics", "bell", "xprimeray", "photon", "hollow-genius"] as const;

describe("pavilion of turning shadows", () => {
  it("registers one released exhibit without moving the older halls", () => {
    for (const id of PRIOR) {
      expect(EXHIBITS[id].placed).toBe(true);
      expect(PLACES[id]).toBeDefined();
    }
    expect(PLACES["hollow-genius"].x).toBeCloseTo(-36 * 6.6, 5);
    expect(PLACES["hollow-genius"].z).toBeCloseTo(4 * 6.6, 5);
    const hall = EXHIBITS["ambiguous-dancer"];
    expect(hall.kind).toBe("exhibit");
    expect(hall.name).toBe("Ambiguous Dancer");
    expect(hall.hall).toBe("Pavilion of Turning Shadows");
    expect(hall.question).toBe("Did she change direction, or did you?");
    expect(hall.href).toBe("/observatory/higher-dimensional/ambiguous-dancer");
    expect(hall.released).toBe(true);
    expect(hall.placed).toBe(true);
    expect(isExhibitId("ambiguous-dancer")).toBe(true);
    expect(isDestinationId("ambiguous-dancer")).toBe(true);
    expect(isDestinationId("dancer")).toBe(false);
    expect(Object.keys(PLACES).sort()).toEqual(Object.keys(EXHIBITS).sort());
  });

  it("stands south-west of the hall, on a path, clear of every older place", () => {
    const place = PLACES["ambiguous-dancer"];
    expect(place.x).toBeCloseTo(-50 * 6.6, 5);
    expect(place.z).toBeCloseTo(-8 * 6.6, 5);
    expect(place.block).toBe(4.6);
    expect(place.reach).toBe(16);
    expect(Math.hypot(place.x, place.z)).toBeGreaterThan(130 + place.block);
    for (const id of PRIOR) {
      const other = PLACES[id];
      const gap = Math.hypot(place.x - other.x, place.z - other.z);
      expect(gap).toBeGreaterThan(place.block + other.block + 20);
    }
    const hall = PLACES["hollow-genius"];
    expect(Math.hypot(place.x - hall.x, place.z - hall.z)).toBeGreaterThan(place.reach + hall.reach);
    const arrived = PATHS.some((path) =>
      path.pts.some(([x, , z]) => Math.hypot(x - place.x, z - place.z) < 0.01),
    );
    expect(arrived).toBe(true);
    const joined = PATHS.some((path) =>
      path.pts.some(([x, , z]) => Math.hypot(x - -34 * 6.6, z - 16 * 6.6) < 0.01),
    );
    expect(joined).toBe(true);
  });

  it("blocks the walker from the pedestal without trapping them", () => {
    const place = PLACES["ambiguous-dancer"];
    const inside = projectOut(place.x, place.z + 1, 0, -1);
    expect(Math.hypot(inside.x - place.x, inside.z - place.z)).toBeGreaterThanOrEqual(place.block - 1e-4);
    const outside = projectOut(place.x, place.z + place.block + 4, 0, 0);
    expect(outside.x).toBeCloseTo(place.x, 4);
    expect(outside.z).toBeCloseTo(place.z + place.block + 4, 4);
    expect(Math.hypot(outside.x, outside.z)).toBeLessThan(GROUND_WALK);
  });

  it("is a procedural silhouette on the existing renderer", () => {
    const scene = readFileSync("src/interactive-atlas/scene.ts", "utf8");
    const pavilion = readFileSync("src/interactive-atlas/pavilion-of-turning-shadows.ts", "utf8");
    const atlas = readFileSync("src/interactive-atlas/InteractiveAtlas.tsx", "utf8");
    expect(scene.match(/new THREE\.WebGLRenderer/g)).toHaveLength(1);
    expect(scene).not.toContain("SpinningDancer");
    expect(scene).toContain("buildPavilionOfTurningShadows");
    expect(pavilion).not.toContain("WebGLRenderer");
    expect(pavilion).not.toContain("SpinningDancer");
    expect(pavilion).not.toContain("dancer-motion");
    expect(pavilion).not.toContain(".glb");
    expect(pavilion).toContain("reduced ? 0.9");
    expect(atlas).toContain('exhibit.id === "ambiguous-dancer"');
    expect(atlas).toContain("?from=interactive-atlas");
    const built = buildPavilionOfTurningShadows();
    expect(built.group.name).toBe("ambiguous-dancer-pavilion");
    expect(built.triangles).toBeGreaterThan(40);
    expect(built.triangles).toBeLessThan(1500);
    built.dispose();
  });

  it("stores one walk pose at the pavilion and will not replay it", () => {
    const now = 1_800_000_000_000;
    const p = PLACES["ambiguous-dancer"];
    sessionStorage.removeItem(ATLAS_RESUME_KEY);
    captureAtlasResume({
      v: 1,
      t: now,
      mode: "walk",
      focus: [p.x, p.y, p.z],
      radius: 28,
      yaw: 0.2,
      pitch: 0.5,
      selected: "ambiguous-dancer",
      walker: { x: p.x, z: p.z + p.block + 3, heading: Math.PI, camYaw: 0, back: 11, lookLift: 4 },
    });
    const first = takeAtlasResume(now + 1000);
    expect(first?.selected).toBe("ambiguous-dancer");
    expect(first?.walker?.z).toBeCloseTo(p.z + p.block + 3, 4);
    expect(takeAtlasResume(now + 1000)).toBeNull();
  });
});
