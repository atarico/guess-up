import type { DailyClose } from '../marketdata/provider.js';

// A round needs 252 shown closes plus 63 future ones (01 §6); 400 leaves room for several cutoffs.
export const MIN_BARS = 400;

/**
 * Whether a bar's date (YYYY-MM-DD) is a Saturday or a Sunday. No exchange in the universe trades
 * then, so such a bar is a provider error: CVS had one on Sunday 2009-07-26, at 2.4 times its neighbours.
 */
export function isWeekend(d: string): boolean {
  const day = new Date(`${d}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
}

export type SeriesCheck = { ok: true; bars: DailyClose[] } | { ok: false; reason: string };

/**
 * Decides whether one provider response can be stored as a symbol's snapshot (02 §5.2).
 * Saturday and Sunday bars are discarded first. Every remaining close must be positive, including
 * the latest one; the latest bar is then dropped, because it may be a partial trading day; at least
 * 400 bars must remain. Pure: the input is not modified.
 */
export function prepareSeries(bars: DailyClose[]): SeriesCheck {
  const weekdays = bars.filter((bar) => !isWeekend(bar.d));
  // `!(close > 0)` also catches NaN, which is what a price that was not a number turns into.
  const bad = weekdays.find((bar) => !(bar.close > 0));
  if (bad) return { ok: false, reason: `non-positive close on ${bad.d}` };

  const kept = weekdays.slice(0, -1);
  if (kept.length < MIN_BARS) {
    return { ok: false, reason: `only ${kept.length} bars after dropping the latest one (minimum ${MIN_BARS})` };
  }
  return { ok: true, bars: kept };
}
