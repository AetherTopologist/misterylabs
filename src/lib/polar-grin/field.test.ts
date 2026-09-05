import { describe, it, expect } from "vitest";
import { A_MAX, N_MIN, WIDTH_DEFAULT, indexAt, sampleField } from "./field";
import { polePos } from "./geometry";
import { toLab } from "./frame";
import { fieldOff, traceRay } from "./rays";
import type { FieldConfig } from "./types";

function C(
  partial: Omit<FieldConfig, "featureScale" | "theta" | "recessDepth"> & {
    theta?: number;
    featureScale?: number;
    recessDepth?: number;
  },
): FieldConfig {
  return { theta: 0, featureScale: 1, recessDepth: 1, ...partial };
}

describe("positive-index field", () => {
  it("is vacuum when field is off", () => {
    const p = polePos();
    expect(indexAt(p.x, p.y, fieldOff())).toBe(1);
    expect(indexAt(p.x - 40, p.y, fieldOff(2.4))).toBe(1);
  });

  it("stays n ≥ 1 and ≤ 1+A_MAX", () => {
    const p = polePos();
    for (const w of [0.4, 1, 2.4]) {
      for (const profile of ["center-high", "annular-high"] as const) {
        const cfg = C({ profile, strength: A_MAX, width: w });
        for (const q of [p, { x: p.x + 40, y: p.y }, { x: 80, y: 80 }]) {
          const n = indexAt(q.x, q.y, cfg);
          expect(n).toBeGreaterThanOrEqual(N_MIN - 1e-12);
          expect(n).toBeLessThanOrEqual(1 + A_MAX + 1e-12);
        }
      }
    }
  });

  it("center-high peaks at the pole; annular peaks off-axis", () => {
    const p = polePos();
    const c = C({ profile: "center-high", strength: 1, width: WIDTH_DEFAULT });
    const a = C({ profile: "annular-high", strength: 1, width: WIDTH_DEFAULT });
    expect(indexAt(p.x, p.y, c)).toBeGreaterThan(indexAt(p.x + 40, p.y, c));
    expect(indexAt(p.x + 40, p.y, a)).toBeGreaterThan(indexAt(p.x, p.y, a));
  });

  it("bends a probe toward increasing n", () => {
    const p = polePos();
    const cfg = C({ profile: "center-high", strength: 1.2, width: 1 });
    expect(sampleField(p.x, p.y + 50, cfg).ny).toBeLessThan(0);
    const ray = traceRay(99, 180, 80, 1, 0, cfg);
    const mid = ray.points[Math.floor(ray.points.length / 2)];
    expect(mid.y).toBeGreaterThan(80 + 1.5);
  });

  it("rotates n with the target", () => {
    const p = polePos();
    const cfg0 = C({ profile: "center-high", strength: 1, width: 1 });
    const n0 = indexAt(p.x, p.y, cfg0);
    const lab = toLab(p.x, p.y, 30);
    const n30 = indexAt(lab.x, lab.y, { ...cfg0, theta: 30 });
    expect(Math.abs(n30 - n0)).toBeLessThan(1e-9);
  });

  it("feature scale does not change n", () => {
    const p = polePos();
    const a = C({ profile: "center-high", strength: 1, width: 1, featureScale: 0.5 });
    const b = { ...a, featureScale: 1.5 };
    expect(indexAt(p.x, p.y, a)).toBe(indexAt(p.x, p.y, b));
  });
});
