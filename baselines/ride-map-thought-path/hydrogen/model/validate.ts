import type { Edge, Node, Violation } from "./types"

const RELATIONS = new Set([
  "derives_from",
  "measured_by",
  "corrects",
  "competes_with",
  "approximates",
  "interprets",
  "inspired_by",
  "resonates_with",
])

const EVIDENCE = new Set(["derives_from", "measured_by"])

/**
 * Roots may carry evidence. Branches may interpret or inspire.
 * A branch cannot derive or measure. Resonance cannot land on evidence,
 * including the trunk eigenvalue E₁.
 */
export function validateGraph(nodes: Node[], edges: Edge[]): Violation[] {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const violations: Violation[] = []

  const seen = new Set<string>()
  for (const node of nodes) {
    if (seen.has(node.id)) {
      violations.push({
        edgeId: node.id,
        code: "duplicate_node",
        message: `Duplicate node ${node.id}.`,
      })
    }
    seen.add(node.id)
    if (node.stratum === "branch" && !node.register) {
      violations.push({
        edgeId: node.id,
        code: "branch_without_register",
        message: `${node.id} is a branch and needs a register.`,
      })
    }
  }

  for (const edge of edges) {
    if (!RELATIONS.has(edge.relation)) {
      violations.push({
        edgeId: edge.id,
        code: "unknown_relation",
        message: `${edge.relation} is not a named relation.`,
      })
      continue
    }
    const from = byId.get(edge.from)
    const to = byId.get(edge.to)
    if (!from || !to) {
      violations.push({
        edgeId: edge.id,
        code: "missing_endpoint",
        message: `${edge.id} points at a missing node.`,
      })
      continue
    }

    if (EVIDENCE.has(edge.relation)) {
      if (from.stratum === "branch" || from.stratum === "seam") {
        violations.push({
          edgeId: edge.id,
          code: "evidence_from_branch",
          message: `${from.id} cannot be the subject of ${edge.relation}. A branch is not evidence.`,
        })
      }
      if (to.stratum === "branch" || to.stratum === "seam") {
        violations.push({
          edgeId: edge.id,
          code: "evidence_touches_branch",
          message: `${edge.relation} cannot use ${to.id} as a source. A branch is not evidence.`,
        })
      }
    }

    if (edge.relation === "resonates_with") {
      if (from.stratum !== "branch" || to.stratum !== "branch") {
        violations.push({
          edgeId: edge.id,
          code: "resonance_into_evidence",
          message: `resonates_with cannot touch ${from.stratum === "branch" ? to.id : from.id}. Resonance stays on branches and does not land on ${to.title}.`,
        })
      }
    }

    if (edge.relation === "interprets") {
      if (from.stratum !== "branch" || edge.epistemic !== "interpreted") {
        violations.push({
          edgeId: edge.id,
          code: "interpret_not_a_branch",
          message: `${edge.id} interprets, but the subject is not an interpretive branch.`,
        })
      }
    }

    if (edge.relation === "competes_with") {
      const evidenceStratum = from.stratum === "root" || from.stratum === "trunk"
      const other = to.stratum === "root" || to.stratum === "trunk"
      if (!evidenceStratum || !other) {
        violations.push({
          edgeId: edge.id,
          code: "competition_not_evidence",
          message: `${edge.id} competes, but one end is not an evidence node.`,
        })
      }
    }

    if (
      from.register === "spiritual_interpretation" ||
      to.register === "spiritual_interpretation"
    ) {
      if (EVIDENCE.has(edge.relation)) {
        violations.push({
          edgeId: edge.id,
          code: "spiritual_as_evidence",
          message: `${edge.id} puts a spiritual register on an evidence edge.`,
        })
      }
    }
  }

  return violations
}
