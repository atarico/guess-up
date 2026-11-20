import { normalise } from '../domain/normalise.js';
import { H, L, pickRound } from '../domain/pickRound.js';
import { type Decision, isCorrect, streaks } from '../domain/stats.js';
import { ApiError } from '../middleware/errors.js';
import type { ClosesReads } from '../repositories/closes.js';
import type { OpenRound, RoundsRepository } from '../repositories/rounds.js';
import type { SymbolReads } from '../repositories/symbols.js';
import type { LiveQuote, LiveQuoteService } from './liveQuoteService.js';

/** What a round is allowed to say before the decision (01 §6, invariant 1). */
export type RoundView = { id: string; points: number[]; resumed: boolean };

/** Everything the decision reveals (01 §7, 02 §7). */
export type Reveal = {
  symbol: string;
  name: string;
  sector: string | null;
  exchange: string | null;
  startDate: string;
  cutoffDate: string;
  endDate: string;
  history: { d: string; c: number }[];
  future: { d: string; c: number }[];
  forwardReturn: number;
  decision: Decision;
  correct: boolean;
};

export type DecisionResult = { reveal: Reveal; streak: { current: number; best: number } };

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

    /**
     * Records the decision once and reveals the round (02 §7). A second decision changes nothing:
     * it gets the reveal with the stored decision. An unknown id and someone else's round get the
     * same 404, so the answer never says whether a round exists (anonymity V9).
     */
    async decide(userId: string, roundId: string, decision: Decision): Promise<DecisionResult> {
      const round = (await deps.rounds.decide(roundId, userId, decision)) ?? (await deps.rounds.findOwn(roundId, userId));
      // An own round that is still open here would mean the update above failed on it; never reveal it.
      if (!round || round.decision === null) throw new ApiError(404, 'NOT_FOUND', 'Round not found');

      const [info, history, future] = await Promise.all([
        deps.symbols.find(round.symbol),
        deps.closes.upTo(round.symbol, round.cutoffDate, L),
        deps.closes.after(round.symbol, round.cutoffDate, H),
      ]);
      if (!info || history.length !== L || future.length !== H) {
        throw new Error('A decided round could not be rebuilt from the stored data');
      }

      return {
        // Field by field, never a spread row (02 §7).
        reveal: {
          symbol: info.symbol,
          name: info.name,
          sector: info.sector,
          exchange: info.exchange,
          startDate: history[0].d,
          cutoffDate: round.cutoffDate,
          endDate: future[H - 1].d,
          history: history.map((bar) => ({ d: bar.d, c: bar.close })),
          future: future.map((bar) => ({ d: bar.d, c: bar.close })),
          // The return frozen at creation, never recomputed (invariant 5).
          forwardReturn: round.forwardReturn,
          decision: round.decision,
          correct: isCorrect(round.decision, round.forwardReturn),
        },
        streak: streaks(await deps.rounds.decidedInOrder(userId)),
      };
    },
  };
}

/** (P1) What GET /rounds/:id/live answers: the quote, plus the move since the cutoff when there is a price. */
export type LiveView = LiveQuote | (LiveQuote & { available: true; sinceCutoff: number });

/**
 * Today's price for a round the user has already decided (02 §7). An unknown id and someone
 * else's round get the same 404 as the decision route; an own round that is still open gets 409,
 * with a fixed message and before any quote is asked, so the provider never hears of its stock
 * (invariant 1).
 */
export async function liveForRound(
  deps: Pick<Deps, 'rounds' | 'closes'> & { liveQuote: LiveQuoteService },
  userId: string,
  roundId: string,
): Promise<LiveView> {
  const round = await deps.rounds.findOwn(roundId, userId);
  if (!round) throw new ApiError(404, 'NOT_FOUND', 'Round not found');
  if (round.decision === null) throw new ApiError(409, 'ROUND_OPEN', 'The round has not been decided yet');

  const quote = await deps.liveQuote.get(round.symbol);
  if (!quote.available) return quote;
  // The cutoff close is the last of the closes up to the cutoff date. The stored data, not a re-fetch (invariant 5's spirit).
  const [cutoffBar] = await deps.closes.upTo(round.symbol, round.cutoffDate, 1);
  if (!cutoffBar) throw new Error('A decided round could not be rebuilt from the stored data');
  return { ...quote, sinceCutoff: quote.price / cutoffBar.close - 1 };
}
