/** Matches centerScale's default target height in mask-geometry.ts. */
export const MASK_HEIGHT = 1.65;

/** Visible height as a multiple of the relief, so the face is not cropped. */
export const FRAME_FIT = 1.28;

export function orthographicZoomFor(
  viewportHeight: number,
  meshHeight = MASK_HEIGHT,
  fit = FRAME_FIT,
): number {
  return Math.max(1, viewportHeight) / (meshHeight * fit);
}

export function perspectiveStandOff(
  fovDeg: number,
  meshHeight = MASK_HEIGHT,
  fit = FRAME_FIT,
): number {
  const visible = meshHeight * fit;
  const half = (fovDeg * Math.PI) / 360;
  return (visible / 2) / Math.tan(half);
}

/** World-space height an orthographic camera shows at this CSS viewport and zoom. */
export function orthographicVisibleHeight(viewportHeight: number, zoom: number): number {
  return viewportHeight / zoom;
}
