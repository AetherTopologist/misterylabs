export function sci(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  if (n === 0) return "0";
  const a = Math.abs(n);
  if (a >= 10000 || a < 0.01) return n.toExponential(digits);
  if (a >= 100) return n.toFixed(1);
  return n.toFixed(digits);
}

export function joules(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1e6) return `${sci(n / 1e6)} MJ`;
  if (Math.abs(n) >= 1e3) return `${sci(n / 1e3)} kJ`;
  return `${sci(n)} J`;
}

export function watts(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const a = Math.abs(n);
  if (a >= 1e9) return `${sci(n / 1e9)} GW`;
  if (a >= 1e6) return `${sci(n / 1e6)} MW`;
  if (a >= 1e3) return `${sci(n / 1e3)} kW`;
  return `${sci(n)} W`;
}

export function seconds(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n >= 3600) return `${sci(n / 3600)} h`;
  if (n >= 60) return `${sci(n / 60)} min`;
  return `${sci(n)} s`;
}
