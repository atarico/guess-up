// Game-layer figures over decided rounds (01 §8, 02 §6). computeStats joins this file in work unit 6.

export type Decision = 'buy' | 'pass';

/** One decided round: the call and its frozen three-month return. */
export type DecidedRound = { decision: Decision; r: number };

/** A buy is right when the return is above zero; a pass is right when it is zero or below (01 §6). */
export function isCorrect(decision: Decision, r: number): boolean {
  return decision === 'buy' ? r > 0 : r <= 0;
}

/**
 * Consecutive right calls over rounds in decision order (01 §8): `current` is the run that ends
 * with the latest round, `best` the longest run so far.
 */
export function streaks(rounds: DecidedRound[]): { current: number; best: number } {
  let current = 0;
  let best = 0;
  for (const round of rounds) {
    current = isCorrect(round.decision, round.r) ? current + 1 : 0;
    best = Math.max(best, current);
  }
  return { current, best };
}

export type Verdict = 'insufficient' | 'bought_none' | 'bought_all' | 'worse' | 'better' | 'coin';

/** Fewer decided rounds than this and there is no verdict yet (01 §8). */
export const ROUNDS_FOR_VERDICT = 10;

/** The figures of GET /stats (02 §7). Returns are decimals; null where a figure is undefined. */
export type Stats = {
  rounds: number;
  buys: number;
  passes: number;
  avgPicks: number | null;
  avgAll: number | null;
  avgPassed: number | null;
  edge: number | null;
  coin: { p5: number; p95: number; percentile: number; trials: number } | null;
  verdict: Verdict;
  roundsUntilVerdict: number;
  hitRate: number | null;
  streak: { current: number; best: number };
};

const mean = (values: number[]) => (values.length === 0 ? null : values.reduce((sum, v) => sum + v, 0) / values.length);

/**
 * Whether the verdict is measured against the coin: enough rounds, and some buys and some passes.
 * With no buys or no passes there is no selection to measure (01 §8).
 */
export function needsCoin(rounds: DecidedRound[]): boolean {
  const buys = rounds.filter((round) => round.decision === 'buy').length;
  return rounds.length >= ROUNDS_FOR_VERDICT && buys > 0 && buys < rounds.length;
}

/**
 * The scoreboard over decided rounds in decision order (01 §8, 02 §6). Edge = mean of the picks minus
 * mean of all rounds. `coin` is the seeded benchmark of these same rounds; it is needed exactly when
 * needsCoin(rounds) is true, and ignored otherwise. Pure.
 */
export function computeStats(rounds: DecidedRound[], coin: { p5: number; p95: number; edges: number[] } | null): Stats {
  const bought = rounds.filter((round) => round.decision === 'buy').map((round) => round.r);
  const passed = rounds.filter((round) => round.decision === 'pass').map((round) => round.r);
  const avgPicks = mean(bought);
  const avgAll = mean(rounds.map((round) => round.r));
  const edge = avgPicks === null || avgAll === null ? null : avgPicks - avgAll;

  const figures = {
    rounds: rounds.length,
    buys: bought.length,
    passes: passed.length,
    avgPicks,
    avgAll,
    avgPassed: mean(passed),
    edge,
    roundsUntilVerdict: Math.max(0, ROUNDS_FOR_VERDICT - rounds.length),
    hitRate: rounds.length === 0 ? null : rounds.filter((round) => isCorrect(round.decision, round.r)).length / rounds.length,
    streak: streaks(rounds),
  };

  // The order of 02 §6: too few rounds, then no selection to measure, then against the coin.
  if (rounds.length < ROUNDS_FOR_VERDICT) return { ...figures, coin: null, verdict: 'insufficient' };
  if (bought.length === 0) return { ...figures, coin: null, verdict: 'bought_none' };
  if (passed.length === 0) return { ...figures, coin: null, verdict: 'bought_all' };
  if (!coin || edge === null) throw new Error('computeStats needs the coin range when there is a verdict to make');

  // Share of coin trials the user's edge is at or above (02 §6).
  const percentile = coin.edges.filter((e) => e <= edge).length / coin.edges.length;
  const verdict: Verdict = edge < coin.p5 ? 'worse' : edge > coin.p95 ? 'better' : 'coin';
  return { ...figures, coin: { p5: coin.p5, p95: coin.p95, percentile, trials: coin.edges.length }, verdict };
}
