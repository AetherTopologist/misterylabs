export type Stratum = "root" | "trunk" | "branch" | "seam"

export type Epistemic = "observed" | "calculated" | "interpreted" | "hypothesized"

export type Relation =
  | "derives_from"
  | "measured_by"
  | "corrects"
  | "competes_with"
  | "approximates"
  | "interprets"
  | "inspired_by"
  | "resonates_with"

export type Register =
  | "physical_correspondence"
  | "historical_influence"
  | "philosophical_resonance"
  | "spiritual_interpretation"

export type Node = {
  id: string
  stratum: Stratum
  epistemic: Epistemic
  title: string
  claim: string
  source?: string
  register?: Register
  /** Publication year of the cited source. A coordinate, not a stratum. */
  year?: number
}

/** `from` is the subject. `e1 derives_from schrodinger` points at the provider. */
export type Edge = {
  id: string
  from: string
  to: string
  relation: Relation
  epistemic: Epistemic
  note: string
}

export type Violation = {
  edgeId: string
  code: string
  message: string
}
