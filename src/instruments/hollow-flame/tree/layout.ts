import type { Node, Stratum } from "./types.ts"

export type PlacedNode = {
  id: string
  x: number
  y: number
  stratum: Stratum
}

export const TREE_WIDTH = 720
export const TREE_HEIGHT = 820
export const FLAME_Y = 318

const BRANCH_ROWS = [40, 122]
const ROOT_ROWS = [568, 708]
const TRAIT_Y = [214, 270, 326, 382]

/** Presentation coordinates only. Branches above, roots below, flame on the trunk. */
export function placeFlameTree(nodes: Node[]): PlacedNode[] {
  const branches = nodes.filter((node) => node.stratum === "branch")
  const roots = nodes.filter((node) => node.stratum === "root")
  const traits = nodes.filter((node) => node.stratum === "trunk" && node.id !== "hollow-flame")
  const placed: PlacedNode[] = []
  const halfB = Math.ceil(branches.length / 2)
  spread(branches.slice(0, halfB), BRANCH_ROWS[0]!, placed)
  spread(branches.slice(halfB), BRANCH_ROWS[1]!, placed)
  const flame = nodes.find((node) => node.id === "hollow-flame")
  if (flame) placed.push({ id: flame.id, x: TREE_WIDTH / 2, y: FLAME_Y, stratum: "trunk" })
  traits.slice(0, 4).forEach((node, index) => {
    placed.push({ id: node.id, x: 168, y: TRAIT_Y[index] ?? FLAME_Y, stratum: "trunk" })
  })
  traits.slice(4).forEach((node, index) => {
    placed.push({ id: node.id, x: TREE_WIDTH - 168, y: TRAIT_Y[index] ?? FLAME_Y, stratum: "trunk" })
  })
  const halfR = Math.ceil(roots.length / 2)
  spread(roots.slice(0, halfR), ROOT_ROWS[0]!, placed)
  spread(roots.slice(halfR), ROOT_ROWS[1]!, placed)
  return placed
}

function spread(nodes: Node[], y: number, into: PlacedNode[]) {
  const count = nodes.length
  const pad = 78
  nodes.forEach((node, index) => {
    const x = count <= 1 ? TREE_WIDTH / 2 : pad + (index * (TREE_WIDTH - pad * 2)) / (count - 1)
    into.push({ id: node.id, x, y, stratum: node.stratum })
  })
}
