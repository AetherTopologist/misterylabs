import { describe, it, expect } from "vitest";
import { A_MAX, indexAt } from "./field";
import { classifyHit } from "./geometry";
import {
  BEST_ZERO_ESCAPE,
  LAUNCH,
  SNAPSHOT_EXTREME,
  bundle,
  countMaterials,
  fieldOff,
} from "./rays";
import type { FieldConfig } from "./types";

const FIELD_OFF_RIBBON = [
  "escaped",
  "stem",
  "stem",
  "stem",
  "stem",
  "red",
  "red",
  "red",
  "red",
  "red",
  "red",
] as const;

function C(
  partial: Omit<FieldConfig, "featureScale" | "theta" | "recessDepth"> & {
    theta?: number;
    featureScale?: number;
    recessDepth?: number;
  },
): FieldConfig {
  return { theta: 0, featureScale: 1, recessDepth: 1, ...partial };
}

function ribbon(cfg: FieldConfig): string {
  return bundle(cfg)
    .map((r) => r.material[0])
    .join("");
}

describe("Polar GRIN frozen reference model", () => {
  it("uses the locked launch geometry", () => {
    expect(LAUNCH).toEqual({
      x: 80,
      y0: 8,
      ySpan: 190,
      tx0: 440,
      ty0: 100,
      tx1: 362,
      ty1: 232,
    });
  });

  it("A=0 is straight and matches the locked FIELD-OFF ribbon", () => {
    const rays = bundle(fieldOff());
    expect(rays).toHaveLength(11);
    for (const r of rays) {
      expect(classifyHit(r.launch.x, r.launch.y)).toBe("outside");
      const dx = r.terminal.x - r.launch.x;
      const dy = r.terminal.y - r.launch.y;
      const cross = Math.abs(dx * r.direction.y - dy * r.direction.x);
      expect(cross).toBeLessThan(2.5);
    }
    expect(rays.map((r) => r.material)).toEqual([...FIELD_OFF_RIBBON]);
    const c = countMaterials(rays);
    expect(c).toMatchObject({ stem: 4, red: 6, escaped: 1, leaf: 0, divot: 0 });
  });

  it("every HEART-EYE class is a marcher fate (1:1)", () => {
    const rays = bundle(C({ profile: "annular-high", strength: 0.9, width: 1 }));
    expect(rays).toHaveLength(11);
    rays.forEach((r, i) => {
      expect(r.id).toBe(i + 1);
      expect(["red", "stem", "leaf", "divot", "escaped"]).toContain(r.material);
    });
  });

  it("honest OFF→ON at recess=2 scale=0.5 keeps a stem and reaches RED 10 ESC 0", () => {
    const off = bundle(fieldOff(1, 0, 0.5, 2));
    expect(ribbon(fieldOff(1, 0, 0.5, 2))).toBe("eeeesrrrrrr");
    const offC = countMaterials(off);
    expect(offC.stem).toBe(1);
    expect(offC.red).toBe(6);
    expect(offC.escaped).toBe(4);
    const on = bundle(
      C({
        profile: "center-high",
        strength: 0.6,
        width: 2.4,
        featureScale: 0.5,
        recessDepth: 2,
      }),
    );
    expect(on.map((r) => r.material[0]).join("")).toBe("rrrsrrrrrrr");
    const onC = countMaterials(on);
    expect(onC.red).toBe(10);
    expect(onC.stem).toBe(1);
    expect(onC.escaped).toBe(0);
    expect(onC.red - offC.red).toBe(4);
    for (let i = 0; i < 11; i++) {
      expect(on[i].launch).toEqual(off[i].launch);
    }
  });

  it("11/11 at recess=2.5 scale=0.5 is geometric hiding, not the ideal", () => {
    const off = bundle(fieldOff(1, 0, 0.5, 2.5));
    const offC = countMaterials(off);
    expect(offC.stem + offC.leaf + offC.divot).toBe(0);
    const on = bundle(
      C({
        profile: "annular-high",
        strength: 0.6,
        width: 2.4,
        featureScale: 0.5,
        recessDepth: 2.5,
      }),
    );
    const onC = countMaterials(on);
    expect(onC.red).toBe(11);
    expect(onC.escaped).toBe(0);
  });

  it("extreme snapshot is RED 10 DIVOT 1 ESC 0; same-target FIELD OFF has no features", () => {
    expect(SNAPSHOT_EXTREME).toMatchObject({
      profile: "annular-high",
      strength: 1.2,
      width: 2.4,
      theta: 0,
      featureScale: 0.5,
      recessDepth: 3,
    });
    const off = bundle(
      fieldOff(
        SNAPSHOT_EXTREME.width,
        SNAPSHOT_EXTREME.theta,
        SNAPSHOT_EXTREME.featureScale,
        SNAPSHOT_EXTREME.recessDepth,
      ),
    );
    expect(countMaterials(off).stem + countMaterials(off).leaf + countMaterials(off).divot).toBe(0);
    expect(off.map((r) => r.material[0]).join("")).toBe("eeeerrrrrrr");
    const on = bundle(SNAPSHOT_EXTREME);
    expect(on.map((r) => r.material)).toEqual([
      "red",
      "red",
      "red",
      "divot",
      "red",
      "red",
      "red",
      "red",
      "red",
      "red",
      "red",
    ]);
    expect(on[3].material).toBe("divot");
    expect(countMaterials(on).escaped).toBe(0);
    expect(countMaterials(on).red).toBe(10);
  });

  it("best zero-escape captures the graze onto red, not 11/11", () => {
    const rays = bundle(BEST_ZERO_ESCAPE);
    const c = countMaterials(rays);
    expect(c.escaped).toBe(0);
    expect(c.red).toBe(7);
    expect(c.stem).toBe(4);
    expect(c.red).toBeLessThan(11);
  });

  it("n stays ≥ 1; field does not mutate occupancy", () => {
    const p = { x: 392, y: 144 };
    const cfg = C({ profile: "center-high", strength: A_MAX, width: 2.4, recessDepth: 3 });
    const n = indexAt(p.x, p.y, cfg);
    expect(n).toBeGreaterThanOrEqual(1);
    expect(n).toBeLessThanOrEqual(1 + A_MAX);
    expect(classifyHit(392, 232, 0, 1, 1)).toBe("red");
  });
});
