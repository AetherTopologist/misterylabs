import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EXHIBITS, isDestinationId, isExhibitId } from "./destinations";
import { ATLAS_RESUME_KEY, captureAtlasResume, takeAtlasResume, validateAtlasResume } from "./resume";
import { GROUND_WALK, PATHS, PLACES, projectOut } from "./world";

const PRIOR = ["hydrogen", "triad", "optics", "bell", "xprimeray", "photon"] as const;

describe("hollow genius fairground registration", () => {
  it("keeps every previous exhibit and adds one released hall", () => {
    for (const id of PRIOR) {
      expect(EXHIBITS[id].placed).toBe(true);
      expect(PLACES[id]).toBeDefined();
    }
    const hall = EXHIBITS["hollow-genius"];
    expect(hall.kind).toBe("exhibit");
    expect(hall.name).toBe("Hollow Genius");
    expect(hall.question).toBe("Why does a hollow face look outward?");
    expect(hall.href).toBe("/observatory/higher-dimensional/hollow-genius");
    expect(hall.released).toBe(true);
    expect(hall.placed).toBe(true);
    expect(isExhibitId("hollow-genius")).toBe(true);
    expect(isDestinationId("hollow-genius")).toBe(true);
    expect(Object.keys(PLACES).sort()).toEqual(Object.keys(EXHIBITS).sort());
  });

  it("stands on the western spur, clear of the cenotaph and the other halls", () => {
    const place = PLACES["hollow-genius"];
    expect(place.x).toBeCloseTo(-36 * 6.6, 5);
    expect(place.z).toBeCloseTo(4 * 6.6, 5);
    expect(Math.hypot(place.x, place.z)).toBeGreaterThan(130 + place.block);
    for (const id of PRIOR) {
      const other = PLACES[id];
      const gap = Math.hypot(place.x - other.x, place.z - other.z);
      expect(gap).toBeGreaterThan(place.block + other.block + 20);
    }
    const arrived = PATHS.some((path) =>
      path.pts.some(([x, , z]) => Math.hypot(x - place.x, z - place.z) < 0.01),
    );
    expect(arrived).toBe(true);
  });

  it("blocks the walker from the plinth without trapping them in it", () => {
    const place = PLACES["hollow-genius"];
    const inside = projectOut(place.x, place.z + 1, 0, -1);
    expect(Math.hypot(inside.x - place.x, inside.z - place.z)).toBeGreaterThanOrEqual(place.block - 1e-4);
    const outside = projectOut(place.x, place.z + place.block + 4, 0, 0);
    expect(outside.x).toBeCloseTo(place.x, 4);
    expect(outside.z).toBeCloseTo(place.z + place.block + 4, 4);
    expect(Math.hypot(outside.x, outside.z)).toBeLessThan(GROUND_WALK);
  });

  it("uses one decimated shell and does not mount a second renderer", () => {
    const scene = readFileSync("src/interactive-atlas/scene.ts", "utf8");
    const hall = readFileSync("src/interactive-atlas/hall-of-faces.ts", "utf8");
    const atlas = readFileSync("src/interactive-atlas/InteractiveAtlas.tsx", "utf8");
    expect(scene.match(/new THREE\.WebGLRenderer/g)).toHaveLength(1);
    expect(scene).not.toContain("HollowGenius");
    expect(scene).not.toContain("@react-three/fiber");
    expect(scene).not.toContain("tesla");
    expect(hall).not.toContain("WebGLRenderer");
    expect(hall).not.toContain("tesla");
    expect(hall).toContain("einstein-hall.glb");
    expect(atlas).toContain('exhibit.id === "hollow-genius"');
    expect(atlas).toContain("?from=interactive-atlas");
    const bytes = statSync("src/interactive-atlas/einstein-hall.glb").size;
    expect(bytes).toBeGreaterThan(20_000);
    expect(bytes).toBeLessThan(400_000);
    expect(statSync("public/models/tesla-mask.glb").size).toBeGreaterThan(bytes);
  });
});

describe("atlas return pose", () => {
  const now = 1_800_000_000_000;
  const place = () => PLACES["hollow-genius"];

  it("rejects a broken, stale, or out-of-bounds pose", () => {
    expect(validateAtlasResume(null, now)).toBeNull();
    expect(validateAtlasResume({ v: 1, t: now, mode: "fly" }, now)).toBeNull();
    expect(validateAtlasResume({ v: 2, t: now, mode: "fly", focus: [0, 2, 0], radius: 40, yaw: 0, pitch: 0.5, selected: null }, now)).toBeNull();
    const stale = {
      v: 1,
      t: now - 50 * 60 * 1000,
      mode: "fly",
      focus: [0, 2, 0],
      radius: 40,
      yaw: 0,
      pitch: 0.5,
      selected: "hollow-genius",
      walker: null,
    };
    expect(validateAtlasResume(stale, now)).toBeNull();
    const lost = { ...stale, t: now, focus: [0, 2, 9_000] };
    expect(validateAtlasResume(lost, now)).toBeNull();
    const unknown = { ...stale, t: now, focus: [0, 2, 10], selected: "dancer" };
    expect(validateAtlasResume(unknown, now)).toBeNull();
  });

  it("stores one walk pose and will not replay it", () => {
    const p = place();
    sessionStorage.removeItem(ATLAS_RESUME_KEY);
    captureAtlasResume({
      v: 1,
      t: now,
      mode: "walk",
      focus: [p.x, p.y, p.z],
      radius: 28,
      yaw: 0.2,
      pitch: 0.5,
      selected: "hollow-genius",
      walker: { x: p.x, z: p.z + p.block + 3, heading: Math.PI, camYaw: 0, back: 11, lookLift: 4 },
    });
    const first = takeAtlasResume(now + 1000);
    expect(first?.mode).toBe("walk");
    expect(first?.selected).toBe("hollow-genius");
    expect(first?.walker?.x).toBeCloseTo(p.x, 4);
    expect(takeAtlasResume(now + 1000)).toBeNull();
  });
});
