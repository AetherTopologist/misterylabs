import assert from "node:assert/strict";
import { B777, SKIN_MARGIN_M, airframeExtent, minimumClearRadius, skinDistance, splitRadii } from "./airframe.ts";

describe("777-200ER schematic", () => {
  it("locks length, span, and height to the published overall figures", () => {
    const e = airframeExtent();
    assert.equal(e.length, B777.lengthM);
    assert.ok(Math.abs(e.span - B777.spanM) < 1e-6, `span ${e.span}`);
    assert.ok(Math.abs(e.height - B777.heightM) < 1e-6, `height ${e.height}`);
    assert.ok(skinDistance({ x: 0, y: 0, z: 0 }).gap < 0);
    assert.ok(Math.abs(skinDistance({ x: 0, y: 0, z: e.noseTip }).gap) < 0.05);
  });

  it("does not use half-span as a single Rmin", () => {
    const axial = minimumClearRadius({ x: 1, y: 0, z: 0 }, 0, SKIN_MARGIN_M);
    const up = minimumClearRadius({ x: 0, y: 1, z: 0 }, 0, SKIN_MARGIN_M);
    const nose = minimumClearRadius({ x: 0, y: 0, z: 1 }, 0, SKIN_MARGIN_M);
    const throughWing = minimumClearRadius({ x: 17, y: -1.2, z: -2.4 }, 0, SKIN_MARGIN_M);
    const half = B777.spanM / 2;
    assert.ok(Math.abs(axial - up) > 10);
    assert.ok(up < half);
    assert.ok(nose > half);
    assert.ok(throughWing > half);
    assert.ok(Math.abs(axial - half) > 1);
    assert.equal(minimumClearRadius({ x: 1, y: 0, z: 0 }, 80, SKIN_MARGIN_M), 80);
  });

  it("does not call a tracking excursion clearance", () => {
    const onSlot = splitRadii(48, [48, 48, 48], [48.1, 47.9, 48]);
    assert.equal(onSlot.clearanceRaised, false);
    assert.equal(onSlot.tracking, false);
    const raised = splitRadii(8, [34, 33, 31], [34.1, 33, 31.2]);
    assert.equal(raised.clearanceRaised, true);
    assert.equal(raised.tracking, false);
    assert.match(raised.note, /half-span is not/i);
    const blown = splitRadii(48, [48, 48, 48], [90, 88, 92]);
    assert.equal(blown.clearanceRaised, false);
    assert.equal(blown.tracking, true);
    assert.match(blown.note, /not an airframe push/i);
    const both = splitRadii(8, [20, 20, 20], [40, 20, 20]);
    assert.equal(both.clearanceRaised, true);
    assert.equal(both.tracking, true);
    assert.match(both.note, /tracking, not the airframe/i);
  });
});
