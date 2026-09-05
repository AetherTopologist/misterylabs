/** Polar GRIN / Apple of the Eye — shared types. */

export const W = 720;
export const H = 420;
export const RAY_COUNT = 11;

export const APPLE = {
  cx: 392,
  cy: 232,
  r: 98,
} as const;

export type Pt = { x: number; y: number };

/** Categorical terminal class. HEART-EYE samples these 1:1 with rays. */
export type MaterialClass = "red" | "stem" | "leaf" | "divot" | "escaped";

export type HitClass = "red" | "stem" | "leaf" | "divot" | "outside";

export const MATERIAL_LABEL: Record<MaterialClass, string> = {
  red: "RED SURFACE",
  stem: "STEM",
  leaf: "LEAF",
  divot: "DIVOT",
  escaped: "ESCAPED",
};

export const MATERIAL_SHORT: Record<MaterialClass, string> = {
  red: "RED",
  stem: "STEM",
  leaf: "LEAF",
  divot: "DIVOT",
  escaped: "ESC",
};

/** Public field configurations. All keep n ≥ 1. */
export type FieldProfile = "off" | "center-high" | "annular-high";

export const FIELD_LABEL: Record<FieldProfile, string> = {
  off: "FIELD OFF",
  "center-high": "CENTER HIGH",
  "annular-high": "ANNULAR HIGH",
};

export interface FieldConfig {
  profile: FieldProfile;
  /** Amplitude in [0, A_MAX]. Ignored when profile is off. */
  strength: number;
  /**
   * Spatial support scale. 1 = design width
   * (σx=36, σy=30, ring w=14, ring r0=40).
   */
  width: number;
  /**
   * Target orientation in degrees, clockwise as drawn.
   * Field is locked to the apple; there is no independent field rotation.
   */
  theta: number;
  /**
   * Stem/leaf size relative to the design cubics, scaled from the pole.
   * 1 = design. Does not change the apple body or the field envelope shape.
   */
  featureScale: number;
  /**
   * Polar dent depth relative to the design silhouette.
   * 1 = design. Scales only the gaussian dent amplitude.
   * Changes the object, not the field strength.
   */
  recessDepth: number;
}

export interface RayPath {
  id: number;
  launch: Pt;
  direction: Pt;
  points: Pt[];
  terminal: Pt;
  material: MaterialClass;
  escaped: boolean;
  /** Peak |dû/ds| along the path, if computed. */
  maxCurvature: number;
}

export interface FieldSample {
  n: number;
  nx: number;
  ny: number;
}

export interface LaunchGeom {
  x: number;
  y0: number;
  ySpan: number;
  tx0: number;
  ty0: number;
  tx1: number;
  ty1: number;
}
