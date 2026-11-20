import type { MarketDataProvider } from '../marketdata/provider.js';
import { UpstreamLimitError } from '../marketdata/provider.js';

/** What the live route says about today's price (02 §5.6, §7). Both shapes are a normal answer. */
export type LiveQuote =
  | { available: true; price: number; asOf: string }
  | { available: false; reason: 'limit' | 'unavailable' };

// The cache is for the credit budget, not for speed: every symbol shown twice in 15 minutes costs
// one credit, not two. The game itself never depends on it (invariant 3).
const CACHE_TTL_MS = 15 * 60_000;
// Shorter than the client's 8 s (OPTIONAL_GIVE_UP_AFTER_MS in frontend/src/lib/api.ts): a reveal that is already on screen should not wait long for a
// line that is optional.
const QUOTE_TIMEOUT_MS = 2_500;

type Deps = {
  provider: Pick<MarketDataProvider, 'fetchQuote'>;
  /** The credit budget's `tryAcquire`: false at once when over budget, never waits (02 §5.3). */
  budget: { tryAcquire(): Promise<boolean> };
  /** Milliseconds since the epoch; tests pass a fake one. */
  clock: () => number;
};

export type LiveQuoteService = ReturnType<typeof createLiveQuoteService>;

/** One instance per process, because the cache lives in memory (02 §5.6). */
export function createLiveQuoteService(deps: Deps) {
  const cache = new Map<string, { quote: LiveQuote & { available: true }; at: number }>();

  return {
    /** Never throws: any failure becomes `{ available: false }`, so the route can always answer 200. */
    async get(symbol: string): Promise<LiveQuote> {
      const cached = cache.get(symbol);
      if (cached && deps.clock() - cached.at < CACHE_TTL_MS) return cached.quote;

      try {
        if (!(await deps.budget.tryAcquire())) return { available: false, reason: 'limit' };
        const { price, asOf } = await deps.provider.fetchQuote(symbol, QUOTE_TIMEOUT_MS);
        const quote = { available: true, price, asOf } as const;
        cache.set(symbol, { quote, at: deps.clock() });
        return quote;
      } catch (err) {
        // Only the error's name is logged: it never carries the key, and the message names a symbol
        // of a round the user has already decided, never an open one.
        console.warn(`live quote failed: ${(err as Error).name}`);
        return { available: false, reason: err instanceof UpstreamLimitError ? 'limit' : 'unavailable' };
      }
    },
  };
}
