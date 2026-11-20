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
