const SUPERS = "⁰¹²³⁴⁵⁶⁷⁸⁹"

function superscript(value: number): string {
  const sign = value < 0 ? "⁻" : ""
  const digits = String(Math.abs(value)).replace(/\d/g, (digit) => SUPERS[Number(digit)] ?? digit)
  return sign + digits
}

export function formatSeconds(value: number): string {
  const exp = Math.floor(Math.log10(value))
  const mantissa = value / 10 ** exp
  return `${mantissa.toFixed(4)}×10${superscript(exp)} s`
}

export function formatTiny(value: number): string {
  if (value === 0) return "0"
  const exp = Math.floor(Math.log10(Math.abs(value)))
  const mantissa = value / 10 ** exp
  return `${mantissa.toFixed(3)}×10${superscript(exp)}`
}

export function formatPm(meters: number): string {
  return `${(meters * 1e12).toFixed(4)} pm`
}
