import { describe, expect, it } from 'vitest';
import { coinBenchmark, coinHistogram, coinSeed, mulberry32, TRIALS } from '../src/domain/coin.js';

const mixed = [0.12, -0.08, 0.03, -0.15, 0.2, 0.01, -0.02, 0.07, -0.11, 0.05, 0.09, -0.04, 0.16, -0.06, 0.0, 0.02];

describe('mulberry32', () => {
  it('gives the same sequence for the same seed, in [0, 1)', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = Array.from({ length: 50 }, a);
    expect(Array.from({ length: 50 }, b)).toEqual(seqA);
    expect(seqA.every((x) => x >= 0 && x < 1)).toBe(true);
    expect(Array.from({ length: 5 }, mulberry32(43))).not.toEqual(seqA.slice(0, 5));
  });
});

describe('coinSeed (02 §6: user id and number of decided rounds)', () => {
  it('is stable for the same user and count, and changes when either changes', () => {
    expect(coinSeed('user-a', 12)).toBe(coinSeed('user-a', 12));
    expect(coinSeed('user-a', 13)).not.toBe(coinSeed('user-a', 12));
    expect(coinSeed('user-b', 12)).not.toBe(coinSeed('user-a', 12));
    expect(Number.isInteger(coinSeed('user-a', 12))).toBe(true);
    expect(coinSeed('user-a', 12)).toBeGreaterThanOrEqual(0);
  });
});

describe('coinBenchmark (02 §6, §9)', () => {
  it('gives the same result for the same seed, and a different one for another seed', () => {
    expect(coinBenchmark(mixed, 6, 7)).toEqual(coinBenchmark(mixed, 6, 7));
    expect(coinBenchmark(mixed, 6, 8).edges).not.toEqual(coinBenchmark(mixed, 6, 7).edges);
  });

  it('runs 2,000 trials by default', () => {
    expect(TRIALS).toBe(2000);
    expect(coinBenchmark(mixed, 6, 7).edges).toHaveLength(2000);
  });

  it('has p5 <= 0 <= p95 on a mixed sample', () => {
    const { p5, p95 } = coinBenchmark(mixed, 6, 7);
    expect(p5).toBeLessThanOrEqual(0);
    expect(p95).toBeGreaterThanOrEqual(0);
  });

  it('keeps nine trials in ten between p5 and p95, inclusive', () => {
    const { p5, p95, edges } = coinBenchmark(mixed, 6, 7);
    expect(edges.filter((e) => e >= p5 && e <= p95).length).toBeGreaterThanOrEqual(1800);
  });

  it('has zero spread when the coin buys every round', () => {
    const { p5, p95, edges } = coinBenchmark(mixed, mixed.length, 7);
    expect(p5).toBeCloseTo(0, 12);
    expect(p95 - p5).toBeCloseTo(0, 12);
    expect(edges.every((e) => Math.abs(e) < 1e-12)).toBe(true);
  });

  it('scores each trial as mean(chosen) - mean(all)', () => {
    // Two rounds, one buy: every trial picks +10% (edge +0.1) or -10% (edge -0.1).
    const { p5, p95, edges } = coinBenchmark([0.1, -0.1], 1, 7);
    expect(new Set(edges.map((e) => e.toFixed(6)))).toEqual(new Set(['0.100000', '-0.100000']));
    expect(p5).toBeCloseTo(-0.1, 12);
    expect(p95).toBeCloseTo(0.1, 12);
  });

  it('chooses without replacement', () => {
    // With replacement, two buys could both be the 1 and reach an edge of 2/3; without it the best is 1/6.
    const { edges } = coinBenchmark([0, 0, 1], 2, 7);
    expect(Math.max(...edges)).toBeCloseTo(0.5 - 1 / 3, 12);
  });

  it('does not modify the returns', () => {
    const returns = [...mixed];
    coinBenchmark(returns, 6, 7);
    expect(returns).toEqual(mixed);
  });
});

describe('coinHistogram (C1: 40 equal bins from the smallest to the largest edge)', () => {
  const edges = [-0.05, -0.02, 0, 0.01, 0.01, 0.03, 0.04, 0.05];

  it('has 40 bins and counts every edge exactly once', () => {
    const { counts } = coinHistogram(edges);
    expect(counts).toHaveLength(40);
    expect(counts.reduce((sum, c) => sum + c, 0)).toBe(edges.length);
  });

  it('starts at the minimum, spans to the maximum, and puts them in the first and last bins', () => {
    const { start, width, counts } = coinHistogram(edges);
    expect(start).toBe(-0.05);
    expect(start + width * 40).toBeCloseTo(0.05, 12);
    expect(counts[0]).toBe(1);
    expect(counts[39]).toBe(1);
  });

  it('puts a value exactly on an inner boundary in the upper bin', () => {
    // Bins of width 1 from 0 to 40: the edge 10 opens bin 10, it does not close bin 9.
    const { counts } = coinHistogram([0, 10, 40]);
    expect(counts[9]).toBe(0);
    expect(counts[10]).toBe(1);
    expect(counts[39]).toBe(1);
  });

  it('keeps the largest edge in the last bin even when floating point rounds the index up', () => {
    const odd = [0.1, 0.3, 0.7];
    const { counts } = coinHistogram(odd);
    expect(counts[39]).toBe(1);
    expect(counts.reduce((sum, c) => sum + c, 0)).toBe(3);
  });

  it('uses one bin of width 0 when every edge is equal', () => {
    expect(coinHistogram([0.02, 0.02, 0.02])).toEqual({ start: 0.02, width: 0, counts: [3] });
  });

  it('does not modify the edges', () => {
    const input = [0.03, -0.01, 0.02];
    coinHistogram(input);
    expect(input).toEqual([0.03, -0.01, 0.02]);
  });
});
