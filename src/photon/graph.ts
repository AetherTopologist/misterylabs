/**
 * Exhibit graph in the Hydrogen baseline shape
 * (baselines/ride-map-thought-path/hydrogen/model).
 * canonId is the shared-forest hook. Forest links sit beside the graph:
 * they may not use evidence relations.
 */

export type Stratum = "root" | "trunk" | "branch" | "seam";

export type Epistemic = "observed" | "calculated" | "interpreted" | "hypothesized";

export type Relation =
  | "derives_from"
  | "measured_by"
  | "corrects"
  | "competes_with"
  | "approximates"
  | "interprets"
  | "inspired_by"
  | "resonates_with";

export type Register =
  | "physical_correspondence"
  | "historical_influence"
  | "philosophical_resonance"
  | "spiritual_interpretation";

export type Node = {
  id: string;
  stratum: Stratum;
  epistemic: Epistemic;
  title: string;
  claim: string;
  source?: string;
  register?: Register;
  year?: number;
  equation?: string;
  behavior?: string;
  /** Canonical id shared across exhibits. Same id, same foundation. */
  canonId?: string;
};

/** `from` is the subject. `e1 derives_from schrodinger` points at the provider. */
export type Edge = {
  id: string;
  from: string;
  to: string;
  relation: Relation;
  epistemic: Epistemic;
  note: string;
};

export type Violation = {
  edgeId: string;
  code: string;
  message: string;
};

export type ForestLink = {
  id: string;
  canonId: string;
  from: string;
  peerExhibit: "hydrogen" | "xprimeray" | "spacetime" | "perception";
  peerLabel: string;
  relation: Relation;
  epistemic: Epistemic;
  note: string;
  /** Released route. The peer name stays the scientific seam; this is only navigation. */
  href?: string;
  hrefLabel?: string;
};

const RELATIONS = new Set<Relation>([
  "derives_from",
  "measured_by",
  "corrects",
  "competes_with",
  "approximates",
  "interprets",
  "inspired_by",
  "resonates_with",
]);

const EVIDENCE = new Set<Relation>(["derives_from", "measured_by"]);

/** Hydrogen intra-exhibit rules. An invalid edge does not attach. */
export function validateGraph(nodes: Node[], edges: Edge[]): Violation[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const violations: Violation[] = [];
  const seen = new Set<string>();

  for (const node of nodes) {
    if (seen.has(node.id)) {
      violations.push({
        edgeId: node.id,
        code: "duplicate_node",
        message: `Duplicate node ${node.id}.`,
      });
    }
    seen.add(node.id);
    if (node.stratum === "branch" && !node.register) {
      violations.push({
        edgeId: node.id,
        code: "branch_without_register",
        message: `${node.id} is a branch and needs a register.`,
      });
    }
  }

  for (const edge of edges) {
    if (!RELATIONS.has(edge.relation)) {
      violations.push({
        edgeId: edge.id,
        code: "unknown_relation",
        message: `${edge.relation} is not a named relation.`,
      });
      continue;
    }
    const from = byId.get(edge.from);
    const to = byId.get(edge.to);
    if (!from || !to) {
      violations.push({
        edgeId: edge.id,
        code: "missing_endpoint",
        message: `${edge.id} points at a missing node.`,
      });
      continue;
    }
    if (EVIDENCE.has(edge.relation)) {
      if (from.stratum === "branch" || from.stratum === "seam") {
        violations.push({
          edgeId: edge.id,
          code: "evidence_from_branch",
          message: `${from.id} cannot be the subject of ${edge.relation}. A branch is not evidence.`,
        });
      }
      if (to.stratum === "branch" || to.stratum === "seam") {
        violations.push({
          edgeId: edge.id,
          code: "evidence_touches_branch",
          message: `${edge.relation} cannot use ${to.id} as a source. A branch is not evidence.`,
        });
      }
    }
    if (edge.relation === "resonates_with") {
      if (from.stratum !== "branch" || to.stratum !== "branch") {
        violations.push({
          edgeId: edge.id,
          code: "resonance_into_evidence",
          message: `resonates_with cannot touch evidence. Resonance stays on branches.`,
        });
      }
    }
    if (edge.relation === "interprets") {
      if (from.stratum !== "branch" || edge.epistemic !== "interpreted") {
        violations.push({
          edgeId: edge.id,
          code: "interpret_not_a_branch",
          message: `${edge.id} interprets, but the subject is not an interpretive branch.`,
        });
      }
    }
    if (edge.relation === "competes_with") {
      const evidenceStratum = from.stratum === "root" || from.stratum === "trunk";
      const other = to.stratum === "root" || to.stratum === "trunk";
      if (!evidenceStratum || !other) {
        violations.push({
          edgeId: edge.id,
          code: "competition_not_evidence",
          message: `${edge.id} competes, but one end is not an evidence node.`,
        });
      }
    }
    if (
      (from.register === "spiritual_interpretation" || to.register === "spiritual_interpretation") &&
      EVIDENCE.has(edge.relation)
    ) {
      violations.push({
        edgeId: edge.id,
        code: "spiritual_as_evidence",
        message: `${edge.id} puts a spiritual register on an evidence edge.`,
      });
    }
  }

  return violations;
}

const FOREST_OK = new Set<Relation>(["interprets", "inspired_by", "resonates_with"]);

/** Cross-exhibit links are seams. They cannot pretend to be derivations. */
export function validateForest(nodes: Node[], links: ForestLink[]): Violation[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const violations: Violation[] = [];
  for (const link of links) {
    if (!byId.has(link.from)) {
      violations.push({
        edgeId: link.id,
        code: "forest_missing_node",
        message: `${link.id} leaves a node that is not in this exhibit.`,
      });
    }
    if (!FOREST_OK.has(link.relation)) {
      violations.push({
        edgeId: link.id,
        code: "forest_as_evidence",
        message: `${link.id} uses ${link.relation}. Forest links cannot derive or measure.`,
      });
    }
    if (link.epistemic === "observed" || link.epistemic === "calculated") {
      violations.push({
        edgeId: link.id,
        code: "forest_overclaimed",
        message: `${link.id} is marked ${link.epistemic}. A cross-exhibit seam is not a result.`,
      });
    }
    if (!link.canonId || !link.note.trim()) {
      violations.push({
        edgeId: link.id,
        code: "forest_unlabeled",
        message: `${link.id} needs a canonical id and a note.`,
      });
    }
  }
  return violations;
}

export const photonNodes: Node[] = [
  {
    id: "pj",
    stratum: "trunk",
    epistemic: "observed",
    title: "Photon Journey",
    claim: "One instrument, two fields: a sunlit Moon and a droplet inches away.",
    behavior: "The bench solves the thin lens for whichever field is selected. Counts, pupils, and plate scale stay illustrative.",
  },
  {
    id: "irradiance",
    stratum: "trunk",
    epistemic: "calculated",
    title: "Image irradiance",
    claim:
      "For an extended source, ideal image irradiance follows luminance, f-number, and transmission — not object distance by itself.",
    equation: "E_image ∝ L · τ / N²",
    behavior: "Exposure compensation scales this preview by 2^EV. The Moon does not need a longer shutter merely because it is far.",
  },
  {
    id: "tally",
    stratum: "trunk",
    epistemic: "calculated",
    title: "Detected tally",
    claim: "The sensor integrates photoelectrons. The shutter time is not the light-travel time.",
    equation: "N̄ = η τ Φ Δt ,   Var(N) ≈ N̄ + σ_read²",
    behavior: "Basic mode parks exposure compensation on the shutter at the current f-number. Advanced mode splits shutter, aperture, and ISO. ISO never enters this count.",
  },
  {
    id: "fermat",
    stratum: "root",
    epistemic: "calculated",
    canonId: "canon.fermat",
    title: "Fermat's principle",
    claim: "A geometric ray is a stationary optical path. The travel time along it is not an exposure.",
    year: 1662,
    equation: "δ ∫ n ds = 0",
    source: "Pierre de Fermat, synthesis on refraction (1662). Textbook form: Born & Wolf, Principles of Optics.",
    behavior: "The ride draws Sun → Moon → lens as a path. The times on that path stay put when you move EV.",
  },
  {
    id: "huygens",
    stratum: "root",
    epistemic: "calculated",
    canonId: "canon.huygens-fresnel",
    title: "Huygens–Fresnel",
    claim: "A wavefront propagates by secondary wavelets. Defocus and diffraction are both propagation.",
    year: 1818,
    equation: "U(P) ∝ ∫ U(Q) (e^{ikr} / r) K(χ) dS",
    source:
      "Christiaan Huygens, Traité de la Lumière (1690). Augustin Fresnel, memoir on the diffraction of light, Académie des Sciences (1818).",
    behavior: "Focus accuracy widens the point-spread function. It does not remove photons from the ledger.",
  },
  {
    id: "maxwell",
    stratum: "root",
    epistemic: "calculated",
    canonId: "canon.maxwell",
    title: "Maxwell's theory",
    claim: "The classical field picture behind rays, energy flux, and polarization.",
    year: 1873,
    equation: "∇·E = ρ/ε₀,  ∇·B = 0,  ∇×E = −∂B/∂t,  ∇×B = μ₀J + μ₀ε₀ ∂E/∂t",
    source:
      "James Clerk Maxwell, A Treatise on Electricity and Magnetism (1873). The compact four-equation form was clarified by Heaviside and Hertz.",
    behavior: "The ledger's energy flow is a Poynting flux in this limit. The preview does not integrate the fields.",
  },
  {
    id: "photon",
    stratum: "root",
    epistemic: "calculated",
    canonId: "canon.photon",
    title: "Photon exchange",
    claim: "At detection, the field couples in quanta. Energy of one quantum is hν, not a piece of spatial detail.",
    year: 1905,
    equation: "E = hν",
    source:
      "Albert Einstein, Über einen die Erzeugung und Verwandlung des Lichtes betreffenden heuristischen Gesichtspunkt, Annalen der Physik 17, 132–148 (1905).",
    behavior: "Underexposure empties the count. The grain is shot noise on that count.",
  },
  {
    id: "etendue",
    stratum: "root",
    epistemic: "calculated",
    canonId: "canon.etendue",
    title: "Radiometry and étendue",
    claim: "Lossless passive optics conserve throughput. You cannot brighten an extended image just by standing closer without changing the pupils.",
    equation: "d²Φ = L cosθ dA dΩ",
    source:
      "Conservation of étendue, the optical Lagrange invariant. Born & Wolf, Principles of Optics. Exposure value: ISO 2720 (APEX).",
    behavior: "Moon and leaf can share a shutter. What changes is how many pixels the subject covers, and how much of the reflected light misses the pupil.",
  },
  {
    id: "diffraction",
    stratum: "root",
    epistemic: "calculated",
    canonId: "canon.diffraction-limit",
    title: "Diffraction and the Airy disk",
    claim:
      "A finite pupil cannot pass arbitrarily fine spatial frequencies. The Airy disk's first minimum sits near 1.22 λ N(1+m). Focus cannot beat that floor, and the wave toggle here does not integrate the diffraction integral.",
    year: 1835,
    equation: "r_Airy ≈ 1.22 λ N(1+m) ,   d = λ / (2 NA)",
    source:
      "George Biddell Airy, On the Diffraction of an Object-glass with Circular Aperture, Transactions of the Cambridge Philosophical Society 5, 283–291 (1835). Ernst Abbe, Beiträge zur Theorie des Mikroskops und der mikroskopischen Wahrnehmung, Archiv für mikroskopische Anatomie 9, 413–468 (1873). Lord Rayleigh, Investigations in Optics, Philosophical Magazine 8, 261–274 (1879).",
    behavior:
      "Stopping down grows the Airy disk and shrinks the geometric circle of confusion. The preview uses the Airy radius as a Gaussian sigma. A full diffraction propagation is later work.",
  },
  {
    id: "turbulence",
    stratum: "root",
    epistemic: "observed",
    canonId: "canon.seeing",
    title: "Atmospheric turbulence",
    claim: "The air column above a telescope has a coherence length. A droplet's air path does not.",
    year: 1966,
    equation: "r₀  (Fried) ,   FWHM ~ λ / r₀",
    source:
      "A. N. Kolmogorov, local structure of turbulence in an incompressible viscous fluid, Doklady Akademii Nauk SSSR 30 (1941). David L. Fried, Optical Resolution Through a Randomly Inhomogeneous Medium for Very Long and Very Short Exposures, JOSA 56, 1372–1379 (1966).",
    behavior: "The disturbance slider is fierce on the lunar crop and nearly idle on the droplet. That mismatch is the lesson.",
  },
  {
    id: "schottky",
    stratum: "root",
    epistemic: "calculated",
    canonId: "canon.shot-noise",
    title: "Shot noise",
    claim: "Independent arrivals fluctuate as the square root of the count. Dim is noisy even when the lens is sharp.",
    year: 1918,
    equation: "SNR_shot = √N̄",
    source:
      "Walter Schottky, Über spontane Stromschwankungen in verschiedenen Elektrizitätsleitern, Annalen der Physik 57, 541–567 (1918).",
    behavior: "Drive EV down. Detail disappears into the count, not into a blur kernel.",
  },
  {
    id: "lunar",
    stratum: "branch",
    epistemic: "interpreted",
    register: "physical_correspondence",
    title: "Lunar photography",
    claim: "The Moon is an extended sunlit surface. The 'Looney 11' rule is a photographer's rule of thumb, close to a sunny-16 exposure, not a derivation.",
    behavior: "Overexposure clips crater rims first. Underexposure buries the maria. Seeing warps the disk on this magnified crop.",
  },
  {
    id: "macro",
    stratum: "branch",
    epistemic: "interpreted",
    register: "physical_correspondence",
    title: "Macro imaging",
    claim:
      "Depth of field shrinks as magnification grows, and the effective f-number is N(1+m). On this 4.8 mm lens at 80 mm, m is only about 0.064 — not a 1:1 reproduction. The focus miss is still what wrecks the droplet. 1:1 would sit at 9.6 mm.",
    behavior: "At high focus accuracy the droplet stays sharper than the leaf. Miss focus and the droplet collapses. Diffraction remains at the floor.",
  },
  {
    id: "seeing-practice",
    stratum: "branch",
    epistemic: "interpreted",
    register: "physical_correspondence",
    title: "Atmospheric seeing",
    claim: "Short exposures can freeze speckles. Stacking them is a later choice. This preview only shows a single illustrative frame.",
    behavior: "Raise disturbance on the Moon, then switch to Macro without touching the slider.",
  },
  {
    id: "computational",
    stratum: "branch",
    epistemic: "interpreted",
    register: "historical_influence",
    title: "Computational photography",
    claim: "Multi-frame methods can estimate a sharper picture. They do not create spatial frequencies the pupil never passed, and they can invent plausible detail.",
    behavior: "This frame is still a single exposure. The seam next to this branch is the open question, not a result.",
  },
  {
    id: "perception",
    stratum: "branch",
    epistemic: "interpreted",
    register: "philosophical_resonance",
    canonId: "canon.measurement",
    title: "Information and perception",
    claim: "A picture that looks like the Moon is not proof the sensor resolved the Moon. Recognition and resolution are different.",
    behavior: "The crosshair is an instrument mark. It stays sharp when the image does not, because it is not in the optical path.",
  },
  {
    id: "seam-model",
    stratum: "seam",
    epistemic: "hypothesized",
    title: "Simplified sensor",
    claim: "Full well, read noise, QE, and pupil diameter are round illustrative numbers. This is not a phone's calibration file.",
    behavior: "Treat electron counts as a scale, not a lab report.",
  },
  {
    id: "seam-compute",
    stratum: "seam",
    epistemic: "hypothesized",
    title: "Open computational question",
    claim: "When does multi-frame processing recover information that was in the counts, and when does it paint a plausible crater or vein?",
    behavior: "No deconvolution is applied. The question is left open on purpose.",
  },
  {
    id: "seam-speculative",
    stratum: "seam",
    epistemic: "hypothesized",
    title: "Speculative seams",
    claim: "Links to hydrogen, curved-ray transport, and spacetime are shared language. They are not results of this preview.",
    behavior: "Read the forest as a map of foundations, not as a derivation.",
  },
  {
    id: "thin-lens",
    stratum: "root",
    epistemic: "calculated",
    canonId: "canon.thin-lens",
    title: "Thin-lens equation",
    claim:
      "A paraxial thin lens maps object distance u to image distance v. Collimated moonlight focuses at f. A droplet at finite u focuses farther, at uf/(u−f).",
    year: 1841,
    equation: "1/u + 1/v = 1/f",
    source:
      "Carl Friedrich Gauss, Dioptrische Untersuchungen (1841), the paraxial form. Textbook statement: Eugene Hecht, Optics.",
    behavior: "The bench solves this for the live stop and the selected field. Axial rays meet at v, not at the sensor, unless focus accuracy is 100%.",
  },
  {
    id: "aperture-stop",
    stratum: "root",
    epistemic: "calculated",
    canonId: "canon.entrance-pupil",
    title: "Aperture stop and entrance pupil",
    claim:
      "The stop limits the bundle. In this thin-lens model the stop sits in the lens plane, so the entrance pupil is the stop. Its diameter is f/N.",
    equation: "D = f / N",
    source: "Stops and pupils in Born & Wolf, Principles of Optics.",
    behavior: "Opening the stop collects more photons, as 1/N², and it enlarges the geometric circle of confusion whenever the sensor is off the image plane.",
  },
  {
    id: "numerical-aperture",
    stratum: "root",
    epistemic: "calculated",
    canonId: "canon.numerical-aperture",
    title: "Numerical aperture",
    claim:
      "Numerical aperture is the sine of the imaging cone. Paraxially it is 1/(2N) for a distant object, and 1/(2N(1+m)) when the conjugate is finite.",
    equation: "NA ≈ 1 / (2 N (1+m))",
    source:
      "Ernst Abbe's numerical aperture in the 1873 microscope paper, reduced to the paraxial cone in Hecht, Optics.",
    behavior: "The bench prints NA next to f-number. Diffraction tracks it. The preview does not run a vector diffraction model.",
  },
  {
    id: "circle-of-confusion",
    stratum: "root",
    epistemic: "calculated",
    canonId: "canon.circle-of-confusion",
    title: "Circle of confusion",
    claim:
      "If the sensor sits a distance δ off the image plane, the axial bundle through a pupil of diameter D lands as a disk of diameter D|δ|/v.",
    equation: "c = D |s − v| / v",
    source: "Paraxial defocus. Rudolf Kingslake, Optics in Photography.",
    behavior: "Focus accuracy moves the sensor along the axis. The loupe draws that disk from the same ray heights as the lens equation.",
  },
  {
    id: "sensor-gain",
    stratum: "root",
    epistemic: "calculated",
    canonId: "canon.sensor-gain",
    title: "Sensor gain and shot noise",
    claim:
      "ISO is a gain on the charge already collected. It does not change the photon arrival rate. Here the read noise is input-referred, so gain brightens grain without improving the electron signal-to-noise ratio.",
    equation: "DN ∝ ISO · (N̄ + noise) ,   SNR_e = N̄ / √(N̄ + σ_read²)",
    source:
      "ISO 12232 for the ISO speed of digital cameras, and Schottky's shot-noise relation. Unity gain in this illustration is ISO 100.",
    behavior: "In Advanced mode, move ISO. The photon ledger stays put. The preview brightens, and highlights reach the clip with fewer electrons.",
  },
  {
    id: "exposure-triangle",
    stratum: "trunk",
    epistemic: "calculated",
    title: "Exposure triangle",
    claim:
      "Shutter duration and aperture change how many photons arrive. ISO changes only the mapping. Exposure compensation is a camera's instruction to bias that product — not a fourth physical flux.",
    equation: "N̄ ∝ τ / N² ,   file ∝ ISO · N̄",
    source: "The photographic exposure triangle as a teaching split of the APEX exposure equation, ISO 2720.",
    behavior:
      "Basic mode keeps the v0.1 compensation slider and parks it on the shutter. Advanced mode exposes shutter, f-number, and ISO separately. The bench aperture is the same variable as the triangle's aperture.",
  },
  {
    id: "atomic-touch",
    stratum: "seam",
    epistemic: "hypothesized",
    title: "Atomic Touch",
    claim:
      "Zoom beyond the optical limit: why fingertips never touch in the classical hard-sphere sense. A future exhibit would have to leave this optical bench for electron density, electromagnetic repulsion, and quantum mechanics.",
    behavior: "Not built. The card under the tree is only the doorway.",
  },
];

export const photonEdges: Edge[] = [
  {
    id: "irr-from-etendue",
    from: "irradiance",
    to: "etendue",
    relation: "derives_from",
    epistemic: "calculated",
    note: "Ideal extended-source irradiance is a radiometric statement about luminance and f-number.",
  },
  {
    id: "irr-from-maxwell",
    from: "irradiance",
    to: "maxwell",
    relation: "derives_from",
    epistemic: "calculated",
    note: "In the ray limit the photometric flux is the Poynting flux through the pupil.",
  },
  {
    id: "tally-from-schottky",
    from: "tally",
    to: "schottky",
    relation: "derives_from",
    epistemic: "calculated",
    note: "The variance model is Poisson arrivals plus a read-noise floor.",
  },
  {
    id: "tally-from-photon",
    from: "tally",
    to: "photon",
    relation: "derives_from",
    epistemic: "calculated",
    note: "The count is in quanta. A quantum is not a unit of resolved detail.",
  },
  {
    id: "pj-from-etendue",
    from: "pj",
    to: "etendue",
    relation: "derives_from",
    epistemic: "calculated",
    note: "The exhibit's exposure claim is the étendue claim.",
  },
  {
    id: "pj-from-huygens",
    from: "pj",
    to: "huygens",
    relation: "derives_from",
    epistemic: "calculated",
    note: "The preview PSF stands in for propagation through a defocused, finite pupil.",
  },
  {
    id: "pj-from-fermat",
    from: "pj",
    to: "fermat",
    relation: "derives_from",
    epistemic: "calculated",
    note: "The ride is a geometric path. Travel time along it is displayed beside, not inside, the shutter.",
  },
  {
    id: "lunar-interprets-irr",
    from: "lunar",
    to: "irradiance",
    relation: "interprets",
    epistemic: "interpreted",
    note: "Lunar exposure practice is this irradiance claim plus a rule of thumb.",
  },
  {
    id: "lunar-interprets-turbulence",
    from: "lunar",
    to: "turbulence",
    relation: "interprets",
    epistemic: "interpreted",
    note: "The magnified crop is where seeing becomes visible. It is a choice of plate scale.",
  },
  {
    id: "macro-interprets-diffraction",
    from: "macro",
    to: "diffraction",
    relation: "interprets",
    epistemic: "interpreted",
    note: "Close focusing is where the diffraction floor and the depth of field show themselves.",
  },
  {
    id: "macro-interprets-etendue",
    from: "macro",
    to: "etendue",
    relation: "interprets",
    epistemic: "interpreted",
    note: "A near subject does not automatically demand a longer exposure.",
  },
  {
    id: "seeing-interprets-turbulence",
    from: "seeing-practice",
    to: "turbulence",
    relation: "interprets",
    epistemic: "interpreted",
    note: "Lucky imaging and the disturbance slider are practices sitting on the same root.",
  },
  {
    id: "compute-interprets-tally",
    from: "computational",
    to: "tally",
    relation: "interprets",
    epistemic: "interpreted",
    note: "Computational photography starts from counts. It is not a new conservation law.",
  },
  {
    id: "compute-inspired-huygens",
    from: "computational",
    to: "huygens",
    relation: "inspired_by",
    epistemic: "interpreted",
    note: "Deconvolution assumes a propagation kernel. Assuming one is not the same as knowing it.",
  },
  {
    id: "perception-interprets-pj",
    from: "perception",
    to: "pj",
    relation: "interprets",
    epistemic: "interpreted",
    note: "Recognition of the disk is not a measurement of resolution.",
  },
  {
    id: "thin-from-fermat",
    from: "thin-lens",
    to: "fermat",
    relation: "derives_from",
    epistemic: "calculated",
    note: "The thin-lens equation is the paraxial stationary path through one surface of power.",
  },
  {
    id: "stop-from-etendue",
    from: "aperture-stop",
    to: "etendue",
    relation: "derives_from",
    epistemic: "calculated",
    note: "The pupil is the stop that admits étendue. For this thin lens, entrance pupil and stop coincide.",
  },
  {
    id: "na-from-stop",
    from: "numerical-aperture",
    to: "aperture-stop",
    relation: "derives_from",
    epistemic: "calculated",
    note: "The imaging cone is the angle subtended by the pupil at the image.",
  },
  {
    id: "coc-from-thin",
    from: "circle-of-confusion",
    to: "thin-lens",
    relation: "derives_from",
    epistemic: "calculated",
    note: "The disk is the axial bundle evaluated off the conjugate the lens equation names.",
  },
  {
    id: "diffraction-from-huygens",
    from: "diffraction",
    to: "huygens",
    relation: "derives_from",
    epistemic: "calculated",
    note: "The Airy disk is what a finite pupil does to a Huygens wavefront. The preview only stores its radius.",
  },
  {
    id: "diffraction-from-na",
    from: "diffraction",
    to: "numerical-aperture",
    relation: "derives_from",
    epistemic: "calculated",
    note: "Abbe's resolution and the Airy radius are both statements about the numerical aperture.",
  },
  {
    id: "pj-from-thin",
    from: "pj",
    to: "thin-lens",
    relation: "derives_from",
    epistemic: "calculated",
    note: "Moonlight is the infinite conjugate. The droplet is the finite one. The bench uses both.",
  },
  {
    id: "pj-from-coc",
    from: "pj",
    to: "circle-of-confusion",
    relation: "derives_from",
    epistemic: "calculated",
    note: "Focus accuracy is a sensor placement. The preview blur for that placement is the circle of confusion.",
  },
  {
    id: "gain-from-schottky",
    from: "sensor-gain",
    to: "schottky",
    relation: "derives_from",
    epistemic: "calculated",
    note: "Gain multiplies a count that already fluctuates. It does not feed the count.",
  },
  {
    id: "gain-from-photon",
    from: "sensor-gain",
    to: "photon",
    relation: "derives_from",
    epistemic: "calculated",
    note: "ISO scales photoelectrons after the quantum has or has not been absorbed.",
  },
  {
    id: "triangle-from-gain",
    from: "exposure-triangle",
    to: "sensor-gain",
    relation: "derives_from",
    epistemic: "calculated",
    note: "One corner of the triangle is gain. The other two are the photon integral.",
  },
  {
    id: "triangle-from-etendue",
    from: "exposure-triangle",
    to: "etendue",
    relation: "derives_from",
    epistemic: "calculated",
    note: "Aperture changes collected power for an extended source as 1/N².",
  },
  {
    id: "triangle-from-stop",
    from: "exposure-triangle",
    to: "aperture-stop",
    relation: "derives_from",
    epistemic: "calculated",
    note: "The f-number on the triangle is the stop, shared with the optical bench.",
  },
  {
    id: "macro-interprets-coc",
    from: "macro",
    to: "circle-of-confusion",
    relation: "interprets",
    epistemic: "interpreted",
    note: "Missing the droplet is a sensor on the wrong side of a close conjugate.",
  },
  {
    id: "lunar-interprets-triangle",
    from: "lunar",
    to: "exposure-triangle",
    relation: "interprets",
    epistemic: "interpreted",
    note: "Looney 11 and exposure compensation are instructions about this triangle, not new optics.",
  },
];

export const forestLinks: ForestLink[] = [
  {
    id: "forest-maxwell-hydrogen",
    canonId: "canon.maxwell",
    from: "maxwell",
    peerExhibit: "hydrogen",
    peerLabel: "Emission and absorption",
    relation: "resonates_with",
    epistemic: "hypothesized",
    note: "Hydrogen lines are electromagnetic transitions. This preview does not compute a spectrum, a Balmer wavelength, or a cross-section.",
    href: "/observatory/hydrogen",
    hrefLabel: "Open Hydrogen",
  },
  {
    id: "forest-huygens-xprimeray",
    canonId: "canon.huygens-fresnel",
    from: "huygens",
    peerExhibit: "xprimeray",
    peerLabel: "Curved-ray paths",
    relation: "inspired_by",
    epistemic: "interpreted",
    note: "xPRIMEray integrates optical paths. Fermat and Huygens are the shared language. This preview does not run that integrator.",
    href: "/observatory/polar-grin",
    hrefLabel: "Open the ray pavilion",
  },
  {
    id: "forest-fermat-spacetime",
    canonId: "canon.null-geodesic",
    from: "fermat",
    peerExhibit: "spacetime",
    peerLabel: "Null paths",
    relation: "resonates_with",
    epistemic: "hypothesized",
    note: "In vacuum the geometric ray is null. Gravitational lensing belongs to a spacetime exhibit. Times here use flat-space c.",
  },
  {
    id: "forest-perception",
    canonId: "canon.measurement",
    from: "perception",
    peerExhibit: "perception",
    peerLabel: "Measurement and reading",
    relation: "interprets",
    epistemic: "interpreted",
    note: "A detected count still has to be read. The crosshair and the caption are part of the reading, not part of the flux.",
  },
];

export const graphViolations = validateGraph(photonNodes, photonEdges);
export const forestViolations = validateForest(photonNodes, forestLinks);

if (graphViolations.length || forestViolations.length) {
  throw new Error(
    [...graphViolations, ...forestViolations].map((item) => item.message).join("\n"),
  );
}
