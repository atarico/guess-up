import { describe, expect, it } from 'vitest';
import { MIN_BARS, prepareSeries } from '../src/domain/series.js';

/** `n` consecutive daily bars with positive closes, oldest first. */
function bars(n: number) {
  const start = Date.parse('2010-01-01T00:00:00Z');
  return Array.from({ length: n }, (_, i) => ({
    d: new Date(start + i * 86_400_000).toISOString().slice(0, 10),
    close: 10 + i / 100,
  }));
}

describe('prepareSeries (02 §5.2)', () => {
  it('drops the most recent bar, which may be a partial trading day, and keeps the rest in order', () => {
    const input = bars(MIN_BARS + 1);
    const result = prepareSeries(input);

    expect(result).toEqual({ ok: true, bars: input.slice(0, -1) });
  });

  it('rejects a series that keeps fewer than 400 bars after the drop', () => {
    const result = prepareSeries(bars(MIN_BARS));
    expect(result).toEqual({ ok: false, reason: 'only 399 bars after dropping the latest one (minimum 400)' });
  });

  it.each([
    ['zero', 0],
    ['negative', -1.5],
    ['not a number', Number.NaN],
  ])('rejects the whole series when any close is %s, naming the day', (_case, close) => {
    const input = bars(MIN_BARS + 10);
    input[123] = { ...input[123], close };

    expect(prepareSeries(input)).toEqual({ ok: false, reason: `non-positive close on ${input[123].d}` });
  });

  it('rejects a bad close even in the most recent bar, the one that would be dropped', () => {
    const input = bars(MIN_BARS + 10);
    input[input.length - 1] = { ...input[input.length - 1], close: 0 };

    expect(prepareSeries(input).ok).toBe(false);
  });

  it('does not modify the series it is given', () => {
    const input = bars(MIN_BARS + 1);
    const copy = structuredClone(input);
    prepareSeries(input);
    expect(input).toEqual(copy);
  });
});
