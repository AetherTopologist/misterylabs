import type { CapGrid } from "./cenotaph-seat";

/**
 * Observation-disc collision. Production leaves the grid empty.
 * Production + Floor installs a flat disc at the file's cap height.
 * The shell wall meets this floor near r = 20.7. The disc walk stops at
 * 19.5. The northern passage and the exterior terrace open with it.
 */
export const CAP_WALK_R = 19.5;

let capGrid: CapGrid | null = null;

export function setMonumentCap(grid: CapGrid | null) {
  capGrid = grid && grid.cells > 0 ? grid : null;
}

export function monumentCapActive() {
  return capGrid !== null;
}

/** Flat disc at the Production + Floor cap. Not a mesh: collision only. */
export function flatDiscCap(y: number, reach = CAP_WALK_R): CapGrid {
  const step = 0.5;
  const x0 = -reach;
  const z0 = -reach;
  const cols = Math.round((reach * 2) / step) + 1;
  const rows = cols;
  const heights = new Float32Array(cols * rows);
  heights.fill(Number.NaN);
  let cells = 0;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = x0 + i * step;
      const z = z0 + j * step;
      if (Math.hypot(x, z) <= reach + 1e-6) {
        heights[j * cols + i] = y;
        cells++;
      }
    }
  }
  return { x0, z0, step, cols, rows, heights, cells, yMin: y, yMax: y };
}

export function capAt(x: number, z: number) {
  const cap = capGrid;
  if (!cap) return 0;
  const ix = Math.round((x - cap.x0) / cap.step);
  const iz = Math.round((z - cap.z0) / cap.step);
  if (ix < 0 || iz < 0 || ix >= cap.cols || iz >= cap.rows) return 0;
  const y = cap.heights[iz * cap.cols + ix];
  return Number.isFinite(y) ? y : 0;
}
