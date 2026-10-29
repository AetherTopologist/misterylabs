import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildFairGarden } from "./garden";
import { GARDEN_COURT } from "./terrain";
import { PLACES } from "./world";

describe("fair garden prototype", () => {
  it("is one distance-culled court beside the House of Unfolding, with a small light budget", () => {
    const garden = buildFairGarden();
    const budget = garden.budget();
    expect(garden.group.name).toBe("fair-garden");
    expect(garden.group.position.x).toBeCloseTo(GARDEN_COURT.x, 4);
    expect(garden.group.position.z).toBeCloseTo(GARDEN_COURT.z, 4);
    expect(budget.lights).toBe(2);
    expect(budget.transparent).toBe(0);
    expect(budget.meshes).toBeLessThan(24);
    expect(budget.instanced).toBeGreaterThan(4);
    expect(budget.triangles).toBeLessThan(2500);
    expect(budget.expanded).toBeLessThan(7000);
    expect(budget.materials).toBeLessThan(12);

    const house = PLACES["inside-out"];
    expect(Math.hypot(house.x - GARDEN_COURT.x, house.z - GARDEN_COURT.z)).toBeGreaterThan(house.block + GARDEN_COURT.block);

    const scene = readFileSync("src/interactive-atlas/scene.ts", "utf8");
    expect(scene.match(/new THREE\.WebGLRenderer/g)).toHaveLength(1);
    expect(scene).toContain("buildFairGarden");
    expect(scene).not.toContain("shadowMap");
  });
});
