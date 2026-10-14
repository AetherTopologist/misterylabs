/** Contextual citations. Status is part of the sentence. Links were checked for this sprint. */

export type ResearchStatus = "Established physics" | "Published hypothesis" | "Historical testimony" | "Unverified claim" | "Simulation assumption";

export type ResearchNode = {
  id: string;
  title: string;
  status: ResearchStatus;
  when: string;
  text: string;
  href?: string;
  contexts: Array<"null" | "phase" | "schwinger" | "transport" | "always">;
};

export const RESEARCH: ResearchNode[] = [
  {
    id: "maxwell-dipole",
    title: "Hertzian point dipole",
    status: "Simulation assumption",
    when: "This instrument",
    contexts: ["always"],
    text: "TRIAD solves prescribed oscillating electric dipoles with the full near, intermediate, and far Hertzian field. Mutual impedance is omitted. These sources are not magnetized plasma spheres and not finite current loops.",
  },
  {
    id: "schwinger-1951",
    title: "Schwinger, vacuum polarization",
    status: "Established physics",
    when: "Phys. Rev. 82, 664 (1951)",
    href: "https://doi.org/10.1103/PhysRev.82.664",
    contexts: ["schwinger"],
    text: "Gauge-invariant vacuum polarization in a prescribed field, including the constant-field effective Lagrangian. The pair series in TRIAD is the later constant-field rate, n = 1…4, not this whole paper and not a transport model.",
  },
  {
    id: "dunne",
    title: "Heisenberg–Euler review",
    status: "Established physics",
    when: "arXiv:hep-th/0406216",
    href: "https://arxiv.org/abs/hep-th/0406216",
    contexts: ["schwinger"],
    text: "Dunne reviews the constant-field effective Lagrangian and where the slowly varying assumption enters. TRIAD does not invent a universal validity threshold for that assumption.",
  },
  {
    id: "reconnection",
    title: "Magnetic reconnection",
    status: "Established physics",
    when: "Rev. Mod. Phys. 82, 603 (2010)",
    href: "https://doi.org/10.1103/RevModPhys.82.603",
    contexts: ["null", "transport"],
    text: "Yamada, Kulsrud, and Ji review reconnection in laboratory and space plasmas. A magnetic null, a picture of crossed lines, or three nodes moving together is not that process. TRIAD has no resistivity, no plasma, and no reconnection solver.",
  },
  {
    id: "schwinger-lattice",
    title: "Schwinger, nuclear energy in a lattice",
    status: "Published hypothesis",
    when: "Z. Phys. D 15, 221 (1990)",
    href: "https://doi.org/10.1007/BF01437184",
    contexts: ["schwinger"],
    text: "A lattice cold-fusion hypothesis. It is not the 1951 vacuum-polarization calculation. TRIAD does not model a metal lattice or a nuclear rate.",
  },
  {
    id: "schwinger-hypothesis",
    title: "Schwinger, cold fusion: a hypothesis",
    status: "Published hypothesis",
    when: "Z. Naturforsch. 45a, 756 (1990)",
    href: "https://www.znaturforsch.com/aa/v45a/45a0756.pdf",
    contexts: ["schwinger"],
    text: "Schwinger argued the reported heat was not ordinary DD fusion. Separate claim from vacuum polarization. Not used by the Maxwell solver.",
  },
  {
    id: "nsf-epri",
    title: "NSF/EPRI workshop",
    status: "Historical testimony",
    when: "16–18 Oct 1989, Washington",
    href: "https://newenergytimes.com/v2/archives/NSF-EPRI-Washington/epri-nsf.shtml",
    contexts: ["transport"],
    text: "Workshop on anomalous effects in deuterided metals. Proceedings published 1993. Paul Werbos is named on the editorial committee. That documents participation. It does not document a suppressed experiment. The link is a secondary archive of the proceedings, not a new result.",
  },
  {
    id: "holt",
    title: "Holt, field resonance propulsion",
    status: "Published hypothesis",
    when: "NASA-TM-80961 (1979)",
    href: "https://ntrs.nasa.gov/citations/19800010907",
    contexts: ["transport"],
    text: "A speculative memorandum on pulsed electromagnetic waveforms and gravitational waveforms. Holt's foreword says the work was unofficial and that NASA was not doing UFO research. TRIAD does not implement this resonance.",
  },
  {
    id: "puthoff",
    title: "Puthoff, gravity as a ZPF force",
    status: "Published hypothesis",
    when: "Phys. Rev. A 39, 2333 (1989)",
    href: "https://doi.org/10.1103/PhysRevA.39.2333",
    contexts: ["transport"],
    text: "A model in which gravity is induced by zero-point fluctuations. Published, and not an established spacecraft mechanism. TRIAD does not engineer the vacuum and does not modify the metric.",
  },
  {
    id: "werbos-teller",
    title: "Werbos on Teller and Schwinger",
    status: "Unverified claim",
    when: "Reported private conversations",
    contexts: ["transport"],
    text: "Claims of private Teller–Schwinger conversations, attributed to Paul Werbos, are unverified testimony. They are not a paper. Werbos's role on the 1989 workshop committee is a separate, documented fact and does not prove those conversations or a suppression claim.",
  },
  {
    id: "forbes",
    title: "Ashton Forbes, October 2026",
    status: "Unverified claim",
    when: "Contemporary public interpretation",
    contexts: ["null", "phase", "transport"],
    text: "A description of three plasma-like spheres in a rotating snowflake, taken toward a critical transition. No peer-reviewed identifier was attached for this sprint. TRIAD tests the electromagnetic geometry. It does not test or adopt the conclusion.",
  },
];

export function researchFor(flags: { nulls: boolean; phase: boolean; schwinger: boolean; transport: boolean }) {
  const want = new Set<ResearchNode["contexts"][number]>(["always"]);
  if (flags.nulls) want.add("null");
  if (flags.phase) want.add("phase");
  if (flags.schwinger) want.add("schwinger");
  if (flags.transport) want.add("transport");
  return RESEARCH.filter((node) => node.contexts.some((c) => want.has(c)));
}

export type MechanismId = "reconnection" | "metric" | "waveguide";

export const MECHANISMS: { id: MechanismId; title: string; need: string; modeled: string; observable: string; contradict: string }[] = [
  {
    id: "reconnection",
    title: "Plasma reconnection",
    need: "A plasma with frozen-in flux, a non-ideal term (resistivity, electron inertia, or an equivalent), and a change of magnetic connectivity. Ideal Maxwell superposition of prescribed dipoles does not supply that.",
    modeled: "Not modeled. Mode A draws the dipole field only. A null or a changed snapshot is not Mode B.",
    observable: "A documented reconnection rate, a plasma inflow and outflow, and a topology change in a plasma magnetic field. Not a picture of three nodes.",
    contradict: "No plasma current, no electric field along a separator in a conducting fluid, or a topology that is only the linear superposition of fixed dipoles.",
  },
  {
    id: "metric",
    title: "Metric or transport",
    need: "A stress-energy source, a gravitational field equation, and a solved path. Electromagnetic invariants are not that source term inside this instrument.",
    modeled: "Not modeled. The anchor ray and the vacuum-bore graphic do not enter fieldAt, the pair series, the reservoir, or the controller.",
    observable: "A measured geodesic deviation or a clock comparison predicted by the metric. Not an E/Es reading.",
    contradict: "Any claim that crossing Es, finding a null, or drawing a line to a destination is already a solved path.",
  },
  {
    id: "waveguide",
    title: "Field waveguide",
    need: "A boundary, a mode cutoff, and a guided power flux that is not just the free-space Poynting vector of three dipoles.",
    modeled: "Not modeled. Cycle-average ⟨S⟩ is displayed as a sketch. There is no duct and no wall.",
    observable: "Power that stays on a channel when the sources are fixed, with a measured attenuation.",
    contradict: "Flux that is only the ordinary radiated power of the dipoles, or a drawing that has no boundary condition.",
  },
];
