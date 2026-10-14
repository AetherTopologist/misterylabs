/**
 * Illustrative optical model for Photon Journey.
 * Separated from the canvas so a later instrument can replace the renderer
 * without rewriting the ledger. Not a calibrated smartphone camera.
 */

export type Mode = "moon" | "macro";

export type Tier = "basic" | "advanced";

export type ControlState = {
  /** Exposure compensation in stops. Basic mode applies it as shutter time only. */
  ev: number;
  /** 0–1 disturbance control. The optical weight depends on the path. */
  seeing: number;
  /** 1 = sensor on the image plane demanded by the lens equation. */
  focus: number;
  tier: Tier;
  /** Advanced-mode integration time. Ignored in basic, where EV sets the shutter. */
  shutter: number;
  /** f-number of the stop. Live in both tiers — the bench and the triangle share it. */
  fNumber: number;
  /** Advanced-mode ISO. Basic locks the mapping at ISO_BASE. */
  iso: number;
};

export const FULL_WELL = 14_000;
export const READ_NOISE = 2.8;
export const QE = 0.62;
export const LENS_T = 0.86;
export const C_KM_S = 299_792.458;
export const AU_KM = 149_597_870.7;
export const MOON_KM = 384_400;
export const BASE_SHUTTER_S = 1 / 1000;
export const PUPIL_M = 0.0024;
export const LAMBDA_M = 550e-9;
export const F_NUMBER = 2;
/** Illustrative thin lens. Entrance pupil at f/2 is the 2.4 mm pupil above. */
export const FOCAL_LENGTH_M = PUPIL_M * F_NUMBER;
/** Unity-gain ISO. The ledger never multiplies by this. */
export const ISO_BASE = 100;
export const F_MIN = 1.4;
export const F_MAX = 16;
export const ISO_MIN = 100;
export const ISO_MAX = 6400;
export const SHUTTER_MIN = 1 / 8000;
export const SHUTTER_MAX = 1;
/**
 * Sensor travel at a full focus miss, chosen so f/2 reproduces the v0.1
 * defocus sigmas (10 px moon, 22 px macro) via c = D|δ|/v.
 */
export const MOON_DELTA_FULL_M = 57.5e-6;
export const MACRO_DELTA_FULL_M = 140e-6;
/** Opened-up field used only so the overview bundles separate on screen. */
export const OVERVIEW_FIELD_RAD = 0.12;
export const OVERVIEW_OBJECT_H_M = 0.008;
/** Kept so the v0.1 1:1 note stays in the module. The live macro magnification is v/u. */
export const MACRO_MAG = 1;
export const MACRO_DISTANCE_M = 0.08;
export const PIXEL_PITCH_M = 1.22e-6;

export const DEFAULTS: ControlState = {
  ev: 0,
  seeing: 0.22,
  focus: 0.84,
  tier: "basic",
  shutter: BASE_SHUTTER_S,
  fNumber: F_NUMBER,
  iso: ISO_BASE,
};

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function exposureFactor(ev: number) {
  return 2 ** ev;
}

/** Integration time if only the shutter (or an equivalent gain) absorbs the EV change. */
export function shutterSeconds(ev: number) {
  return BASE_SHUTTER_S * exposureFactor(ev);
}

export function meanElectrons(albedo: number, ev: number) {
  return Math.max(0, albedo) * FULL_WELL * exposureFactor(ev);
}

export function snr(albedo: number, ev: number) {
  const n = meanElectrons(albedo, ev);
  return n / Math.sqrt(n + READ_NOISE * READ_NOISE);
}

export type LayerBlur = {
  defocus: number;
  seeing: number;
  diffraction: number;
  subject: number;
  ground: number;
  warpPx: number;
  cocM: number;
  cocPx: number;
};

export function imageDistance(focalM: number, objectDistanceM: number) {
  if (!Number.isFinite(objectDistanceM)) return focalM;
  return 1 / (1 / focalM - 1 / objectDistanceM);
}

export type Conjugate = {
  mode: Mode;
  focalLengthM: number;
  objectDistanceM: number;
  imageDistanceM: number;
  magnification: number;
  fNumber: number;
  pupilM: number;
  nEff: number;
  numericalAperture: number;
  defocusM: number;
  deltaFullM: number;
  sensorDistanceM: number;
  cocDiameterM: number;
  cocPx: number;
};

export function conjugate(mode: Mode, fNumber: number, focus: number): Conjugate {
  const focalLengthM = FOCAL_LENGTH_M;
  const n = clamp(fNumber, F_MIN, F_MAX);
  const pupilM = focalLengthM / n;
  const objectDistanceM = mode === "moon" ? Number.POSITIVE_INFINITY : MACRO_DISTANCE_M;
  const imageDistanceM = imageDistance(focalLengthM, objectDistanceM);
  const magnification = mode === "moon" ? 0 : imageDistanceM / objectDistanceM;
  const miss = 1 - clamp(focus, 0, 1);
  const shaped = mode === "moon" ? miss ** 1.25 : miss ** 1.15;
  const deltaFullM = mode === "moon" ? MOON_DELTA_FULL_M : MACRO_DELTA_FULL_M;
  const defocusM = shaped * deltaFullM;
  const sensorDistanceM = imageDistanceM + defocusM;
  const cocDiameterM = (pupilM * Math.abs(sensorDistanceM - imageDistanceM)) / imageDistanceM;
  const nEff = n * (1 + magnification);
  return {
    mode,
    focalLengthM,
    objectDistanceM,
    imageDistanceM,
    magnification,
    fNumber: n,
    pupilM,
    nEff,
    numericalAperture: 1 / (2 * nEff),
    defocusM,
    deltaFullM,
    sensorDistanceM,
    cocDiameterM,
    cocPx: cocDiameterM / PIXEL_PITCH_M,
  };
}

export type RayPath = {
  yLens: number;
  thetaIn: number;
  thetaOut: number;
};

/** Image-space height. z = 0 at the lens, positive toward the sensor. */
export function rayHeight(ray: RayPath, z: number) {
  return ray.yLens + ray.thetaOut * z;
}

export function infinityBundle(fieldRad: number, pupilM: number, focalM: number): RayPath[] {
  return [pupilM / 2, 0, -pupilM / 2].map((yLens) => ({
    yLens,
    thetaIn: fieldRad,
    thetaOut: fieldRad - yLens / focalM,
  }));
}

export function finiteBundle(objectHeightM: number, objectDistanceM: number, pupilM: number, focalM: number): RayPath[] {
  return [pupilM / 2, 0, -pupilM / 2].map((yLens) => {
    const thetaIn = (yLens - objectHeightM) / objectDistanceM;
    return { yLens, thetaIn, thetaOut: thetaIn - yLens / focalM };
  });
}

export function overviewBundles(opt: Conjugate) {
  if (opt.mode === "moon") {
    return {
      upper: infinityBundle(OVERVIEW_FIELD_RAD, opt.pupilM, opt.focalLengthM),
      lower: infinityBundle(-OVERVIEW_FIELD_RAD, opt.pupilM, opt.focalLengthM),
      axial: infinityBundle(0, opt.pupilM, opt.focalLengthM),
    };
  }
  return {
    upper: finiteBundle(OVERVIEW_OBJECT_H_M, opt.objectDistanceM, opt.pupilM, opt.focalLengthM),
    lower: finiteBundle(-OVERVIEW_OBJECT_H_M, opt.objectDistanceM, opt.pupilM, opt.focalLengthM),
    axial: finiteBundle(0, opt.objectDistanceM, opt.pupilM, opt.focalLengthM),
  };
}

export function bundleSpread(rays: RayPath[], z: number) {
  const ys = rays.map((ray) => rayHeight(ray, z));
  return Math.max(...ys) - Math.min(...ys);
}

/**
 * Gaussian sigmas in preview pixels.
 * Defocus is the geometric circle of confusion at the illustrative pixel pitch.
 * Diffraction is an Airy radius turned into a Gaussian — not a propagated wave.
 */
export function layerBlur(mode: Mode, seeing: number, focus: number, fNumber = F_NUMBER): LayerBlur {
  const miss = 1 - clamp(focus, 0, 1);
  const s = clamp(seeing, 0, 1);
  const opt = conjugate(mode, fNumber, focus);
  const airyPx = (1.22 * LAMBDA_M * opt.nEff) / PIXEL_PITCH_M;
  const diffraction = airyPx * 0.42;
  const defocus = opt.cocPx / 2.355;

  const fwhmArcsec = 0.4 + s * 3.2;
  const pxPerArcsec = mode === "moon" ? 2.4 : 0.18;
  const seeingSigma = (fwhmArcsec * pxPerArcsec) / 2.355;

  const leafFloor = mode === "macro" ? (7 + miss * 12) * (F_NUMBER / opt.fNumber) : defocus;
  const groundDefocus = mode === "moon" ? defocus : Math.hypot(defocus, leafFloor);
  const subject = Math.hypot(defocus, seeingSigma, diffraction);
  const ground = Math.hypot(groundDefocus, seeingSigma, diffraction);
  const warpPx = mode === "moon" ? s * 5.2 : s * 0.45;

  return {
    defocus,
    seeing: seeingSigma,
    diffraction,
    subject,
    ground,
    warpPx,
    cocM: opt.cocDiameterM,
    cocPx: opt.cocPx,
  };
}

/** Gaussian MTF at 0.25 cycles/pixel. Blur only — noise is not an MTF. */
export function mtfQuarterNyquist(sigmaPx: number) {
  const f = 0.25;
  return Math.exp(-2 * Math.PI ** 2 * sigmaPx * sigmaPx * f * f);
}

/** Pixel-aperture MTF at the same frequency. sinc(f) = sin(πf)/(πf). */
export function samplingMtf() {
  const f = 0.25;
  return Math.sin(Math.PI * f) / (Math.PI * f);
}

export function propagationTimes() {
  const sunToEarthS = AU_KM / C_KM_S;
  const moonToEarthS = MOON_KM / C_KM_S;
  const leafToLensS = MACRO_DISTANCE_M / (C_KM_S * 1000);
  return { sunToEarthS, moonToEarthS, leafToLensS };
}

export function formatClock(seconds: number) {
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    const rest = Math.round(seconds - minutes * 60);
    return `${minutes} min ${rest} s`;
  }
  if (seconds >= 1) return `${seconds.toFixed(2)} s`;
  if (seconds >= 1e-6) return `${(seconds * 1e6).toFixed(2)} µs`;
  return `${(seconds * 1e9).toFixed(2)} ns`;
}

export function formatShutter(seconds: number) {
  if (seconds >= 0.2) return `${seconds.toFixed(2)} s`;
  const inv = 1 / seconds;
  return `1/${Math.round(inv)} s`;
}

export function formatEv(ev: number) {
  const sign = ev > 0 ? "+" : "";
  return `${sign}${ev.toFixed(1)} EV`;
}

export function formatFNumber(fNumber: number) {
  const rounded = Math.round(fNumber * 10) / 10;
  return `f/${rounded >= 10 ? rounded.toFixed(0) : rounded.toFixed(1)}`;
}

export function formatIso(iso: number) {
  return `ISO ${Math.round(iso)}`;
}

export function formatLength(meters: number) {
  if (!Number.isFinite(meters)) return "∞";
  const sign = meters < 0 ? "−" : "";
  const abs = Math.abs(meters);
  if (abs >= 1) return `${sign}${abs.toFixed(2)} m`;
  if (abs >= 0.01) return `${sign}${(abs * 100).toFixed(1)} cm`;
  if (abs >= 1e-3) return `${sign}${(abs * 1000).toFixed(2)} mm`;
  return `${sign}${(abs * 1e6).toFixed(1)} µm`;
}

export function effectiveShutter(controls: ControlState) {
  const seconds = controls.tier === "advanced" ? controls.shutter : shutterSeconds(controls.ev);
  return clamp(seconds, SHUTTER_MIN, SHUTTER_MAX);
}

export function effectiveFNumber(controls: ControlState) {
  return clamp(controls.fNumber, F_MIN, F_MAX);
}

export function effectiveIso(controls: ControlState) {
  if (controls.tier !== "advanced") return ISO_BASE;
  return clamp(controls.iso, ISO_MIN, ISO_MAX);
}

/**
 * Basic parks the file mapping at ISO 100. The stored ISO is not cleared.
 * Returning to Advanced restores it. Shutter is rewritten only so the photon
 * integral does not jump: Basic takes EV from the live shutter, Advanced
 * takes the shutter from the live EV. Aperture is shared by both tiers.
 * A shutter outside ±4 EV is clipped into that window on the way into Basic.
 */
export function withTier(controls: ControlState, tier: Tier): ControlState {
  if (controls.tier === tier) return controls;
  if (tier === "basic") {
    const shutter = effectiveShutter(controls);
    const ev = clamp(Math.log2(shutter / BASE_SHUTTER_S), -4, 4);
    return { ...controls, tier, ev };
  }
  return {
    ...controls,
    tier,
    shutter: effectiveShutter(controls),
    fNumber: effectiveFNumber(controls),
  };
}

/** Photons and photoelectrons. ISO is intentionally absent. */
export function photonScale(controls: ControlState) {
  const time = effectiveShutter(controls) / BASE_SHUTTER_S;
  const aperture = (F_NUMBER / effectiveFNumber(controls)) ** 2;
  return time * aperture;
}

/** Display mapping only. Does not feed the ledger. */
export function isoGain(controls: ControlState) {
  return effectiveIso(controls) / ISO_BASE;
}

export function detectedElectrons(albedo: number, controls: ControlState) {
  return Math.max(0, albedo) * FULL_WELL * photonScale(controls);
}

export function snrFromElectrons(electrons: number) {
  const n = Math.max(0, electrons);
  return n / Math.sqrt(n + READ_NOISE * READ_NOISE);
}

export function formatSci(value: number) {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs === 0) return "0";
  if (abs >= 0.01 && abs < 10_000) {
    if (abs >= 100) return Math.round(value).toLocaleString("en-US");
    return value.toPrecision(3);
  }
  const exp = Math.floor(Math.log10(abs));
  const mant = value / 10 ** exp;
  return { mant, exp };
}

export function sciText(value: number) {
  const formatted = formatSci(value);
  if (typeof formatted === "string") return formatted;
  return `${formatted.mant.toFixed(2)}×10^${formatted.exp}`;
}

const PUPIL_AREA = Math.PI * (PUPIL_M / 2) ** 2;

export function lambertianFraction(distanceM: number, pupilM = PUPIL_M) {
  const area = pupilM === PUPIL_M ? PUPIL_AREA : Math.PI * (pupilM / 2) ** 2;
  return area / (Math.PI * distanceM * distanceM);
}

export type LedgerLine = {
  id: string;
  label: string;
  photons: number;
  note: string;
};

export type Ledger = {
  lines: LedgerLine[];
  fraction: number;
  detectedElectrons: number;
  /** Relative residual of the two conservation cuts. ~0 when coherent. */
  residual: number;
};

/**
 * Work backwards from the same electron scale the preview uses, then
 * forward through reflectance, étendue, transmission, and QE.
 * Stages partition the bundle. They do not include "unresolved detail".
 */
export function moonLedger(ev: number, albedo = 0.18, exposureScale = 1, pupilM = PUPIL_M): Ledger {
  const detected = meanElectrons(albedo, ev) * exposureScale;
  const atSensor = detected / QE;
  const collected = atSensor / LENS_T;
  const fraction = lambertianFraction(MOON_KM * 1000, pupilM);
  const reflected = collected / fraction;
  const incident = reflected / albedo;
  const absorbed = incident - reflected;
  const missed = reflected - collected;
  const opticsLoss = collected - atSensor;
  const qeLoss = atSensor - detected;
  const residual =
    Math.abs(incident - (absorbed + reflected)) / incident +
    Math.abs(reflected - (missed + collected)) / reflected;
  return {
    fraction,
    detectedElectrons: detected,
    residual,
    lines: [
      {
        id: "incident",
        label: "Incident on the patch",
        photons: incident,
        note: "Illustrative visible-band bundle for the lunar patch behind one preview pixel.",
      },
      {
        id: "absorbed",
        label: "Absorbed by the regolith",
        photons: absorbed,
        note: "Gone as heat. Not available to any camera.",
      },
      {
        id: "reflected",
        label: "Reflected",
        photons: reflected,
        note: "This pixel's reflectance. A Bond albedo of 0.12 is a whole-Moon average, not this patch.",
      },
      {
        id: "missed",
        label: "Missed this aperture",
        photons: missed,
        note: "Reflected into the hemisphere and not into this pupil. Nearly all of it.",
      },
      {
        id: "collected",
        label: "Collected by the optics",
        photons: collected,
        note: `Entrance pupil ${(pupilM * 1000).toFixed(2)} mm. ISO is not in this tally.`,
      },
      {
        id: "optics",
        label: "Lost in the lens",
        photons: opticsLoss,
        note: `Transmission set at ${(LENS_T * 100).toFixed(0)}% for this illustration.`,
      },
      {
        id: "qe",
        label: "Arrived, not detected",
        photons: qeLoss,
        note: `Quantum efficiency set at ${(QE * 100).toFixed(0)}%.`,
      },
      {
        id: "detected",
        label: "Detected electrons",
        photons: detected,
        note: "Poisson mean before the full well clips the count.",
      },
    ],
  };
}

/**
 * Diffuse path through a water surface onto a leaf.
 * The specular glint is called out separately: it is a narrow lobe, not a
 * slice of this diffuse partition.
 */
export function macroLedger(ev: number, leafAlbedo = 0.14, exposureScale = 1, pupilM = PUPIL_M): Ledger {
  const fresnel = 0.04;
  const transmitted = 1 - fresnel;
  const leafReflectShare = transmitted * leafAlbedo;
  const absorbedShare = transmitted * (1 - leafAlbedo);
  const detected = meanElectrons(leafAlbedo, ev) * exposureScale;
  const atSensor = detected / QE;
  const collected = atSensor / LENS_T;
  const fraction = lambertianFraction(MACRO_DISTANCE_M, pupilM);
  const leafReflected = collected / fraction;
  const incident = leafReflected / leafReflectShare;
  const fresnelPhotons = incident * fresnel;
  const absorbed = incident * absorbedShare;
  const missed = leafReflected - collected;
  const opticsLoss = collected - atSensor;
  const qeLoss = atSensor - detected;
  const residual =
    Math.abs(incident - (fresnelPhotons + absorbed + leafReflected)) / incident +
    Math.abs(leafReflected - (missed + collected)) / leafReflected;
  return {
    fraction,
    detectedElectrons: detected,
    residual,
    lines: [
      {
        id: "incident",
        label: "Incident on the droplet",
        photons: incident,
        note: "Open-shade bundle sized so a leaf midtone lands near the lunar midtone at the same shutter. Distance did not force a longer exposure.",
      },
      {
        id: "fresnel",
        label: "Fresnel reflection at the water",
        photons: fresnelPhotons,
        note: "About 4% at normal incidence. The bright glint is the narrow lobe of this term, not a separate energy species.",
      },
      {
        id: "absorbed",
        label: "Absorbed in the leaf",
        photons: absorbed,
        note: "After transmission through the droplet.",
      },
      {
        id: "reflected",
        label: "Reflected by the leaf",
        photons: leafReflected,
        note: "Diffuse return. This is the light the focus plane is trying to image.",
      },
      {
        id: "missed",
        label: "Missed this aperture",
        photons: missed,
        note: "Still most of the diffuse return — but a vastly larger share than the Moon, because the pupil subtends a larger angle.",
      },
      {
        id: "collected",
        label: "Collected by the optics",
        photons: collected,
        note: `Entrance pupil ${(pupilM * 1000).toFixed(2)} mm. Same optic as the lunar case. ISO is not in this tally.`,
      },
      {
        id: "optics",
        label: "Lost in the lens",
        photons: opticsLoss,
        note: `Transmission ${(LENS_T * 100).toFixed(0)}%.`,
      },
      {
        id: "qe",
        label: "Arrived, not detected",
        photons: qeLoss,
        note: `Quantum efficiency ${(QE * 100).toFixed(0)}%.`,
      },
      {
        id: "detected",
        label: "Detected electrons",
        photons: detected,
        note: "Poisson mean for the leaf midtone. Specular pixels clip sooner.",
      },
    ],
  };
}

export function activeLedger(mode: Mode, controls: ControlState) {
  const pupil = FOCAL_LENGTH_M / effectiveFNumber(controls);
  const scale = photonScale(controls);
  return mode === "moon" ? moonLedger(0, 0.18, scale, pupil) : macroLedger(0, 0.14, scale, pupil);
}

export function dominantLimit(mode: Mode, controls: ControlState) {
  const albedo = mode === "moon" ? 0.18 : 0.14;
  const highlight = mode === "moon" ? 0.72 : 1.15;
  const blur = layerBlur(mode, controls.seeing, controls.focus, effectiveFNumber(controls));
  const mid = detectedElectrons(albedo, controls);
  const hi = detectedElectrons(highlight, controls);
  const gain = isoGain(controls);
  if (hi * gain > FULL_WELL && mid * gain > FULL_WELL * 0.92) return "Sensor clipping";
  if (snrFromElectrons(mid) < 7) return "Photon noise";
  const ranked = [
    ["Defocus", blur.defocus],
    ["Atmospheric seeing", blur.seeing],
    ["Diffraction", blur.diffraction],
  ].sort((a, b) => Number(b[1]) - Number(a[1]));
  const optical = Math.hypot(blur.defocus, blur.seeing, blur.diffraction);
  if (optical < 0.85) return "Sampling";
  return String(ranked[0][0]);
}

export function seeingCaption(mode: Mode) {
  if (mode === "moon") {
    return "Long path. This crop is plate-scaled so a few arcseconds of seeing can move craters. A phone wide lens usually records the Moon on far fewer pixels, and seeing is rarely what limits it.";
  }
  return "Short path. The same control is almost idle here: centimeters of air are not an atmosphere. Macro failure comes from focus and the diffraction floor, not from astronomical seeing.";
}
