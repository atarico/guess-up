import { describe, expect, it } from 'vitest';
import { coinHistogram } from '../src/domain/coin.js';
import { computeStats, type DecidedRound, isCorrect, needsCoin, streaks } from '../src/domain/stats.js';

describe('isCorrect (01 §6, 02 §6)', () => {
  it('a buy is right only when the forward return is above zero', () => {
    expect(isCorrect('buy', 0.021)).toBe(true);
    expect(isCorrect('buy', 0)).toBe(false);
    expect(isCorrect('buy', -0.124)).toBe(false);
  });

  it('a pass is right when the forward return is zero or below', () => {
    expect(isCorrect('pass', -0.124)).toBe(true);
    expect(isCorrect('pass', 0)).toBe(true);
    expect(isCorrect('pass', 0.021)).toBe(false);
  });
});

const right: DecidedRound = { decision: 'buy', r: 0.1 };
const wrong: DecidedRound = { decision: 'buy', r: -0.1 };

describe('streaks (01 §8: consecutive right calls, current and best)', () => {
  it('is zero for no rounds', () => {
    expect(streaks([])).toEqual({ current: 0, best: 0 });
  });

  it('counts the run at the end as current and the longest run as best', () => {
    expect(streaks([right, right, wrong, right])).toEqual({ current: 1, best: 2 });
    expect(streaks([right, wrong, right, right, right, wrong])).toEqual({ current: 0, best: 3 });
  });

  it('has current equal to best when every call was right', () => {
    expect(streaks([right, right, right])).toEqual({ current: 3, best: 3 });
  });

  it('is zero when every call was wrong', () => {
    expect(streaks([wrong, wrong])).toEqual({ current: 0, best: 0 });
  });

  it('judges each round with isCorrect, passes included', () => {
    const rightPass: DecidedRound = { decision: 'pass', r: 0 };
    const wrongPass: DecidedRound = { decision: 'pass', r: 0.05 };
    expect(streaks([rightPass, right, wrongPass, rightPass])).toEqual({ current: 1, best: 2 });
  });
});

describe('computeStats (01 §8, 02 §6)', () => {
  const buy = (r: number): DecidedRound => ({ decision: 'buy', r });
  const pass = (r: number): DecidedRound => ({ decision: 'pass', r });
  /** Ten rounds: five buys returning `x`, five passes returning `y`; the edge is (x - y) / 2. */
  const tenRounds = (x: number, y: number) => [...Array(5).fill(buy(x)), ...Array(5).fill(pass(y))];
  const wideCoin = { p5: -1, p95: 1, edges: [-1, 0, 1] };

  it('matches the worked example of 01 §8 exactly', () => {
    const stats = computeStats([buy(0.1), buy(-0.05), pass(0.08), pass(0.02)], null);
    expect(stats.avgPicks).toBeCloseTo(0.025, 12);
    expect(stats.avgAll).toBeCloseTo(0.0375, 12);
    expect(stats.avgPassed).toBeCloseTo(0.05, 12);
    expect(stats.edge).toBeCloseTo(-0.0125, 12);
    expect(stats.hitRate).toBe(0.25);
    expect(stats).toMatchObject({ rounds: 4, buys: 2, passes: 2, verdict: 'insufficient', roundsUntilVerdict: 6, coin: null });
  });

  it('has nothing to average with no decided rounds', () => {
    expect(computeStats([], null)).toEqual({
      rounds: 0,
      buys: 0,
      passes: 0,
      avgPicks: null,
      avgAll: null,
      avgPassed: null,
      edge: null,
      coin: null,
      verdict: 'insufficient',
      roundsUntilVerdict: 10,
      hitRate: null,
      streak: { current: 0, best: 0 },
    });
  });

  it('says insufficient under 10 rounds, before anything else', () => {
    const nineWithoutBuys = Array(9).fill(pass(0.01));
    expect(computeStats(nineWithoutBuys, null)).toMatchObject({ verdict: 'insufficient', roundsUntilVerdict: 1 });
  });

  it('bought_none: no buys, so no picks and no edge', () => {
    const stats = computeStats(Array(10).fill(pass(0.02)), null);
    expect(stats).toMatchObject({ verdict: 'bought_none', avgPicks: null, edge: null, coin: null, roundsUntilVerdict: 0 });
    expect(stats.avgPassed).toBeCloseTo(0.02, 12);
  });

  it('bought_all: every chart bought, nothing passed, an edge of zero', () => {
    const stats = computeStats(Array(10).fill(buy(0.02)), null);
    expect(stats).toMatchObject({ verdict: 'bought_all', avgPassed: null, coin: null });
    expect(stats.edge).toBeCloseTo(0, 12);
  });

  it('is worse below the coin range, better above it, and coin inside it', () => {
    const coin = { p5: -0.02, p95: 0.02, edges: [-0.05, -0.02, 0, 0.02, 0.05] };
    expect(computeStats(tenRounds(-0.06, 0), coin).verdict).toBe('worse'); // edge -0.03
    expect(computeStats(tenRounds(0.06, 0), coin).verdict).toBe('better'); // edge +0.03
    expect(computeStats(tenRounds(0.02, 0), coin).verdict).toBe('coin'); // edge +0.01
  });

  it('counts the range bounds themselves as coin', () => {
    const rounds = tenRounds(-0.04, 0);
    const edge = computeStats(rounds, wideCoin).edge as number;
    expect(computeStats(rounds, { p5: edge, p95: edge + 0.1, edges: [edge] }).verdict).toBe('coin');
    expect(computeStats(rounds, { p5: edge - 0.1, p95: edge, edges: [edge] }).verdict).toBe('coin');
  });

  it('reports the coin range, the trials, and the shares of coin edges strictly below and strictly above the user', () => {
    const rounds = tenRounds(0.02, 0);
    const edge = computeStats(rounds, wideCoin).edge as number;
    const coin = { p5: -0.02, p95: 0.02, edges: [edge - 0.03, edge - 0.01, edge, edge + 0.01, edge + 0.03] };
    expect(computeStats(rounds, coin).coin).toEqual({
      p5: -0.02,
      p95: 0.02,
      percentile: 0.4,
      beatenBy: 0.4,
      trials: 5,
      histogram: coinHistogram(coin.edges),
    });
  });

  it('adds the coin histogram: every trial counted once in 40 bins', () => {
    const rounds = tenRounds(0.02, 0);
    const edge = computeStats(rounds, wideCoin).edge as number;
    const coin = { p5: -0.02, p95: 0.02, edges: [edge - 0.03, edge - 0.01, edge, edge + 0.01, edge + 0.03] };
    const { histogram } = computeStats(rounds, coin).coin!;
    expect(histogram.counts).toHaveLength(40);
    expect(histogram.counts.reduce((sum, c) => sum + c, 0)).toBe(5);
    expect(histogram.start).toBe(edge - 0.03);
  });

  it('counts a tie with a coin trial on neither side', () => {
    const rounds = tenRounds(0.02, 0);
    const edge = computeStats(rounds, wideCoin).edge as number;
    // The best possible picks tie every coin trial that picked the same charts.
    const coin = { p5: -0.02, p95: 0.02, edges: [edge - 0.01, edge, edge, edge] };
    expect(computeStats(rounds, coin).coin).toMatchObject({ percentile: 0.25, beatenBy: 0 });
  });

  it('counts a pass at zero as right in the hit rate, and keeps the streak', () => {
    const stats = computeStats([buy(0.1), pass(0), buy(-0.1), pass(-0.2), pass(0.3)], null);
    expect(stats.hitRate).toBe(0.6);
    expect(stats.streak).toEqual({ current: 0, best: 2 });
  });

  it('refuses to judge without the coin range when there is a verdict to make', () => {
    expect(needsCoin(tenRounds(0.02, 0))).toBe(true);
    expect(needsCoin(Array(10).fill(buy(0.02)))).toBe(false);
    expect(needsCoin(Array(9).fill(buy(0.02)))).toBe(false);
    expect(() => computeStats(tenRounds(0.02, 0), null)).toThrow(/coin/);
  });
});
