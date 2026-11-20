import { describe, expect, it } from 'vitest';
import { H, L, pickRound } from '../src/domain/pickRound.js';
import type { DailyClose } from '../src/marketdata/provider.js';

/** `n` daily closes: day i has close 100 + i, on consecutive calendar days from 2010-01-01. */
function series(n: number): DailyClose[] {
  const start = Date.UTC(2010, 0, 1);
  return Array.from({ length: n }, (_, i) => ({
    d: new Date(start + i * 86_400_000).toISOString().slice(0, 10),
    close: 100 + i,
  }));
}

const lowest = () => 0;
const highest = () => 0.999_999_999;

describe('pickRound (02 §6)', () => {
  it('uses the constants of 01 §6: 252 shown days and 63 days of future', () => {
    expect(L).toBe(252);
    expect(H).toBe(63);
  });

  it('returns null when the series is too short for 252 shown days plus 63 more', () => {
    expect(pickRound(series(L + H - 1), lowest)).toBeNull();
    expect(pickRound(series(0), lowest)).toBeNull();
  });

  it('has exactly one possible cutoff for the shortest usable series', () => {
    const s = series(L + H);
    for (const rng of [lowest, () => 0.5, highest]) {
      expect(pickRound(s, rng)?.cutoffIndex).toBe(L - 1);
    }
  });

  it('lower bound: the earliest cutoff shows the first 252 closes', () => {
    const s = series(400);
    const round = pickRound(s, lowest);
    expect(round?.cutoffIndex).toBe(L - 1);
    expect(round?.shown).toHaveLength(L);
    expect(round?.shown[0]).toBe(s[0].close);
    expect(round?.shown[L - 1]).toBe(s[L - 1].close);
  });

  it('upper bound: the latest cutoff leaves exactly 63 closes after it', () => {
    const s = series(400);
    const round = pickRound(s, highest);
    expect(round?.cutoffIndex).toBe(400 - 1 - H);
    expect(round?.shown).toHaveLength(L);
    expect(round?.shown[L - 1]).toBe(s[400 - 1 - H].close);
  });

  it('chooses the cutoff uniformly among the valid days', () => {
    // 400 closes give 86 valid cutoffs (251..336); half way is 251 + 43.
    expect(pickRound(series(400), () => 0.5)?.cutoffIndex).toBe(L - 1 + 43);
  });

  it('computes the forward return as close[t + 63] / close[t] - 1', () => {
    const s = series(400);
    const round = pickRound(s, lowest);
    // close[251] = 351, close[314] = 414
    expect(round?.forwardReturn).toBeCloseTo(414 / 351 - 1, 12);
  });

  it('never reads a close after t + 63', () => {
    const s = series(400);
    const limit = L - 1 + H; // with the lowest rng, t = 251
    const guarded = new Proxy(s, {
      get(target, key, receiver) {
        if (typeof key === 'string' && /^\d+$/.test(key) && Number(key) > limit) {
          throw new Error(`read index ${key}, past t + H`);
        }
        return Reflect.get(target, key, receiver);
      },
    });
    expect(() => pickRound(guarded, lowest)).not.toThrow();
  });

  it('does not modify the series', () => {
    const s = series(320);
    const copy = structuredClone(s);
    pickRound(s, () => 0.3);
    expect(s).toEqual(copy);
  });
});
