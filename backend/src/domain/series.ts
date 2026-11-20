import type { DailyClose } from '../marketdata/provider.js';

// A round needs 252 shown closes plus 63 future ones (01 §6); 400 leaves room for several cutoffs.
export const MIN_BARS = 400;

export type SeriesCheck = { ok: true; bars: DailyClose[] } | { ok: false; reason: string };

/**
 * Decides whether one provider response can be stored as a symbol's snapshot (02 §5.2).
 * Every close of the response must be positive, including the latest one; the latest bar is
 * then dropped, because it may be a partial trading day; at least 400 bars must remain.
 * Pure: the input is not modified.
 */
export function prepareSeries(bars: DailyClose[]): SeriesCheck {
  // `!(close > 0)` also catches NaN, which is what a price that was not a number turns into.
  const bad = bars.find((bar) => !(bar.close > 0));
  if (bad) return { ok: false, reason: `non-positive close on ${bad.d}` };

  const kept = bars.slice(0, -1);
  if (kept.length < MIN_BARS) {
    return { ok: false, reason: `only ${kept.length} bars after dropping the latest one (minimum ${MIN_BARS})` };
  }
  return { ok: true, bars: kept };
}
