import { describe, expect, it } from 'vitest';
import { normalise } from '../src/domain/normalise.js';

describe('normalise (02 §6)', () => {
  it('maps the minimum to 0, the maximum to 1 and everything else in proportion', () => {
    expect(normalise([2, 4, 6, 10])).toEqual([0, 0.25, 0.5, 1]);
  });

  it('keeps the length and every value in [0, 1]', () => {
    const values = Array.from({ length: 252 }, (_, i) => 50 + 20 * Math.sin(i / 9) + i / 10);
    const out = normalise(values);
    expect(out).toHaveLength(252);
    expect(out.every((v) => v >= 0 && v <= 1)).toBe(true);
    expect(Math.min(...out)).toBe(0);
    expect(Math.max(...out)).toBe(1);
  });

  it('returns 0.5 everywhere for a flat window', () => {
    expect(normalise([7, 7, 7])).toEqual([0.5, 0.5, 0.5]);
    expect(normalise([7])).toEqual([0.5]);
  });

  it('gives the same points when every price is scaled, so a split-adjusted refresh draws the same chart', () => {
    const values = [61.2, 58.4, 63.9, 70.1, 41.9, 55];
    const scaled = values.map((v) => v * 0.25);
    const rescaled = values.map((v) => v * 3.7);
    normalise(scaled).forEach((v, i) => expect(v).toBeCloseTo(normalise(values)[i], 12));
    normalise(rescaled).forEach((v, i) => expect(v).toBeCloseTo(normalise(values)[i], 12));
  });

  it('does not modify its input', () => {
    const values = [3, 1, 2];
    normalise(values);
    expect(values).toEqual([3, 1, 2]);
  });
});
