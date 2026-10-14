import assert from "node:assert/strict";
import {
  DEFAULTS,
  FOCAL_LENGTH_M,
  FULL_WELL,
  ISO_BASE,
  MACRO_DISTANCE_M,
  MACRO_MAG,
  bundleSpread,
  conjugate,
  detectedElectrons,
  effectiveIso,
  effectiveShutter,
  exposureFactor,
  imageDistance,
  isoGain,
  layerBlur,
  macroLedger,
  meanElectrons,
  moonLedger,
  overviewBundles,
  photonScale,
  rayHeight,
  shutterSeconds,
  snr,
  withTier,
} from "./physics";
import { forestViolations, graphViolations, photonEdges, photonNodes } from "./graph";

test("exposure doubles per stop and the shutter follows", () => {
  assert.equal(exposureFactor(3), 8);
  assert.ok(Math.abs(shutterSeconds(0) - 0.001) < 1e-12);
  assert.ok(Math.abs(shutterSeconds(2) - 0.004) < 1e-12);
  assert.ok(meanElectrons(0.2, 1) / meanElectrons(0.2, 0) - 2 < 1e-9);
});

test("extreme exposure clips or starves the midtone", () => {
  assert.ok(meanElectrons(0.2, 4) > FULL_WELL);
  assert.ok(snr(0.05, -4) < 8);
  assert.ok(snr(0.18, 0) > 20);
});

test("macro seeing does not dominate the short path", () => {
  const moon = layerBlur("moon", 1, 0.5);
  const macro = layerBlur("macro", 1, 0.5);
  assert.ok(macro.seeing < moon.seeing * 0.2);
  assert.ok(macro.warpPx < 1);
  assert.ok(macro.defocus > moon.defocus);
  assert.ok(macro.diffraction > moon.diffraction);
});

test("ledgers conserve and do not invent a detail bin", () => {
  for (const book of [moonLedger(0), moonLedger(2), macroLedger(-1)]) {
    assert.ok(book.residual < 1e-9);
    assert.ok(book.lines.every((line) => line.photons > 0));
    assert.equal(
      book.lines.some((line) => /unresolved|detail|blur/i.test(line.label)),
      false,
    );
  }
  const moon = moonLedger(0);
  const macro = macroLedger(0);
  assert.ok(macro.fraction > moon.fraction * 1e12);
});

test("hydrogen-shaped graph and forest both pass", () => {
  assert.deepEqual(graphViolations, []);
  assert.deepEqual(forestViolations, []);
  assert.equal(photonNodes.length, 26);
  assert.equal(photonEdges.length, 30);
  assert.ok(photonNodes.some((node) => node.canonId === "canon.maxwell"));
  assert.ok(photonNodes.some((node) => node.id === "thin-lens"));
  assert.ok(photonNodes.some((node) => node.id === "atomic-touch"));
  assert.ok(photonNodes.some((node) => node.title === "Diffraction and the Airy disk"));
});

test("thin lens matches far and near conjugates", () => {
  const far = conjugate("moon", 2, 1);
  assert.ok(Math.abs(far.imageDistanceM - FOCAL_LENGTH_M) < 1e-12);
  assert.equal(far.defocusM, 0);
  assert.equal(far.cocDiameterM, 0);
  const near = conjugate("macro", 2, 1);
  const v = imageDistance(FOCAL_LENGTH_M, MACRO_DISTANCE_M);
  assert.ok(Math.abs(near.imageDistanceM - v) < 1e-12);
  assert.ok(Math.abs(near.magnification - v / MACRO_DISTANCE_M) < 1e-12);
  assert.ok(Math.abs(conjugate("macro", 16, 0.2).imageDistanceM - v) < 1e-12);
});

test("displayed bundles agree with the lens equation", () => {
  for (const mode of ["moon", "macro"] as const) {
    for (const focus of [1, 0.4, 0]) {
      const opt = conjugate(mode, focus === 0 ? 8 : 2.8, focus);
      const bundles = overviewBundles(opt);
      for (const rays of [bundles.axial, bundles.upper, bundles.lower]) {
        assert.ok(bundleSpread(rays, opt.imageDistanceM) < 1e-9);
        const atImage = rayHeight(rays[0], opt.imageDistanceM);
        if (mode === "moon" && rays === bundles.axial) assert.ok(Math.abs(atImage) < 1e-12);
      }
      const coc = bundleSpread(bundles.axial, opt.sensorDistanceM);
      assert.ok(Math.abs(coc - opt.cocDiameterM) < 1e-12);
    }
  }
  const wide = conjugate("moon", 2, 0);
  const stopped = conjugate("moon", 8, 0);
  assert.ok(Math.abs(wide.cocDiameterM / stopped.cocDiameterM - 4) < 1e-9);
  const blurWide = layerBlur("moon", 0, 0.5, 2);
  const blurStopped = layerBlur("moon", 0, 0.5, 8);
  assert.ok(blurStopped.diffraction > blurWide.diffraction * 3);
  assert.ok(blurStopped.defocus < blurWide.defocus / 3);
});

test("ISO changes gain and not the photon count", () => {
  const base = { ...DEFAULTS, tier: "advanced" as const, shutter: 0.001, fNumber: 2, iso: ISO_BASE };
  const boosted = { ...base, iso: 800 };
  const longer = { ...base, shutter: 0.002 };
  const slower = { ...base, fNumber: 4 };
  assert.equal(detectedElectrons(0.18, base), detectedElectrons(0.18, boosted));
  assert.equal(isoGain(base), 1);
  assert.equal(isoGain(boosted), 8);
  assert.ok(Math.abs(detectedElectrons(0.18, longer) / detectedElectrons(0.18, base) - 2) < 1e-12);
  assert.ok(Math.abs(detectedElectrons(0.18, slower) / detectedElectrons(0.18, base) - 0.25) < 1e-12);
  assert.ok(Math.abs(photonScale(base) - 1) < 1e-12);
  const basic = { ...DEFAULTS, ev: 2, tier: "basic" as const, iso: 3200, fNumber: 2 };
  assert.equal(isoGain(basic), 1);
  assert.ok(Math.abs(detectedElectrons(0.2, basic) - meanElectrons(0.2, 2)) < 1e-6);
  const book = moonLedger(0, 0.18, photonScale(boosted), FOCAL_LENGTH_M / boosted.fNumber);
  const quiet = moonLedger(0, 0.18, photonScale(base), FOCAL_LENGTH_M / base.fNumber);
  assert.ok(Math.abs(book.detectedElectrons - quiet.detectedElectrons) < 1e-6);
});

test("basic and advanced keep the stored ISO", () => {
  const advanced = { ...DEFAULTS, tier: "advanced" as const, shutter: 0.004, fNumber: 4, iso: 1600, ev: 0 };
  const basic = withTier(advanced, "basic");
  assert.equal(basic.tier, "basic");
  assert.equal(basic.iso, 1600);
  assert.equal(basic.fNumber, 4);
  assert.equal(effectiveIso(basic), ISO_BASE);
  assert.ok(Math.abs(basic.ev - 2) < 1e-12);
  assert.ok(Math.abs(effectiveShutter(basic) - 0.004) < 1e-12);
  assert.equal(withTier(basic, "basic"), basic);
  const back = withTier(basic, "advanced");
  assert.equal(back.iso, 1600);
  assert.equal(effectiveIso(back), 1600);
  assert.ok(Math.abs(back.shutter - 0.004) < 1e-9);
  assert.equal(back.fNumber, 4);
  assert.equal(detectedElectrons(0.18, advanced), detectedElectrons(0.18, back));
  const moved = withTier({ ...basic, ev: 0 }, "advanced");
  assert.equal(moved.iso, 1600);
  assert.ok(Math.abs(moved.shutter - 0.001) < 1e-12);
});

test("live macro magnification is the conjugate, not MACRO_MAG", () => {
  const near = conjugate("macro", 2.8, 0.4);
  const v = imageDistance(FOCAL_LENGTH_M, near.objectDistanceM);
  assert.equal(near.objectDistanceM, MACRO_DISTANCE_M);
  assert.ok(Math.abs(near.magnification - v / near.objectDistanceM) < 1e-12);
  assert.ok(near.magnification > 0 && near.magnification < 0.2);
  assert.notEqual(near.magnification, MACRO_MAG);
  assert.ok(Math.abs(conjugate("macro", 1.4, 0).magnification - conjugate("macro", 16, 1).magnification) < 1e-12);
});
