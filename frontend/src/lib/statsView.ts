import type { CoinHistogram } from './api-types';
import { copy } from './copy';
import { percent, signedPoints } from './format';

// The arithmetic behind the stats screen's drawings: plain numbers in, plain numbers out, so the
// components only place them.

export type Direction = 'up' | 'down' | 'flat';

/**
 * Up, down or flat, read from a number as it is shown (`+2.1%`, `−12.4%`, `0.0%`). The same rule as
 * `headline()` in reveal.ts: a value that rounds to zero has no sign, so no arrow and no colour.
 */
export function directionOf(shown: string): Direction {
  if (shown.startsWith('+')) return 'up';
  if (shown.startsWith('−')) return 'down';
  return 'flat';
}

export const ARROWS: Record<Direction, string | null> = { up: '▲', down: '▼', flat: null };

/** The arrow's accessible label, the same words as the reveal's (03 §10); none where there is no arrow. */
export function arrowLabel(direction: Direction): string | null {
  return direction === 'up' ? copy.play.up : direction === 'down' ? copy.play.down : null;
}

/** The edge row: the value in percentage points with its arrow, or a dash when there is no edge. */
export function edgeView(edge: number | null): { text: string; arrow: string | null; direction: Direction } {
  if (edge === null) return { text: copy.statsScreen.missing, arrow: null, direction: 'flat' };
  const shown = signedPoints(edge);
  const direction = directionOf(shown);
  return { text: copy.statsCards.averages.points(shown), arrow: ARROWS[direction], direction };
}

/**
 * Bar widths in percent for the three averages: proportional to the size of each value, the largest
 * at 90% so it never touches the end of the track. Null and zero are empty. The value's sign is
 * written next to the bar, not drawn.
 */
export function averageBars(values: (number | null)[]): number[] {
  const largest = Math.max(0, ...values.map((v) => Math.abs(v ?? 0)));
  if (largest === 0) return values.map(() => 0);
  return values.map((v) => (Math.abs(v ?? 0) / largest) * 90);
}

/** The hit-rate ring: how much of its stroke stays empty (`circumference` when there is no rate). */
export function ringOffset(rate: number | null, circumference: number): number {
  const filled = rate === null ? 0 : Math.min(1, Math.max(0, rate));
  return circumference * (1 - filled);
}

export const STRIP_HEIGHT = 88;
const HALF = STRIP_HEIGHT / 2;
const MIN_BAR = 3;

export type StripBar = { direction: Direction; height: number; top: number };

/**
 * The strip of the last rounds, one bar each, in the order given. Height is proportional to |return|
 * against the largest in the strip (at least 0.1, so a quiet strip does not look wild), and the
 * smallest bar is 3 px so every round is visible. Up bars sit on the baseline, down bars hang from
 * it; a return that shows as 0.0% is a thin bar on the line. Direction is read from the shown value.
 */
export function stripBars(returns: number[]): StripBar[] {
  const scale = Math.max(0.1, ...returns.map(Math.abs));
  return returns.map((r) => {
    const direction = directionOf(percent(r));
    const height = Math.max(MIN_BAR, Math.round((Math.abs(r) / scale) * (HALF - 2)));
    const top = direction === 'up' ? HALF - height : direction === 'down' ? HALF + 1 : HALF - height / 2;
    return { direction, height, top };
  });
}

export type HistogramView = {
  /** Every position and size is a percent of the drawing's width, except `height`: percent of its height. */
  bins: { left: number; width: number; height: number; inBand: boolean }[];
  band: { left: number; width: number };
  marker: number;
  zero: number;
  ticks: { left: number; label: string }[];
};

const TICK_STEPS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50];

/**
 * Where everything goes in the coin card's drawing. The scale always includes the bins, p5, p95, 0
 * and the user's edge, plus a small margin, so the marker never leaves the drawing even when the
 * user is beyond every coin. A bin is gold when its centre is inside the 90% band.
 */
export function histogramView(histogram: CoinHistogram, p5: number, p95: number, edge: number): HistogramView {
  const { start, width, counts } = histogram;
  const end = width > 0 ? start + width * counts.length : start;
  let low = Math.min(start, p5, edge, 0);
  let high = Math.max(end, p95, edge, 0);
  // Every coin equal and everything at 0: give the drawing some width to stand on.
  if (high === low) {
    low -= 0.005;
    high += 0.005;
  }
  const margin = (high - low) * 0.03;
  low -= margin;
  high += margin;
  const x = (value: number) => ((value - low) / (high - low)) * 100;

  const tallest = Math.max(1, ...counts);
  const bins = counts.map((n, k) => {
    // With width 0 all the trials sit at one value: draw a narrow bar around it.
    const from = width > 0 ? start + k * width : start;
    const left = width > 0 ? x(from) : x(start) - 1.25;
    const binWidth = width > 0 ? x(from + width) - left : 2.5;
    const centre = width > 0 ? from + width / 2 : start;
    return {
      left,
      width: binWidth,
      // A bin with a single coin is still a visible sliver.
      height: n > 0 ? Math.max(2, (n / tallest) * 100) : 0,
      inBand: centre >= p5 && centre <= p95,
    };
  });

  // Ticks on round numbers of points, about six across.
  const spanPoints = (high - low) * 100;
  const step = TICK_STEPS.find((s) => s >= spanPoints / 6) ?? TICK_STEPS[TICK_STEPS.length - 1];
  const ticks: HistogramView['ticks'] = [];
  for (let k = Math.ceil((low * 100) / step); k * step <= high * 100; k++) {
    // Integers when the step is whole, so 0 reads "0" and not "0.0".
    ticks.push({ left: x((k * step) / 100), label: signedPoints((k * step) / 100).replace(/\.0$/, '') });
  }

  return { bins, band: { left: x(p5), width: x(p95) - x(p5) }, marker: x(edge), zero: x(0), ticks };
}
