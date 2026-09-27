/** Compressed range inset. Not a metric scale and not a transport path. */

export const ANCHOR_RANGE_MIN_KM = 0.5;
export const ANCHOR_RANGE_MAX_KM = 2000;

/**
 * Screen radius of the anchor marker.
 * u = log10(anchorKm / 0.5) / log10(2000 / 0.5), clamped to [0, 1].
 * screenRadius = pxMin + u * (pxMax - pxMin).
 * The numeric range stays exact elsewhere. This radius is not meters.
 */
export function compressedRadius(anchorKm: number, pxMin = 10, pxMax = 58): number {
  const km = Math.max(anchorKm, ANCHOR_RANGE_MIN_KM);
  const span = Math.log10(ANCHOR_RANGE_MAX_KM / ANCHOR_RANGE_MIN_KM);
  const u = Math.log10(km / ANCHOR_RANGE_MIN_KM) / span;
  const clamped = Math.max(0, Math.min(1, u));
  return pxMin + clamped * (pxMax - pxMin);
}
