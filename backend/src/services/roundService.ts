import { normalise } from '../domain/normalise.js';
import { L, pickRound } from '../domain/pickRound.js';
import { ApiError } from '../middleware/errors.js';
import type { ClosesReads } from '../repositories/closes.js';
import type { OpenRound, RoundsRepository } from '../repositories/rounds.js';
import type { SymbolReads } from '../repositories/symbols.js';

/** What a round is allowed to say before the decision (01 §6, invariant 1). */
export type RoundView = { id: string; points: number[]; resumed: boolean };

type Deps = {
  rounds: RoundsRepository;
  closes: ClosesReads;
  symbols: SymbolReads;
  /** A number in [0, 1); Math.random in production, injected so tests can choose. */
  random: () => number;
};

// Error messages in this file are fixed strings: they reach the logs, and they must never carry
// the symbol or a date of an open round (anonymity V5, V6).

export function roundService(deps: Deps) {
  /** Rebuilds the points from the stored closes: the same 252 closes, so the same chart. */
  async function resume(open: OpenRound): Promise<RoundView> {
    const shown = await deps.closes.upTo(open.symbol, open.cutoffDate, L);
    if (shown.length !== L) throw new Error('An open round could not be rebuilt from the stored closes');
    return { id: open.id, points: normalise(shown.map((bar) => bar.close)), resumed: true };
  }

  return {
    /**
     * The user's open round if there is one, otherwise a new one (02 §7). No rerolls: a user has
     * at most one open round, so asking again never shows a different chart.
     */
    async createOrResume(userId: string): Promise<RoundView> {
      const open = await deps.rounds.findOpen(userId);
      if (open) return resume(open);

      const ready = await deps.symbols.listReady();
      if (ready.length === 0) throw new ApiError(503, 'NO_DATA', 'No price series is ready yet');

      // The stock first, then the cutoff, so stocks with long histories do not dominate (01 §6).
      const symbol = ready[Math.floor(deps.random() * ready.length)];
      const series = await deps.closes.series(symbol);
      const picked = pickRound(series, deps.random);
      // Cannot happen with the seed's minimum of 400 bars (domain/series.ts); kept as a guard.
      if (!picked) throw new Error('A ready series is too short for a round');

      const id = await deps.rounds.insertOpen({
        userId,
        symbol,
        cutoffDate: series[picked.cutoffIndex].d,
        // Frozen now; stats never recompute it from re-fetched prices (invariant 5).
        forwardReturn: picked.forwardReturn,
      });
      if (id === null) {
        // Two requests at once: the other one opened a round first, and the index kept only that one.
        const winner = await deps.rounds.findOpen(userId);
        if (!winner) throw new Error('No open round after a conflicting insert');
        return resume(winner);
      }
      return { id, points: normalise(picked.shown), resumed: false };
    },
  };
}
