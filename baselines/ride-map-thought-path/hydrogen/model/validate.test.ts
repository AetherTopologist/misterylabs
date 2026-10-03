import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { hydrogenEdges, hydrogenNodes, rejectedResonance } from "./graph.ts"
import type { Edge, Node } from "./types.ts"
import { validateGraph } from "./validate.ts"

describe("hydrogen graph", () => {
  it("accepts the H0 graph", () => {
    const violations = validateGraph(hydrogenNodes, hydrogenEdges)
    assert.deepEqual(violations, [])
    assert.equal(hydrogenNodes.length, 18)
    assert.equal(hydrogenEdges.length, 21)
  })

  it("rejects resonance into E₁", () => {
    const violations = validateGraph(hydrogenNodes, [rejectedResonance])
    assert.equal(violations.length, 1)
    assert.equal(violations[0]?.code, "resonance_into_evidence")
    assert.equal(violations[0]?.edgeId, "fixture-resonate-e1")
    assert.equal(rejectedResonance.to, "e1")
    assert.equal(rejectedResonance.relation, "resonates_with")
  })

  it("lets the Gaussian trial approximate E₁ without deriving it", () => {
    const node = hydrogenNodes.find((item) => item.id === "gaussian-trial")
    assert.equal(node?.stratum, "root")
    assert.equal(node?.epistemic, "calculated")
    const onto = hydrogenEdges.filter((edge) => edge.from === "gaussian-trial" && edge.to === "e1")
    assert.equal(onto.length, 1)
    assert.equal(onto[0]?.relation, "approximates")
    assert.equal(onto[0]?.id, "gaussian-approximates-e1")
    assert.ok(
      hydrogenEdges.some(
        (edge) => edge.id === "gaussian-from-schrodinger" && edge.relation === "derives_from",
      ),
    )
    assert.ok(
      hydrogenEdges.some(
        (edge) => edge.id === "gaussian-from-codata" && edge.relation === "derives_from",
      ),
    )
  })

  it("rejects a branch that tries to derive a root", () => {
    const edge: Edge = {
      id: "bad-derive",
      from: "cloud-picture",
      to: "schrodinger",
      relation: "derives_from",
      epistemic: "interpreted",
      note: "illegal",
    }
    const codes = validateGraph(hydrogenNodes, [edge]).map((item) => item.code)
    assert.ok(codes.includes("evidence_from_branch"))
  })

  it("rejects evidence taken from a spiritual register", () => {
    const nodes: Node[] = [
      ...hydrogenNodes,
      {
        id: "myth",
        stratum: "branch",
        epistemic: "interpreted",
        register: "spiritual_interpretation",
        title: "Myth",
        claim: "Not in the H0 screen.",
      },
    ]
    const edge: Edge = {
      id: "myth-derives",
      from: "e1",
      to: "myth",
      relation: "derives_from",
      epistemic: "calculated",
      note: "illegal",
    }
    const codes = validateGraph(nodes, [edge]).map((item) => item.code)
    assert.ok(codes.includes("evidence_touches_branch"))
    assert.ok(codes.includes("spiritual_as_evidence"))
  })

  it("keeps Puthoff off ψ₁₀₀ and E₁, and leaves the seam powerless", () => {
    const derived = hydrogenEdges.filter(
      (edge) =>
        edge.from === "puthoff-1987" &&
        (edge.to === "psi" || edge.to === "e1") &&
        (edge.relation === "derives_from" || edge.relation === "measured_by"),
    )
    assert.equal(derived.length, 0)
    const compete = hydrogenEdges.find((edge) => edge.id === "puthoff-competes-schrodinger")
    assert.equal(compete?.relation, "competes_with")
    const seam = hydrogenNodes.find((node) => node.id === "h-seam-1")
    assert.equal(seam?.stratum, "seam")
    assert.equal(seam?.epistemic, "hypothesized")
    assert.equal(
      hydrogenEdges.filter((edge) => edge.from === "h-seam-1" || edge.to === "h-seam-1").length,
      0,
    )
    assert.equal(hydrogenNodes.find((node) => node.id === "rutherford")?.year, 1911)
    assert.equal(hydrogenNodes.find((node) => node.id === "born-rule")?.year, 1926)
    assert.equal(hydrogenNodes.find((node) => node.id === "puthoff-1987")?.year, 1987)
  })
})
