import { describe, expect, it } from "vitest";
import {
  BOUNDARIES,
  INDENT_GAP_M,
  LAST_DISTANCE_M,
  MACRO_GAP_M,
  MILESTONES,
  RECEPTORS,
  dominantReceptor,
  firingRate,
  formatGap,
  gapAt,
  hapticPattern,
  indented,
  journeyTFor,
  nearestMilestone,
  pulseHaptic,
  zenoPartition,
} from "./model";

describe("the last distance ladder", () => {
  it("descends through ten finite gaps, including the two reference frames", () => {
    expect(MILESTONES).toHaveLength(10);
    for (let i = 1; i < MILESTONES.length; i++) {
      expect(MILESTONES[i].meters).toBeLessThan(MILESTONES[i - 1].meters);
    }
    expect(MILESTONES.map((item) => item.meters)).toContain(MACRO_GAP_M);
    expect(MILESTONES.map((item) => item.meters)).toContain(LAST_DISTANCE_M);
    expect(formatGap(MACRO_GAP_M)).toBe("1.50 cm");
    expect(formatGap(LAST_DISTANCE_M)).toBe("238 μm");
  });

  it("moves continuously on a log scale and still lands on the named frames", () => {
    expect(gapAt(0)).toBeCloseTo(MILESTONES[0].meters, 12);
    expect(gapAt(1)).toBeCloseTo(MILESTONES[9].meters, 16);
    expect(gapAt(0.4)).toBeLessThan(gapAt(0.2));
    expect(nearestMilestone(MACRO_GAP_M).id).toBe("macro");
    expect(nearestMilestone(LAST_DISTANCE_M).id).toBe("last");
    expect(journeyTFor(MACRO_GAP_M)).toBeGreaterThan(0);
    expect(journeyTFor(MACRO_GAP_M)).toBeLessThan(1);
    expect(gapAt(journeyTFor(LAST_DISTANCE_M))).toBeCloseTo(LAST_DISTANCE_M, 12);
  });
});

describe("corpuscle teaching curves", () => {
  it("stays silent until the skin is actually loaded", () => {
    expect(indented(MACRO_GAP_M)).toBe(false);
    expect(indented(LAST_DISTANCE_M)).toBe(false);
    expect(indented(INDENT_GAP_M)).toBe(true);
    for (const id of RECEPTORS) {
      expect(firingRate(id, 1, 40, false)).toBe(0);
    }
    expect(dominantReceptor(1, 40, false)).toBeNull();
  });

  it("gives pressure to Merkel, flutter to Meissner, buzz to Pacinian, and little to a poke at Ruffini", () => {
    expect(dominantReceptor(1, 0, true)).toBe("merkel");
    expect(dominantReceptor(1, 40, true)).toBe("meissner");
    expect(dominantReceptor(1, 250, true)).toBe("pacinian");
    expect(firingRate("merkel", 1, 0, true)).toBeGreaterThan(firingRate("merkel", 1, 200, true));
    expect(firingRate("pacinian", 1, 250, true)).toBeGreaterThan(firingRate("pacinian", 1, 0, true));
    expect(firingRate("ruffini", 1, 0, true)).toBeLessThan(firingRate("merkel", 1, 0, true));
  });
});

describe("Zeno sandbox", () => {
  it("does not print a positive remainder as zero", () => {
    const wall = MILESTONES[9].meters;
    const remainder = zenoPartition(wall, 10).remainder;
    expect(remainder).toBeGreaterThan(0);
    const label = formatGap(remainder);
    expect(label).not.toBe("0 pm");
    expect(Number.parseFloat(label)).toBeGreaterThan(0);
    const finer = formatGap(zenoPartition(wall, 24).remainder);
    expect(finer).not.toBe("0 pm");
    expect(Number.parseFloat(finer)).toBeGreaterThan(0);
  });

  it("halves the remainder and never travels past the finite gap", () => {
    const gap = LAST_DISTANCE_M;
    const early = zenoPartition(gap, 1);
    const later = zenoPartition(gap, 12);
    expect(early.traveled + early.remainder).toBeCloseTo(gap, 12);
    expect(later.traveled + later.remainder).toBeCloseTo(gap, 12);
    expect(later.traveled).toBeGreaterThan(early.traveled);
    expect(later.remainder).toBeLessThan(early.remainder);
    expect(later.traveled).toBeLessThanOrEqual(gap);
    expect(zenoPartition(gap, 0).traveled).toBe(0);
  });
});

describe("scientific boundaries", () => {
  it("keeps force, strain, spikes, position, and experience as different sentences", () => {
    const ids = BOUNDARIES.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([
      "embodiment",
      "electromagnetic",
      "deformation",
      "transduction",
      "proprioception",
      "perception",
    ]);
    for (const item of BOUNDARIES) {
      expect(item.body.toLowerCase()).toContain("not");
    }
    const perception = BOUNDARIES.find((item) => item.id === "perception");
    expect(perception?.body).not.toMatch(/proves|confirms/i);
  });
});

describe("optional haptics", () => {
  it("does nothing until asked, then sends the receptor’s pattern", () => {
    const calls: Array<number | number[]> = [];
    expect(pulseHaptic("pacinian", false, () => true)).toBe("off");
    expect(pulseHaptic("pacinian", true, (pattern) => {
      calls.push(pattern);
      return true;
    })).toBe("sent");
    expect(calls[0]).toEqual(hapticPattern("pacinian"));
    expect(pulseHaptic("merkel", true, () => false)).toBe("unavailable");
  });
});
