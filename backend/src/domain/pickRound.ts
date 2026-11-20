import type { DailyClose } from '../marketdata/provider.js';

/** Trading days shown, about one year (01 §6). */
export const L = 252;
/** Trading days of future behind the cutoff, about three months (01 §6). */
export const H = 63;

export type PickedRound = { cutoffIndex: number; shown: number[]; forwardReturn: number };

/**
 * Chooses a cutoff day t uniformly among the days with L closes up to and including it and H
 * closes after it (02 §6): L-1 <= t <= n-1-H. Returns the L shown closes and the frozen forward
 * return close[t+H] / close[t] - 1, or null when the series is too short. Reads nothing past t+H.
 * `rng` returns a number in [0, 1), like Math.random. Pure: the series is not modified.
 */
export function pickRound(series: DailyClose[], rng: () => number): PickedRound | null {
  const validCutoffs = series.length - L - H + 1;
  if (validCutoffs <= 0) return null;

  const t = L - 1 + Math.floor(rng() * validCutoffs);
  const shown = series.slice(t - L + 1, t + 1).map((bar) => bar.close);
  const forwardReturn = series[t + H].close / series[t].close - 1;
  return { cutoffIndex: t, shown, forwardReturn };
}
