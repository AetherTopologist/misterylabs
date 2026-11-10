/**
 * Atlas placement for Prometheus, in the existing observatory world.
 * The front court is FOOT. The Cenotaph collision cylinder is CEN_BLOCK.
 * Units are the atlas world, not meters assumed by this page.
 *
 * ARCH_GLB_URL is the reserved socket for a custom arch. Empty means procedural.
 */

export const CEN_BLOCK = 130
export const FOOT = { x: 0, z: 158 }
export const ARCH_GLB_URL = ""

/** Piers only. The opening on x = 0 is the threshold. */
export const ARCH_PIERS = [
  { x: -10, z: 188, block: 1.8 },
  { x: 10, z: 188, block: 1.8 },
] as const

/** East of the centerline, between the arch and the front court. */
export const PROMETHEUS_PLACE = { x: 7, y: 0, z: 170, block: 3.2 }

export type Obstacle = { x: number; z: number; block: number }

export function obstacles(): Obstacle[] {
  return [...ARCH_PIERS, PROMETHEUS_PLACE]
}

export function clearsCenotaph(place: Obstacle, cenotaph = CEN_BLOCK) {
  const radial = Math.hypot(place.x, place.z) - place.block
  return radial > cenotaph
}

/** Straight walk from the outer court, through the arch, to the foot. */
export function centerlineClear(step = 0.5) {
  for (let z = FOOT.z; z <= 210; z += step) {
    if (hits(0, z)) return false
  }
  return true
}

export function footStandsClear() {
  return !hits(FOOT.x, FOOT.z)
}

function hits(x: number, z: number) {
  return obstacles().some((item) => Math.hypot(x - item.x, z - item.z) < item.block)
}
