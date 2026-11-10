import type { Mode, Phase, Subject } from "@/instruments/hollow-flame/sim";
import { deathLine, modelSubject } from "@/instruments/hollow-flame/physics";

export function phaseLabel(subject: Subject, phase: Phase) {
  const table: Record<Exclude<Subject, "manifold">, Record<Phase, string>> = {
    flame: {
      cold: "Cold wick",
      igniting: "Ignition",
      stable: "Stabilized",
      perturbed: "Perturbed",
      extinguishing: "Extinction",
      out: "Extinguished",
    },
    plasmoid: {
      cold: "Dark",
      igniting: "Breakdown",
      stable: "Confined",
      perturbed: "Disrupted",
      extinguishing: "Collapse",
      out: "Extinguished",
    },
    cell: {
      cold: "Dormant",
      igniting: "Establishing",
      stable: "Homeostatic",
      perturbed: "Insulted",
      extinguishing: "Running down",
      out: "Collapsed",
    },
  };
  return table[modelSubject(subject)][phase];
}

export function banner(subject: Subject) {
  if (subject === "plasmoid") return "Not a flame. Electromagnetic double layer.";
  if (subject === "cell") return "Not a flame. Membrane, metabolism, stored pattern.";
  if (subject === "manifold") return "Same drawing. Not the same mechanism.";
  return "Diffusion flame. The reaction is a hollow shell.";
}

export function modeHint(subject: Subject, mode: Mode) {
  const flame: Record<Mode, string> = {
    luminous: "What a camera sees. Yellow is hot soot, not the reaction itself.",
    temperature: "Illustrative thermal field. The shell is hotter than the fuel-rich core.",
    reaction: "Where fuel and oxygen meet. A thin sheet, not the yellow glow.",
    section: "Cut on the axis. Vapor in the core, oxygen inward, heat in the sheet.",
  };
  const plasmoid: Record<Mode, string> = {
    luminous: "Schematic sheath. This light is plasma, not soot.",
    temperature: "Stand-in for energy density. Not a measured temperature.",
    reaction: "The double layer — a thin drop in electric potential.",
    section: "The near half is removed so the inner layer can be seen.",
  };
  const cell: Record<Mode, string> = {
    luminous: "Membrane with a slow domain pattern. Illustrative, not a measured map.",
    temperature: "False color for resting-potential domains. Levin’s Vmem, as a sketch.",
    reaction: "Metabolic activity gathered at the boundary.",
    section: "Opened so the nucleus sits inside a maintained interior.",
  };
  const kind = modelSubject(subject);
  if (kind === "plasmoid") return plasmoid[mode];
  if (kind === "cell") return cell[mode];
  return flame[mode];
}

export function sliderMeta(subject: Subject) {
  if (subject === "plasmoid") {
    return [
      { key: "fuel" as const, label: "Drive", hint: "Electrical free energy into the sheath" },
      { key: "oxygen" as const, label: "Density", hint: "Ambient neutral gas" },
      { key: "airflow" as const, label: "Disruption", hint: "Shear on the confinement" },
    ];
  }
  if (subject === "cell") {
    return [
      { key: "fuel" as const, label: "Nutrient", hint: "Metabolic supply" },
      { key: "oxygen" as const, label: "Integrity", hint: "How well the membrane holds a gradient" },
      { key: "airflow" as const, label: "Insult", hint: "Osmotic or mechanical disturbance" },
    ];
  }
  return [
    { key: "fuel" as const, label: "Fuel", hint: "Wax vaporization into the core" },
    { key: "oxygen" as const, label: "Oxygen", hint: "Oxidizer diffusing inward" },
    { key: "airflow" as const, label: "Airflow", hint: "Crossflow that can tear the sheet" },
  ];
}

export function marginWord(subject: Subject, margin: number) {
  const death = deathLine(subject);
  if (margin < death) return "Failing";
  if (margin < death + 0.12) return "Near limit";
  return "Holding";
}

export function sheetWord(thickness: number) {
  if (thickness < 0.07) return "Thin sheet";
  if (thickness < 0.1) return "Moderate sheet";
  return "Broad sheet";
}
