import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { hydrogenEdges, hydrogenNodes, rejectedResonance } from "./graph.ts"
import { brokenStop, HYDROGEN_Y, placeHydrogenTree } from "./treeLayout.ts"
import type { Node } from "./types.ts"
import { validateGraph } from "./validate.ts"

describe("hydrogen tree layout", () => {
  it("puts branches above the trunk and roots below it", () => {
    const placed = placeHydrogenTree(hydrogenNodes)
    const hydrogen = placed.find((node) => node.id === "hydrogen")
    assert.ok(hydrogen)
    assert.equal(hydrogen.y, HYDROGEN_Y)
    assert.equal(hydrogen.stratum, "trunk")
    for (const node of placed) {
      if (node.stratum === "branch") assert.ok(node.y < hydrogen.y)
      if (node.stratum === "root") assert.ok(node.y > hydrogen.y)
      if (node.stratum === "trunk") assert.ok(node.y < Math.min(...placed.filter((item) => item.stratum === "root").map((item) => item.y)))
    }
    assert.equal(placed.filter((node) => node.seam).length, 1)
    const seam = placed.find((node) => node.id === "h-seam-1")
    assert.ok(seam?.seam)
    assert.ok(seam.y < hydrogen.y)
    assert.ok(seam.y > Math.max(...placed.filter((node) => node.stratum === "branch").map((node) => node.y)))
  })

  it("marks a seam as a graft between the branches and the trunk", () => {
    const seam: Node = {
      id: "open-question",
      stratum: "seam",
      epistemic: "hypothesized",
      title: "Open question",
      claim: "Layout fixture only. Not part of the H0 graph.",
    }
    const placed = placeHydrogenTree([...hydrogenNodes, seam])
    const graft = placed.find((node) => node.id === "open-question")
    const branchY = Math.max(...placed.filter((node) => node.stratum === "branch").map((node) => node.y))
    assert.ok(graft?.seam)
    assert.ok(graft.y > branchY)
    assert.ok(graft.y < HYDROGEN_Y)
  })

  it("lets accepted edges attach and stops the rejected resonance short of E₁", () => {
    assert.equal(validateGraph(hydrogenNodes, hydrogenEdges).length, 0)
    const refused = validateGraph(hydrogenNodes, [rejectedResonance])
    assert.equal(refused.length, 1)
    assert.equal(refused[0]?.code, "resonance_into_evidence")
    const placed = placeHydrogenTree(hydrogenNodes)
    const from = placed.find((node) => node.id === rejectedResonance.from)
    const to = placed.find((node) => node.id === rejectedResonance.to)
    assert.ok(from && to)
    const stop = brokenStop(from, to)
    const reached = Math.hypot(stop.x - to.x, stop.y - to.y)
    const full = Math.hypot(from.x - to.x, from.y - to.y)
    assert.ok(reached > 20)
    assert.ok(reached < full)
  })
})
