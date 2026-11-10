export type Subject = "flame" | "plasmoid" | "cell" | "manifold";

export type Eval = {
  activity: number;
  secondary: number;
  margin: number;
  height: number;
  tempC: number | null;
  thickness: number;
};

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function clamp01(n: number) {
  return clamp(n, 0, 1);
}

/** Outer mixing radius of the candle envelope. KEEP IN SYNC with the flame shader. */
export function flameRadius(t: number, fuel: number) {
  const u = clamp01(t);
  const belly = Math.sin(Math.pow(u, 0.55) * Math.PI);
  return (0.04 + 0.34 * fuel) * belly * Math.pow(1 - u, 0.18);
}

/** Stoichiometric sheet inside the envelope. Low oxygen pushes it outward. */
export function shellRadius(t: number, fuel: number, oxygen: number) {
  const outer = flameRadius(t, fuel);
  const ratio = fuel / Math.max(oxygen, 0.15);
  const frac = clamp(0.46 + 0.24 * ratio, 0.4, 0.88);
  return outer * frac;
}

function evalFlame(fuel: number, oxygen: number, airflow: number): Eval {
  const starve = fuel < 0.2 ? (0.2 - fuel) / 0.2 : 0;
  const choke = oxygen < 0.24 ? (0.24 - oxygen) / 0.24 : 0;
  const blow = Math.max(0, airflow - 0.45) / 0.55;
  const quench = starve * 0.9 + choke * 0.95 + blow * 1.2;
  const mix = fuel * oxygen;
  const activity = clamp01(mix * (1 - Math.min(1, quench)));
  const margin = activity - 0.1 - blow * 0.34 - choke * 0.18 - starve * 0.16;
  const height = 0.42 + 1.4 * fuel * (0.5 + 0.5 * oxygen) * (1 - airflow * 0.48);
  const thickness = 0.055 + 0.09 * (1 - oxygen) + starve * 0.03;
  const tempC = 22 + Math.min(1.15, activity / 0.55) * 1250;
  return { activity, secondary: thickness, margin, height, tempC, thickness };
}

function evalPlasmoid(drive: number, density: number, disrupt: number): Eval {
  const sheath = drive * Math.sqrt(Math.max(density, 0));
  const shear = disrupt * disrupt * 1.15;
  const starved = density < 0.15 ? 0.5 : 0;
  const activity = clamp01(sheath * (1 - Math.min(1, shear + starved)));
  const margin = activity - 0.12 - disrupt * 0.28;
  const separation = 0.06 + 0.12 * (1 - density) + drive * 0.04;
  const height = 0.7 + 0.5 * drive * (1 - disrupt * 0.4);
  return {
    activity,
    secondary: separation,
    margin,
    height,
    tempC: null,
    thickness: separation,
  };
}

function evalCell(nutrient: number, integrity: number, insult: number): Eval {
  const metabolism = nutrient * (0.3 + 0.7 * integrity);
  const damage = insult * (1.1 - 0.65 * integrity);
  const activity = clamp01(metabolism * (1 - Math.min(1, damage)));
  const margin = activity - 0.08 - insult * 0.12;
  const gradient = clamp01(integrity * (1 - insult * 0.45));
  const height = 0.62 + 0.4 * activity;
  const thickness = 0.08 + 0.12 * (1 - integrity);
  return { activity, secondary: gradient, margin, height, tempC: null, thickness };
}

export function modelSubject(subject: Subject): Exclude<Subject, "manifold"> {
  return subject === "manifold" ? "flame" : subject;
}

export function evaluate(subject: Subject, a: number, b: number, c: number): Eval {
  const kind = modelSubject(subject);
  if (kind === "plasmoid") return evalPlasmoid(a, b, c);
  if (kind === "cell") return evalCell(a, b, c);
  return evalFlame(a, b, c);
}

/** Margin below this and the schematic boundary fails. Cells are allowed to dip. */
export function deathLine(subject: Subject) {
  const kind = modelSubject(subject);
  if (kind === "cell") return -0.08;
  if (kind === "plasmoid") return -0.02;
  return 0;
}
