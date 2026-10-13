import { R_MIN, bmagnitude, fieldAt, type Dipole, type Vec } from "./fields";
import { invariantsOf } from "./qed";
import {
  DIV_WITHIN,
  exclusionState,
  instantOf,
  motionState,
  nearestSource,
  sampleEB,
  searchNulls,
  symmetryScore,
  traceStreamlines,
  worstState,
  type Axes,
} from "./topology";

const FREQ = 1e8;
const R = 48;

function axes(): Axes {
  return {
    origin: { x: 0, y: 0, z: 0 },
    e1: { x: 1, y: 0, z: 0 },
    e2: { x: 0, y: 0, z: 1 },
    n: { x: 0, y: 1, z: 0 },
  };
}

function triad(phasesDeg: number[], orient: "vertical" | "tangential" = "vertical"): Dipole[] {
  return [0, 1, 2].map((i) => {
    const a = (i * 2 * Math.PI) / 3;
    const x = R * Math.cos(a);
    const z = R * Math.sin(a);
    const vertical = orient === "vertical";
    return {
      x,
      y: 0,
      z,
      ux: vertical ? 0 : -Math.sin(a),
      uy: vertical ? 1 : 0,
      uz: vertical ? 0 : Math.cos(a),
      pAmp: 1e-4,
      phase: (phasesDeg[i] * Math.PI) / 180,
      dark: false,
    };
  });
}

describe("field topology", () => {
  it("matches the phasor real-part convention and withholds the exclusion ball", () => {
    const dips = triad([0, 0, 0]);
    const p = { x: 20, y: 2, z: -6 };
    const raw = fieldAt(dips, p, FREQ);
    const got = instantOf(raw, 0.4);
    const c = Math.cos(0.4);
    const s = Math.sin(0.4);
    expect(got.B.x).toBeCloseTo((raw.hxR * c - raw.hxI * s) * 1.25663706212e-6, 8);
    expect(got.invalid).toBe(false);
    const inside = sampleEB(dips, { x: dips[0].x, y: 0, z: dips[0].z + 1 }, FREQ, 0);
    expect(inside.invalid).toBe(true);
    expect(nearestSource(inside.E, dips)).toBeGreaterThan(0);
    expect(bmagnitude(raw)).toBeGreaterThan(0);
  });

  it("finds a verified center null for equal vertical dipoles and not inside r < 4 m", () => {
    const dips = triad([0, 0, 0]);
    const center = sampleEB(dips, { x: 0, y: 0, z: 0 }, FREQ, 0);
    expect(Math.hypot(center.B.x, center.B.y, center.B.z)).toBeLessThan(1e-6 * Math.hypot(sampleEB(dips, { x: 10, y: 0, z: 0 }, FREQ, 0).B.x, sampleEB(dips, { x: 10, y: 0, z: 0 }, FREQ, 0).B.y, sampleEB(dips, { x: 10, y: 0, z: 0 }, FREQ, 0).B.z) + 1e-12);
    const found = searchNulls(dips, FREQ, 0, axes(), R, "light");
    const verified = found.nulls.filter((n) => n.klass === "verified");
    expect(verified.length).toBeGreaterThan(0);
    for (const hit of found.nulls) {
      expect(nearestSource(hit.p, dips)).toBeGreaterThanOrEqual(R_MIN);
      expect(hit.label === "Verified numerical null candidate" || hit.label === "Under-resolved candidate").toBe(true);
    }
    const near = verified.some((n) => Math.hypot(n.p.x, n.p.y, n.p.z) < 4);
    expect(near).toBe(true);
    expect(found.note.toLowerCase()).not.toMatch(/reconnect/);
  });

  it("reports no proved absence, and a phase break raises the C3 residual", () => {
    const quiet = symmetryScore(triad([0, 0, 0]), FREQ, 0, axes(), R);
    const broken = symmetryScore(triad([0, 90, 0]), FREQ, 0, axes(), R);
    expect(quiet.residual).toBeLessThan(0.03);
    expect(broken.residual).toBeGreaterThan(quiet.residual * 5);
    expect(broken.text).toMatch(/not threefold symmetric/i);
    const one = triad([0, 0, 0]);
    one[1].dark = true;
    one[2].dark = true;
    const lonely = searchNulls(one, FREQ, 0, axes(), R, "light");
    expect(lonely.note).toMatch(/No null detected|verified|under-resolved/);
    expect(lonely.nulls.every((n) => nearestSource(n.p, one) >= R_MIN)).toBe(true);
  });

  it("keeps streamline steps aligned with instantaneous B", () => {
    const dips = triad([0, 0, 0]);
    const stepM = 2.5;
    const lines = traceStreamlines(dips, FREQ, 0.3, axes(), R, {
      seeds: 6,
      steps: 8,
      stepM,
      direction: "forward",
      offsetM: 0,
      plane: "orbit",
    });
    expect(lines.length).toBeGreaterThan(3);
    let aligned = 0;
    let checked = 0;
    for (const line of lines) {
      const a = line.pts[0];
      const b = line.pts[1];
      const step = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
      const sl = Math.hypot(step.x, step.y, step.z);
      const b0 = sampleEB(dips, a, FREQ, 0.3).B;
      const b0l = Math.hypot(b0.x, b0.y, b0.z);
      if (sl < 1e-6 || b0l < 1e-18) continue;
      const ux = b0.x / b0l;
      const uy = b0.y / b0l;
      const uz = b0.z / b0l;
      const mid = { x: a.x + ux * stepM * 0.5, y: a.y + uy * stepM * 0.5, z: a.z + uz * stepM * 0.5 };
      const field = sampleEB(dips, mid, FREQ, 0.3);
      if (field.invalid) continue;
      const bl = Math.hypot(field.B.x, field.B.y, field.B.z);
      if (!(bl > 0)) continue;
      const cos = Math.abs((step.x * field.B.x + step.y * field.B.y + step.z * field.B.z) / (sl * bl));
      checked++;
      if (cos > 0.98) aligned++;
    }
    expect(checked).toBeGreaterThan(3);
    expect(aligned / checked).toBeGreaterThan(0.85);
  });

  it("classifies exclusion, motion, and an unevaluated ledger without inventing a pass", () => {
    expect(exclusionState(1.2, 0, 10).state).toBe("OUTSIDE VALIDATED DOMAIN");
    expect(exclusionState(5, 0, 10).state).toBe("APPROXIMATION CAUTION");
    expect(exclusionState(20, 0, 10).state).toBe("WITHIN TESTED MODEL");
    expect(motionState(0, 0).state).toBe("WITHIN TESTED MODEL");
    expect(motionState(80, 1.2).state).toBe("APPROXIMATION CAUTION");
    expect(motionState(80, 1.2).text).toMatch(/not a fully self-consistent/);
    expect(worstState(["WITHIN TESTED MODEL", "NOT EVALUATED"])).toBe("NOT EVALUATED");
    expect(worstState(["APPROXIMATION CAUTION", "OUTSIDE VALIDATED DOMAIN"])).toBe("OUTSIDE VALIDATED DOMAIN");
    const dips = triad([0, 0, 0]);
    const d0 = dips[0];
    const pure = sampleEB([d0], { x: d0.x + 12, y: 4, z: 3 }, FREQ, 0.4);
    const inv = invariantsOf(pure.E, pure.B);
    expect(inv.e).toBeGreaterThan(0);
    expect(inv.eps).toBeGreaterThan(0);
    expect(Math.abs(inv.e - inv.eps) / inv.e).toBeGreaterThan(0.2);
  });

  it("keeps div B inside the documented tolerance away from the sources", () => {
    const dips = triad([0, 0, 0]);
    const ax = axes();
    const p: Vec = { x: 90, y: 6, z: -20 };
    expect(nearestSource(p, dips)).toBeGreaterThan(20);
    const h = 0.2;
    const comp = (q: Vec) => sampleEB(dips, q, FREQ, 0).B;
    const bx = (comp({ ...p, x: p.x + h }).x - comp({ ...p, x: p.x - h }).x) / (2 * h);
    const by = (comp({ ...p, y: p.y + h }).y - comp({ ...p, y: p.y - h }).y) / (2 * h);
    const bz = (comp({ ...p, z: p.z + h }).z - comp({ ...p, z: p.z - h }).z) / (2 * h);
    const b = comp(p);
    const rel = (Math.abs(bx + by + bz) * h) / Math.hypot(b.x, b.y, b.z);
    expect(rel).toBeLessThan(DIV_WITHIN);
  });
});
