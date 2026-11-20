import { describe, expect, it } from 'vitest';
import type { CoinHistogram } from './api-types';
import { averageBars, directionOf, edgeView, histogramView, ringOffset, stripBars } from './statsView';

const MINUS = '−';

describe('directionOf: one rule for arrow and colour, from the number as shown', () => {
  it('reads the sign of the shown text', () => {
    expect(directionOf('+2.1%')).toBe('up');
    expect(directionOf(`${MINUS}12.4%`)).toBe('down');
    expect(directionOf('0.0%')).toBe('flat');
  });
});

describe('edgeView', () => {
  it('a negative edge: down arrow, minus sign, puntos', () => {
    expect(edgeView(-0.013)).toEqual({ text: `${MINUS}1.3 puntos`, arrow: '▼', direction: 'down' });
  });
  it('a positive edge: up arrow', () => {
    expect(edgeView(0.02)).toEqual({ text: '+2.0 puntos', arrow: '▲', direction: 'up' });
  });
  it('an edge that rounds to zero has no arrow and no sign, as shown', () => {
    expect(edgeView(-0.00004)).toEqual({ text: '0.0 puntos', arrow: null, direction: 'flat' });
  });
  it('null is a dash', () => {
    expect(edgeView(null)).toEqual({ text: '—', arrow: null, direction: 'flat' });
  });
});

describe('averageBars', () => {
  it('widths are proportional to |value|, the largest at 90%', () => {
    expect(averageBars([0.021, 0.034, 0.054])).toEqual([35, 56.67, 90].map((n) => expect.closeTo(n, 1)));
  });
  it('null and zero are empty; negatives use their size', () => {
    expect(averageBars([null, 0, -0.045, 0.09])).toEqual([0, 0, 45, 90]);
  });
  it('all empty: no division by zero', () => {
    expect(averageBars([null, 0, 0])).toEqual([0, 0, 0]);
  });
});

describe('ringOffset', () => {
  it('is the full circumference at 0, nothing at 1, clamped', () => {
    expect(ringOffset(0, 100)).toBe(100);
    expect(ringOffset(1, 100)).toBe(0);
    expect(ringOffset(0.25, 100)).toBe(75);
    expect(ringOffset(1.2, 100)).toBe(0);
    expect(ringOffset(null, 100)).toBe(100);
  });
});

describe('stripBars', () => {
  it('height is proportional to |return|, up bars sit above the baseline and down bars below', () => {
    const [up, down, flat] = stripBars([0.1, -0.05, 0.0001]);
    expect(up).toMatchObject({ direction: 'up', height: 42, top: 2 });
    expect(down).toMatchObject({ direction: 'down', height: 21, top: 45 });
    // Shown as 0.0%: a thin bar on the baseline, neither up nor down.
    expect(flat).toMatchObject({ direction: 'flat', height: 3, top: 42.5 });
  });
  it('the scale never clips: the largest return fills the half height', () => {
    const [big] = stripBars([0.9, 0.1]);
    expect(big.height).toBe(42);
  });
  it('a tiny but visible return still shows', () => {
    const bars = stripBars([0.3, 0.011]);
    expect(bars[1].height).toBeGreaterThanOrEqual(3);
  });
});

describe('histogramView', () => {
  // 40 bins from -5 to +5 points.
  const hist: CoinHistogram = { start: -0.05, width: 0.0025, counts: Array.from({ length: 40 }, (_, k) => (k === 20 ? 100 : 50)) };
  const inside = (n: number) => n >= 0 && n <= 100;

  it('colours bins by their centre: inside p5..p95 in the band, the rest outside', () => {
    const v = histogramView(hist, -0.02, 0.02, 0.0);
    // Bin 12 is centred at -1.875 (inside), bin 5 at -3.625 (outside).
    expect(v.bins[12].inBand).toBe(true);
    expect(v.bins[5].inBand).toBe(false);
    expect(v.bins[35].inBand).toBe(false);
  });
  it('heights are relative to the tallest bin', () => {
    const v = histogramView(hist, -0.02, 0.02, 0);
    expect(v.bins[20].height).toBe(100);
    expect(v.bins[0].height).toBe(50);
  });
  it('an empty bin has no height, a bin of one still shows', () => {
    const v = histogramView({ start: 0, width: 0.01, counts: [0, 1, 1000] }, 0, 0.02, 0.01);
    expect(v.bins[0].height).toBe(0);
    expect(v.bins[1].height).toBeGreaterThanOrEqual(2);
  });
  it('the band, the marker and the zero are inside the drawing, even when the edge is outside every bin', () => {
    for (const edge of [-0.2, 0.2, 0, -0.03]) {
      const v = histogramView(hist, -0.02, 0.02, edge);
      for (const n of [v.band.left, v.band.left + v.band.width, v.marker, v.zero]) expect(inside(n)).toBe(true);
      for (const bin of v.bins) expect(inside(bin.left) && inside(bin.left + bin.width)).toBe(true);
    }
  });
  it('the marker sits at the edge: further right for a larger edge', () => {
    expect(histogramView(hist, -0.02, 0.02, 0.01).marker).toBeGreaterThan(histogramView(hist, -0.02, 0.02, -0.01).marker);
  });
  it('width 0 (every coin equal): one finite bin, no NaN anywhere', () => {
    const v = histogramView({ start: 0.004, width: 0, counts: [2000] }, 0.004, 0.004, 0.004);
    const numbers = [v.marker, v.zero, v.band.left, v.band.width, ...v.bins.flatMap((b) => [b.left, b.width, b.height])];
    expect(numbers.every(Number.isFinite)).toBe(true);
    expect(v.bins).toHaveLength(1);
    expect(v.bins[0].inBand).toBe(true);
  });
  it('axis ticks fall on round numbers of points, with 0 among them', () => {
    const v = histogramView(hist, -0.02, 0.02, 0);
    expect(v.ticks.map((t) => t.label)).toEqual([`${MINUS}4`, `${MINUS}2`, '0', '+2', '+4']);
    expect(v.ticks.every((t) => inside(t.left))).toBe(true);
  });
});
