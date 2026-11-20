import { coinBenchmark, coinSeed } from '../domain/coin.js';
import { computeStats, needsCoin, type Stats } from '../domain/stats.js';
import type { RoundsRepository } from '../repositories/rounds.js';

export function statsService(deps: { rounds: RoundsRepository }) {
  return {
    /**
     * The scoreboard over the user's decided rounds only (02 §7): an open round never enters a figure,
     * because its frozen return counted in "buy everything" would reveal its direction. The coin runs
     * only when there is a verdict to make, seeded so the range is stable until a new round is decided.
     */
    async forUser(userId: string): Promise<Stats> {
      const decided = await deps.rounds.decidedInOrder(userId);
      const coin = needsCoin(decided)
        ? coinBenchmark(
            decided.map((round) => round.r),
            decided.filter((round) => round.decision === 'buy').length,
            coinSeed(userId, decided.length),
          )
        : null;
      return computeStats(decided, coin);
    },
  };
}
