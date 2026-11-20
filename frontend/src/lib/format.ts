// Formatting only, all through Intl with es-MX (03 §9). No currency conversion happens anywhere.

const MINUS = '−';
const NBSP = ' ';

// signDisplay 'exceptZero' decides the sign on the rounded value, so a tiny negative that rounds to
// zero shows as 0.0, never −0.0: no rounded value carries a sign the real one does not have.
const percentFormat = new Intl.NumberFormat('es-MX', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
});
const oneDecimal = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const signedOneDecimal = new Intl.NumberFormat('es-MX', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
});
const twoDecimals = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// API dates have no time: read them as UTC midnight and format in UTC, or a browser in Mexico,
// behind UTC, would show the previous day.
const fullDate = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** Intl writes negatives with a hyphen; the interface uses the real minus sign. */
const realMinus = (text: string) => text.replace('-', MINUS);

/** A return as a decimal (0.021) → `+2.1%`, `−12.4%`, `0.0%`. */
export function percent(r: number): string {
  return realMinus(percentFormat.format(r));
}

/** A difference of returns as a decimal (−0.013) → `1.3`, in percentage points; the verb carries the direction. */
export function points(d: number): string {
  return oneDecimal.format(Math.abs(d) * 100);
}

/** A coin range bound as a decimal (−0.021) → `−2.1`, `+2.0`. */
export function signedPoints(d: number): string {
  return realMinus(signedOneDecimal.format(d * 100));
}

/** A price in US dollars → `USD 1,234.56`. Never a bare `$`: in Mexico it reads as pesos. */
export function money(price: number): string {
  return `USD${NBSP}${twoDecimals.format(price)}`;
}

/** An API date `YYYY-MM-DD` → `12 mar 2019`. */
export function dateFull(iso: string): string {
  return fullDate.format(new Date(`${iso}T00:00:00Z`));
}

const wholePercent = new Intl.NumberFormat('es-MX', { style: 'percent', maximumFractionDigits: 0 });

/**
 * A share as a decimal (0.96) → `96%`, rounded down, so a claim such as "superas al 96%" is never
 * overstated. The tiny epsilon keeps 0.96, stored as 0.95999…, at 96.
 */
export function share(p: number): string {
  return wholePercent.format(Math.floor(p * 100 + 1e-9) / 100);
}
