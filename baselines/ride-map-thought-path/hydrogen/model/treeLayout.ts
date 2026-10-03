import type { Node, Stratum } from "./types.ts"

export type PlacedNode = {
  id: string
  x: number
  y: number
  stratum: Stratum
  seam: boolean
}

export const TREE_WIDTH = 340
export const TREE_HEIGHT = 452
export const HYDROGEN_Y = 164

const BRANCH_Y = 20
const ROOT_ROWS = [300, 372]
const TRUNK_SLOTS = [88, 124, 204, 244]

/** Presentation coordinates only. The nodes are the typed graph, unchanged. */
export function placeHydrogenTree(nodes: Node[]): PlacedNode[] {
  const branches = nodes.filter((node) => node.stratum === "branch")
  const roots = nodes.filter((node) => node.stratum === "root")
  const trunks = nodes.filter((node) => node.stratum === "trunk" && node.id !== "hydrogen")
  const seams = nodes.filter((node) => node.stratum === "seam")
  const placed: PlacedNode[] = []

  spread(branches, BRANCH_Y, false, placed)
  const hydrogen = nodes.find((node) => node.id === "hydrogen")
  if (hydrogen) {
    placed.push({ id: hydrogen.id, x: 170, y: HYDROGEN_Y, stratum: "trunk", seam: false })
  }
  trunks.forEach((node, index) => {
    placed.push({
      id: node.id,
      x: 170,
      y: TRUNK_SLOTS[index] ?? HYDROGEN_Y,
      stratum: "trunk",
      seam: false,
    })
  })
  const split = Math.ceil(roots.length / 2)
  spread(roots.slice(0, split), ROOT_ROWS[0], false, placed)
  spread(roots.slice(split), ROOT_ROWS[1], false, placed)
  seams.forEach((node, index) => {
    placed.push({
      id: node.id,
      x: 250 - index * 22,
      y: 64,
      stratum: "seam",
      seam: true,
    })
  })
  return placed
}

export function brokenStop(
  from: { x: number; y: number },
  to: { x: number; y: number },
  fraction = 0.62,
): { x: number; y: number } {
  return {
    x: from.x + (to.x - from.x) * fraction,
    y: from.y + (to.y - from.y) * fraction,
  }
}

function spread(nodes: Node[], y: number, seam: boolean, into: PlacedNode[]) {
  const count = nodes.length
  const pad = 52
  nodes.forEach((node, index) => {
    const x = count <= 1 ? 170 : pad + (index * (TREE_WIDTH - pad * 2)) / (count - 1)
    into.push({ id: node.id, x, y, stratum: node.stratum, seam })
  })
}
