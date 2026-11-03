import type { CapGrid } from "./cenotaph-seat";

/**
 * Full-resolution cap only. Production leaves the grid empty.
 *
 * The shell wall meets this floor near r = 20.7. The disc walk stops at
 * 19.5. The northern passage is a separate corridor, and only while this
 * grid is installed. The terrace ring stays closed.
 */
export const CAP_WALK_R = 19.5;

let capGrid: CapGrid | null = null;

export function setMonumentCap(grid: CapGrid | null) {
  capGrid = grid && grid.cells > 0 ? grid : null;
}

export function monumentCapActive() {
  return capGrid !== null;
}

/** Height of the surveyed cap at this column, or 0 when the column is empty. */
export function capAt(x: number, z: number) {
  const cap = capGrid;
  if (!cap) return 0;
  const ix = Math.round((x - cap.x0) / cap.step);
  const iz = Math.round((z - cap.z0) / cap.step);
  if (ix < 0 || iz < 0 || ix >= cap.cols || iz >= cap.rows) return 0;
  const y = cap.heights[iz * cap.cols + ix];
  return Number.isFinite(y) ? y : 0;
}
